# test_scheduler.py
import pytest
from datetime import datetime, timedelta, timezone
from models import PlanRequest, Task, PlannableSlot, PlannedBlock
from scheduler import schedule, calcular_tiempo_restante, generar_bloques_disponibles, agrupar_bloques_consecutivos

# Helpers
def make_task(taskId, title, estimatedTime, finishDate, givenDate):
    return Task(
        taskId=taskId,
        title=title,
        estimatedTime=estimatedTime,
        finishDate=finishDate,
        givenDate=givenDate,
        includeReviews=False
    )

def make_slot(start, end):
    return PlannableSlot(start=start, end=end)

def make_block(taskId, start, end, scheduledTime):
    return PlannedBlock(taskId=taskId, start=start, end=end, scheduledTime=scheduledTime)

def make_request(tasks, slots, previous=[]):
    return PlanRequest(tasks=tasks, plannableSlots=slots, previousPlan=previous)

def make_tasks_n(n, estimated_minutes=60, finish="2026-06-01T23:59:00Z", given="2026-05-01T00:00:00Z"):
    return [make_task(f"t{i}", f"Tarea {i}", estimated_minutes, finish, given) for i in range(1, n + 1)]

def make_week_slots(start_date="2026-05-11", n_days=5, start_hour=9, end_hour=18):
    year, month, day = int(start_date[:4]), int(start_date[5:7]), int(start_date[8:10])
    base = datetime(year, month, day, tzinfo=timezone.utc)
    slots = []
    for d in range(n_days):
        day_dt = base + timedelta(days=d)
        s = day_dt.replace(hour=start_hour, minute=0, second=0)
        e = day_dt.replace(hour=end_hour,   minute=0, second=0)
        slots.append(make_slot(s.strftime("%Y-%m-%dT%H:%M:%SZ"), e.strftime("%Y-%m-%dT%H:%M:%SZ")))
    return slots

def make_planned_block(taskId, start, end, scheduled_time, status="pending"):
    return PlannedBlock(taskId=taskId, start=start, end=end, scheduledTime=scheduled_time, status=status)


