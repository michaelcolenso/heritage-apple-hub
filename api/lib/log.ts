export type LogLevel = "info" | "warn" | "error";

function writeLog(level: LogLevel, message: string, fields: Record<string, unknown> = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  console[level](JSON.stringify(payload));
}

export function logInfo(message: string, fields?: Record<string, unknown>) {
  writeLog("info", message, fields);
}

export function logWarn(message: string, fields?: Record<string, unknown>) {
  writeLog("warn", message, fields);
}

export function logError(message: string, fields?: Record<string, unknown>) {
  writeLog("error", message, fields);
}

export async function measure<T>(action: () => Promise<T>) {
  const startedAt = performance.now();
  const result = await action();
  return { result, durationMs: Number((performance.now() - startedAt).toFixed(2)) };
}
