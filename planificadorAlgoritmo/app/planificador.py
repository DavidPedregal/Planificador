from ortools.sat.python import cp_model
# 
model = cp_model.CpModel()

# Bloques por hora (8h a 22h -> 14 bloques de 1h)
horas = range(8, 22)
dias = ["lunes", "martes", "miércoles", "jueves", "viernes"]

# Horas ocupadas (ejemplo)
ocupadas = {
    "lunes": [(9, 12), (15, 17)],
    "martes": [(10, 13)],
}

# Generamos las horas libres por día
libres = {}
for d in dias:
    usados = []
    for (a, b) in ocupadas.get(d, []):
        usados.extend(range(a, b))
    libres[d] = [h for h in horas if h not in usados]

# Tareas con duración y deadline (en días)
tareas = [
    {"nombre": "Matemáticas", "duracion": 3, "deadline": 2},  # antes del miércoles
    {"nombre": "Historia", "duracion": 2, "deadline": 1},     # antes del martes
]

# Variables: tarea -> día, hora de inicio
starts = {}
for t in tareas:
    starts[t['nombre']] = {}
    for d in range(t['deadline'] + 1):  # solo antes del deadline
        for h in libres[dias[d]]:
            starts[t['nombre'], d, h] = model.NewBoolVar(f"{t['nombre']}_{dias[d]}_{h}")

# Restricciones: cada tarea se programa una vez
for t in tareas:
    model.Add(sum(starts[t['nombre'], d, h] for d in range(t['deadline']+1)
                  for h in libres[dias[d]]) == 1)

# (Aquí agregarías restricción de no solapamiento, etc.)

# Objetivo: minimizar la hora máxima de finalización
model.Minimize(sum(h * starts[t['nombre'], d, h]
                   for t in tareas for d in range(t['deadline']+1)
                   for h in libres[dias[d]]))

solver = cp_model.CpSolver()
solver.Solve(model)

for t in tareas:
    for d in range(t['deadline']+1):
        for h in libres[dias[d]]:
            if solver.Value(starts[t['nombre'], d, h]):
                print(f"{t['nombre']} -> {dias[d]} a las {h}:00")
