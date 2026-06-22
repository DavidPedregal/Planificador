"""
Para de detener CP-SAT por "estancamiento" (lleva X segundos sin encontrar
una solución mejor), hace falta un hilo vigilante: el propio callback de
soluciones SOLO se ejecuta cuando hay una mejora, así que no puede, por sí
solo, darse cuenta de que ha pasado mucho tiempo sin que nada cambie.

Este módulo lanza Solve() en un hilo, y desde el hilo principal comprueba
periódicamente cuánto ha pasado desde la última mejora; si se supera el
umbral, llama a callback.StopSearch() desde fuera (es seguro hacerlo desde
otro hilo, está soportado por OR-Tools para este propósito).

Uso:
    result = solve_with_stagnation_stop(
        model, max_time_seconds=30, stagnation_seconds=5
    )
    print(result.status_name, result.stopped_by_stagnation, result.history)
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from ortools.sat.python import cp_model


class _StagnationCallback(cp_model.CpSolverSolutionCallback):
    def __init__(self, min_improvement_ratio: float = 0.0):
        """
        Args:
            min_improvement_ratio: una mejora solo "cuenta" para reiniciar el
                reloj de estancamiento si reduce |objective - mejor_anterior|
                en al menos esta fracción del |objective| anterior. Con 0.0
                (por defecto), cualquier mejora cuenta, igual que antes.

                Ejemplo: con min_improvement_ratio=0.001 (0.1%), una mejora
                de -1130464 a -1130474 (0.0009% de cambio) NO reinicia el
                reloj, porque es ruido frente al tamaño del objetivo.
        """
        super().__init__()
        self.history = []
        self.last_improvement_time = None  # None hasta la primera mejora
        self.min_improvement_ratio = min_improvement_ratio
        self._last_significant_objective = None
        self._lock = threading.Lock()

    def on_solution_callback(self):
        t_wall = self.WallTime()
        obj = self.ObjectiveValue()
        bound = self.BestObjectiveBound()
        gap = abs(obj - bound) / abs(obj) if obj != 0 else 0.0

        with self._lock:
            if self._last_significant_objective is None:
                significant = True
            else:
                prev: float = self._last_significant_objective
                # Cuanto ha mejorado relativo al tamaño del objetivo anterior
                relative_change = abs(obj - prev) / abs(prev) if prev != 0 else 1.0
                significant = relative_change >= self.min_improvement_ratio

            self.history.append({
                "time": round(t_wall, 3),
                "objective": obj,
                "bound": bound,
                "gap": gap,
                "significant": significant,
            })

            if significant:
                self._last_significant_objective = obj
                self.last_improvement_time = time.monotonic()
            # Si NO es significativa, deliberadamente NO actualizamos
            # last_improvement_time: el reloj de estancamiento sigue
            # contando desde la última mejora que sí importó.

    def seconds_since_last_improvement(self):
        """None si aun no hay ninguna solucion factible (no contar como estancamiento)."""
        with self._lock:
            if self.last_improvement_time is None:
                return None
            return time.monotonic() - self.last_improvement_time


@dataclass
class StagnationSolveResult:
    status: int
    status_name: str
    stopped_by_stagnation: bool
    solver: cp_model.CpSolver = field(default_factory=cp_model.CpSolver)
    history: list = field(default_factory=list)
    wall_time: float = 0.0


def solve_with_stagnation_stop(
    model: cp_model.CpModel,
    max_time_seconds: float,
    stagnation_seconds: float,
    min_improvement_ratio: float = 0.0,
    check_interval: float = 0.1,
    solver_params: dict | None = None,
) -> StagnationSolveResult:
    """
    Resuelve el modelo, deteniéndolo si:
      (a) se alcanza max_time_seconds (límite duro de respaldo), o
      (b) pasan más de stagnation_seconds sin una mejora SIGNIFICATIVA
          (ver min_improvement_ratio).
    lo que ocurra primero.

    Args:
        model: el cp_model.CpModel ya construido (variables, restricciones,
            objetivo) — no se modifica aquí.
        max_time_seconds: límite duro, igual que max_time_in_seconds de
            siempre. Actúa de red de seguridad si el estancamiento no se
            detecta a tiempo o si nunca se encuentra ninguna solución.
        stagnation_seconds: si no hay mejora significativa en este
            intervalo, se detiene.
        min_improvement_ratio: fracción mínima de cambio en |objective| para
            que una mejora "cuente" y reinicie el reloj de estancamiento.
            0.0 = cualquier mejora cuenta (comportamiento original). Un
            valor como 0.005 (0.5%) ignora micro-mejoras de ruido numérico
            en términos de coste finos (p.ej. distancia a givenDate) que no
            representan una mejora relevante de la solución.
        check_interval: cada cuánto se comprueba el estancamiento desde el
            hilo vigilante (no necesita ser muy fino; 0.1s es razonable).
        solver_params: dict opcional de parámetros adicionales a fijar en
            solver.parameters (ej. {"relative_gap_limit": 0.05}, para usar
            estancamiento Y gap juntos).

    Returns:
        StagnationSolveResult con el status final, si se paró por
        estancamiento, y el historial de mejoras (cada entrada incluye
        "significant": bool, para que puedas distinguir mejoras de ruido
        al inspeccionar result.history).
    """
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_time_seconds
    if solver_params:
        for key, value in solver_params.items():
            setattr(solver.parameters, key, value)

    callback = _StagnationCallback(min_improvement_ratio=min_improvement_ratio)
    stopped_by_stagnation = threading.Event()
    _solve_finished = threading.Event()

    def watcher():
        while True:
            time.sleep(check_interval)
            since_improvement = callback.seconds_since_last_improvement()
            if since_improvement is not None and since_improvement > stagnation_seconds:
                stopped_by_stagnation.set()
                callback.StopSearch()
                return
            # Si Solve() ya terminó (por max_time o porque cerró el gap),
            # el hilo principal habrá hecho join() y este watcher debe
            # poder salir también; lo controlamos desde fuera con un Event.
            if _solve_finished.is_set():
                return
    watcher_thread = threading.Thread(target=watcher, daemon=True)
    watcher_thread.start()

    t0 = time.monotonic()
    status = solver.Solve(model, callback)
    t1 = time.monotonic()

    _solve_finished.set()
    watcher_thread.join(timeout=1.0)

    return StagnationSolveResult(
        status=status,  # type: ignore[arg-type]
        status_name=solver.StatusName(status),
        stopped_by_stagnation=stopped_by_stagnation.is_set(),
        solver=solver,
        history=callback.history,
        wall_time=t1 - t0,
    )