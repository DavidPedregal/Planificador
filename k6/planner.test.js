/**
 * STRESS TEST — planner.test.js
 *
 * Purpose: isolate and stress the most expensive endpoint — POST /plan —
 * which calls OR-Tools via the Python microservice. This is the most
 * likely bottleneck on a single-server deployment.
 *
 * ⚠️  WARNING: Each POST /plan run regenerates the plan for the user in
 * the database. Use a DEDICATED TEST ACCOUNT, not your real account.
 * Create a throwaway Google account, log in once to get a JWT, and use
 * that token here.
 *
 * What the test does:
 *   1. Ramp from 1 → 5 concurrent users making POST /plan requests
 *   2. Hold at 5 for 30 s to see how the system sustains it
 *   3. Ramp down and record where latency climbs or errors appear
 *
 * Keep VU count LOW. Each request is CPU-heavy (OR-Tools solver).
 * Starting at 1-3 VUs is sensible; only go to 5+ if 3 looks stable.
 *
 * Usage:
 *   k6 run -e TOKEN=<test_account_jwt> k6/planner.test.js
 *
 * Optional overrides:
 *   k6 run -e TOKEN=<jwt> -e BASE_URL=http://localhost:8000 k6/planner.test.js
 */

import http  from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://mentiplan.com/api";
const TOKEN    = __ENV.TOKEN;

export const options = {
    stages: [
        { duration: "10s", target: 1 },  // warm up with a single user
        { duration: "20s", target: 3 },  // ramp to 3 concurrent planners
        { duration: "30s", target: 3 },  // hold — watch for timeout/errors
        { duration: "10s", target: 5 },  // push to 5 — expect degradation here
        { duration: "10s", target: 0 },  // ramp down
    ],

    thresholds: {
        // The planner can legitimately take several seconds — thresholds are generous
        http_req_duration: ["p(95)<10000", "p(99)<20000"],
        // No more than 5% errors (the solver can fail if there's nothing to schedule)
        http_req_failed:   ["rate<0.05"],
    },
};

const headers = {
    Authorization:  `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
};

export default function () {
    const res = http.post(`${BASE_URL}/plan`, null, { headers });

    check(res, {
        "plan creado (201)":              (r) => r.status === 201,
        "respuesta en menos de 10s":      (r) => r.timings.duration < 10000,
        "body contiene data o warnings":  (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.data !== undefined;
            } catch {
                return false;
            }
        },
    });

    // Long pause: OR-Tools needs CPU. Hammering without sleep would queue
    // requests faster than the solver can process them.
    sleep(2);
}
