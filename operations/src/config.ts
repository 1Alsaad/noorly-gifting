export const DEPARTMENTS = [
  "management",
  "research",
  "sourcing",
  "finance",
  "creative",
  "store-operations",
  "marketing",
  "fulfillment-service",
] as const;
export type Department = (typeof DEPARTMENTS)[number];
export const TIKTOK_SLOTS = [
  "09:17",
  "12:17",
  "15:17",
  "18:17",
  "21:17",
] as const;
export const TIMEZONE = "Europe/Stockholm";
export const REQUIRED_CONNECTIONS = {
  database: ["DATABASE_URL"],
  operator: ["OPS_OPERATOR_PASSWORD", "OPS_SERVICE_TOKEN", "CRON_SECRET"],
  models: ["OPS_USD_SEK", "OPS_FX_VERIFIED_AT"],
  shopify: [
    "SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_ADMIN_ACCESS_TOKEN",
    "SHOPIFY_WEBHOOK_SECRET",
  ],
  buffer: [
    "BUFFER_API_KEY",
    "BUFFER_ORGANIZATION_ID",
    "BUFFER_TIKTOK_CHANNEL_ID",
  ],
  mail: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "OPS_OWNER_EMAIL"],
  catalog: ["NOORLY_CATALOG_TOKEN", "NOORLY_CATALOG_SIGNING_SECRET"],
} as const;
export function configurationStatus(env: NodeJS.ProcessEnv = process.env) {
  return Object.entries(REQUIRED_CONNECTIONS).map(([name, keys]) => ({
    name,
    ready: keys.every((k) => Boolean(env[k])),
    missing: keys.filter((k) => !env[k]),
  }));
}
export function fxRate(
  env: NodeJS.ProcessEnv = process.env,
  now = new Date(),
): number {
  const rate = Number(env.OPS_USD_SEK);
  const age = now.getTime() - Date.parse(env.OPS_FX_VERIFIED_AT ?? "");
  if (
    !Number.isFinite(rate) ||
    rate <= 0 ||
    rate > 100 ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > 35 * 86400000
  )
    throw new Error(
      "A current verified USD/SEK rate is required before paid API calls.",
    );
  return rate;
}
export function stockholmDay(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join("-");
}
/** Resolve wall-clock schedules using Intl's timezone database, including daylight-saving time. */
export function stockholmSlot(day: string, time: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error("Invalid schedule");
  const target = Date.parse(`${day}T${time}:00Z`);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = new Intl.DateTimeFormat("sv-SE", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const value = (key: string) => p.find((part) => part.type === key)!.value;
    const rendered = Date.parse(
      `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:${value("second")}Z`,
    );
    guess += target - rendered;
  }
  return new Date(guess);
}
