# Personal OS

Personal OS is a single-owner, modular personal management application built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and PostgreSQL. The current usable slice includes authentication, persisted settings, dashboard metrics, JSON backup/restore, Movies & TV, Books, Finance with budgets/reports/CSV, the Turkish Öğrenme ve Yaşam Merkezi (learning areas, lessons, English practice, travel places and learning statistics), Courses, owner-scoped tags, and persistent local attachments.

## Local development

Requirements: Node.js 20.9+, pnpm 9+, and Docker (for PostgreSQL).

```bash
cp .env.example .env
# Set SESSION_SECRET and BOOTSTRAP_TOKEN in .env.
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm dev
```

Open `http://localhost:3000/setup` once to create the single owner account using `BOOTSTRAP_TOKEN`, then use `/login` for subsequent sessions. The setup endpoint rejects a second owner and uses a transaction for the initialization race. The included Compose file maps PostgreSQL to host port `5433` so it can coexist with another local PostgreSQL service.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`pnpm module:create journal` creates a non-overwriting feature scaffold under `src/features/journal`. Register its descriptor in `src/config/modules.ts` and add intentional Prisma migrations for its data model.

## Database and backups

Use Prisma migrations for schema changes. Never use destructive synchronization against a real database.

```bash
pnpm db:migrate --name describe-change
pnpm db:deploy
pg_dump --format=custom --file=lifeos-$(date +%Y%m%d).dump "$DATABASE_URL"
pg_restore --clean --if-exists --dbname="$DATABASE_URL" lifeos-YYYYMMDD.dump
```

The settings backup page provides a versioned owner-scoped JSON export plus validated preview and an explicitly confirmed transactional restore. Settings also provides owner-scoped attachment upload/download/delete with MIME and 10 MB size validation. Attachment bytes use `ATTACHMENTS_DIR` (default `storage/uploads`), which must be a persistent disk in production. A PostgreSQL backup remains necessary for complete disaster recovery.

## Architecture

Read [`AGENTS.md`](./AGENTS.md), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`docs/DATABASE.md`](./docs/DATABASE.md), and [`docs/PROGRESS.md`](./docs/PROGRESS.md) before extending the project. The module registry is the single source for navigation metadata; feature code must remain owner-scoped and server-authorized.
