# Architecture

## Scope and status

This document describes the architecture for the Personal Life OS. The protected runtime, persistence, export/import, Movies & TV, Books, Finance MVP (including budgets/reports/CSV), Courses, tags, metadata contracts, and local attachment storage slices are implemented. Module-local filtering remains available; the cross-module general search surface is intentionally removed. Broader localization coverage, typed attachment relationships, and integration coverage remain in progress. Future sessions must compare this plan with the actual source and migrations before making changes.

## Product boundary

The system is a single-user, owner-controlled personal management application. It has one database and one owner account. It does not include organizations, teams, invitations, multi-tenant schemas, public registration, social features, or billing for the application itself. All durable data is stored in PostgreSQL. Browser storage may keep only non-sensitive UI preferences.

The application is a modular monolith: one Next.js deployment, one process boundary, and feature-oriented code. Modules can share stable services and components, but domain internals remain isolated. A microservice split would add operational cost without helping a single owner.

## Runtime layers

1. **App Router and shell** — route groups for authentication and the protected dashboard, persistent responsive shell, loading/error/not-found boundaries, and server-rendered pages by default.
2. **Feature modules** — movies & TV, books, finance, and courses are the first implementation modules. Tasks, projects, notes, habits, goals, and subscriptions have registered responsibilities but remain disabled or use the shared placeholder until built.
3. **Application services** — server-only use cases for authentication, activity events, backup/export, attachment storage, pagination, and formatting. Services enforce authorization and domain invariants.
4. **Data access** — Prisma repositories or focused queries backed by a reused server-side PostgreSQL client. No database calls from client components.
5. **Infrastructure adapters** — password/session provider, persistent file storage, metadata-provider interfaces, and optional external integrations. Adapters keep credentials and network calls off the client.

## Planned source boundaries

```text
src/
  app/
    (auth)/
    (dashboard)/
    api/
  components/
    ui/
    shared/
    layout/
    charts/
    forms/
  config/
    modules.ts
    navigation.ts
    dashboard.ts
    i18n.ts
  features/
    movies/
    books/
    finance/
    courses/
    tasks/
    projects/
    notes/
    habits/
    goals/
    subscriptions/
    dashboard/
  lib/
    auth/
    db/
    validation/
    errors/
    pagination/
    export/
    backup/
    currency/
    dates/
    security/
    storage/
  hooks/
  types/
  tests/
```

A feature may use subdirectories such as `schemas.ts`, `queries.ts`, `mutations.ts`, `services.ts`, `components/`, and `__tests__/`. The layout is a guide, not a reason to create empty files.

## Module registry

`src/config/modules.ts` is the planned source of truth for module descriptors. Each descriptor includes a stable ID, route, display-name translation key, icon, description key, navigation section, enabled state and optional dashboard-widget IDs. Sidebar and settings read the registry rather than maintaining separate lists. A disabled module is hidden from primary navigation and remains manageable through settings when appropriate.

The registry is intentionally a simple typed configuration. It is not a runtime plugin marketplace. Adding a module should be predictable: scaffold a feature, add its descriptor, add translations, add schema and persistence, and wire dashboard widgets only when they are implemented.

## Shared UI and interaction contracts

The design system uses semantic CSS variables with light, dark, and system themes. Shared components are planned for the shell, page headers, cards, tables, empty/loading/error states, dialogs, drawers, forms, filters, pagination, badges, tags, currency, ratings, attachments, and charts. They must be keyboard accessible, responsive, compatible with reduced-motion preferences, and consistent across modules.

Lists use one server-side convention for filtering, sorting, search, pagination, row actions, and responsive presentation. Domain modules can customize columns and detail content without replacing the underlying table behavior.

All user-facing text is Turkish. Date, time, number, and currency formatting use Turkish locale conventions together with the owner’s timezone and currency settings.

## Server and client rules

React Server Components are the default. Use Client Components for browser-only interaction such as form controls, dialogs, drag ordering, charts, and filters. Client code receives typed, minimized data and never opens a database connection. Server Actions or Route Handlers validate with Zod, authenticate the session, authorize the owner, execute a service, and return a safe typed result. Raw database and stack errors stay server-side.

Use TanStack Query only where client-side server-state coordination is justified; do not introduce a client cache for private financial records without explicit invalidation and cache boundaries. Avoid public caching of personalized responses.

## Cross-module infrastructure

- **Dashboard:** `src/features/dashboard/widgets.ts` defines the widget registry and `ModulePreference` rows persist owner-scoped visibility and ordering. Widgets report meaningful empty states and use real stored data; Settings exposes keyboard-friendly reorder controls.
- **Activity:** domain services emit small, non-sensitive activity events after successful primary operations. Activity failure must not silently roll back unrelated work unless the event is part of an atomic invariant.
- **Tags and attachments:** shared services provide ownership checks and reusable metadata while modules own their entity relationships. Attachments use a storage adapter with a persistent local implementation and a future S3-compatible boundary.
- **Metadata providers:** `src/lib/metadata/types.ts` defines server-side, read-only adapters for movies, series, and books. Adapters return normalized records and never write to Prisma; manual entry is represented by an explicit empty provider, so external API keys and network calls remain optional and off the client.
- **Backup/export:** a versioned JSON envelope and module exporters provide complete, validated data export/import. Restore validates and previews before a transaction applies changes. CSV is offered for useful tabular modules.
- **Generator:** `pnpm module:create <name>` scaffolds configuration, feature boundaries, validation/data-access/UI/test templates, translation placeholders, and database instructions without inventing domain behavior.

## Security and operational boundaries

The owner account is initialized once using a protected, single-use bootstrap path. Passwords are securely hashed; sessions are server-side, expire, and use secure cookies. Authentication attempts are rate-limited. Every mutation re-checks authorization on the server. Secrets never enter client bundles or logs.

Financial values use exact decimal arithmetic or minor currency units. Transfers update the affected accounts atomically and are excluded from income/expense reports. Mixed currencies require an explicit conversion rule and rate. Database changes use migrations. Local development may use Docker Compose PostgreSQL; production backup guidance documents native PostgreSQL tools in addition to application export.

## Planned request path

```text
Browser request
  -> App Router page / Server Action / Route Handler
  -> session authentication and owner authorization
  -> Zod input validation
  -> feature service (domain rules and transaction boundary)
  -> Prisma query/repository
  -> PostgreSQL
  -> typed result + activity invalidation/revalidation
```

A client component may call a server action or route handler, but it never bypasses this path.
