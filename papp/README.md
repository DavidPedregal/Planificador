# Mentiplan — Frontend (`papp/`)

Frontend de la aplicación web Mentiplan. Construido con Next.js 16, React Compiler y TypeScript.

## Stack

- **Next.js 16** con App Router
- **TypeScript**
- **FullCalendar** — calendario interactivo
- **i18next** — internacionalización (español e inglés)
- **CSS plano** con variables CSS para theming

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Pantalla de login con Google Sign-In |
| `/home` | Vista principal: calendario + sidebar + to-do list |
| `/settings` | Configuración de la cuenta y preferencias |
| `/statistics` | Estadísticas de tiempo de estudio por asignatura |

Las páginas protegidas (`/home`, `/settings`, `/statistics`) llaman a `useAuthGuard()` al montarse. El hook verifica el token con el backend y redirige a `/` si la sesión no es válida.

## Estructura de código

```
src/
├── app/
│   ├── components/
│   │   ├── calendar/        # Componente FullCalendar y lógica de eventos
│   │   ├── event/           # Diálogos de añadir y editar eventos
│   │   ├── plannedEvent/    # Diálogos de eventos planificados
│   │   ├── sidebar/         # Barra lateral, menú de herramientas, importar/exportar
│   │   ├── todoList/        # Lista de tareas pendientes
│   │   └── navbar/          # Barra de navegación
│   ├── home/                # Página /home
│   ├── settings/            # Página /settings
│   ├── statistics/          # Página /statistics
│   └── config/config.ts     # URL del backend
├── context/AppContext.tsx   # Estado global (usuario, tema, alertas)
├── hooks/useAuthGuard.ts    # Protección de rutas
├── i18n/                    # Configuración i18next + locales (en, es)
└── lib/api.ts               # Wrapper apiFetch
```

## Conceptos clave

### Llamadas a la API

Usar siempre `apiFetch` de `src/lib/api.ts` para endpoints JSON. Devuelve `{ ok, data, message }`. El campo `message` ya viene traducido (el backend envía claves i18n y `apiFetch` las resuelve).

Excepción: las subidas de archivos usan `fetch` nativo con `FormData`.

Todas las peticiones incluyen `Authorization: Bearer <token>` desde `localStorage`.

### Theming

El tema es `"dark"` (por defecto) o `"light"`, almacenado en `userSettings` y aplicado como `data-theme` en `<html>`. Todos los colores son variables CSS definidas en `globals.css`. Nunca hardcodear colores.

### i18n

Dos locales: `en` y `es`. Se autodetecta el idioma del navegador. Archivos de traducción en `src/i18n/locales/en.json` y `es.json`. Al añadir cualquier texto visible al usuario, añadirlo a **ambos** archivos.

### Patrón de diálogos

Todos los diálogos usan las clases CSS: `aed-overlay`, `aed-dialog`, `aed-header`, `aed-body`, `aed-footer`, `aed-field`, `aed-label`, `aed-input`, `aed-button`, `aed-button primary`. Ver `add-event-dialog.css` como referencia.

## Desarrollo local

```bash
# Desde la raíz del proyecto
docker compose up --build

# O directamente (requiere .env con NEXT_PUBLIC_URL_BACK y NEXT_PUBLIC_GOOGLE_CLIENT_ID)
cd papp
npm install
npm run dev
```

La aplicación corre en `http://localhost:3000`.