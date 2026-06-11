/**
 * LOAD TEST — tasks.test.js
 *
 * Purpose: simulate realistic concurrent usage of the main read-heavy
 * endpoints. This mirrors what happens when multiple users open the app:
 * the frontend fires ~5 parallel requests to populate the calendar,
 * sidebar, and task list.
 *
 * Endpoints tested (all GET, all authenticated):
 *   GET /users/verify     — token check on page load
 *   GET /calendars        — load user calendars (sidebar)
 *   GET /calendars/common — load default calendars (sidebar)
 *   GET /events           — load calendar events (main view)
 *   GET /tasks            — load task list
 *   GET /plan             — load planned events
 *
 * Rate limiter: dbLimiter allows 1000 req / 15 min per IP.
 * With 20 VUs × 30s each VU makes ~5 req/iteration × ~15 iterations
 * = ~1500 req total. Watch the rate — back off if you see 429s.
 *
 * Usage:
 *   k6 run -e TOKEN=<your_jwt> k6/tasks.test.js
 *
 * Optional overrides:
 *   k6 run -e TOKEN=<jwt> -e BASE_URL=http://localhost:8000 k6/tasks.test.js
 *
 * Ramp-up profile (edit options.stages to change load shape):
 *   0-10s  ramp from 0 → 20 VUs
 *   10-40s hold at 20 VUs
 *   40-50s ramp down to 0
 */

import http  from "k6/http";
import { check, group, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://mentiplan.com/api";
const TOKEN    = __ENV.TOKEN;

export const options = {
    stages: [
        { duration: "10s", target: 20 },  // ramp up
        { duration: "30s", target: 20 },  // hold
        { duration: "10s", target: 0  },  // ramp down
    ],

    thresholds: {
        // All endpoints: p95 under 1 s, p99 under 3 s
        http_req_duration:           ["p(95)<1000", "p(99)<3000"],
        // Individual endpoint thresholds (tagged by name)
        "http_req_duration{name:verify}":    ["p(95)<300"],
        "http_req_duration{name:calendars}": ["p(95)<800"],
        "http_req_duration{name:events}":    ["p(95)<1000"],
        "http_req_duration{name:tasks}":     ["p(95)<800"],
        "http_req_duration{name:plan}":      ["p(95)<1000"],
        // Error rate under 1% (excludes expected 4xx like 401 on expired tokens)
        http_req_failed: ["rate<0.01"],
    },
};

const headers = { Authorization: `Bearer ${TOKEN}` };

export default function () {
    // ── Verificación de token ─────────────────────────────────────────────────
    group("verificar token", () => {
        const res = http.get(`${BASE_URL}/users/verify`, {
            headers,
            tags: { name: "verify" },
        });
        check(res, { "verify → 200": (r) => r.status === 200 });
    });

    sleep(0.2);

    // ── Carga inicial del sidebar ─────────────────────────────────────────────
    group("cargar calendarios", () => {
        const [custom, common] = http.batch([
            {
                method: "GET",
                url: `${BASE_URL}/calendars`,
                params: { headers, tags: { name: "calendars" } },
            },
            {
                method: "GET",
                url: `${BASE_URL}/calendars/common`,
                params: { headers, tags: { name: "calendars" } },
            },
        ]);

        check(custom, { "calendars → 200":        (r) => r.status === 200 });
        check(common, { "calendars/common → 200":  (r) => r.status === 200 });
    });

    sleep(0.2);

    // ── Carga de la vista principal ───────────────────────────────────────────
    group("cargar eventos y tareas", () => {
        const [events, tasks, plan] = http.batch([
            {
                method: "GET",
                url: `${BASE_URL}/events`,
                params: { headers, tags: { name: "events" } },
            },
            {
                method: "GET",
                url: `${BASE_URL}/tasks`,
                params: { headers, tags: { name: "tasks" } },
            },
            {
                method: "GET",
                url: `${BASE_URL}/plan`,
                params: { headers, tags: { name: "plan" } },
            },
        ]);

        check(events, { "events → 200": (r) => r.status === 200 });
        check(tasks,  { "tasks → 200":  (r) => r.status === 200 });
        check(plan,   { "plan → 200":   (r) => r.status === 200 });
    });

    // Pause between iterations — simulates a user reading the calendar
    sleep(1);
}
