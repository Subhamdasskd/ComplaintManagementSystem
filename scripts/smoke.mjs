#!/usr/bin/env node
/**
 * End-to-end smoke test against a running deployment.
 *
 *   node scripts/smoke.mjs                       # http://localhost:3100
 *   node scripts/smoke.mjs https://my-app.vercel.app
 *   BASE_URL=https://my-app.vercel.app node scripts/smoke.mjs
 *
 * It exercises the real HTTP surface: public pages, demo login, raising a complaint,
 * comments (public and internal), RBAC refusals, the status lifecycle, escalation,
 * ratings, notifications, attachment download and the cron watchdog.
 *
 * Exits 1 if any check fails, so it can gate a deploy.
 */
const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3100").replace(/\/$/, "");

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${label}${detail ? ` :: ${detail}` : ""}`);
  }
}

async function request(path, { method = "GET", body, cookie, form } = {}) {
  const headers = { "User-Agent": "cms-smoke" };
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(BASE + path, { method, headers, body: payload, redirect: "manual" });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, headers: response.headers, text, json };
}

async function login(role) {
  const res = await request("/api/auth/demo", { method: "POST", body: { role } });
  const cookie = (res.headers.getSetCookie?.() ?? [])[0]?.split(";")[0] ?? "";
  return { cookie, status: res.status, body: res.json };
}

async function main() {
  console.log(`Smoke testing ${BASE}\n`);

  const home = await request("/");
  check("GET / renders the landing page", home.status === 200 && home.text.includes("<title>"), String(home.status));
  check("GET /login renders", (await request("/login")).status === 200);

  // The read-only demo needs no database, so it must work on any deployment.
  const demo = await request("/demo");
  check("GET /demo renders the read-only demo", demo.status === 200 && demo.text.includes("Read-only demo"), String(demo.status));
  check("GET /demo shows complaint references", /CMS-\d{4}-\d{4}/.test(demo.text));
  check("GET /demo/complaints renders", (await request("/demo/complaints")).status === 200);
  check("GET /demo/analytics renders", (await request("/demo/analytics")).status === 200);
  const demoDetail = await request("/demo/complaints/cms-2026-0001");
  check("GET /demo/complaints/[id] renders a timeline", demoDetail.status === 200 && demoDetail.text.includes("Everything that happened"), String(demoDetail.status));

  const guarded = await request("/dashboard");
  check("GET /dashboard redirects when signed out", guarded.status === 307, String(guarded.status));

  const admin = await login("ADMIN");
  if (admin.status !== 200) {
    check("Demo login works (database seeded?)", false, `${admin.status} ${JSON.stringify(admin.body).slice(0, 120)}`);
    summary();
    return;
  }
  check("Demo login works", admin.status === 200);

  const requester = await login("USER");
  const l1 = await login("L1");
  const l2 = await login("L2");

  for (const [, path] of [
    ["dashboard", "/dashboard"],
    ["complaints", "/complaints"],
    ["analytics", "/analytics"],
    ["admin users", "/admin/users"],
    ["admin policy", "/admin/settings"],
    ["notifications", "/notifications"],
  ]) {
    const res = await request(path, { cookie: admin.cookie });
    check(`GET ${path} renders for an admin`, res.status === 200, String(res.status));
  }

  const form = new FormData();
  form.set("title", "Smoke test: printer queue is stuck on floor 4");
  form.set("description", "Every job sits in the queue and never prints. Three people on the floor are blocked today.");
  form.set("category", "HARDWARE");
  form.set("priority", "HIGH");
  form.append("files", new Blob(["smoke test attachment"], { type: "text/plain" }), "evidence.txt");

  const created = await request("/api/complaints", { method: "POST", form, cookie: requester.cookie });
  const complaint = created.json?.complaint;
  check("POST /api/complaints creates a complaint with an attachment", created.status === 201 && Boolean(complaint?.id), String(created.status));
  check("New complaint is auto-assigned", Boolean(complaint?.assigneeId));
  if (!complaint) {
    summary();
    return;
  }

  const detail = await request(`/complaints/${complaint.id}`, { cookie: requester.cookie });
  check("Requester can open their complaint", detail.status === 200, String(detail.status));

  const forbidden = await request(`/api/complaints/${complaint.id}/status`, {
    method: "POST",
    body: { status: "REJECTED" },
    cookie: requester.cookie,
  });
  check("Requester cannot reject a complaint (403)", forbidden.status === 403, String(forbidden.status));

  const wip = await request(`/api/complaints/${complaint.id}/status`, {
    method: "POST",
    body: { status: "WIP", note: "Smoke test: investigating." },
    cookie: l1.cookie,
  });
  check("L1 moves the complaint to in progress", wip.status === 200, String(wip.status));

  const remark = await request(`/api/complaints/${complaint.id}/remarks`, {
    method: "POST",
    body: { body: "Smoke test public reply." },
    cookie: l1.cookie,
  });
  check("L1 posts a public reply", remark.status === 201, String(remark.status));

  const internal = await request(`/api/complaints/${complaint.id}/remarks`, {
    method: "POST",
    body: { body: "Smoke test internal note.", internal: true },
    cookie: l1.cookie,
  });
  check("L1 posts an internal note", internal.status === 201, String(internal.status));

  const requesterView = await request(`/complaints/${complaint.id}`, { cookie: requester.cookie });
  check("Internal note is hidden from the requester", !requesterView.text.includes("Smoke test internal note"));

  const badAssign = await request(`/api/complaints/${complaint.id}/assign`, {
    method: "POST",
    body: { assigneeId: null },
    cookie: l1.cookie,
  });
  check("L1 cannot reassign (403)", badAssign.status === 403, String(badAssign.status));

  const escalate = await request(`/api/complaints/${complaint.id}/escalate`, {
    method: "POST",
    body: { note: "Smoke test escalation." },
    cookie: l2.cookie,
  });
  check("L2 can escalate to the next level", escalate.status === 200, String(escalate.status));

  const closed = await request(`/api/complaints/${complaint.id}/status`, {
    method: "POST",
    body: { status: "CLOSED", note: "Smoke test: resolved." },
    cookie: l2.cookie,
  });
  check("L2 closes the complaint", closed.status === 200, String(closed.status));

  const feedback = await request(`/api/complaints/${complaint.id}/feedback`, {
    method: "POST",
    body: { rating: 5, feedback: "Smoke test rating." },
    cookie: requester.cookie,
  });
  check("Requester rates the closed complaint", feedback.status === 200, String(feedback.status));

  const reopen = await request(`/api/complaints/${complaint.id}/status`, {
    method: "POST",
    body: { status: "OPEN" },
    cookie: requester.cookie,
  });
  check("Requester reopens the complaint", reopen.status === 200, String(reopen.status));

  const notifications = await request("/api/notifications", { cookie: requester.cookie });
  check("Notifications were created", (notifications.json?.items ?? []).length > 0);

  const api = await request(`/api/complaints/${complaint.id}`, { cookie: requester.cookie });
  const attachmentId = api.json?.complaint?.attachments?.[0]?.id;
  if (attachmentId) {
    const download = await request(`/api/attachments/${attachmentId}`, { cookie: requester.cookie });
    check("Attachment downloads for the requester", download.status === 200 && download.text.includes("smoke test attachment"), String(download.status));
  }

  const badCron = await request("/api/cron/escalate?secret=definitely-wrong");
  check("Cron endpoint rejects a bad secret (401)", badCron.status === 401 || badCron.status === 503, String(badCron.status));

  const adminApi = await request("/api/admin/users", { cookie: requester.cookie });
  check("Requester cannot read the admin API (403)", adminApi.status === 403, String(adminApi.status));

  const invalid = await request("/api/complaints", {
    method: "POST",
    body: { title: "x", description: "too short", category: "NOPE", priority: "HIGH" },
    cookie: requester.cookie,
  });
  check("Validation rejects a bad payload (422)", invalid.status === 422, String(invalid.status));

  summary();
}

function summary() {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("\nSmoke test crashed:", error.message);
  process.exit(1);
});
