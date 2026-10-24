import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { getEnv } from "@/lib/env/server";
import { enqueuePurchase } from "@/lib/analytics/outbox";
import { HttpError, readBody, safeError } from "@/lib/security/request";
import { verifyShopifyHmac } from "@/lib/security/webhook";

export const runtime = "nodejs";
const paidOrderSchema = z.object({
  id: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]),
  financial_status: z.literal("paid"),
  test: z.boolean().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  total_price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  note_attributes: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .default([]),
});

export async function POST(request: Request) {
  try {
    const env = getEnv();
    if (!env.SHOPIFY_WEBHOOK_SECRET || !env.SHOPIFY_STORE_DOMAIN)
      throw new HttpError(503, "WEBHOOK_NOT_CONFIGURED");
    const raw = await readBody(request, 1_048_576);
    if (
      !verifyShopifyHmac(
        raw,
        request.headers.get("x-shopify-hmac-sha256"),
        env.SHOPIFY_WEBHOOK_SECRET,
      )
    )
      throw new HttpError(401, "INVALID_SIGNATURE");
    if (
      request.headers.get("x-shopify-shop-domain") !== env.SHOPIFY_STORE_DOMAIN
    )
      throw new HttpError(401, "INVALID_SHOP");
    if (request.headers.get("x-shopify-topic") !== "orders/paid")
      return Response.json({ ok: true, ignored: true });
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      throw new HttpError(400, "INVALID_JSON");
    }
    const parsed = paidOrderSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "INVALID_PAID_ORDER");
    const order = parsed.data;
    if (order.test || env.NEXT_PUBLIC_COMMERCE_PROVIDER === "mock")
      return Response.json({ ok: true, ignored: true });
    const attributes = Object.fromEntries(
      order.note_attributes.map((a) => [a.name, a.value]),
    );
    const session = z.uuid().safeParse(attributes._stilla_analytics_session);
    const analyticsAllowed =
      attributes._stilla_analytics_consent === "granted" && session.success;
    const metaCookie = (key: string) => {
      const value = attributes[key] ?? "";
      return /^fb\\.\\d+\\.\\d+\\.[A-Za-z0-9_-]{1,160}$/.test(value)
        ? value
        : "";
    };
    const marketingAllowed = attributes._noorly_meta_consent === "granted";
    const fbp = marketingAllowed ? metaCookie("_noorly_meta_fbp") : "";
    const fbc = marketingAllowed ? metaCookie("_noorly_meta_fbc") : "";
    if (!analyticsAllowed && !fbp && !fbc)
      return Response.json({ ok: true, analytics: "not_consented" });
    // Hash store + order identity: paid topic redeliveries with new webhook IDs are also deduplicated.
    const id = createHash("sha256")
      .update(`${env.SHOPIFY_STORE_DOMAIN}:${order.id}:paid`)
      .digest("hex");
    const enqueued = await enqueuePurchase({
      id,
      createdAt: new Date().toISOString(),
      delivered: [],
      analyticsAllowed,
      marketingFbp: fbp || undefined,
      marketingFbc: fbc || undefined,
      event: {
        name: "purchase",
        properties: {
          ...(analyticsAllowed ? { anonymous_session_id: session.data } : {}),
          transaction_id: id,
          currency: order.currency,
          value: Number(order.total_price),
          source: "shopify_webhook",
        },
      },
    });
    const requestId = randomUUID();
    console.info(
      JSON.stringify({
        level: "info",
        code: "PAID_ORDER_QUEUED",
        requestId,
        duplicate: !enqueued,
      }),
    );
    return Response.json({ ok: true, duplicate: !enqueued, requestId });
  } catch (error) {
    return safeError(error);
  }
}
