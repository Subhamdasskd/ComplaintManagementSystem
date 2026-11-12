# AGENTS.md

Instructions for coding agents working in this repository.

## Ground rules

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, Prisma + PostgreSQL.
- Server components read through Prisma directly; user actions go through the route
  handlers in `src/app/api/**`. Mutations live in `src/lib/complaints.ts`.
- RBAC is centralised in `src/lib/rbac.ts`. Never duplicate permission checks in
  components; call the helpers and pass the result down.
- Every state change must append a `StatusEvent` so the audit trail stays complete.
- Keep the light/futuristic design language: glass surfaces (`.card`), gradient accents,
  rounded-2xl/3xl geometry, mono labels. No hard-coded hex values in components —
  use the tokens in `src/app/globals.css`.

## Before you push

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four must pass. The CI workflow runs the same commands.
