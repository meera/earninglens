# Database Migrations Guide

This project uses **Drizzle ORM** for database migrations. Migrations are version-controlled SQL files that track all database schema changes.

## Migration Workflow

### Development Flow

```bash
# 1. Make changes to schema
vim lib/db/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Review generated SQL
cat migrations/0001_*.sql

# 4. Apply to local database
npm run db:migrate

# 5. Commit migration files
git add migrations/
git commit -m "Add user role column"
git push
```

### Production Deployment (Automatic)

Migrations run **automatically** during Vercel deployment:

```
1. git push
2. Vercel runs: npm run build
   ├─ npm run db:migrate  ← Applies migrations to Neon
   └─ next build          ← Builds application
3. Deploy ✅
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run db:push` | ⚠️ Direct schema sync (dev only!) |

## Configuration

**drizzle.config.ts:**
```typescript
{
  schema: './lib/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  schemaFilter: ['markethawkeye'],  // Only manage this schema
}
```

**Environment Variables:**
- **Local**: `.env` → Points to local PostgreSQL (192.168.86.250:54322)
- **Production**: Vercel env vars → Points to Neon database

## Directory Structure

```
web/
├── migrations/
│   ├── 0000_initial_schema.sql       ← Committed to git
│   ├── 0001_add_user_roles.sql       ← Committed to git
│   └── meta/
│       └── _journal.json             ← Migration metadata
├── drizzle.config.ts                 ← Migration config
└── lib/db/
    ├── schema.ts                     ← Source of truth
    └── index.ts                      ← Database client
```

## Example: Adding a New Column

```typescript
// 1. Edit lib/db/schema.ts
export const user = markethawkSchema.table('user', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),  // NEW
});
```

```bash
# 2. Generate migration
npm run db:generate
# Creates: migrations/0001_wealthy_colossus.sql

# 3. Review the SQL
cat migrations/0001_*.sql
# Shows: ALTER TABLE "markethawkeye"."user" ADD COLUMN "role" varchar(50) DEFAULT 'user';

# 4. Apply locally
npm run db:migrate

# 5. Test your changes
npm run dev

# 6. Commit and deploy
git add migrations/ lib/db/schema.ts
git commit -m "Add user role column"
git push  # Vercel auto-applies migration
```

## Best Practices

### ✅ DO

- **Always generate migrations** for schema changes
- **Commit migration files** to git immediately
- **Review generated SQL** before committing
- **Test migrations locally** before deploying
- **Make backward-compatible changes** when possible

### ❌ DON'T

- **Don't** edit migration files manually (unless adding data migrations)
- **Don't** delete old migrations (breaks history)
- **Don't** use `db:push` in production (no audit trail)
- **Don't** run migrations manually in production (let CI/CD handle it)

## Backward-Compatible Migrations

For zero-downtime deployments, make changes in phases:

### Example: Renaming a Column

**❌ Bad (Breaking change):**
```sql
ALTER TABLE users RENAME COLUMN name TO full_name;
-- Old code breaks immediately!
```

**✅ Good (Two-phase migration):**

```sql
-- Phase 1: Add new column, keep old one
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
UPDATE users SET full_name = name;

-- Deploy new code (writes to both columns)

-- Phase 2 (later): Remove old column
ALTER TABLE users DROP COLUMN name;
```

## Troubleshooting

### "No schema changes, nothing to migrate"

Your local database already matches schema.ts. This is normal if you:
- Already ran migrations locally
- Made no schema changes

### Migration fails in production

1. Check Vercel logs: `vercel logs`
2. Verify `DATABASE_URL` in Vercel dashboard
3. Test migration locally with production data clone

### Rollback a migration

Drizzle doesn't have automatic rollback. If you need to undo:

```bash
# 1. Revert the schema change
git revert <commit-hash>

# 2. Generate new migration
npm run db:generate

# 3. Deploy
git push
```

## First-Time Setup (Production)

If Neon has old tables in `public` schema:

```bash
# 1. Connect to Neon
psql "your-neon-connection-string"

# 2. Clean slate (⚠️ destructive!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# 3. Deploy (migrations will create everything)
git push
```

## Migration Metadata

Drizzle tracks applied migrations in `drizzle.__drizzle_migrations`:

```sql
SELECT * FROM drizzle.__drizzle_migrations;
```

Shows:
- Migration hash
- Created timestamp
- Which migrations have been applied

## Resources

- [Drizzle Migrations Docs](https://orm.drizzle.team/docs/migrations)
- [Drizzle Kit Commands](https://orm.drizzle.team/kit-docs/overview)
- [Neon Branching](https://neon.tech/docs/guides/branching)

---

**Last Updated:** 2025-11-15
**Database:** Neon PostgreSQL (markethawkeye schema)
**ORM:** Drizzle v0.36.4
