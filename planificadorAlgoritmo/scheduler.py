from datetime import datetime, timedelta
from ortools.sat.python import cp_model
from models import PlanRequest, PlanResponse, ScheduledBlock, Warning
import time

from stagnation_stop import solve_with_stagnation_stop

BLOCK_SIZE = 15  # minutos por bloque

def schedule(request: PlanRequest) -> PlanResponse:
    tasks = request.tasks
    plannable_slots = request.plannableSlots
    previous_plan = request.previousPlan
    max_time = request.maxTime

    # 1. Calcular tiempo restante por tarea
    tasks_with_remaining = calcular_tiempo_restante(tasks, previous_plan)

    # 2. Generar bloques disponibles de 15 minutos
    available_blocks = generar_bloques_disponibles(plannable_slots, previous_plan)

    if not available_blocks or not tasks_with_remaining:
        warnings = [
            Warning(taskId=t["taskId"], title=t["title"], message="api.scheduler.noSlots")
            for t in tasks_with_remaining
        ]
        return PlanResponse(scheduled=[], warnings=warnings)

    # 3. Resolver con cp_model
    scheduled, warnings = resolver(tasks_with_remaining, available_blocks, max_time)

    return PlanResponse(scheduled=scheduled, warnings=warnings)


# scheduler.py
def calcular_tiempo_restante(tasks, previous_plan):
    tiempo_planificado = {}
    for block in previous_plan:
        # Solo descontar si el bloque fue completado o está pendiente
        # Si fue uncompleted, el usuario no lo hizo y hay que replanificarlo
        if block.status in ('pending', 'completed'):
            tiempo_planificado[block.taskId] = tiempo_planificado.get(block.taskId, 0) + block.scheduledTime

    resultado = []
    for task in tasks:
        restante = task.estimatedTime - tiempo_planificado.get(task.taskId, 0)
        if restante > 0:
            resultado.append({**task.model_dump(), "estimatedTime": restante})

    return resultado


def generar_bloques_disponibles(plannable_slots, previous_plan):
    # Bloques ya ocupados por planificación previa
    ocupados = set()
    for block in previous_plan:
        start = datetime.fromisoformat(block.start.replace("Z", "+00:00"))
        end = datetime.fromisoformat(block.end.replace("Z", "+00:00"))
        current = start
        while current < end:
            ocupados.add(current.isoformat())
            current += timedelta(minutes=BLOCK_SIZE)

    # Generar bloques libres de 15 minutos dentro de los huecos planificables
    bloques = []
    for slot in plannable_slots:
        start = datetime.fromisoformat(slot.start.replace("Z", "+00:00"))
        end = datetime.fromisoformat(slot.end.replace("Z", "+00:00"))
        current = start
        while current + timedelta(minutes=BLOCK_SIZE) <= end:
            if current.isoformat() not in ocupados:
                bloques.append(current)
            current += timedelta(minutes=BLOCK_SIZE)

    return sorted(bloques)

