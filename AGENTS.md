# Personal Life OS: contributor guide

This repository is the home of a single-owner Personal Life OS built as a modular Next.js monolith. The application is intended for long-term daily use, so new work should preserve data integrity, accessibility, and a small, understandable architecture.

## Current repository state

The repository now contains a working early foundation (package configuration, TypeScript/Tailwind setup, shared utilities, module registry, responsive shell/theme, Prisma schema and migration, password/session helpers, bootstrap/login/logout routes, owner-scoped settings, versioned JSON export/import and restore, module scaffold generator, activity feed, and finance money helpers). Movies & TV, Books, Finance (including budgets/reports/CSV), Courses, and the Turkish Öğrenme ve Yaşam Merkezi have usable owner-scoped CRUD screens with validation and tests. Tags, persistent local attachment storage, learning goals/notes, English practice, travel planning, and dashboard learning metrics are implemented; typed attachment-to-domain relationships, richer activity coverage, and broader end-to-end coverage remain under active development. Treat the documents in `docs/` as the working plan, then verify every assumption against the source tree and migration history before extending it. Do not describe planned capabilities as shipped features.

## Architecture principles

- Use Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Zod, React Hook Form, TanStack Table, and the other dependencies listed in the product specification only when they have a clear need.
- Keep the application a modular monolith. There is one owner, one database, and no organizations, teams, roles matrix, public registration, or application billing.
- Prefer React Server Components. Add Client Components only for interactions that require browser state or event handlers. Database access stays on the server.
- Organize domain code by feature. A feature owns its validation, data access, business rules, server actions or route handlers, UI, types, and tests. Shared code belongs in shared libraries only when it is genuinely reusable.
- Register modules, navigation, and dashboard widgets centrally. General cross-module search is intentionally excluded at the owner’s request. Do not duplicate navigation or create an independent table system for each module.
- Store all durable application data in PostgreSQL. `localStorage` is limited to non-sensitive interface preferences.
- Treat money as exact decimal or minor-unit values. Use transactions for transfers, restore operations, and other multi-record changes.
- Validate and authorize every server mutation. Never depend on client checks or middleware alone.
- Keep user-facing strings in translation resources. Turkish is the only supported interface language. Defaults are `Europe/Istanbul`, TRY, and Monday as the first day of the week.

## Expected source layout

```text
src/
  app/                 # route segments, layouts, loading/error/not-found UI
  components/          # ui, shared, layout, charts, forms
  config/              # module, navigation, dashboard, localization config
  features/            # one directory per domain module
  hooks/               # reusable client hooks
  lib/                 # db, auth, validation, errors, export, backup, etc.
  types/               # shared public types only
  tests/               # test setup and cross-feature tests
prisma/
  schema.prisma
  migrations/
  seed.ts
docs/
```

The exact tree may evolve with implementation. Do not create speculative folders or models solely to mirror this example.

## Adding a module

1. Read `docs/ARCHITECTURE.md`, `docs/MODULES.md`, `docs/DATABASE.md`, and `docs/PROGRESS.md`.
2. Decide whether the module is part of the current implementation phase. Keep future modules disabled or show the shared placeholder until their behavior is actually implemented.
3. Use `pnpm module:create <name>` when the generator exists. It creates a starting structure without overwriting existing files; it does not invent domain logic.
4. Add a module descriptor to the central registry: stable ID, route, label key, icon, navigation section, enabled state and optional dashboard widgets.
5. Keep the feature self-contained. Expose cross-module behavior through explicit services or contracts rather than importing another feature's internal files.
6. Add Zod schemas before wiring forms or mutations. Every mutation must authenticate the owner, authorize the operation, validate input, and return a typed success or safe error result.
7. Add migrations for schema changes. Never edit an applied migration or use destructive synchronization against a real database.
8. Add translation keys, empty/loading/error states, responsive UI, and tests for the domain rules. Update `docs/PROGRESS.md`, `docs/NEXT_STEPS.md`, and any relevant decision or database notes.

## Naming and coding conventions

- Use `PascalCase` for React components and classes, `camelCase` for functions, variables, and hooks, and `kebab-case` for route segments and generator names.
- Name server actions and service functions after domain intent (`createBook`, `recordTransfer`) rather than UI controls.
- Keep files focused. Avoid `any`; model unknown input as `unknown` and validate it.
- Use semantic design tokens and shared components instead of one-off colors, spacing, or table implementations.
- Use UTC or a clearly documented database timestamp convention internally, then format dates in the owner’s configured timezone.
- Never log passwords, session tokens, secrets, raw financial records, or backup payloads.

## Database and security rules

- Use Prisma migrations and a safely reused server-side client. Add indexes for common list, search, relation, and date queries.
- Preserve financial invariants: transfers are neither income nor expense, mixed currencies require an explicit conversion rule, and balance-affecting operations are atomic.
- Keep owner setup single-use and race-safe. Use secure password hashing, server-side sessions, secure cookies, expiration, authentication rate limiting, and protected routes.
- Validate uploaded files, size, MIME type, storage keys, and ownership. Durable local storage must use a persistent path and a storage adapter boundary for future S3-compatible backends.
- Backup import must validate the complete payload before changing data, use a versioned format, preview changes, require explicit confirmation, and avoid partial destructive restores.

## Verification and definition of done

Run the checks appropriate to the change, usually:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Use the project’s actual scripts once `package.json` exists. A module is done only when its real persistence, authorization, validation, responsive states, localization, and meaningful tests work; a page with placeholder buttons does not count. For every check that cannot run, record the reason in `docs/PROGRESS.md`.

Before handing work to another session:

- inspect the actual source and migration state;
- update progress, decisions, database notes, and next steps;
- record known limitations and verification results;
- avoid claiming completion for planned or partially implemented work.
