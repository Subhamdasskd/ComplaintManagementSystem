# Security policy

## Reporting a vulnerability

Please do not open a public issue. Report privately through
[GitHub Security Advisories](https://github.com/Subhamdasskd/ComplaintManagementSystem/security/policy)
or email the maintainer at `subhamdasskd7808@gmail.com`.

Include the affected route or page, the role you were signed in as, and the request that
reproduces the problem. You will get a response within a few days.

## Supported versions

The `main` branch and the live demo deployment are supported. This is a portfolio project
without a formal release cadence.

## What is already in place

- Passwords are hashed with bcrypt (cost 10) and never returned by any endpoint.
- Sessions are HS256 JWTs in an `httpOnly`, `sameSite=lax`, `secure`-in-production cookie.
- Every API route re-checks the session server-side; middleware only handles redirects.
- Complaint reads and writes go through the predicates in `src/lib/rbac.ts`, so an
  unauthorised request returns `403` or `404` rather than leaking existence.
- Attachment bytes are only streamed to viewers who can see the parent complaint.
- Internal notes are filtered out of the requester's queries, not hidden in the UI only.
- `/api/cron/escalate` requires the `CRON_SECRET` bearer token when the variable is set.
- The last active administrator cannot be demoted or deactivated.

## Deployment checklist

- [ ] `AUTH_SECRET` is a fresh 32-byte random value, different per environment.
- [ ] `CRON_SECRET` is set, so the watchdog cannot be triggered by strangers.
- [ ] `DATABASE_URL` uses TLS (`?sslmode=require`) for hosted Postgres.
- [ ] The demo dataset has been reviewed before going public — it contains fictional people
      and complaints only.
- [ ] If you deploy for real use, change the seeded demo passwords or remove the demo accounts.
- [ ] `npm audit` is clean at the time of deploying.

## Known limitations

- There is no rate limiting on `/api/auth/login`; put a WAF or an edge rate limit in front of
  it before exposing the app to the open internet at scale.
- Attachment size is capped at 2 MB and stored in the database, which is convenient but not a
  substitute for object storage with virus scanning.
- The demo role switcher intentionally signs you into seeded `@demo.test` accounts. Remove
  `src/app/api/auth/demo/route.ts` for a production deployment with real users.
