# Heritage Apple Hub

Heritage Apple Hub is a React + TypeScript + Vite application for showcasing and transacting heritage apple varieties.

## Local setup

```bash
cp .env.example .env          # fill in DATABASE_URL, KIMI_*, STRIPE_*, S3_*
npm install
npm run db:migrate            # apply Drizzle migrations from db/migrations/
npx tsx db/seed.ts            # optional: seed varieties, sellers, sample orders
npm run dev                   # http://localhost:3000
```

When the schema changes, regenerate the migration with `npm run db:generate` and commit the new SQL file alongside the schema diff.

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# copy the whsec_... value into STRIPE_WEBHOOK_SECRET
```

## Operations quick reference

### Release checklist

Follow this sequence for every production deployment:

1. **Schema migration dry-run**
   - Generate and review the migration plan.
   - Run migrations against a staging or production-like clone.
   - Validate query performance and data integrity before touching production.
2. **Backup verification**
   - Confirm the latest automated backup completed successfully.
   - Execute a restore drill to a disposable environment and verify recovered data.
3. **Canary deploy**
   - Deploy the new application version to a small traffic slice.
   - Monitor error rate, latency, and key business events before full rollout.
4. **Health checks**
   - Validate API health endpoints, database connectivity, queue/workers, and auth flows.
   - Confirm alerts and dashboards are receiving fresh telemetry.
5. **Post-deploy smoke tests**
   - Validate critical user journeys (login, browse varieties, checkout, order visibility).
   - Confirm admin/operator workflows function as expected.

### Migration guardrails

For all schema and application changes, use a three-phase migration pattern:

1. **Backward-compatible migration first**
   - Additive schema changes only (new nullable columns/tables/indexes, dual-write support).
   - Never remove or rename schema elements required by the current production app version.
2. **Code path switch**
   - Deploy application code that reads/writes through the new schema path.
   - Use feature flags or staged rollout where possible.
   - Observe for at least one full traffic cycle before cleanup.
3. **Cleanup migration**
   - Remove deprecated columns/tables/indexes only after confirming no old code paths remain.
   - Treat destructive changes as a separate release with explicit rollback planning.

## Detailed runbook

See [`docs/operations/release-and-rollback.md`](docs/operations/release-and-rollback.md) for detailed release and rollback procedures for both application and database changes.
