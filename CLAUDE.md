# Planificador (Mentiplan) — Claude Context

## Golden rules
- **Ask before assuming.** If anything is unclear — architecture, behaviour, naming, scope — ask. Do not fill gaps with guesses.
- **Follow existing patterns.** Match the style, structure, and conventions already in the codebase. If you think a better design exists, propose it and let the user decide.
- **Never touch `.env` files.**

---

## What this app is
A personal scheduling app (public name: **Mentiplan**). Users log in with Google, manage calendars and events, create tasks, and use an AI planner that schedules study sessions and reviews automatically.

Production URL: `mentiplan.com`

---

## Architecture — 3 services

```
Planificador/
├── papp/                    # Next.js 16 frontend        → localhost:3000
├── planificadorBack/        # Express.js backend         → localhost:8000
├── planificadorAlgoritmo/   # FastAPI + OR-Tools planner → localhost:8001
└── docker-compose.yml
```

All three are containerised. MongoDB runs as a 4th container (internal only, no host port).

### Running locally (Docker)
```bash
docker compose up --build
```
Before building, set `docker-compose.yml` values for local use:
- `CORS_ORIGIN: http://localhost:3000`
- `NEXT_PUBLIC_URL_BACK: http://localhost:8000`

### Deploying to production
Push to repo → SSH into server → `git pull` → `docker compose up --build -d`.
Production values in `docker-compose.yml`:
- `CORS_ORIGIN: http://mentiplan.com`
- `NEXT_PUBLIC_URL_BACK: http://mentiplan.com/api`

### Required env vars
A root `.env` file (not tracked in git) is read by docker-compose for secret substitution.  
Each service also needs its own `.env` for local non-Docker development.

| Var | Used by |
|-----|---------|
| `JWT_SECRET` | backend |
| `GOOGLE_CLIENT_ID` | backend |
| `GOOGLE_CLIENT_SECRET` | backend |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | frontend (baked at build time) |
| `MONGO_URI` | backend (default: `mongodb://mongo:27017/planificador`) |
| `PLANNER_URL` | backend (default: `http://algoritmo:8001`) |
| `CORS_ORIGIN` | backend |
| `PORT` | backend (8000) |
| `NEXT_PUBLIC_URL_BACK` | frontend (baked at build time) |

---

## Frontend (`papp/`)

**Stack:** Next.js 16, React Compiler, TypeScript, i18next, FullCalendar, plain CSS.

### Key directories
```
src/
├── app/
│   ├── components/       # All UI components
│   │   ├── calendar/
│   │   ├── event/        # Add/edit event dialogs
│   │   ├── plannedEvent/ # Planned event dialogs
│   │   ├── sidebar/      # Sidebar, tools menu, import/export/delete dialogs
│   │   ├── todoList/
│   │   └── navbar/
│   ├── home/             # /home page (calendar + sidebar + todo)
│   ├── settings/         # /settings page
│   ├── statistics/       # /statistics page (incomplete)
│   └── config/config.ts  # backendUrl
├── context/AppContext.tsx # Global state
├── hooks/useAuthGuard.ts  # Route protection
├── i18n/                  # i18next setup + locales (en, es)
└── lib/api.ts             # apiFetch wrapper
```

### Global context — `useApp()`
Provides: `user`, `logout`, `theme`, `toggleTheme`, `setTheme`, `userSettings`, `pushAlert`, `alerts`.

### API calls
Always use `apiFetch` from `src/lib/api.ts` for JSON endpoints. It returns `{ ok, data, message }`. The `message` is already translated (backend sends i18n keys, `apiFetch` resolves them).

Exception: multipart/file uploads use raw `fetch` with `FormData`.

All requests include `Authorization: Bearer <token>` from `localStorage.getItem("token")`.

### Route protection
Protected pages (`/home`, `/settings`, `/statistics`) call `useAuthGuard()` as the first line of their component. The hook checks token + user in localStorage and verifies the token with `GET /users/verify`. On failure it calls `logout()` and redirects to `/`.

