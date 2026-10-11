# Database design

## Status

`prisma/schema.prisma` contains the initial shared, first-module, and future-module model contract. Migrations `0001_foundation`, `20261011104515_learning_goals_notes`, `20261011124036_learning_center`, `20261011134639_learning_detail_todos`, `20261011150000_turkish_only`, and `20261011162000_learning_item_content` have been applied to the local PostgreSQL Docker service; future changes must use additive reviewed migrations. The `Owner.locale` field is normalized to `tr` and protected by a database check constraint. Keep the schema additive and review changes against the constraints below. Do not create speculative tables beyond the current documented model contract.

## Database and migrations

- PostgreSQL is the system of record and Prisma is the ORM.
- Use a single safely reused server-side Prisma client. Do not instantiate a client per request in development or production.
- Create additive, reviewed migrations with `prisma migrate dev` locally and `prisma migrate deploy` for production. Never edit an applied migration or use destructive automatic synchronization against real data.
- Store timestamps consistently (prefer UTC in the database) and render them using the owner’s configured timezone.
- Add indexes for foreign keys, status/date list filters, common search fields, and unique business keys. Let query plans and real use guide additional indexes.
- Development seed data must be explicit and safe to run only in development. Production startup must never seed examples implicitly.

## Planned core models

The first schema is expected to cover:

- `Owner` — the single account, password hash and setup metadata.
- `AppSetting` — owner-scoped settings such as locale, timezone, currency, week start, and schema version.
- `ModulePreference` — enabled modules, dashboard visibility/order, and page-size/view preferences.
- `Tag` — reusable owner-owned tag name, color, and normalized lookup value.
- `Attachment` — owner-owned file metadata, safe storage key, MIME/size, and relation metadata defined by explicit associations.
- `Movie`, `TVSeries`, `WatchEntry` — media metadata, status, rating/review, favorite/tags, watched dates, and episode/season progress.
- `Book`, `ReadingSession` — reading library metadata, status, current page, ratings/reviews, start/completion dates, and history.
- `FinancialAccount`, `FinancialCategory`, `FinancialTransaction`, `Budget`, `BudgetAllocation` — accounts, classifications, exact amounts/currencies, transaction legs, recurring metadata, and budget periods.
- `Course`, `CourseLesson`, `StudySession` — course metadata, status/progress, lessons, completion, study duration, and learning records.
- `LearningArea`, `LearningItem`, `LearningTodo`, `LearningStudySession`, `LearningAreaTag`, `LearningItemTag` — owner-scoped extensible learning areas, nested topics/subtopics with summary, detailed content, requirements and learning outcomes, typed lesson/practice records, actionable checklists, study time, and tags. Areas cover Technology, Academic, and Personal Life groups and retain the existing `Course` models for backwards compatibility.
- `TravelPlace`, `TravelPlaceTag` — owner-scoped wishlist/visited places with budget, priority, links, photo and visit date.
- `EnglishSkillProgress`, `LearningEnglishEntry` — owner-scoped English vocabulary, grammar, reading, listening, speaking, and writing records linked to a learning area.
- `Note`, `Goal` — owner-scoped records; optional typed `courseId`, `lessonId`, `learningAreaId`, and `learningItemId` relations support both legacy courses and the learning center.
- `Task`, `Project`, `Note`, `Habit`, `HabitEntry`, `Goal`, `GoalMilestone`, `Subscription` — future module models added only as each module is implemented.
- `ActivityEvent` — a small owner-scoped event type, entity reference, safe message/translation key, and timestamp; never secrets or sensitive transaction details.

Every model needs a stable unique identifier, `createdAt`, `updatedAt` where mutable, explicit owner relation where applicable, and appropriate relation indexes. Avoid polymorphic foreign keys when an explicit association table or typed nullable relation is clearer.

## Ownership and relationships

The single `Owner` relation is the authorization boundary even though there is no multi-tenant design. Queries and mutations should scope records to the authenticated owner. Tags and attachments are reusable services with explicit association tables or typed joins; modules should not depend on undocumented polymorphic records.

Expected examples include:

- `Book` to `ReadingSession` (one-to-many), `Course` to `CourseLesson` and `StudySession` (one-to-many), and `Project` to `Task` (one-to-many or explicit join if tasks can be shared later).
- Course learning notes use nullable typed relations from `Note` to `Course` and `CourseLesson`; course learning goals use a nullable typed relation from `Goal` to `Course`. Mutations verify that the selected lesson belongs to the selected owner-scoped course.
- Learning-center children carry both an owner ID and a typed area relation. Mutations verify the area belongs to the authenticated owner before writing; backup import repeats these checks for area children, English records, study sessions, notes, and goals.
- Movies and series to tags through explicit join tables; series to seasons/episodes if episode tracking requires those entities.
- Financial accounts to transactions through explicit transaction legs when a transfer has two sides. A transfer must not be represented as two unrelated income/expense rows.
- Budgets to allocations and categories through explicit owner-scoped foreign keys.

## Financial invariants

1. Monetary amounts use PostgreSQL `numeric`/Prisma `Decimal` or properly defined integer minor units. JavaScript floating-point arithmetic is not acceptable for persisted money or reports.
2. Every financial record has an explicit currency. The owner’s default is TRY, with USD/EUR and other currencies allowed.
3. Account balances are never combined across currencies without an explicit exchange rate and conversion rule stored with the calculation.
4. Transfers affect source and destination accounts atomically, carry a transfer identity, and are excluded from income and expense totals.
5. Credit-card balances, debt, cash, bank, savings, and other account types retain their semantics; moving money is not automatically income.
6. Budget reports classify transactions once, respect date boundaries and category allocation, and never silently double-count a transfer.
7. Operations that update multiple financial rows run in one database transaction and reject invalid states before commit.

## Backup, import, and restore

Application export is a versioned JSON envelope containing schema version, export timestamp, owner-scoped settings, learning areas/items/study sessions/English records, travel places, and other module records with stable IDs and relationships. Import first parses and validates the entire payload, checks supported version and integrity, and generates a restore preview. Older v1 payloads may omit the newer learning-center arrays; missing arrays are treated as empty during restore. Only explicit confirmation may apply a transaction; malformed or unsupported data is rejected before any production changes. Use conflict rules documented by the implementation (for example, stable-ID upsert or a fresh restore) and preserve relation ordering.

Application export does not replace native PostgreSQL backups. Deployment documentation should include `pg_dump`/`pg_restore` (or equivalent managed PostgreSQL snapshots), restore drills, encryption and access controls, and retention choices. Automated third-party storage of sensitive records is not enabled implicitly.

## Attachments and storage

Attachment metadata lives in PostgreSQL; bytes use a storage adapter. The initial self-hosted implementation may use a configured persistent local directory. Validate file size and MIME type, generate safe non-user-controlled storage keys, check owner access on read/delete, and clean up bytes when metadata is removed. Never depend on ephemeral serverless filesystem storage for durable uploads. The adapter boundary leaves room for S3-compatible storage later without making cloud service a prerequisite.

## Seed and development data

A seed script may create a clearly marked development owner and realistic examples for local testing. It must require an explicit development environment check, be idempotent where practical, and never run automatically in production. Tests should use isolated fixtures or a dedicated database and verify real CRUD, authentication, transfers, budgets, and backup validation as infrastructure becomes available.
