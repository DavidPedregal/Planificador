# Mentiplan — Backend (`planificadorBack/`)

API REST de la aplicación Mentiplan. Gestiona usuarios, calendarios, eventos, tareas y la comunicación con el microservicio de planificación.

## Stack

- **Node.js + Express.js**
- **Mongoose / MongoDB**
- **JWT** — autenticación stateless (7 días de expiración)
- **Google OAuth** — login con cuenta de Google
- **multer** — subida de archivos (máx. 5 MB)
- **node-ical** — parseo de archivos ICS

## Arquitectura

```
routes/ → services/ → repository/ → models/
```

Cada capa tiene una única responsabilidad. Las rutas no acceden a la base de datos directamente; los repositorios no contienen lógica de negocio.

## API

Todas las rutas protegidas requieren `Authorization: Bearer <jwt>` en la cabecera. El middleware `authMiddleware` decodifica el token y pone `req.userId` disponible.

Las respuestas siempre usan el formato `{ data: ... }` o `{ message: "api.i18n.key" }`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/users/login` | Intercambia un token de Google por un JWT |
| `GET` | `/users/verify` | Verifica que el JWT sigue siendo válido |
| `GET` | `/events` | Lista todos los eventos del usuario |
| `POST` | `/events` | Crea un evento (puede ser recurrente) |
| `PUT` | `/events/:id` | Edita un evento individual |
| `PUT` | `/events/forward/:id` | Edita este y todos los eventos futuros del grupo |
| `PUT` | `/events/all/:id` | Edita todos los eventos del grupo |
| `DELETE` | `/events/:id` | Elimina un evento individual |
| `DELETE` | `/events/forward/:id` | Elimina este y los eventos futuros del grupo |
| `DELETE` | `/events/all/:id` | Elimina todos los eventos del grupo |
| `POST` | `/events/import` | Importa eventos desde un archivo `.csv` o `.ics` |
| `DELETE` | `/events/label/:label` | Elimina todos los eventos con una etiqueta dada |
| `GET` | `/calendars` | Lista los calendarios personalizados del usuario |
| `GET` | `/calendars/common` | Lista los calendarios del sistema del usuario |
| `POST` | `/calendars` | Crea un calendario |
| `DELETE` | `/calendars/clean/:id` | Elimina todos los eventos de un calendario |
| `DELETE` | `/calendars/:id` | Elimina un calendario y sus eventos |
| `GET` | `/tasks` | Lista todas las tareas del usuario |
| `POST` | `/tasks` | Crea una o varias tareas |
| `PUT` | `/tasks/:id` | Edita una tarea |
| `DELETE` | `/tasks/:id` | Elimina una tarea |
| `GET` | `/subjects` | Lista las asignaturas del usuario |
| `POST` | `/subjects` | Crea una asignatura |
| `DELETE` | `/subjects/:id` | Elimina una asignatura |
| `GET` | `/plan` | Obtiene el plan de estudio actual |
| `POST` | `/plan` | Genera un nuevo plan (incremental) |
| `POST` | `/plan/reset` | Descarta el plan existente y genera uno nuevo desde cero |
| `DELETE` | `/plan` | Elimina el plan actual |
| `GET` | `/settings` | Obtiene la configuración del usuario |
| `PUT` | `/settings/:id` | Actualiza la configuración |
| `GET` | `/statistics/subject-time` | Tiempo de estudio por asignatura en un rango de fechas |
| `GET` | `/statistics/comparison-time` | Comparativa de tiempo estimado vs. real |

## Importación de horarios

- **`.ics`** — formato iCal estándar (exportado desde Google Calendar u otros).
- **`.csv`** — formato CSV universitario (UO) con columnas: Subject, Start Date, Start Time, End Date, End Time, Description, Location.

## Modelos de datos

| Modelo | Descripción |
|--------|-------------|
| `User` | Usuario (sub de Google, nombre, email, avatar) |
| `Calendar` | Calendario del usuario con nombre y color |
| `CalendarEvent` | Evento en un calendario; soporta agrupación por `groupId` para recurrencias |
| `Task` | Tarea con tiempo estimado, fecha límite y soporte de repetición espaciada (SM-2) |
| `Subject` | Asignatura asociada a tareas |
| `PlanEvent` | Bloque de estudio generado por el planificador |
| `Settings` | Preferencias del usuario (tema, vista, franja horaria, tiempo máximo de planificación) |

## Clases de error (`errors/AppError.js`)

| Clase | HTTP |
|-------|------|
| `ValidationError` | 400 |
| `NotFoundError` | 404 |
| `RepositoryError` | 500 |

Los errores se lanzan desde los servicios y son capturados por el middleware central `errorHandler`.

## Rate limiting

- `authLimiter` — ruta de login (50 req / 15 min).
- `dbLimiter` — resto de rutas autenticadas (1000 req / 15 min).
- Limitador global en todas las rutas (1000 req / 15 min).

## Tests

```bash
cd planificadorBack
npm test
```

Jest + supertest. Los tests de rutas mockean el rate limiter, los repositorios y los parsers de importación. El archivo `package.json` incluye `setupFiles: ["dotenv/config"]` para cargar el `.env` automáticamente.

## Desarrollo local

```bash
# Desde la raíz del proyecto
docker compose up --build

# O directamente (requiere MongoDB y las variables de entorno del .env)
cd planificadorBack
npm install
npm start
```

El servidor escucha en el puerto `8000`.