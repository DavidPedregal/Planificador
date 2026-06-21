"""
Umbral dinámico de relative_gap_limit para CP-SAT, basado en ajuste empírico.

Hallazgo experimental (ver notas de las pruebas con blocks=40/80/160):
  - El gap de optimalidad al cortar el solver sigue aproximadamente
    gap ≈ a(blocks) * tasks^b(blocks), en la zona de occupancy baja-media
    (~0.1-0.5: el horario tiene bastante margen libre respecto al tiempo
    total de las tareas).
  - Cuando occupancy es alta (horario casi lleno), el gap cae mucho más
    rápido de lo que predice esa fórmula -> ahí no usamos el modelo,
    aplicamos directamente un umbral bajo fijo (es seguro: el solver real
    converge mejor de lo que el modelo predeciría, así que no nos quedamos
    cortos).
  - El modelo se ajustó con pocos puntos (3 series de hasta 9 valores de
    tasks). Es una heurística de arranque razonable, no una ley exacta.
    Conviene revisarla con datos reales de producción.

IMPORTANTE: el ajuste se hizo en términos de (tasks, blocks), donde blocks
es el número de huecos de 15 min disponibles para planificar (variable
`n_blocks` en resolver()), no `n_tasks * n_blocks` ni otra combinación.
"""

from bisect import bisect_left

# Puntos medidos (blocks -> (a, b) del ajuste gap = a * tasks^b)
_KNOWN_BLOCKS = [40, 80, 160]
_KNOWN_A = [0.1543, 0.4201, 0.5538]
_KNOWN_B = [-0.7885, -1.2988, -1.1933]

# Umbrales de seguridad
_OCCUPANCY_HIGH_THRESHOLD = 0.7   # por encima de esto, el modelo no aplica
_HIGH_OCCUPANCY_GAP_LIMIT = 0.05  # umbral fijo y conservador para esa zona
_SAFETY_MARGIN = 1.3              # margen sobre el gap predicho (30%)
_MIN_GAP_LIMIT = 0.02             # nunca pedir menos del 2%
_MAX_GAP_LIMIT = 0.50             # nunca pedir más del 50% (no tiene sentido práctico)


def _interp(x: float, xs: list[int], ys: list[float]) -> float:
    """Interpolación lineal simple, sin dependencias externas (sin numpy)."""
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    i = bisect_left(xs, x)
    x0, x1 = xs[i - 1], xs[i]
    y0, y1 = ys[i - 1], ys[i]
    frac = (x - x0) / (x1 - x0)
    return y0 + frac * (y1 - y0)


def predicted_gap(n_tasks: int, n_blocks: int) -> float:
    """
    Gap de optimalidad esperado (fracción, ej. 0.1 = 10%) para una instancia
    con n_tasks tareas y n_blocks huecos disponibles, asumiendo occupancy
    baja-media. No tiene en cuenta occupancy directamente -> usar
    get_gap_limit() para la lógica completa.
    """
    if n_tasks <= 0:
        return _MAX_GAP_LIMIT
    a = _interp(n_blocks, _KNOWN_BLOCKS, _KNOWN_A)
    b = _interp(n_blocks, _KNOWN_BLOCKS, _KNOWN_B)
    gap = a * (n_tasks ** b)
    return min(gap, _MAX_GAP_LIMIT)


def get_gap_limit(n_tasks: int, n_blocks: int, total_task_time: int) -> float:
    """
    Calcula el relative_gap_limit a aplicar en CpSolver.parameters para una
    instancia concreta.

    Args:
        n_tasks: número de tareas a planificar (len(tasks) en resolver()).
        n_blocks: número de bloques de 15 min disponibles (len(available_blocks)).
        total_task_time: minutos totales a planificar entre todas las tareas
            (sum(task["estimatedTime"] for task in tasks)).

    Returns:
        Valor a asignar a solver.parameters.relative_gap_limit.
    """
    if n_blocks <= 0 or n_tasks <= 0:
        return _MIN_GAP_LIMIT

    occupancy = total_task_time / (n_blocks * 15)

    if occupancy > _OCCUPANCY_HIGH_THRESHOLD:
        # Horario casi lleno: poca simetría real, el solver converge rápido.
        # Un umbral fijo bajo es seguro aquí (no estamos extrapolando el
        # modelo fuera de su rango de validez).
        return _HIGH_OCCUPANCY_GAP_LIMIT

    gap = predicted_gap(n_tasks, n_blocks)
    limit = gap * _SAFETY_MARGIN
    return max(min(limit, _MAX_GAP_LIMIT), _MIN_GAP_LIMIT)
