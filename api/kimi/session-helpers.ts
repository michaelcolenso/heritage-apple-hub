import type { SessionPayload } from "./types";

export function toSessionPayload(payload: Record<string, unknown>): SessionPayload | null {
  const unionId = payload.unionId;
  const clientId = payload.clientId;

  if (typeof unionId !== "string" || typeof clientId !== "string") {
    return null;
  }

  return { unionId, clientId };
}
