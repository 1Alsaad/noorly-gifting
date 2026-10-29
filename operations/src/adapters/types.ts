export type ExternalResult<T = unknown> = {
  status: "succeeded" | "rejected" | "unknown";
  externalId?: string;
  data?: T;
  reason?: string;
};

export type AdapterReadiness = {
  ready: boolean;
  missing: string[];
  limitations: string[];
};
export type AdapterOptions = {
  fetch?: typeof fetch;
  timeoutMs?: number;
  now?: () => number;
};
export type Env = Record<string, string | undefined>;

export function readiness(
  values: Record<string, unknown>,
  limitations: string[] = [],
): AdapterReadiness {
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return { ready: missing.length === 0, missing, limitations };
}

export function unavailable<T>(state: AdapterReadiness): ExternalResult<T> {
  return {
    status: "rejected",
    reason: `Missing or invalid configuration: ${state.missing.join(", ")}`,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function isString(value: unknown): value is string {
  return typeof value === "string";
}
export function nonempty(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}
export function actionKeyValid(value: unknown): value is string {
  return isString(value) && /^[A-Za-z0-9_./:-]{1,200}$/.test(value);
}
export function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
