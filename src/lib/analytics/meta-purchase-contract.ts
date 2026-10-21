import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";

const inputSchema = z.object({
  shop: z.string().regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/),
  orderId: z.string().regex(/^[1-9]\d{0,19}$/),
  financialStatus: z.string(),
  test: z.boolean(),
  cancelled: z.boolean(),
  // These must come from verified consent evidence, not client order parameters.
  marketingConsent: z.boolean(),
  shopifyMarketingAllowed: z.boolean(),
  paidAt: z.iso.datetime({ offset: true }),
  currency: z.string().regex(/^[A-Z]{3}$/),
  total: z.string().regex(/^\d{1,9}(\.\d{1,2})?$/),
});

export type MetaPurchaseInput = z.input<typeof inputSchema>;
export type MetaPurchaseContract = {
  eventName: "Purchase";
  eventId: string;
  eventTime: number;
  currency: string;
  value: number;
};

/**
 * Offline preparation only: no tracking, storage, network or production caller.
 * The future adapter must authenticate the paid order and verify current consent.
 * Share eventName/eventId between browser and server; persist retry delivery state
 * atomically. This contract alone does not deliver or deduplicate Meta events.
 */
export function prepareMetaPurchaseContract(
  input: unknown,
  now = Date.now(),
): MetaPurchaseContract | null {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return null;
  const order = parsed.data;
  const paidAt = Date.parse(order.paidAt);
  const value = Number(order.total);
  if (
    order.financialStatus !== "paid" ||
    order.test ||
    order.cancelled ||
    !order.marketingConsent ||
    !order.shopifyMarketingAllowed ||
    !Number.isFinite(now) ||
    paidAt > now ||
    value <= 0
  )
    return null;
  return {
    eventName: "Purchase",
    eventId: createHash("sha256")
      .update(`${order.shop}:${order.orderId}:paid`)
      .digest("hex"),
    eventTime: Math.floor(paidAt / 1000),
    currency: order.currency,
    value,
  };
}
