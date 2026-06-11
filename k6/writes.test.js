/**
 * LOAD TEST — writes.test.js
 *
 * Purpose: test the write-heavy endpoints (POST, PUT, DELETE) which are
 * more expensive than reads because they always hit disk and update indexes.
 *
 * Strategy:
 *   PUT  — setup() creates a pool of tasks; each VU picks one at random
 *           and updates it. Safe and repeatable — same ID can be updated
 *           thousands of times without accumulating data.
 *
 *   POST + DELETE — paired in the same iteration: create a task, extract
 *           its ID from the response, delete it immediately. Database ends
 *           up exactly as it started and both write operations get tested.
 *
 * setup() / teardown() are k6 lifecycle functions that run ONCE before and
 * after the test (not once per VU). They create and clean up the PUT pool.
 *
 * ⚠️  Use a dedicated test account JWT, not your real account.
 *     The setup pool tasks will be visible in the app during the test.
 *
 * Usage:
 *   k6 run -e TOKEN=<test_account_jwt> k6/writes.test.js
 *
 * Optional overrides:
 *   k6 run -e TOKEN=<jwt> -e BASE_URL=https://localhost:8000 k6/writes.test.js
 */

import http  from "k6/http";
import { check, group, sleep } from "k6";

const BASE_URL      = __ENV.BASE_URL || "https://mentiplan.com/api";
const TOKEN         = __ENV.TOKEN;
const SETUP_POOL    = 20;   // number of tasks created in setup() for the PUT pool

export const options = {
    stages: [
        { duration: "10s", target: 5  },  // ramp up — writes need more time per req
        { duration: "30s", target: 10 },  // hold
        { duration: "10s", target: 0  },  // ramp down
    ],

    thresholds: {
        // Writes are slower than reads — thresholds are more generous
        http_req_duration:             ["p(95)<2000", "p(99)<5000"],
        "http_req_duration{name:put}":    ["p(95)<1500"],
        "http_req_duration{name:post}":   ["p(95)<2000"],
        "http_req_duration{name:delete}": ["p(95)<1000"],
        http_req_failed:               ["rate<0.05"],
    },
};

// ── Task bodies ───────────────────────────────────────────────────────────────

// plannable:false so these test tasks never interfere with the real planner
const NEW_TASK = JSON.stringify({
    title:          "k6 write test",
    estimatedTime:  30,
    finishDate:     "2027-12-31T23:59:00.000Z",
    givenDate:      "2026-01-01",
    plannable:      false,
    includeReviews: false,
    frequencyType:  "none",
});

const UPDATED_TASK = JSON.stringify({
    title:          "k6 write test (updated)",
    estimatedTime:  45,
    finishDate:     "2027-12-31T23:59:00.000Z",
    givenDate:      "2026-01-01",
    plannable:      false,
    includeReviews: false,
});

function authHeaders() {
    return {
        Authorization:  `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
    };
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export function setup() {
    const ids = [];

    for (let i = 0; i < SETUP_POOL; i++) {
        const res  = http.post(`${BASE_URL}/tasks`, NEW_TASK, { headers: authHeaders() });
        const body = JSON.parse(res.body);

        // POST /tasks returns { data: [...] } — insertMany always returns an array
        if (res.status === 201 && body.data && body.data.length > 0) {
            ids.push(body.data[0]._id);
        }
    }

    if (ids.length === 0) {
        throw new Error("setup() failed: could not create any tasks. Check TOKEN and BASE_URL.");
    }

    console.log(`setup: created ${ids.length} tasks for the PUT pool`);
    return { taskIds: ids };
}

export function teardown(data) {
    console.log(`teardown: deleting ${data.taskIds.length} setup tasks`);
    for (const id of data.taskIds) {
        http.del(`${BASE_URL}/tasks/${id}`, null, { headers: authHeaders() });
    }
}

// ── Main test ─────────────────────────────────────────────────────────────────

export default function (data) {

    // ── PUT: update a random task from the setup pool ─────────────────────────
    group("actualizar tarea (PUT)", () => {
        const id  = data.taskIds[Math.floor(Math.random() * data.taskIds.length)];
        const res = http.put(
            `${BASE_URL}/tasks/${id}`,
            UPDATED_TASK,
            { headers: authHeaders(), tags: { name: "put" } }
        );

        check(res, { "put → 200": (r) => r.status === 200 });
    });

    sleep(0.5);

    // ── POST + DELETE: create a task then immediately remove it ───────────────
    group("crear y eliminar tarea (POST+DELETE)", () => {
        const createRes = http.post(
            `${BASE_URL}/tasks`,
            NEW_TASK,
            { headers: authHeaders(), tags: { name: "post" } }
        );

        check(createRes, { "post → 201": (r) => r.status === 201 });

        if (createRes.status === 201) {
            const body   = JSON.parse(createRes.body);
            const taskId = body.data[0]._id;

            const deleteRes = http.del(
                `${BASE_URL}/tasks/${taskId}`,
                null,
                { headers: authHeaders(), tags: { name: "delete" } }
            );

            check(deleteRes, { "delete → 200": (r) => r.status === 200 });
        }
    });

    sleep(1);
}
