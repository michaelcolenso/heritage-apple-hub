# Release and rollback runbook

This runbook defines the standard release sequence, migration guardrails, and rollback procedures for Heritage Apple Hub.

## 1) Release checklist (required sequence)

Execute these steps in order for every production release:

1. **Schema migration dry-run**
   - Review the migration SQL and expected side effects.
   - Run migration in a staging environment with production-like data volume.
   - Capture execution time, lock behavior, and query plan changes.
2. **Backup verification**
   - Verify backup recency and successful completion status.
   - Perform a test restore and run basic data integrity checks.
3. **Canary deploy**
   - Deploy to a small, controlled subset of instances or users.
   - Monitor logs, APM traces, database load, and error budgets.
4. **Health checks**
   - Confirm `/health` and dependency checks are green.
   - Validate external integrations (email, auth/session, payment, storage) as applicable.
5. **Post-deploy smoke tests**
   - Validate critical flows end-to-end.
   - Include at minimum: authentication, catalog/browse, cart, checkout, and order history.

Do not advance to the next step until the current step is verified and documented.

## 2) Migration guardrails

Use this lifecycle for all schema-affecting releases:

1. **Backward-compatible migration first**
   - Prefer additive, non-breaking schema changes.
   - Enable dual-read/dual-write or compatibility shims as needed.
2. **Code path switch**
   - Deploy application changes that switch reads/writes to the new structure.
   - Use feature flags and canary rollout to limit blast radius.
3. **Cleanup migration**
   - Remove deprecated structures only after validating no consumers remain.
   - Schedule destructive cleanup separately when risk is elevated.

## 3) Rollback procedures

### A) Application version rollback

Use when: new app code introduces regressions but schema is still compatible.

1. Halt further rollout and keep canary/fleet size fixed.
2. Re-deploy the last known good application artifact.
3. Disable release-specific feature flags.
4. Run health checks and smoke tests.
5. Document incident timeline, root cause hypothesis, and follow-up actions.

### B) Database schema rollback

Use when: migration causes correctness/performance issues that cannot be mitigated quickly.

1. Place the system in a controlled state (read-only mode or maintenance window if needed).
2. If rollback SQL exists and is verified, execute rollback migration.
3. If rollback SQL is unsafe/unavailable, restore from the most recent verified backup.
4. Re-deploy the matching application version that is compatible with the restored schema.
5. Validate data integrity and critical user journeys before resuming normal traffic.
6. Record restoration point objective (RPO) impact and any manually replayed operations.

## 4) Decision guidance

- Prefer **application rollback first** if schema remains backward-compatible.
- Use **database rollback/restore** only when data correctness or system stability is at risk and app rollback is insufficient.
- Always pair rollback execution with stakeholder communication and incident tracking.
