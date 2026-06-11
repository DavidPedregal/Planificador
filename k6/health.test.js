/**
 * SMOKE TEST — health.test.js
 *
 * Purpose: confirm the server is alive and responding within acceptable
 * latency before running heavier tests.
 *
 * What it does: hits GET /users/verify with your JWT. If the server is up
 * and the token is valid you get 200; if the token is expired you get 401.
 * Either way a real HTTP response proves the server is reachable.
 *
 * Usage:
 *   k6 run -e TOKEN=<your_jwt> k6/health.test.js
 *
 * Optional overrides:
 *   k6 run -e TOKEN=<jwt> -e BASE_URL=http://localhost:8000 k6/health.test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://mentiplan.com/api";
const TOKEN    = __ENV.TOKEN;

export const options = {
    vus:      5,
    duration: "15s",

    thresholds: {
        // 95% of requests must complete in under 500 ms
        http_req_duration: ["p(95)<500"],
        // Zero failed connections (status 0 = server unreachable)
        "checks{type:reachable}": ["rate==1"],
    },
};

export default function () {
    const res = http.get(`${BASE_URL}/users/verify`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        tags: { type: "reachable" },
    });

    check(res, {
        "servidor responde (no es timeout)": (r) => r.status !== 0,
        "respuesta en menos de 500ms":       (r) => r.timings.duration < 500,
    }, { type: "reachable" });

    sleep(1);
}
