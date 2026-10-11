# Module map and development contract

## Status

The repository has a working foundation plus usable Movies & TV, Books, Finance, Courses, and Öğrenme ve Yaşam Merkezi modules. Shared owner-scoped tags and persistent local attachment storage are also available. This document records the module boundaries and delivery order for the remaining work. A module is considered implemented only after its persistence, server behavior, UI states, localization, authorization, and meaningful tests are present.

## Registry contract

All modules are described in a central typed registry. A descriptor includes:

- stable `id` and route;
- display name and description translation keys;
- icon and navigation section;
- `enabled` state;
- optional dashboard-widget IDs;
- an implementation status used by settings and the shared placeholder.

Navigation, dashboard widgets, and settings derive from this registry. Disabled modules do not appear in primary navigation. They may remain visible in settings with an explanation and an enable switch only when enabling is safe.

## Current implementation sequence

### Foundation (planned/in progress)

The first phase establishes Next.js App Router, strict TypeScript, PostgreSQL/Prisma, environment validation, owner authentication, the shell and design tokens, localization, settings foundations, shared components, CRUD/error conventions, and test infrastructure. No feature is claimed complete while this work is only planned.

### Core systems (planned)

Dashboard and widget registry, tags, attachments, activity events, backup/export validation, and the module scaffolding command are built before domain breadth. These systems must use real database contracts and safe empty states.

### First modules (delivery order)

1. **Movies & TV** — manual movie and series entry, status, ratings, favorites, filters, search, statistics, personal tags, season/episode tracking, watched progress, and a server-side metadata-provider contract. The current slice works without an external API; provider integrations remain future work.
2. **Books** — manual library, reading statuses, page progress, sessions/history, ratings/reviews, favorites, personal tags, total reading statistics, and a server-side book metadata-provider contract. Monthly goals and provider integrations remain future work.
3. **Finance** — accounts, categories, exact-currency transactions, income/expense classification, transfers, budgets/allocations, recurring transactions, filters, monthly reports, and CSV export. Currency and transfer invariants are part of the domain contract.
4. **Courses & learning** — legacy course/lesson CRUD, providers and links, statuses, progress, lesson completion, study sessions, personal tags, course/lesson learning notes, course goals, completion date, and learning statistics.
5. **Öğrenme ve Yaşam Merkezi** — owner-scoped learning areas grouped as Technology, Academic, and Personal Life; topic-only `/learning/[slug]` indexes with completion state; `/learning/[slug]/items/[itemId]` topic detail screens with summary, detailed content, requirements, outcomes, item-scoped notes/goals/todos, and nested topics/subtopics; typed topics/practice/labs/mini projects/quizzes/readings/videos/reviews; actionable checklists; study sessions; English skills and entries; travel places; goals/notes; local filtering; dashboard statistics; and modal CRUD. Existing Courses records remain supported and are included in dashboard learning totals.

Each module gets a feature directory with data access, validation, service/mutations, types, UI, translations, and tests. It uses shared list, form, dialog, table, state, and notification conventions while keeping domain-specific detail in the feature.

## Future module responsibilities

These modules are registered as planned and should remain disabled or use the consistent informative placeholder until implemented:

- **Tasks:** priorities, due dates, completion, recurrence, and project association.
- **Projects:** status, tasks, milestones, and progress.
- **Notes:** rich text or structured Markdown, categories, tags, search, and links to resources.
- **Habits:** daily/weekly definitions, entries, streaks, and completion statistics.
- **Goals:** targets, milestones, and progress tracking.
- **Subscriptions:** monthly/annual costs, categories, renewal dates, and upcoming renewal views.

Do not create dozens of empty files or fake buttons for these modules. Add their schema and screens when their behavior is ready.

## Shared module contract

Every delivered module must support:

- owner-scoped server mutations with authentication, authorization, and Zod validation;
- create, read, update, delete, list, detail, search, sort, filter, and pagination behavior appropriate to the domain;
- loading, empty, error, not-found, and confirmation states;
- responsive desktop/tablet/mobile presentation and keyboard-accessible controls;
- Turkish user-facing labels with locale-aware dates and amounts;
- activity events that avoid secrets and sensitive financial details;
- unit/integration/E2E coverage for critical behavior;
- progress and decision documentation updates.

## Cross-module integration

Use explicit service contracts for relationships such as tags, attachments, activity, dashboard widgets, and notes attached to courses or lessons. A feature must not import another feature’s repository or internal component. If a relationship is needed, define a stable service or association model and document its ownership and transaction behavior.

## Module scaffolding

`pnpm module:create <name>` is available as a non-overwriting developer tool. It creates a feature boundary, Zod validation template, data-access placeholder, empty-state component, and a validation test. The developer must register the descriptor, add translations, and create intentional migrations and domain behavior; the generator does not invent production logic.