# --- calcular_tiempo_restante ---
class TestCalcularTiempoRestante:
    def test_sin_plan_previo_devuelve_tiempo_completo(self):
        tasks = [make_task("t1", "Mates", 120, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")]
        result = calcular_tiempo_restante(tasks, [])
        assert result[0]["estimatedTime"] == 120

    def test_con_plan_previo_descuenta_tiempo(self):
        tasks = [make_task("t1", "Mates", 120, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [make_block("t1", "2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z", 60)]
        result = calcular_tiempo_restante(tasks, previous)
        assert result[0]["estimatedTime"] == 60

    def test_tarea_completamente_planificada_no_aparece(self):
        tasks = [make_task("t1", "Mates", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [make_block("t1", "2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z", 60)]
        result = calcular_tiempo_restante(tasks, previous)
        assert len(result) == 0

    def test_multiples_bloques_previos_se_acumulan(self):
        tasks = [make_task("t1", "Mates", 120, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [
            make_block("t1", "2026-05-05T09:00:00Z", "2026-05-05T09:30:00Z", 30),
            make_block("t1", "2026-05-05T10:00:00Z", "2026-05-05T10:30:00Z", 30),
        ]
        result = calcular_tiempo_restante(tasks, previous)
        assert result[0]["estimatedTime"] == 60


# --- generar_bloques_disponibles ---
class TestGenerarBloquesDisponibles:
    def test_genera_bloques_de_15_minutos(self):
        slots = [make_slot("2026-05-05T09:00:00Z", "2026-05-05T11:00:00Z")]
        bloques = generar_bloques_disponibles(slots, [])
        assert len(bloques) == 8  # 9:00, 9:15, 9:30, 9:45, 10:00, 10:15, 10:30, 10:45

    def test_excluye_bloques_del_plan_previo(self):
        slots = [make_slot("2026-05-05T09:00:00Z", "2026-05-05T11:00:00Z")]
        previous = [make_block("t1", "2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z", 60)]
        bloques = generar_bloques_disponibles(slots, previous)
        assert len(bloques) == 4  # solo 10:00, 10:15, 10:30, 10:45

    def test_bloques_ordenados_cronologicamente(self):
        slots = [
            make_slot("2026-05-06T10:00:00Z", "2026-05-06T11:00:00Z"),
            make_slot("2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z"),
        ]
        bloques = generar_bloques_disponibles(slots, [])
        assert bloques == sorted(bloques)

    def test_sin_slots_devuelve_lista_vacia(self):
        bloques = generar_bloques_disponibles([], [])
        assert len(bloques) == 0


# --- schedule ---
class TestSchedule:
    def test_planifica_tarea_dentro_del_hueco(self):
        request = make_request(
            tasks=[make_task("t1", "Mates", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")]
        )
        result = schedule(request)
        assert len(result.scheduled) == 1
        assert len(result.warnings) == 0

    def test_tarea_termina_antes_de_finishDate(self):
        finish = "2026-05-05T23:59:00Z"
        request = make_request(
            tasks=[make_task("t1", "Mates", 120, finish, "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")]
        )
        result = schedule(request)
        finish_dt = datetime.fromisoformat(finish.replace("Z", "+00:00"))
        for block in result.scheduled:
            end_dt = datetime.fromisoformat(block.end)
            assert end_dt <= finish_dt

    def test_no_planifica_antes_de_givenDate(self):
        request = make_request(
            tasks=[make_task("t1", "Mates", 60, "2026-05-10T23:59:00Z", "2026-05-06T00:00:00Z")],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z"),
                make_slot("2026-05-06T09:00:00Z", "2026-05-06T12:00:00Z")]
        )
        result = schedule(request)
        given = datetime.fromisoformat("2026-05-06T00:00:00+00:00")
        for block in result.scheduled:
            block_start = datetime.fromisoformat(block.start)
            assert block_start >= given

    def test_scheduledTime_cubre_estimatedTime(self):
        request = make_request(
            tasks=[make_task("t1", "Mates", 90, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")]
        )
        result = schedule(request)
        total = sum(b.scheduledTime for b in result.scheduled if b.taskId == "t1")
        assert total >= 90

    def test_bloques_no_se_solapan(self):
        request = make_request(
            tasks=[
                make_task("t1", "Mates", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z"),
                make_task("t2", "Historia", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z"),
            ],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")]
        )
        result = schedule(request)
        bloques = sorted(result.scheduled, key=lambda b: b.start)
        for i in range(1, len(bloques)):
            end_anterior = datetime.fromisoformat(bloques[i-1].end)
            start_actual = datetime.fromisoformat(bloques[i].start)
            assert end_anterior <= start_actual

    def test_tarea_imposible_va_a_warnings(self):
        request = make_request(
            tasks=[make_task("t1", "Mates", 9999, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")]
        )
        result = schedule(request)
        assert len(result.warnings) == 1
        assert result.warnings[0].taskId == "t1"
        assert len(result.scheduled) == 0

    def test_tarea_imposible_no_impide_planificar_otras(self):
        request = make_request(
            tasks=[
                make_task("t1", "Mates", 9999, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z"),
                make_task("t2", "Historia", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z"),
            ],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")]
        )
        result = schedule(request)
        assert any(b.taskId == "t2" for b in result.scheduled)
        assert any(w.taskId == "t1" for w in result.warnings)

    def test_respeta_plan_previo(self):
        request = make_request(
            tasks=[make_task("t1", "Mates", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")],
            previous=[make_block("t2", "2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z", 60)]
        )
        result = schedule(request)
        ocupado_start = datetime.fromisoformat("2026-05-05T09:00:00+00:00")
        ocupado_end = datetime.fromisoformat("2026-05-05T10:00:00+00:00")
        for block in result.scheduled:
            block_start = datetime.fromisoformat(block.start)
            block_end = datetime.fromisoformat(block.end)
            assert not (block_start < ocupado_end and block_end > ocupado_start)

    def test_sin_slots_todos_van_a_warnings(self):
        request = make_request(
            tasks=[make_task("t1", "Mates", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[]
        )
        result = schedule(request)
        assert len(result.scheduled) == 0
        assert len(result.warnings) == 1

    def test_titulo_heredado_de_la_tarea(self):
        request = make_request(
            tasks=[make_task("t1", "Matemáticas", 60, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-05T09:00:00Z", "2026-05-05T12:00:00Z")]
        )
        result = schedule(request)
        assert all(b.title == "Matemáticas" for b in result.scheduled)

    def test_tarea_fragmentada_cubre_tiempo_total(self):
        request = make_request(
            tasks=[make_task("t1", "Mates", 120, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[
                make_slot("2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z"),
                make_slot("2026-05-06T09:00:00Z", "2026-05-06T10:00:00Z"),
            ]
        )
        result = schedule(request)
        total = sum(b.scheduledTime for b in result.scheduled if b.taskId == "t1")
        assert total >= 120

    def test_bloque_uncompleted_no_descuenta_tiempo(self):
        tasks = [make_task("t1", "Mates", 120, "2026-05-10T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [make_block("t1", "2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z", 60)]
        # Sobreescribimos el status
        previous[0] = PlannedBlock(taskId="t1", start="2026-05-05T09:00:00Z", end="2026-05-05T10:00:00Z", scheduledTime=60, status="uncompleted")
        result = calcular_tiempo_restante(tasks, previous)
        assert result[0]["estimatedTime"] == 120  # no se descontó nada


# ============================================================
# Paranoid-mode tests
# ============================================================


# --- agrupar_bloques_consecutivos ---

class TestAgruparBloquesConsecutivos:
    def test_lista_vacia_devuelve_lista_vacia(self):
        assert agrupar_bloques_consecutivos([]) == []

    def test_un_solo_bloque_forma_un_grupo(self):
        b = datetime(2026, 5, 5, 9, 0, tzinfo=timezone.utc)
        groups = agrupar_bloques_consecutivos([b])
        assert len(groups) == 1
        assert groups[0] == [b]

    def test_todos_consecutivos_forman_un_unico_grupo(self):
        base = datetime(2026, 5, 5, 9, 0, tzinfo=timezone.utc)
        blocks = [base + timedelta(minutes=15 * i) for i in range(6)]  # 9:00–10:30
        groups = agrupar_bloques_consecutivos(blocks)
        assert len(groups) == 1
        assert len(groups[0]) == 6

    def test_bloques_no_consecutivos_forman_grupos_separados(self):
        b1 = datetime(2026, 5, 5, 9,  0, tzinfo=timezone.utc)
        b2 = datetime(2026, 5, 5, 10, 0, tzinfo=timezone.utc)  # gap de 45 min
        groups = agrupar_bloques_consecutivos([b1, b2])
        assert len(groups) == 2

    def test_patron_alternado_cada_30_min_forma_grupos_individuales(self):
        base = datetime(2026, 5, 5, 9, 0, tzinfo=timezone.utc)
        blocks = [base + timedelta(minutes=30 * i) for i in range(4)]  # 9:00, 9:30, 10:00, 10:30
        groups = agrupar_bloques_consecutivos(blocks)
        assert len(groups) == 4

    def test_dos_grupos_separados_por_un_hueco(self):
        base = datetime(2026, 5, 5, 9, 0, tzinfo=timezone.utc)
        # 9:00, 9:15, 9:30 | gap | 10:00, 10:15
        blocks = [base + timedelta(minutes=15 * i) for i in range(3)] + \
                 [base + timedelta(minutes=60 + 15 * i) for i in range(2)]
        groups = agrupar_bloques_consecutivos(blocks)
        assert len(groups) == 2
        assert len(groups[0]) == 3
        assert len(groups[1]) == 2


# --- Muchas tareas ---

class TestMuchasTareas:
    def test_10_tareas_caben_en_semana_completa(self):
        # 10 × 60 min = 10 h; semana 5 días × 9 h = 45 h → todas deben caber
        tasks = make_tasks_n(10, estimated_minutes=60, finish="2026-05-20T23:59:00Z")
        slots = make_week_slots()
        result = schedule(make_request(tasks, slots))
        assert len(result.warnings) == 0
        assert len({b.taskId for b in result.scheduled}) == 10

    def test_tiempo_total_planificado_cubre_cada_tarea(self):
        tasks = make_tasks_n(5, estimated_minutes=90, finish="2026-05-20T23:59:00Z")
        slots = make_week_slots()
        result = schedule(make_request(tasks, slots))
        assert len(result.warnings) == 0
        for task in tasks:
            total = sum(b.scheduledTime for b in result.scheduled if b.taskId == task.taskId)
            assert total >= 90

    def test_mas_trabajo_que_tiempo_disponible_planifica_las_que_caben(self):
        # 10 × 120 min = 20 h; solo 5 h disponibles → algunas en warnings
        tasks = make_tasks_n(10, estimated_minutes=120, finish="2026-05-20T23:59:00Z")
        slots = [make_slot("2026-05-11T09:00:00Z", "2026-05-11T14:00:00Z")]
        result = schedule(make_request(tasks, slots))
        assert len(result.warnings) > 0
        assert len(result.scheduled) > 0

    def test_tareas_con_deadlines_distintos_respetan_cada_deadline(self):
        tasks = [
            make_task("t1", "Urgente", 60, "2026-05-12T08:00:00Z", "2026-05-11T00:00:00Z"),
            make_task("t2", "Normal",  60, "2026-05-15T23:59:00Z", "2026-05-11T00:00:00Z"),
            make_task("t3", "Tardia",  60, "2026-05-20T23:59:00Z", "2026-05-11T00:00:00Z"),
        ]
        slots = make_week_slots()
        result = schedule(make_request(tasks, slots))
        assert len(result.warnings) == 0
        deadlines = {
            "t1": "2026-05-12T08:00:00Z",
            "t2": "2026-05-15T23:59:00Z",
            "t3": "2026-05-20T23:59:00Z",
        }
        for block in result.scheduled:
            dl  = datetime.fromisoformat(deadlines[block.taskId].replace("Z", "+00:00"))
            end = datetime.fromisoformat(block.end)
            assert end <= dl, f"{block.taskId}: bloque termina después del deadline"

    def test_tarea_cuyo_deadline_es_anterior_a_todos_los_slots_va_a_warnings(self):
        tasks = [make_task("t1", "Vencida", 60, "2026-05-01T23:59:00Z", "2026-04-01T00:00:00Z")]
        slots = [make_slot("2026-05-11T09:00:00Z", "2026-05-11T12:00:00Z")]
        result = schedule(make_request(tasks, slots))
        assert any(w.taskId == "t1" for w in result.warnings)
        assert not any(b.taskId == "t1" for b in result.scheduled)

    def test_sin_tareas_devuelve_todo_vacio(self):
        result = schedule(make_request(tasks=[], slots=make_week_slots()))
        assert result.scheduled == []
        assert result.warnings == []

    def test_bloques_de_distintas_tareas_no_se_solapan_con_muchas_tareas(self):
        tasks = make_tasks_n(8, estimated_minutes=45, finish="2026-05-20T23:59:00Z")
        slots = make_week_slots()
        result = schedule(make_request(tasks, slots))
        bloques = sorted(result.scheduled, key=lambda b: b.start)
        for i in range(1, len(bloques)):
            end_prev  = datetime.fromisoformat(bloques[i - 1].end)
            start_cur = datetime.fromisoformat(bloques[i].start)
            assert end_prev <= start_cur


# --- Plan previo complejo ---

class TestPlanPrevioComplejo:
    def test_tarea_parcialmente_planificada_solo_necesita_el_tiempo_restante(self):
        # t1: 120 min, ya tiene 60 min pending → solo necesita 60 más
        tasks = [make_task("t1", "Mates", 120, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [make_planned_block("t1", "2026-05-08T09:00:00Z", "2026-05-08T10:00:00Z", 60, "pending")]
        slots = [make_slot("2026-05-11T09:00:00Z", "2026-05-11T10:00:00Z")]  # exactamente 60 min
        result = schedule(make_request(tasks, slots, previous))
        assert len(result.warnings) == 0
        total_nuevo = sum(b.scheduledTime for b in result.scheduled if b.taskId == "t1")
        assert total_nuevo >= 60

    def test_tarea_totalmente_completada_no_aparece_en_nuevo_plan(self):
        tasks = [make_task("t1", "Mates", 60, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [make_planned_block("t1", "2026-05-08T09:00:00Z", "2026-05-08T10:00:00Z", 60, "completed")]
        slots = [make_slot("2026-05-11T09:00:00Z", "2026-05-11T12:00:00Z")]
        result = schedule(make_request(tasks, slots, previous))
        assert not any(b.taskId == "t1" for b in result.scheduled)
        assert not any(w.taskId == "t1" for w in result.warnings)

    def test_bloque_uncompleted_en_pasado_no_descuenta_tiempo_ni_bloquea_slots_futuros(self):
        # El bloque uncompleted es del pasado → no ocupa slots futuros, y el tiempo no se descuenta
        tasks = [make_task("t1", "Mates", 60, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [make_planned_block("t1", "2026-05-01T09:00:00Z", "2026-05-01T10:00:00Z", 60, "uncompleted")]
        slots = [make_slot("2026-05-11T09:00:00Z", "2026-05-11T12:00:00Z")]
        result = schedule(make_request(tasks, slots, previous))
        assert len(result.warnings) == 0
        total = sum(b.scheduledTime for b in result.scheduled if b.taskId == "t1")
        assert total >= 60

    def test_mezcla_pending_completed_uncompleted_descuenta_solo_los_validos(self):
        # t1: 180 min total
        # 60 pending  → descuenta
        # 30 completed → descuenta
        # 45 uncompleted → NO descuenta
        # restante = 180 - 60 - 30 = 90
        tasks = [make_task("t1", "Mates", 180, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")]
        previous = [
            make_planned_block("t1", "2026-05-06T09:00:00Z", "2026-05-06T10:00:00Z", 60, "pending"),
            make_planned_block("t1", "2026-05-07T09:00:00Z", "2026-05-07T09:30:00Z", 30, "completed"),
            make_planned_block("t1", "2026-05-08T09:00:00Z", "2026-05-08T09:45:00Z", 45, "uncompleted"),
        ]
        remaining = calcular_tiempo_restante(tasks, previous)
        assert len(remaining) == 1
        assert remaining[0]["estimatedTime"] == 90

    def test_plan_previo_grande_ocupa_slots_y_nueva_tarea_usa_el_hueco_libre(self):
        # El plan previo llena 9-17 h cada día; queda 1 h libre por día (17-18 h)
        previous = []
        base = datetime(2026, 5, 11, tzinfo=timezone.utc)
        for d in range(5):
            day = base + timedelta(days=d)
            previous.append(make_planned_block(
                "otro",
                day.replace(hour=9).strftime("%Y-%m-%dT%H:%M:%SZ"),
                day.replace(hour=17).strftime("%Y-%m-%dT%H:%M:%SZ"),
                480,
                "pending",
            ))
        tasks = [make_task("t_nueva", "Nueva", 60, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")]
        slots = make_week_slots(start_hour=9, end_hour=18)  # 1 h libre por día (17-18)
        result = schedule(make_request(tasks, slots, previous))
        assert not any(w.taskId == "t_nueva" for w in result.warnings)
        assert any(b.taskId == "t_nueva" for b in result.scheduled)

    def test_5_tareas_totalmente_cubiertas_por_pending_no_generan_nada(self):
        # Todas las tareas ya están completamente planificadas como pending → nada nuevo
        tasks = make_tasks_n(5, estimated_minutes=60, finish="2026-05-20T23:59:00Z")
        previous = [
            make_planned_block(f"t{i}", f"2026-05-0{i}T09:00:00Z", f"2026-05-0{i}T10:00:00Z", 60, "pending")
            for i in range(1, 6)
        ]
        slots = make_week_slots()
        result = schedule(make_request(tasks, slots, previous))
        assert result.scheduled == []
        assert result.warnings == []

    def test_multiples_bloques_previos_de_distintas_tareas_se_acumulan_independientemente(self):
        # t1: 120 min, con 45 pending + 30 completed = 75 descontados → faltan 45
        # t2: 60 min, con 60 pending → ya cubierta
        tasks = [
            make_task("t1", "A", 120, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z"),
            make_task("t2", "B", 60,  "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z"),
        ]
        previous = [
            make_planned_block("t1", "2026-05-06T09:00:00Z", "2026-05-06T09:45:00Z", 45, "pending"),
            make_planned_block("t1", "2026-05-07T09:00:00Z", "2026-05-07T09:30:00Z", 30, "completed"),
            make_planned_block("t2", "2026-05-08T09:00:00Z", "2026-05-08T10:00:00Z", 60, "pending"),
        ]
        remaining = calcular_tiempo_restante(tasks, previous)
        assert len(remaining) == 1
        assert remaining[0]["taskId"] == "t1"
        assert remaining[0]["estimatedTime"] == 45


# --- Edge cases ---

class TestEdgeCases:
    def test_estimated_time_no_multiplo_de_15_se_redondea_arriba(self):
        # 70 min → necesita 5 bloques de 15 = 75 min planificados
        request = make_request(
            tasks=[make_task("t1", "Mates", 70, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-11T09:00:00Z", "2026-05-11T12:00:00Z")]
        )
        result = schedule(request)
        assert len(result.warnings) == 0
        total = sum(b.scheduledTime for b in result.scheduled if b.taskId == "t1")
        assert total >= 70

    def test_slot_exactamente_igual_al_tiempo_de_tarea(self):
        # Slot de 60 min exactos para una tarea de 60 min → debe planificarse perfecta
        request = make_request(
            tasks=[make_task("t1", "Exacta", 60, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-11T09:00:00Z", "2026-05-11T10:00:00Z")]
        )
        result = schedule(request)
        assert len(result.warnings) == 0
        total = sum(b.scheduledTime for b in result.scheduled if b.taskId == "t1")
        assert total == 60

    def test_dos_tareas_llenan_exactamente_el_slot_sin_solaparse(self):
        # Slot de 60 min; dos tareas de 30 min → deben caber justas sin solaparse
        request = make_request(
            tasks=[
                make_task("t1", "A", 30, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z"),
                make_task("t2", "B", 30, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z"),
            ],
            slots=[make_slot("2026-05-11T09:00:00Z", "2026-05-11T10:00:00Z")]
        )
        result = schedule(request)
        assert len(result.warnings) == 0
        bloques = sorted(result.scheduled, key=lambda b: b.start)
        for i in range(1, len(bloques)):
            end_prev  = datetime.fromisoformat(bloques[i - 1].end)
            start_cur = datetime.fromisoformat(bloques[i].start)
            assert end_prev <= start_cur

    def test_deadline_a_mitad_de_slot_impide_completar_tarea(self):
        # Slot 09:00-12:00, deadline 10:00, tarea 90 min → solo hay 60 min antes del deadline
        request = make_request(
            tasks=[make_task("t1", "Urgente", 90, "2026-05-11T10:00:00Z", "2026-05-01T00:00:00Z")],
            slots=[make_slot("2026-05-11T09:00:00Z", "2026-05-11T12:00:00Z")]
        )
        result = schedule(request)
        assert any(w.taskId == "t1" for w in result.warnings)

    def test_tarea_fragmentada_en_tres_slots_no_contiguos_cubre_tiempo_total(self):
        # Tarea de 120 min repartida en tres slots separados
        request = make_request(
            tasks=[make_task("t1", "Larga", 120, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")],
            slots=[
                make_slot("2026-05-11T09:00:00Z", "2026-05-11T09:45:00Z"),  # 45 min
                make_slot("2026-05-12T14:00:00Z", "2026-05-12T14:45:00Z"),  # 45 min
                make_slot("2026-05-13T10:00:00Z", "2026-05-13T11:00:00Z"),  # 60 min
            ]
        )
        result = schedule(request)
        assert len(result.warnings) == 0
        total = sum(b.scheduledTime for b in result.scheduled if b.taskId == "t1")
        assert total >= 120

    def test_nuevo_plan_no_solapa_con_bloques_del_plan_previo(self):
        # El plan previo ocupa 09:00-10:00; el nuevo bloque no puede caer ahí
        previous = [make_planned_block("t_vieja", "2026-05-11T09:00:00Z", "2026-05-11T10:00:00Z", 60, "pending")]
        tasks = [make_task("t_nueva", "Nueva", 60, "2026-05-20T23:59:00Z", "2026-05-01T00:00:00Z")]
        slots = [make_slot("2026-05-11T09:00:00Z", "2026-05-11T12:00:00Z")]
        result = schedule(make_request(tasks, slots, previous))
        ocupado_start = datetime.fromisoformat("2026-05-11T09:00:00+00:00")
        ocupado_end   = datetime.fromisoformat("2026-05-11T10:00:00+00:00")
        for block in result.scheduled:
            bs = datetime.fromisoformat(block.start)
            be = datetime.fromisoformat(block.end)
            assert not (bs < ocupado_end and be > ocupado_start)

    def test_muchos_slots_y_una_sola_tarea_pequeña_se_planifica_al_principio(self):
        # Tarea de 15 min con mucho espacio disponible → debe aparecer en el primer slot
        tasks = [make_task("t1", "Mini", 15, "2026-05-20T23:59:00Z", "2026-05-11T00:00:00Z")]
        slots = make_week_slots()
        result = schedule(make_request(tasks, slots))
        assert len(result.warnings) == 0
        assert len(result.scheduled) == 1
        assert result.scheduled[0].scheduledTime == 15