# Mentiplan — Planificador Académico Inteligente

**Mentiplan** es una aplicación web personal para organizar estudios y tareas académicas. Los usuarios inician sesión con Google, gestionan calendarios y eventos, crean tareas y dejan que el planificador con IA distribuya automáticamente las sesiones de estudio en el tiempo libre disponible.

Disponible en producción en: **mentiplan.com**

---

## Arquitectura — 3 servicios

```
Planificador/
├── papp/                    # Frontend — Next.js 16        → localhost:3000
├── planificadorBack/        # Backend  — Express.js        → localhost:8000
├── planificadorAlgoritmo/   # Planificador — FastAPI       → localhost:8001
└── docker-compose.yml
```

Los tres servicios están contenedorizados. MongoDB corre como cuarto contenedor (solo acceso interno).

---

## Funcionalidades principales

- **Google Sign-In** — autenticación mediante cuenta de Google; no hay registro manual.
- **Calendario central** — vista mensual, semanal o diaria con FullCalendar. Los eventos y sesiones de estudio planificadas se muestran juntos.
- **Múltiples calendarios** — el usuario puede crear calendarios con color personalizado y filtrar la vista por cada uno.
- **Eventos con recurrencia** — soporte para eventos únicos y periódicos (diario, semanal, mensual, anual) con opciones de edición individual, desde una fecha o todos.
- **Importación de horarios** — carga de archivos `.ics` (Google Calendar) o `.csv` (formato universitario UO) para importar el horario académico.
- **Tareas** — cada tarea tiene título, descripción, asignatura, tiempo estimado (minutos) y fecha límite. Se pueden marcar como completadas.
- **Planificación automática con OR-Tools** — el backend calcula los slots libres del usuario (respetando eventos existentes y la franja horaria configurada) y los envía al microservicio Python, que usa Google OR-Tools para repartir las sesiones de estudio de forma óptima.
- **Reseñas con repetición espaciada** — las tareas pueden generar reseñas automáticas usando un algoritmo SM-2 simplificado para reforzar el aprendizaje.
- **Replanificación** — el plan existente se puede recalcular desde cero o incrementalmente (añadiendo solo las nuevas tareas sin modificar las ya asignadas).
- **To-do list** — lista de tareas pendientes integrada en la pantalla principal.
- **Estadísticas** — tiempo dedicado por asignatura y comparativa de tiempo estimado vs. real, con filtro por fechas.
- **Configuración** — tema (oscuro/claro), color de acento, vista predeterminada del calendario, franja horaria visible (hora inicio/fin), duración de los slots y tiempo máximo de planificación.
- **Internacionalización** — interfaz en español e inglés con detección automática del idioma del navegador.

---

## Ejecutar en local (Docker)

Antes de construir, ajustar en `docker-compose.yml`:

```yaml
CORS_ORIGIN: http://localhost:3000
NEXT_PUBLIC_URL_BACK: http://localhost:8000
```

Luego:

```bash
docker compose up --build
```

La aplicación quedará disponible en `http://localhost:3000`.

## Desplegar en producción

```bash
# En el servidor
git pull
docker compose up --build -d
```

Asegurarse de que `docker-compose.yml` tenga los valores de producción:

```yaml
CORS_ORIGIN: http://mentiplan.com
NEXT_PUBLIC_URL_BACK: http://mentiplan.com/api
```

---

## Variables de entorno

Un archivo `.env` en la raíz (no incluido en git) es leído por docker-compose para la sustitución de secretos.

| Variable | Servicio |
|----------|---------|
| `JWT_SECRET` | backend |
| `GOOGLE_CLIENT_ID` | backend |
| `GOOGLE_CLIENT_SECRET` | backend |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | frontend (compilado en build) |
| `MONGO_URI` | backend (por defecto: `mongodb://mongo:27017/planificador`) |
| `PLANNER_URL` | backend (por defecto: `http://algoritmo:8001`) |
| `CORS_ORIGIN` | backend |
| `PORT` | backend (8000) |
| `NEXT_PUBLIC_URL_BACK` | frontend (compilado en build) |

---

## Autor

Desarrollado por **David Pedregal Ribas**
Trabajo de Fin de Grado — Universidad de Oviedo, Escuela de Ingeniería Informática