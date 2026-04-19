# Heritage Apple Hub

A full-stack marketplace and catalog for heirloom apple preservation with a React + Vite frontend and a Hono + tRPC API backend.

## Architecture Diagram

```mermaid
flowchart LR
  U[Browser Client\nReact + Vite] -->|HTTP + tRPC| A[Hono API\napi/boot.ts]
  A --> R[tRPC Router\napi/router.ts]
  R --> Q[Query + Domain Layers\napi/queries/* + routers]
  Q --> D[(MySQL\nDrizzle ORM)]
  A --> K[Kimi OAuth/Open APIs]
```

## Required Environment Variables

The API validates these variables at startup in every environment. The only bypass is explicitly enabling local dev mode (`LOCAL_DEV_MODE=true`), where safe defaults are applied and logged.

| Variable | Required | Safe local default |
| --- | --- | --- |
| `APP_ID` | Yes | `local-app-id` |
| `APP_SECRET` | Yes | `local-app-secret` |
| `DATABASE_URL` | Yes | `mysql://root:root@127.0.0.1:3306/heritage_apple_hub` |
| `KIMI_AUTH_URL` | Yes | `http://localhost:5173/mock/kimi/auth` |
| `KIMI_OPEN_URL` | Yes | `http://localhost:5173/mock/kimi/open` |
| `OWNER_UNION_ID` | Optional | empty string |
| `NODE_ENV` | Recommended | `development` |
| `LOCAL_DEV_MODE` | Optional | `false` |

### Example `.env` (local)

```bash
APP_ID=local-app-id
APP_SECRET=local-app-secret
DATABASE_URL=mysql://root:root@127.0.0.1:3306/heritage_apple_hub
KIMI_AUTH_URL=http://localhost:5173/mock/kimi/auth
KIMI_OPEN_URL=http://localhost:5173/mock/kimi/open
OWNER_UNION_ID=
LOCAL_DEV_MODE=true
NODE_ENV=development
```

## Startup Commands (Local and Production)

### Local development

```bash
npm install
npm run dev
```

If you are intentionally running without all real credentials, set:

```bash
LOCAL_DEV_MODE=true npm run dev
```

### Production build and runtime

```bash
npm install
npm run build
npm run start
```

## Migration Workflow

Use Drizzle for schema lifecycle:

1. Update schema definitions in `db/schema.ts` (and related relation files if needed).
2. Generate migration files:
   ```bash
   npm run db:generate
   ```
3. Apply migrations:
   ```bash
   npm run db:migrate
   ```
4. For rapid sync in non-production environments, use push:
   ```bash
   npm run db:push
   ```

## Incident / Debug Runbook

1. **Confirm environment validation output**
   - On startup, inspect logs for missing env variables and fallback usage.
   - If startup fails, set real values (or explicitly `LOCAL_DEV_MODE=true` for local-only recovery).
2. **Check API health**
   - Verify server boot logs and `Server running on http://localhost:<port>/` output in production mode.
3. **Check database reachability**
   - Validate `DATABASE_URL` and database process/network accessibility.
4. **Inspect auth integrations**
   - Confirm `KIMI_AUTH_URL` and `KIMI_OPEN_URL` are reachable and correct for the target environment.
5. **Run static checks**
   ```bash
   npm run check
   npm run lint
   npm run test
   ```
6. **Mitigate quickly**
   - Roll back to last known-good release if issue is user-impacting and unresolved.

## Rollback Procedure

1. Identify last known-good git commit or release artifact.
2. Restore application artifact (or checkout commit and rebuild):
   ```bash
   git checkout <known_good_commit>
   npm install
   npm run build
   npm run start
   ```
3. Re-apply last known-good database migration state (if required by your deployment process).
4. Verify startup logs, API endpoints, and critical user flows.
5. Announce incident status and capture postmortem actions before reattempting the failed change.
