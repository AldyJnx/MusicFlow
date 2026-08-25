import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://host.docker.internal:8000/api").replace(
  /\/$/,
  "",
);
const targetVus = Number(__ENV.TARGET_VUS || 10_000);
const rampUp = __ENV.RAMP_UP || "10m";
const holdDuration = __ENV.HOLD_DURATION || "15m";
const rampDown = __ENV.RAMP_DOWN || "5m";
const intervalSeconds = Number(__ENV.REQUEST_INTERVAL_SECONDS || 5);
const authToken = __ENV.AUTH_TOKEN || "";

export const options = {
  discardResponseBodies: true,
  scenarios: {
    musicflow_api: {
      executor: "ramping-vus",
      startVUs: 0,
      gracefulRampDown: "30s",
      stages: [
        { duration: rampUp, target: targetVus },
        { duration: holdDuration, target: targetVus },
        { duration: rampDown, target: 0 },
      ],
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<2000"],
  },
};

export default function () {
  const health = http.get(`${baseUrl}/health`, {
    tags: { endpoint: "health" },
    timeout: "10s",
  });
  check(health, {
    "health responds": (response) => response.status === 200,
  });

  // Include one authenticated read when a short-lived test token is supplied.
  // Do not hard-code or commit tokens in this script.
  if (authToken) {
    const catalog = http.get(`${baseUrl}/catalog/albums/recent?take=12`, {
      headers: { Authorization: `Bearer ${authToken}` },
      tags: { endpoint: "catalog-recent-albums" },
      timeout: "10s",
    });
    check(catalog, {
      "catalog responds": (response) => response.status === 200,
    });
  }

  // VUs model concurrent users; the interval prevents 10k users from being
  // mistaken for 10k requests per second. Tune it to real user behaviour.
  sleep(Math.max(0, intervalSeconds));
}
