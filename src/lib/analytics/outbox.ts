import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getEnv } from "@/lib/env/server";
import { redisCommand } from "@/lib/security/redis";
import { analyticsEventSchema } from "./schema";

const OUTBOX = "stilla:analytics:pending";
const envelopeSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.string(),
  event: analyticsEventSchema,
  analyticsAllowed: z.boolean().optional(),
  marketingFbp: z.string().optional(),
  marketingFbc: z.string().optional(),
  delivered: z.array(z.enum(["ga4", "posthog", "relay", "meta"])),
});
export type PurchaseEnvelope = z.infer<typeof envelopeSchema>;

/** Atomic dedupe AND durable enqueue. Acknowledgement is safe only after this succeeds. */
export async function enqueuePurchase(
  envelope: PurchaseEnvelope,
): Promise<boolean> {
  envelopeSchema.parse(envelope);
  const result = await redisCommand<number>([
    "EVAL",
    "if redis.call('EXISTS',KEYS[1])==1 then return 0 end; redis.call('SET',KEYS[2],ARGV[1]); redis.call('SADD',KEYS[3],ARGV[2]); redis.call('SET',KEYS[1],'1','EX',15552000); return 1",
    3,
    `stilla:analytics:dedupe:${envelope.id}`,
    `stilla:analytics:event:${envelope.id}`,
    OUTBOX,
    JSON.stringify(envelope),
    envelope.id,
  ]);
  return result === 1;
}

async function deliver(
  provider: "ga4" | "posthog" | "relay" | "meta",
  item: PurchaseEnvelope,
) {
  const env = getEnv();
  const properties = item.event.properties;
  let url: string;
  let body: unknown;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider === "ga4") {
    const params = new URLSearchParams({
      measurement_id: env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!,
      api_secret: env.GA4_API_SECRET!,
    });
    url = `https://www.google-analytics.com/mp/collect?${params}`;
    body = {
      client_id: properties.anonymous_session_id,
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: properties.transaction_id,
            value: properties.value,
            currency: properties.currency,
            engagement_time_msec: 1,
          },
        },
      ],
    };
  } else if (provider === "posthog") {
    url = `${env.NEXT_PUBLIC_POSTHOG_HOST!.replace(/\/$/, "")}/capture/`;
    body = {
      api_key: env.NEXT_PUBLIC_POSTHOG_KEY,
      event: "purchase",
      distinct_id: properties.anonymous_session_id,
      timestamp: item.createdAt,
      properties: {
        ...properties,
        $insert_id: item.id,
        $process_person_profile: false,
      },
    };
  } else if (provider === "meta") {
    url = `https://graph.facebook.com/${env.META_CAPI_API_VERSION}/${env.NEXT_PUBLIC_META_PIXEL_ID}/events`;
    headers.Authorization = `Bearer ${env.META_CAPI_ACCESS_TOKEN}`;
    body = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(new Date(item.createdAt).getTime() / 1000),
          event_id: item.id,
          action_source: "website",
          event_source_url: env.NEXT_PUBLIC_SITE_URL,
          user_data: {
            ...(item.marketingFbp ? { fbp: item.marketingFbp } : {}),
            ...(item.marketingFbc ? { fbc: item.marketingFbc } : {}),
          },
          custom_data: {
            currency: properties.currency,
            value: properties.value,
          },
        },
      ],
    };
  } else {
    url = env.ANALYTICS_DELIVERY_URL!;
    headers.Authorization = `Bearer ${env.ANALYTICS_DELIVERY_TOKEN}`;
    headers["Idempotency-Key"] = item.id;
    body = item;
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("ANALYTICS_DELIVERY_FAILED");
}

/** Invoke from authenticated scheduled worker. Failed deliveries stay pending. */
export async function drainPurchaseOutbox(maxItems = 20) {
  const env = getEnv();
  const providers: ("ga4" | "posthog" | "relay" | "meta")[] = [];
  if (env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && env.GA4_API_SECRET)
    providers.push("ga4");
  if (env.NEXT_PUBLIC_POSTHOG_KEY && env.NEXT_PUBLIC_POSTHOG_HOST)
    providers.push("posthog");
  if (env.ANALYTICS_DELIVERY_URL && env.ANALYTICS_DELIVERY_TOKEN)
    providers.push("relay");
  if (
    env.META_CAPI_ACCESS_TOKEN &&
    env.META_CAPI_API_VERSION &&
    /^\d+$/.test(env.NEXT_PUBLIC_META_PIXEL_ID ?? "")
  )
    providers.push("meta");
  if (!providers.length)
    return { processed: 0, pending: true, reason: "PROVIDER_NOT_CONFIGURED" };
  const pending = await redisCommand<string[]>(["SMEMBERS", OUTBOX]);
  let processed = 0;
  const startedAt = Date.now();
  for (const id of pending.slice(0, maxItems)) {
    if (Date.now() - startedAt > 25_000) break;
    const lockKey = `stilla:analytics:lock:${id}`;
    const lock = randomUUID();
    if ((await redisCommand(["SET", lockKey, lock, "NX", "EX", 60])) !== "OK")
      continue;
    try {
      const raw = await redisCommand<string | null>([
        "GET",
        `stilla:analytics:event:${id}`,
      ]);
      if (!raw) continue;
      const item = envelopeSchema.parse(JSON.parse(raw));
      for (const provider of providers) {
        if (provider === "meta") {
          if (!item.marketingFbp && !item.marketingFbc) continue;
        } else if (item.analyticsAllowed === false) continue;
        if (item.delivered.includes(provider)) continue;
        await deliver(provider, item);
        item.delivered.push(provider);
        await redisCommand([
          "SET",
          `stilla:analytics:event:${id}`,
          JSON.stringify(item),
        ]);
      }
      await redisCommand([
        "EVAL",
        "redis.call('SREM',KEYS[1],ARGV[1]); redis.call('DEL',KEYS[2]); return 1",
        2,
        OUTBOX,
        `stilla:analytics:event:${id}`,
        id,
      ]);
      processed += 1;
    } catch {
      // Redacted operational metadata only; no payload, URL, response body or credentials.
      console.warn(
        JSON.stringify({
          level: "warn",
          code: "ANALYTICS_OUTBOX_RETRY",
          eventId: id,
        }),
      );
    } finally {
      await redisCommand([
        "EVAL",
        "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0",
        1,
        lockKey,
        lock,
      ]);
    }
  }
  return { processed, pending: pending.length > processed };
}