def resolver(tasks, available_blocks, max_time):
    model = cp_model.CpModel()
    n_tasks = len(tasks)
    n_blocks = len(available_blocks)

    x = {}
    for i in range(n_tasks):
        for j in range(n_blocks):
            x[i, j] = model.NewBoolVar(f"x_{i}_{j}") # type: ignore

    completada = {}
    for i in range(n_tasks):
        completada[i] = model.NewBoolVar(f"completada_{i}") # type: ignore

    bloques_necesarios = []
    for i, task in enumerate(tasks):
        needed = -(-task["estimatedTime"] // BLOCK_SIZE)
        bloques_necesarios.append(needed)

    # Restricción: cada bloque se asigna a una sola tarea como máximo
    for j in range(n_blocks):
        model.Add(sum(x[i, j] for i in range(n_tasks)) <= 1) # type: ignore

    # Restricción: bloques asignados >= necesarios SI la tarea está completada
    # Cap en needed para evitar sobreasignación
    for i, task in enumerate(tasks):
        needed = bloques_necesarios[i]
        total_asignados = sum(x[i, j] for j in range(n_blocks))
        model.Add(total_asignados >= needed).OnlyEnforceIf(completada[i]) # type: ignore
        model.Add(total_asignados < needed).OnlyEnforceIf(completada[i].Not()) # type: ignore
        model.Add(total_asignados <= needed) # type: ignore

    # Restricción: bloques después de finishDate no se pueden asignar
    for i, task in enumerate(tasks):
        finish = datetime.fromisoformat(task["finishDate"].replace("Z", "+00:00"))
        for j, block_time in enumerate(available_blocks):
            if block_time + timedelta(minutes=BLOCK_SIZE) > finish:
                model.Add(x[i, j] == 0) # type: ignore

    given_dates = []
    for task in tasks:
        given_dates.append(datetime.fromisoformat(task["givenDate"].replace("Z", "+00:00")))

    # Restricción dura: no planificar antes de givenDate
    costs = []
    for i, task in enumerate(tasks):
        given = datetime.fromisoformat(task["givenDate"].replace("Z", "+00:00"))
        for j, block_time in enumerate(available_blocks):
            if block_time < given:
                model.Add(x[i, j] == 0)

    if available_blocks and given_dates:
        max_block = available_blocks[-1]
        min_given = min(given_dates)
        distance_cap = max(1, int((max_block - min_given).total_seconds() // (BLOCK_SIZE * 60))) + 1
    else:
        distance_cap = 1

    partial_fill_weight = distance_cap + 1

    for i in range(n_tasks):
        for j, block_time in enumerate(available_blocks):
            distance = int((block_time - given_dates[i]).total_seconds() // (BLOCK_SIZE * 60))
            distance = min(distance, distance_cap)
            costs.append(distance * x[i, j])

    # Bonus de continuidad: recompensa pares de bloques consecutivos asignados a la misma tarea
    # Desalienta la fragmentación sin impedir la asignación de bloques sueltos
    continuity_weight = partial_fill_weight * max(1, n_blocks // max(1, n_tasks))
    cont = {}
    continuity_terms = []
    for i in range(n_tasks):
        for j in range(n_blocks - 1):
            if available_blocks[j + 1] - available_blocks[j] == timedelta(minutes=BLOCK_SIZE):
                c = model.NewBoolVar(f"cont_{i}_{j}") # type: ignore
                cont[i, j] = c
                model.Add(c <= x[i, j]) # type: ignore
                model.Add(c <= x[i, j + 1]) # type: ignore
                model.Add(c >= x[i, j] + x[i, j + 1] - 1) # type: ignore
                continuity_terms.append(-continuity_weight * c)

    # Penalización de dispersión: minimiza la distancia entre el primer y el último bloque
    # asignado a cada tarea, evitando el patrón t1→t2→t1
    span_weight = max(1, (distance_cap + 1) // (n_blocks + 1)) if n_blocks > 0 else 1
    first_block = {}
    last_block = {}
    span_terms = []
    for i in range(n_tasks):
        ub = max(0, n_blocks - 1)
        first_block[i] = model.NewIntVar(0, ub, f"first_block_{i}") # type: ignore
        last_block[i] = model.NewIntVar(0, ub, f"last_block_{i}") # type: ignore
        model.Add(last_block[i] >= first_block[i]) # type: ignore
        for j in range(n_blocks):
            model.Add(first_block[i] <= j).OnlyEnforceIf(x[i, j]) # type: ignore
            model.Add(last_block[i] >= j).OnlyEnforceIf(x[i, j]) # type: ignore
        span_terms.append(span_weight * (last_block[i] - first_block[i]))

    # Prioridad 1: maximizar tareas completadas
    # Prioridad 2: maximizar bloques asignados (incluso en tareas parciales)
    # Prioridad 3: minimizar dispersión entre fragmentos de la misma tarea
    # Prioridad 4: minimizar fragmentación interna (bloques consecutivos juntos)
    # Prioridad 5: minimizar distancia a givenDate
    peso = n_tasks * n_blocks * distance_cap + 1
    model.Minimize(
        sum(-peso * completada[i] for i in range(n_tasks)) +
        sum(-partial_fill_weight * x[i, j] for i in range(n_tasks) for j in range(n_blocks)) + # type: ignore
        sum(costs) +
        sum(continuity_terms) +
        sum(span_terms)
    )

    totalTaskTime = sum(task["estimatedTime"] for task in tasks)

    result = solve_with_stagnation_stop(
        model,
        max_time_seconds=max_time,
        stagnation_seconds=5,
        min_improvement_ratio=0.001,
    )

    solver = result.solver
    status = result.status

    try:
        obj = solver.ObjectiveValue()
        bound = solver.BestObjectiveBound()
        actual_gap = abs(obj - bound) / abs(obj) if obj != 0 else 0.0
    except Exception:
        obj, bound, actual_gap = None, None, None
    print(f"[scheduler] {result.wall_time:.3f} {result.status_name} tasks={n_tasks} blocks={n_blocks} taskTime={totalTaskTime} "
        f"obj={obj} bound={bound} actual_gap={actual_gap} stagnation={result.stopped_by_stagnation}")    
    scheduled = []
    warnings = []

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for i, task in enumerate(tasks):
            is_complete = solver.Value(completada[i]) == 1

            if not is_complete:
                warnings.append(Warning(
                    taskId=task["taskId"],
                    title=task["title"],
                    message="api.scheduler.cannotFinish"
                ))

            bloques_asignados = [
                available_blocks[j]
                for j in range(n_blocks)
                if solver.Value(x[i, j]) == 1
            ]

            if not bloques_asignados:
                continue

            bloques_asignados.sort()
            grupos = agrupar_bloques_consecutivos(bloques_asignados)
            total_remaining = task["estimatedTime"]

            for grupo in grupos:
                start = grupo[0]
                end = grupo[-1] + timedelta(minutes=BLOCK_SIZE)
                grupo_minutos = len(grupo) * BLOCK_SIZE
                percentage = round(grupo_minutos / total_remaining * 100)
                scheduled.append(ScheduledBlock(
                    taskId=task["taskId"],
                    title=f"{task['title']} ({percentage}%)",
                    start=start.isoformat(),
                    end=end.isoformat(),
                    scheduledTime=grupo_minutos
                ))
    else:
        for task in tasks:
            warnings.append(Warning(
                taskId=task["taskId"],
                title=task["title"],
                message="No es posible terminar esta tarea antes de su fecha de entrega"
            ))

    return scheduled, warnings

def agrupar_bloques_consecutivos(bloques):
    if not bloques:
        return []

    grupos = []
    grupo_actual = [bloques[0]]

    for i in range(1, len(bloques)):
        if bloques[i] - bloques[i - 1] == timedelta(minutes=BLOCK_SIZE):
            grupo_actual.append(bloques[i])
        else:
            grupos.append(grupo_actual)
            grupo_actual = [bloques[i]]

    grupos.append(grupo_actual)
    return grupos