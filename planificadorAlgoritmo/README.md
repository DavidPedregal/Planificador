# Mentiplan — Microservicio de Planificación (`planificadorAlgoritmo/`)

Microservicio Python que implementa el algoritmo de planificación de sesiones de estudio usando Google OR-Tools. El backend principal lo invoca internamente; el frontend nunca llama a este servicio directamente.

## Stack

- **Python 3.11**
- **FastAPI** — API REST
- **Google OR-Tools** — optimización con restricciones
- **Docker**

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Comprobación de estado |
| `POST` | `/plan` | Genera un plan de estudio |

## Entrada — `POST /plan`

```json
{
  "tasks": [
    {
      "taskId": "string",
      "title": "string",
      "estimatedTime": 120,
      "finishDate": "2025-06-15T00:00:00",
      "givenDate": "2025-06-01T00:00:00",
      "includeReviews": false
    }
  ],
  "plannableSlots": [
    { "start": "2025-06-10T09:00:00", "end": "2025-06-10T11:00:00" }
  ],
  "previousPlan": [],
  "maxTime": 10
}
```

| Campo | Descripción |
|-------|-------------|
| `tasks` | Tareas a planificar, con tiempo estimado (minutos) y fecha límite |
| `plannableSlots` | Franjas libres del usuario calculadas por el backend (sin solapamiento con eventos existentes ni fuera de la franja horaria configurada) |
| `previousPlan` | Bloques ya planificados de planes anteriores (para planificación incremental) |
| `maxTime` | Tiempo máximo de resolución en segundos (configurado por el usuario) |

> El backend es responsable de calcular los `plannableSlots` (descontando eventos existentes del calendario y respetando la franja horaria del usuario). El microservicio asume que los datos llegan ya validados.

## Salida

```json
{
  "scheduled": [
    {
      "taskId": "string",
      "title": "string",
      "start": "2025-06-10T09:00:00",
      "end": "2025-06-10T11:00:00",
      "scheduledTime": 120
    }
  ],
  "warnings": [
    {
      "taskId": "string",
      "title": "string",
      "message": "string"
    }
  ]
}
```

- `scheduled` — bloques de estudio asignados (una tarea puede dividirse en varios bloques).
- `warnings` — tareas que no pudieron planificarse completamente (por ejemplo, por falta de tiempo disponible antes de la fecha límite).

## Modos de planificación

**Planificación completa** (`previousPlan: []`) — se recalcula todo el calendario desde cero.

**Planificación incremental** (`previousPlan: [...]`) — los bloques del plan previo se tratan como ocupados y solo se insertan las nuevas tareas sin modificar las ya asignadas.

## Modelo de optimización

El algoritmo formula el problema como una optimización con restricciones (CP-SAT de OR-Tools) que:

- Respeta las fechas límite de cada tarea.
- No asigna trabajo fuera de los `plannableSlots`.
- Distribuye la carga diaria de forma homogénea.
- Prioriza completar las tareas lo antes posible dentro del tiempo disponible.
- Emite advertencias en lugar de fallar cuando no es posible planificar una tarea entera.

## Desarrollo local

```bash
# Desde la raíz del proyecto
docker compose up --build

# O directamente
cd planificadorAlgoritmo
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001

# Tests
python -m pytest test_scheduler.py
```