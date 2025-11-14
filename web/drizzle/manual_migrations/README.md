# Manual Database Migrations

This directory contains SQL migrations that were manually applied to the database because drizzle-kit migrations failed or were not used.

## Why Manual Migrations?

- **Version mismatch**: drizzle-orm and drizzle-kit version incompatibility
- **Emergency fixes**: Quick fixes needed before migration system setup
- **Schema changes**: Direct SQL was faster than fixing drizzle tooling

## Applied Migrations

### 001_earnings_calls.sql
- **Created**: 2025-11-13
- **Database**: PostgreSQL 192.168.86.250:54322
- **Schema**: markethawkeye
- **Purpose**: Create earnings_calls table for batch processing pipeline
- **Status**: ✅ Applied manually via psql

**Application command:**
```bash
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -f web/drizzle/manual_migrations/001_earnings_calls.sql
```

**Verification:**
```bash
PGPASSWORD=postgres psql -h 192.168.86.250 -p 54322 -U postgres -d postgres -c "\d markethawkeye.earnings_calls"
```

## Future Migrations

When drizzle-kit is fixed:
1. Update drizzle-orm and drizzle-kit to compatible versions
2. Run `npm run db:generate` to generate migrations
3. Run `npm run db:migrate` to apply migrations
4. Document any manual changes needed

## Production Deployment

For production (Neon):
1. Test migration on local database first
2. Create backup of production database
3. Apply migration to production
4. Verify with queries
5. Document in this README

## Schema Sync

The TypeScript schema in `web/lib/db/schema.ts` should always match the actual database schema. Manual migrations require:
1. Apply SQL to database
2. Update TypeScript schema.ts
3. Document in this directory
