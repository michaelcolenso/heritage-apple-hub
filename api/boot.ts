import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { logInfo } from "./lib/log";
import { toErrorResponse, ErrorCode } from "./lib/errors";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use("*", async (c, next) => {
  const requestId = c.req.header("x-request-id") || randomUUID();
  c.header("x-request-id", requestId);
  (c.req.raw as Request & { requestId?: string }).requestId = requestId;

  const startedAt = performance.now();
  await next();

  logInfo("http.request.completed", {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
  });
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  const requestId = c.req.header("x-request-id") || (c.req.raw as Request & { requestId?: string }).requestId || randomUUID();
  const req = new Request(c.req.raw, { headers: new Headers(c.req.raw.headers) });
  req.headers.set("x-request-id", requestId);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => {
  const requestId = c.req.header("x-request-id") || (c.req.raw as Request & { requestId?: string }).requestId || randomUUID();
  return c.json(toErrorResponse("Not Found", ErrorCode.notFound, requestId), 404);
});

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    logInfo("server.started", { port });
  });
}
