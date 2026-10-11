# Next steps

This list is ordered to keep the application extensible without claiming unfinished work as complete. Before each session, read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/PROGRESS.md`, inspect the actual source and migrations, then update these notes as reality changes.

## Phase 1: foundation

1. Finish translation coverage across every module and shared CRUD/error primitives.
2. Add Playwright setup and meaningful auth/navigation smoke tests.
3. Add session cleanup/expiry jobs and review middleware coverage.
4. Update `docs/PROGRESS.md` with actual verification output after each increment.

## Phase 2: core systems

1. Expand the implemented dashboard/widget registry with drag-and-drop ordering and richer charts after broader E2E coverage.
2. Preserve module-local filtering; general cross-module search is intentionally excluded.
3. Extend typed tag associations to future modules as they are implemented.
4. Add typed attachment relationships for domain records and a future S3-compatible adapter while preserving the local storage boundary.
5. Add activity-event recording conventions and a recent activity feed that excludes secrets and sensitive financial details.
6. Harden the implemented versioned JSON export/import flow with broader integration/E2E coverage and native PostgreSQL backup documentation.
7. Implement `pnpm module:create <name>` with safe, non-overwriting scaffolding and registration instructions.

## Phase 3: domain modules

Movies & TV, Books, Finance MVP (including budgets/reports/CSV), Courses & Learning, and the Öğrenme ve Yaşam Merkezi have usable implementations. The learning center includes extensible areas, nested topic indexes and topic detail screens with modal notes/goals/todos, typed learning items, English practice, travel planning, legacy-course compatibility, and dashboard study metrics. Continue with broader activity integration, typed attachment relationships, and production deployment checks.

Keep Tasks, Projects, Notes, Habits, Goals, and Subscriptions disabled or on the shared informative placeholder until their behavior is implemented.

## Phase 4: integration and release checks

- Verify navigation derives from the registry and disabled modules behave consistently.
- Verify authentication, session expiry, mutation authorization, and setup protections.
- Verify real CRUD persistence, module-local filters, dashboard metrics, settings, localization, theme, and responsive layouts.
- Verify finance classifications, transfers, budgets, currency handling, and no transfer double-counting.
- Verify backup export/import validation, restore preview, transactional safety, and CSV behavior.
- Run lint, typecheck, unit/integration tests, Playwright E2E tests, and production build. Record results and unresolved limits in `docs/PROGRESS.md`.
- Document deployment, migrations, seed behavior, environment variables, and PostgreSQL backup/restore commands in `README.md` before the initial release.
