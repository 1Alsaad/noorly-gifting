import "server-only";
import { getEnv } from "@/lib/env/server";

/** Compatible with Redis REST services, e.g. Upstash. Never called from the browser. */
export async function redisCommand<T>(
  command: (string | number)[],
): Promise<T> {
  const env = getEnv();
  if (!env.RATE_LIMIT_PROVIDER_URL || !env.RATE_LIMIT_PROVIDER_TOKEN)
    throw new Error("DURABLE_STORE_UNAVAILABLE");
  const response = await fetch(env.RATE_LIMIT_PROVIDER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RATE_LIMIT_PROVIDER_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("DURABLE_STORE_UNAVAILABLE");
  const payload = (await response.json()) as { result?: T; error?: string };
  if (payload.error || !("result" in payload))
    throw new Error("DURABLE_STORE_UNAVAILABLE");
  return payload.result as T;
}

export function hasDurableStore() {
  const env = getEnv();
  return Boolean(env.RATE_LIMIT_PROVIDER_URL && env.RATE_LIMIT_PROVIDER_TOKEN);
}
