# Contributing

Thanks for taking a look. This project is small on purpose, so the rules are short.

## Set up

```bash
git clone https://github.com/Subhamdasskd/ComplaintManagementSystem.git
cd ComplaintManagementSystem
npm install
cp .env.example .env.local     # DATABASE_URL + AUTH_SECRET + CRON_SECRET
npx prisma db push
npm run db:seed
npm run dev
```

You need a PostgreSQL database. Locally that can be any Postgres instance — the schema only
uses portable types (`text`, `timestamp`, `bytea`).

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs the same four commands; a red build will not be merged.

## Conventions

- **Server components read, route handlers write.** Pages query Prisma directly; every
  mutation goes through `src/app/api/**` and delegates to `src/lib/complaints.ts`.
- **Audit everything.** If you add a state change, append a `StatusEvent` in the same
  transaction. The timeline is the product.
- **Permissions are not inline.** Add a predicate to `src/lib/rbac.ts` (with a unit test), then
  use it in both the UI and the route handler. Never check `role === "ADMIN"` in a component.
- **Nothing impure during render.** Dates and `Date.now()` come from the server component as a
  prop, or from an effect. This keeps hydration stable and ESLint's React rules happy.
- **Design language.** Glass surfaces (`.card`), gradient accents, `rounded-2xl`, mono labels.
  Colours come from the tokens in `src/app/globals.css`, not from literal hex values.
- **Commits** follow `type: summary` — `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

## Adding an SLA tier or status

1. Add the value to `PRIORITIES`/`STATUSES` in `src/lib/constants.ts`.
2. Add its metadata (`STATUS_META`, `PRIORITY_META`) including a tailwind tone and, for
   priorities, the default SLA hours.
3. Extend `TRANSITIONS` in the same file if the new status participates in the lifecycle.
4. Update the Zod enum in `src/lib/validation.ts` (it derives from the constants, so usually
   nothing to do) and the seed if you want demo data for it.
5. Run `npm test` — the RBAC and SLA suites will tell you what else broke.

## Adding an API route

Copy the shape of an existing route: `requireViewer()` → permission predicate → Zod parse →
service call → `NextResponse.json`. Wrap the body in `try/catch` and return `errorResponse(error)`
so `HttpError` statuses and validation messages survive.

## Reporting bugs

Use the issue template and include the role you were signed in as. Screenshots of the timeline
plus the failing network response are usually enough to reproduce.
