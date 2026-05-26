from datetime import datetime, timedelta
from ortools.sat.python import cp_model
from models import PlanRequest, PlanResponse, ScheduledBlock, Warning

BLOCK_SIZE = 15  # minutos por bloque


def schedule(request: PlanRequest) -> PlanResponse:
    tasks = request.tasks
    plannable_slots = request.plannableSlots
    previous_plan = request.previousPlan

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
    scheduled, warnings = resolver(tasks_with_remaining, available_blocks)

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

def resolver(tasks, available_blocks):
    model = cp_model.CpModel()
    n_tasks = len(tasks)
    n_blocks = len(available_blocks)

    x = {}
    for i in range(n_tasks):
        for j in range(n_blocks):
            x[i, j] = model.NewBoolVar(f"x_{i}_{j}") # type: ignore

    # Variable que indica si la tarea i está completamente planificada
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
    for i, task in enumerate(tasks):
        needed = bloques_necesarios[i]
        total_asignados = sum(x[i, j] for j in range(n_blocks))
        model.Add(total_asignados >= needed).OnlyEnforceIf(completada[i]) # type: ignore
        model.Add(total_asignados < needed).OnlyEnforceIf(completada[i].Not()) # type: ignore

    # Restricción: bloques después de finishDate no se pueden asignar
    for i, task in enumerate(tasks):
        finish = datetime.fromisoformat(task["finishDate"].replace("Z", "+00:00"))
        for j, block_time in enumerate(available_blocks):
            if block_time + timedelta(minutes=BLOCK_SIZE) > finish:
                model.Add(x[i, j] == 0) # type: ignore

    # Objetivo: maximizar tareas completadas, luego minimizar distancia a givenDate
    given_dates = []
    for task in tasks:
        given_dates.append(datetime.fromisoformat(task["givenDate"].replace("Z", "+00:00")))

    # Penalización por distancia a givenDate (normalizada)
    max_distance = 1000
    costs = []
    # Restricción dura: no planificar antes de givenDate
    for i, task in enumerate(tasks):
        given = datetime.fromisoformat(task["givenDate"].replace("Z", "+00:00"))
        for j, block_time in enumerate(available_blocks):
            if block_time < given:
                model.Add(x[i, j] == 0)

    # Coste: minimizar distancia a givenDate
    for i in range(n_tasks):
        for j, block_time in enumerate(available_blocks):
            distance = int((block_time - given_dates[i]).total_seconds() // (BLOCK_SIZE * 60))
            distance = min(distance, max_distance)
            costs.append(distance * x[i, j])

    # Prioridad 1: maximizar tareas completadas (peso alto)
    # Prioridad 2: minimizar distancia a givenDate (peso bajo)
    peso = n_tasks * n_blocks * max_distance + 1
    model.Minimize(
        sum(-peso * completada[i] for i in range(n_tasks)) +
        sum(costs)
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.Solve(model)

    scheduled = []
    warnings = []

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for i, task in enumerate(tasks):
            if solver.Value(completada[i]) == 0:
                warnings.append(Warning(
                    taskId=task["taskId"],
                    title=task["title"],
                    message="api.scheduler.cannotFinish"
                ))
                continue

            bloques_asignados = [
                available_blocks[j]
                for j in range(n_blocks)
                if solver.Value(x[i, j]) == 1
            ]

            bloques_asignados.sort()
            grupos = agrupar_bloques_consecutivos(bloques_asignados)

            for grupo in grupos:
                start = grupo[0]
                end = grupo[-1] + timedelta(minutes=BLOCK_SIZE)
                scheduled.append(ScheduledBlock(
                    taskId=task["taskId"],
                    title=task["title"],
                    start=start.isoformat(),
                    end=end.isoformat(),
                    scheduledTime=len(grupo) * BLOCK_SIZE
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