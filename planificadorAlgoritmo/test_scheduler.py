# test_scheduler.py
import pytest
from datetime import datetime, timedelta
from models import PlanRequest, Task, PlannableSlot, PlannedBlock
from scheduler import schedule, calcular_tiempo_restante, generar_bloques_disponibles

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
    def test_genera_bloques_de_30_minutos(self):
        slots = [make_slot("2026-05-05T09:00:00Z", "2026-05-05T11:00:00Z")]
        bloques = generar_bloques_disponibles(slots, [])
        assert len(bloques) == 4  # 9:00, 9:30, 10:00, 10:30

    def test_excluye_bloques_del_plan_previo(self):
        slots = [make_slot("2026-05-05T09:00:00Z", "2026-05-05T11:00:00Z")]
        previous = [make_block("t1", "2026-05-05T09:00:00Z", "2026-05-05T10:00:00Z", 60)]
        bloques = generar_bloques_disponibles(slots, previous)
        assert len(bloques) == 2  # solo 10:00 y 10:30

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