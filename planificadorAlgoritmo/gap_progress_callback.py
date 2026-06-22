"""
Callback para capturar la evolución del gap de optimalidad a lo largo del
tiempo, en una sola ejecución del solver.

Uso:
    callback = GapProgressCallback()
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60  # generoso, para ver toda la curva
    # NO fijar relative_gap_limit aquí (o ponerlo muy bajo), queremos ver
    # el progreso completo, no que pare en cuanto alcance un gap concreto.
    status = solver.Solve(model, callback)

    callback.print_table()
    # o:
    for row in callback.history:
        print(row)
"""

from ortools.sat.python import cp_model


class GapProgressCallback(cp_model.CpSolverSolutionCallback):
    def __init__(self, snapshot_fn=None):
        """
        snapshot_fn: función opcional sin argumentos que, llamada DENTRO del
            callback, devuelve algo que represente la solución actual (por
            ejemplo, la lista de grupos de bloques por tarea, usando
            self.Value(x[i, j]) — pásala como closure que capture x, tasks,
            available_blocks, etc.). Si no se da, solo se guardan los números.

            Ejemplo de uso:

                def snapshot():
                    return {
                        i: [j for j in range(n_blocks) if callback.Value(x[i, j]) == 1]
                        for i in range(n_tasks)
                    }
                callback = GapProgressCallback(snapshot_fn=snapshot)

            (snapshot_fn debe llamar a callback.Value(...), no a solver.Value(...),
            ya que durante el callback el propio callback expone los valores
            de la solución actual.)
        """
        super().__init__()
        self.history = []  # lista de dicts: {time, objective, bound, gap, snapshot}
        self._snapshot_fn = snapshot_fn

    def on_solution_callback(self):
        obj = self.ObjectiveValue()
        bound = self.BestObjectiveBound()
        t = self.WallTime()

        # gap relativo, igual que lo define CP-SAT internamente
        if obj != 0:
            gap = abs(obj - bound) / abs(obj)
        else:
            gap = 0.0

        entry = {
            "time": round(t, 3),
            "objective": obj,
            "bound": bound,
            "gap": gap,
        }
        if self._snapshot_fn is not None:
            entry["snapshot"] = self._snapshot_fn()

        self.history.append(entry)

    def print_table(self):
        print(f"{'t (s)':>8} {'objective':>14} {'bound':>14} {'gap':>8}")
        for row in self.history:
            print(f"{row['time']:>8.3f} {row['objective']:>14.0f} {row['bound']:>14.0f} {row['gap']:>8.4f}")

    def gap_at_time(self, target_time: float) -> float | None:
        """Devuelve el gap de la última solución encontrada ANTES de target_time."""
        candidates = [r for r in self.history if r["time"] <= target_time]
        if not candidates:
            return None
        return candidates[-1]["gap"]