### Theming
Theme is `"dark"` (default) or `"light"`, stored in `userSettings` and applied as `data-theme` on `<html>`.
All colours are CSS custom properties defined in `globals.css` under `:root, [data-theme="dark"]` and `[data-theme="light"]`. Never hardcode colours — use the variables.

### i18n
Two locales: `en` and `es`. Auto-detects browser language on first load; falls back to `en`.
Translation files: `src/i18n/locales/en.json` and `es.json`.
Backend error messages are i18n keys (e.g. `"api.auth.unauthorized"`) — `apiFetch` resolves them automatically.
When adding any user-facing string, add it to **both** locale files.

### Dialog pattern
All dialogs use CSS classes: `aed-overlay`, `aed-dialog`, `aed-header`, `aed-body`, `aed-footer`, `aed-field`, `aed-label`, `aed-input`, `aed-button`, `aed-button primary`. See `add-event-dialog.css` as the reference.

---

## Backend (`planificadorBack/`)

**Stack:** Express.js, Mongoose/MongoDB, JWT, Google OAuth, multer, node-ical.

### Layered architecture
```
routes/ → services/ → repository/ → models/
```
Each layer has a single responsibility. Do not skip layers (e.g. routes must not query the DB directly).

### Route pattern
```js
router.get('/', dbLimiter, authMiddleware, async (req, res, next) => {
    try {
        const result = await SomeService.doThing(req.userId, ...);
        res.status(200).json({ data: result });
    } catch (err) {
        next(err);
    }
});
```
- `authMiddleware` sets `req.userId` (validated MongoDB ObjectId).
- Errors are passed to `next(err)` and handled by the central `errorHandler` middleware.
- Responses always use `{ data: ... }` or `{ message: "api.i18n.key" }` format.

### Error classes (`errors/AppError.js`)
| Class | HTTP |
|-------|------|
| `ValidationError` | 400 |
| `NotFoundError` | 404 |
| `RepositoryError` | 500 |

Throw these from services; the error handler maps them to HTTP responses.

### Auth
- Login: `POST /users/login` — exchanges a Google OAuth token for a JWT (7-day expiry).
- All protected routes require `Authorization: Bearer <jwt>` header.
- `authMiddleware` decodes the JWT and sets `req.userId`.

### Rate limiting
- `authLimiter` — login route only (50 req / 15 min).
- `dbLimiter` — all other authenticated routes (1000 req / 15 min).
- Global limiter on all routes (1000 req / 15 min).

### Models
`CalendarEvent`, `Calendar`, `PlanEvent`, `Settings`, `Subject`, `Task`, `User`.

Key `CalendarEvent` fields: `userId`, `title`, `calendarId`, `start`, `end`, `useCalendarColor`, `color`, `label`, `groupId`.

### Import parsers
`services/importParsers/universityCsvParser.js` — university CSV format (Subject, Start Date, Start Time, End Date, End Time, Description, Location).  
`services/importParsers/googleCalendarParser.js` — standard ICS/iCal format via `node-ical`.

### Tests
Jest + supertest. Run with `npm test` from `planificadorBack/`.
`setupFiles: ["dotenv/config"]` in `package.json` so tests load `.env` automatically.
Router tests mock `rateLimiterMiddleware`, `calendarRepository`, and any parsers.

---

## Python microservice (`planificadorAlgoritmo/`)

**Stack:** FastAPI, OR-Tools, uvicorn.

Two endpoints:
- `GET /health`
- `POST /plan` — receives tasks/events, returns a scheduled plan.

Called internally by the backend via `PLANNER_URL` env var. Frontend never calls it directly.

---

## Known state / planned work
- **Statistics page** (`/statistics`): exists but is incomplete. Needs to be built out.
- **Known bugs**: to be fixed as discovered.
- No other major features are planned at this time.
