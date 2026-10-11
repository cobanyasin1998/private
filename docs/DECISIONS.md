# Architecture decisions

This is a lightweight decision record for the Personal Life OS. Entries describe decisions made by the product specification and planning work. Implementation sessions should add a dated entry when a material choice changes.

## ADR-001: Use a single-user modular monolith

**Status:** Accepted (planned foundation)

The product has one owner and one database. A Next.js modular monolith keeps deployment, authentication, migrations, and operational work manageable for one developer while feature boundaries preserve extensibility. Multi-tenant and microservice infrastructure are explicitly out of scope.

## ADR-002: Use Next.js App Router with server-first rendering

**Status:** Accepted (planned foundation)

App Router and React Server Components minimize client JavaScript and keep data access on the server. Client Components are reserved for browser interaction such as forms, dialogs, charts, drag ordering, and filters.

## ADR-003: PostgreSQL and Prisma are the system of record

**Status:** Accepted (planned foundation)

Relational persistence supports owner-scoped records, migrations, transactions, and reporting. Prisma provides typed access while keeping SQL and credentials server-side. Applied migrations are immutable; schema changes are additive and reviewed.

## ADR-004: Central registries for modules and widgets

**Status:** Accepted (planned foundation)

A typed module registry is simpler and more transparent than a runtime plugin system. Navigation and dashboard widgets derive from registries so adding a module does not require editing unrelated components. General cross-module search is intentionally not part of the product surface.

## ADR-005: Exact monetary representation

**Status:** Accepted (domain invariant)

Financial amounts use PostgreSQL numeric/Prisma Decimal or defined minor units. Floating-point arithmetic can silently introduce errors, so it is not used for persisted money, balances, transfers, or reports. Currency conversion requires an explicit rate and rule.

## ADR-006: Server-side authorization on every mutation

**Status:** Accepted (security invariant)

Middleware and client guards improve navigation but are not authorization boundaries. Every server action and route handler authenticates the session, checks owner access, validates input, and returns safe errors. This also protects future background and API entry points.

## ADR-007: Versioned application backup plus native database backup guidance

**Status:** Accepted (data protection)

A validated JSON export/import helps the owner move application data and preview restores. It does not replace `pg_dump`/`pg_restore` or managed PostgreSQL snapshots, which remain the deployment backup strategy. Restore operations validate before a transaction changes production data.

## ADR-008: Shared contracts instead of speculative polymorphism

**Status:** Accepted (data modeling)

Tags, attachments, activity, and dashboard widgets are shared services with explicit associations. Avoid generic polymorphic foreign keys where a typed relation or association table is clearer. Add models only when a delivered feature requires them.

## ADR-009: Turkish-only user interface

**Status:** Accepted (product defaults)

The application has a Turkish-only user interface. All labels, navigation, validation, notifications, and errors use Turkish resources. Timezone (`Europe/Istanbul`), date/time formatting, week start (Monday), and currency (TRY) remain owner settings.

## ADR-010: Future modules stay visibly planned

**Status:** Accepted (scope control)

Tasks, projects, notes, habits, goals, and subscriptions are prepared in the registry and documentation but are disabled or shown through the shared placeholder until their real persistence and behavior exist. This avoids presenting fake completeness and keeps the first implementation phases focused.
