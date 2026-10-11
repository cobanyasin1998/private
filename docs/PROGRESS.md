# Project progress

Updated: 2026-10-11

## Current state

The remote repository was cloned successfully. A working foundation now exists: package scripts and dependencies, Next.js/TypeScript/Tailwind configuration, environment example, Docker Compose, shared formatting/i18n utilities, a central module registry, responsive shell/theme, a broad Prisma schema plus generated migrations, password/session helpers, bootstrap/login/logout API routes, database-backed dashboard/session protection, auth rate limiting, persisted owner settings, versioned JSON export/import with preview and transactional restore, a module scaffolding command, exact-money helpers, activity events, metadata-provider contracts, and unit test tooling. Movies & TV, Books, Finance, Courses, and the Öğrenme ve Yaşam Merkezi now have owner-scoped CRUD, responsive forms and libraries, domain invariants, and tests. Owner-scoped tags and persistent attachment storage are now usable; typed attachment-to-domain relationships and broader activity coverage remain in progress.

The foundation is currently in active implementation and documentation. The target architecture, database constraints, module boundaries, decision record, continuation workflow, and next implementation sequence are documented in this directory and `AGENTS.md`. The dashboard now has a registry of real data widgets with owner-scoped persisted visibility and ordering preferences.

## Phase status

| Phase | Status | Evidence / remaining work |
| --- | --- | --- |
| Phase 1: Foundation | In progress | Auth/session, route protection, settings persistence, responsive shell, registry, Prisma migration, backup export, and shared error boundaries exist. User-facing text is fixed to Turkish; broader centralized text coverage and shared CRUD primitives remain. |
| Phase 2: Core systems | In progress | Module generator, exact-money helpers, activity feed, owner-scoped tags with assignment/filtering, persistent attachment storage/API, versioned JSON export/import with transactional restore, and finance CSV export exist. Broader integration coverage remains. |
| Phase 3: Movies & TV | Implemented, validation ongoing | Owner-scoped movie and TV series CRUD, status/favorite actions, module-local filtering, season/episode tracking, watched progress, forms, and schema tests exist. Broader E2E and external provider integration remain later work. |
| Phase 3: Books | Implemented, validation ongoing | Owner-scoped CRUD, reading status/favorite/progress/session flows, filters, forms, stats, and schema tests exist. Add E2E coverage and provider integration later. |
| Phase 3: Finance | Implemented, validation ongoing | Owner-scoped accounts, categories, income/expense transactions, atomic same-currency transfers, archive/delete guards, filters, currency-grouped balances, monthly budgets with category allocations, monthly reports, CSV export, responsive UI, and invariant tests exist. |
| Phase 3: Courses | Implemented, validation ongoing | Owner-scoped course CRUD, status/progress, lessons, study sessions, course/lesson learning notes, course goals, filters, statistics, responsive UI, and schema tests exist. Add E2E coverage later. |
| Phase 3: Öğrenme ve Yaşam Merkezi | Implemented | Learning areas with dedicated detail screens, nested topics/subtopics, labs, actionable todos, study sessions, English skills and entries, travel places, modal CRUD, owner-scoped goals/notes, dashboard active-learning/weekly-study/upcoming-goal widgets, additive backup support, and starter content exist. |
| Phase 4: Final integration | In progress | Auth/navigation smoke tests, database migration status, lint, typecheck, unit tests, Playwright smoke tests, and production build pass. Broader CRUD E2E and production deployment checks remain. |

## Completed in this documentation pass

- Established contributor rules in `AGENTS.md`.
- Captured the initial foundation scaffold state without treating it as feature completion.
- Described the planned server-first modular monolith and registry boundaries in `docs/ARCHITECTURE.md`.
- Recorded the planned PostgreSQL/Prisma models, financial invariants, and backup constraints in `docs/DATABASE.md`.
- Mapped first and future modules and their delivery contract in `docs/MODULES.md`.
- Recorded foundational architecture decisions in `docs/DECISIONS.md`.
- Listed the next executable implementation steps in `docs/NEXT_STEPS.md`.
- Added and generated the initial Prisma client from `prisma/schema.prisma`.
- Added single-owner bootstrap/login API routes with scrypt password hashing and server-side sessions.
- Added responsive app shell, theme switcher, persisted settings, JSON backup export, and module registry driven navigation.
- Added owner-scoped Movies and Books libraries with server mutations, responsive forms, progress tracking, and validation tests.
- Added owner-scoped Finance accounts, categories, transactions, same-currency atomic transfers, currency-safe statistics, monthly budgets with category allocations, monthly category reports, CSV export, responsive UI, and invariant tests.
- Added owner-scoped Courses with status/progress, lesson completion, study sessions, statistics, responsive UI, and schema tests.
- Added strict versioned backup validation, preview, explicit RESTORE confirmation, and transactional owner-scoped restore while preserving credentials and sessions.
- Added owner-scoped tag CRUD, assignment and filtering for Movies, Books, and Courses, plus a settings manager and reusable picker/filter.
- Added persistent local attachment storage with MIME/content/size checks, owner-authorized upload/download/delete routes, settings UI, and restore preflight for separately backed-up file bytes.
- Added monthly finance budgets, category allocations, currency-safe reports, and formula-injection-safe CSV export.
- Added Turkish-only navigation, shell labels, finance reports, and attachment UI with the locale fixed to Turkish.
- Added `pnpm module:create <name>` scaffolding command and exact minor-unit money helpers with unit tests.
- Added the configurable dashboard widget registry, real finance/learning/media/activity widgets, and owner-scoped persisted widget visibility and ordering preferences in Settings.
- Added server-side metadata-provider contracts for movies, series, and books with a deterministic manual provider.
- Added TV series CRUD, detail screens, season/episode management, watched progress transactions, and activity events.
- Removed general search from navigation, the app shell, keyboard shortcuts, server routes, and the module registry at the owner’s request. Module-local filters remain available.
- Added an accessible shared modal surface and moved movie, book, course, and TV series create/edit flows into modals; legacy form routes redirect back to their library.
- Added the extensible Turkish Öğrenme ve Yaşam Merkezi with Technology, Academic, and Personal Life areas, typed learning items, English practice, travel places, dashboard study metrics, and modal CRUD while retaining legacy Courses.
- Extended versioned backup export, validation, and transactional restore for learning areas/items/study sessions, English records, travel places, and learningArea-linked notes/goals; older payloads remain accepted when these arrays are absent.

## Verification

Final verification on 2026-10-11 passed: `tsc --noEmit --incremental false`, `eslint .`, `vitest run` (22 files, 85 tests), `playwright test` (10 tests), `next build`, and `prisma migrate status` all succeeded. PostgreSQL is running through Docker Compose on `localhost:5433`; the development server is available at `http://localhost:3000`.

## Known limitations

- The application is an early usable slice and is not yet a complete daily-use product.
- Attachment metadata is currently general-purpose settings storage; attaching files directly to individual movies/books/courses/lessons is still pending.
- Activity events currently cover the main creation flows; richer update/delete/status events remain incomplete. Standalone Notes and Goals modules remain disabled; course-scoped learning notes/goals and learning-area todos are implemented.
- No production deployment or backup has been configured.
