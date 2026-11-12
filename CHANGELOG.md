# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-11-12

### Added

- **Read-only demo at `/demo`** — overview, complaint list, a full complaint timeline and analytics,
  rendered from a deterministic dataset (`src/lib/demo/dataset.ts`). It needs no database and no
  sign-in, so the deployment is explorable the moment it ships.
- **`npm run smoke`** — a dependency-free end-to-end HTTP suite (33 checks) covering the demo
  routes, demo login, raise/comment/escalate/close/rate/reopen, RBAC refusals, attachment
  download and validation. Exits non-zero on failure, so it can gate a deploy.

### Changed

- API routes now return a clear `503` with remediation steps when the database is unreachable,
  instead of an opaque `500`.

## [1.0.0] — 2026-11-12

First complete release: a working complaint desk with a seeded public demo.

### Added

- **Roles and access control** — requester, L1, L2, L3 and administrator, with visibility,
  transitions, reassignment and escalation rules centralised in `src/lib/rbac.ts` and covered
  by unit tests.
- **Complaint lifecycle** — Open → In progress → Hold → Closed / Rejected, with requester
  confirmation and reopening, and an append-only `StatusEvent` audit trail on every change.
- **Automatic assignment** — new complaints go to the active agent at the right level with the
  smallest open queue, and the assignee is notified in-app.
- **SLA tracking** — per-priority windows (4h/24h/72h/120h), countdown and consumption on every
  card, breach flagging, and administrator-editable policy.
- **Automatic escalation** — `/api/cron/escalate` sweeps unresolved complaints from L1 → L2 →
  L3 once their level window closes, reassigns them and notifies both teams. Pure decision
  logic in `src/lib/escalation.ts` with seven unit tests.
- **Attachments** — up to three files per complaint, stored in Postgres and streamed back only
  to viewers authorised for the complaint.
- **Remarks** — public replies for requesters and staff-only internal notes.
- **Notifications** — in-app inbox with unread badge and mark-all-read.
- **Analytics** — 30-day volume trend, status mix, category split, resolution hours by priority,
  SLA compliance, CSAT and agent workload.
- **Administration** — create people, change roles, deactivate accounts (last admin protected),
  and tune SLA/escalation policy.
- **Public demo** — one-click role login for the seeded dataset (30 complaints, 9 people).
- **Tooling** — ESLint flat config, Vitest suite, GitHub Actions CI, Vercel configuration with
  a cron schedule, and a deterministic seeder.

### Known limitations

- Notifications are in-app only; no email or SMS transport.
- Attachments are capped at 2 MB and kept in Postgres.
- The watchdog is schedule-based, so escalation is eventually consistent.
- Single-tenant: one deployment serves one complaint desk.
