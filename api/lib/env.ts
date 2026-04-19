import "dotenv/config";

type EnvKey =
  | "APP_ID"
  | "APP_SECRET"
  | "DATABASE_URL"
  | "KIMI_AUTH_URL"
  | "KIMI_OPEN_URL";

const REQUIRED_ENV_KEYS: EnvKey[] = [
  "APP_ID",
  "APP_SECRET",
  "DATABASE_URL",
  "KIMI_AUTH_URL",
  "KIMI_OPEN_URL",
];

const SAFE_LOCAL_DEFAULTS: Record<EnvKey, string> = {
  APP_ID: "local-app-id",
  APP_SECRET: "local-app-secret",
  DATABASE_URL: "mysql://root:root@127.0.0.1:3306/heritage_apple_hub",
  KIMI_AUTH_URL: "http://localhost:5173/mock/kimi/auth",
  KIMI_OPEN_URL: "http://localhost:5173/mock/kimi/open",
};

const isProduction = process.env.NODE_ENV === "production";
const isLocalDevMode = ["1", "true", "yes", "on"].includes(
  (process.env.LOCAL_DEV_MODE ?? "").toLowerCase(),
);

function validateRequiredEnv(): void {
  const missing = REQUIRED_ENV_KEYS.filter((name) => !process.env[name]);

  if (!missing.length) {
    return;
  }

  const output = [
    "[env] Startup validation found missing required environment variables:",
    ...missing.map(
      (name) => `  - ${name} (safe local default: ${SAFE_LOCAL_DEFAULTS[name]})`,
    ),
    "[env] Set LOCAL_DEV_MODE=true to run with safe local defaults.",
  ].join("\n");

  if (!isLocalDevMode) {
    throw new Error(`${output}\n[env] Refusing startup outside explicit local dev mode.`);
  }

  console.warn(output);
}

function getEnv(name: EnvKey): string {
  const value = process.env[name];
  if (value) {
    return value;
  }

  return SAFE_LOCAL_DEFAULTS[name];
}

validateRequiredEnv();

export const env = {
  appId: getEnv("APP_ID"),
  appSecret: getEnv("APP_SECRET"),
  isProduction,
  isLocalDevMode,
  databaseUrl: getEnv("DATABASE_URL"),
  kimiAuthUrl: getEnv("KIMI_AUTH_URL"),
  kimiOpenUrl: getEnv("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
