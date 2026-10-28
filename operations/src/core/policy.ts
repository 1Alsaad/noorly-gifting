import type {
  Action,
  Decision,
  OpsState,
  ProductEvidence,
  VerifiedOrder,
} from "./types.js";

export const LIMITS = Object.freeze({
  softwareMonthlyOre: 100_000,
  adsInitialMonthlyOre: 50_000,
  adsMaximumMonthlyOre: 100_000,
  supplierFloatOre: 200_000,
  observationMs: 72 * 60 * 60 * 1000,
  heartbeatGapMs: 20 * 60 * 1000,
});
export const BASE_READINESS = [
  "connectors",
  "budget_reconciliation",
  "webhook_deduplication",
  "recovery",
] as const;
export class PolicyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PolicyError";
  }
}
export function money(value: number, label = "amountOre"): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new PolicyError(
      "INVALID_MONEY",
      `${label} must be nonnegative integer ore`,
    );
  return value;
}
export function stockholmMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
}
export function contributionOre(order: VerifiedOrder): number {
  return (
    order.revenueOre -
    order.productCostOre -
    order.shippingCostOre -
    order.paymentFeeOre -
    order.adCostOre -
    order.refundsOre -
    order.returnsReprintsOre -
    order.personalizationLabourOre
  );
}
export function profitQualified(state: OpsState, now: Date): boolean {
  const month = stockholmMonth(now);
  const orders = Object.values(state.orders).filter(
    (o) =>
      o.source === "shopify_supplier_payment" &&
      new Set(o.sourceRefs).size >= 3 &&
      o.paidAt &&
      o.fulfilledAt &&
      o.payoutReceivedAt &&
      Date.parse(o.verifiedAt) <= now.getTime() &&
      Date.parse(o.payoutReceivedAt) <= now.getTime() &&
      Date.parse(o.fulfilledAt) <= now.getTime() &&
      Date.parse(o.paidAt) <= now.getTime() &&
      stockholmMonth(new Date(o.payoutReceivedAt)) === month,
  );
  const allocatedAds = orders.reduce((sum, order) => sum + order.adCostOre, 0);
  const contributionBeforeAds = orders.reduce(
    (sum, order) => sum + contributionOre(order) + order.adCostOre,
    0,
  );
  // Failed/unsold experiments still cost money. Count all current-month ads,
  // including pending commitments, without double-subtracting attributed ad costs.
  return (
    orders.length > 0 &&
    contributionBeforeAds -
      Math.max(allocatedAds, budgetUsage(state, "ads", now)) >
      0
  );
}
export function budgetUsage(
  state: OpsState,
  category: "software" | "ads" | "supplier",
  now: Date,
): number {
  const month = stockholmMonth(now);
  const used = Object.values(state.reservations).reduce((total, r) => {
    if (
      r.category !== category ||
      r.status === "released" ||
      r.funding === "prepaid"
    )
      return total;
    // Outstanding reservations carry across month boundaries, so rollover cannot bypass a cap.
    if (r.status === "reserved") return total + r.amountOre;
    if (
      category === "supplier" ||
      (r.settledAt && stockholmMonth(new Date(r.settledAt)) === month)
    )
      return total + (r.actualOre ?? 0);
    return total;
  }, 0);
  return category === "supplier"
    ? used -
        Object.values(state.supplierRecoveries).reduce(
          (sum, r) => sum + r.amountOre,
          0,
        )
    : used;
}
function validSource(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
function fresh(timestamp: string, now: Date, days: number): boolean {
  const age = now.getTime() - Date.parse(timestamp);
  return Number.isFinite(age) && age >= 0 && age <= days * 86400000;
}
export function evaluateLaunch(e: ProductEvidence, now: Date): Decision {
  const reasons: string[] = [];
  if (
    e.search.country !== "SE" ||
    e.search.method !== "absolute_volume" ||
    !Number.isFinite(e.search.monthlySearches) ||
    e.search.monthlySearches < 100 ||
    !e.search.period ||
    !validSource(e.search.sourceUrl) ||
    !fresh(e.search.observedAt, now, 35)
  )
    reasons.push(
      "Current absolute Swedish search volume of at least 100/month is required.",
    );
  if (
    e.trends.country !== "SE" ||
    !e.trends.seasonalWindow ||
    !validSource(e.trends.sourceUrl) ||
    !fresh(e.trends.observedAt, now, 35)
  )
    reasons.push("Swedish seasonal Google Trends evidence is required.");
  // Explicit conservative defaults; these are operational thresholds, not claimed sales volumes.
  if (
    !Number.isFinite(e.marketplace.rating) ||
    e.marketplace.rating < 4 ||
    e.marketplace.rating > 5 ||
    !Number.isSafeInteger(e.marketplace.reviewCount) ||
    e.marketplace.reviewCount < 100 ||
    !e.marketplace.country ||
    !validSource(e.marketplace.sourceUrl) ||
    !fresh(e.marketplace.observedAt, now, 35)
  )
    reasons.push(
      "At least 100 marketplace reviews averaging 4/5 and a dated market source are required.",
    );
  const s = e.supplier;
  if (
    !s.productId ||
    !s.variantId ||
    !s.quoteId ||
    s.integration !== "shopify_direct" ||
    s.shippingCountry !== "SE" ||
    !validSource(s.sourceUrl) ||
    !fresh(s.observedAt, now, 7) ||
    !Number.isInteger(s.deliveryDaysMax) ||
    s.deliveryDaysMax < 1
  )
    reasons.push(
      "An exact current supplier variant, direct Shopify integration and Sweden delivery quote are required.",
    );
  const p = e.pricing;
  for (const key of [
    "sellingPriceOre",
    "productCostOre",
    "shippingCostOre",
    "paymentFeeOre",
    "adCostAllowanceOre",
    "returnsReprintsAllowanceOre",
    "personalizationLabourOre",
  ] as const) {
    try {
      money(p[key], key);
    } catch {
      reasons.push(`Invalid ${key}.`);
    }
  }
  if (
    Object.values(p).length !== 7 ||
    p.sellingPriceOre <=
      p.productCostOre +
        p.shippingCostOre +
        p.paymentFeeOre +
        p.adCostAllowanceOre +
        p.returnsReprintsAllowanceOre +
        p.personalizationLabourOre
  )
    reasons.push(
      "Contribution after all quoted costs and allowances must be positive.",
    );
  if (!e.provenance.actor || !e.provenance.evidenceRefs.length)
    reasons.push("Trusted evidence provenance is required.");
  return { allowed: reasons.length === 0, reasons };
}
export function liveReadiness(state: OpsState, now: Date): string[] {
  const reasons: string[] = [];
  const elapsed =
    now.getTime() - Date.parse(state.control.observationStartedAt);
  if (!Number.isFinite(elapsed) || elapsed < LIMITS.observationMs)
    reasons.push("The 72-hour observation period is incomplete.");
  const heartbeatAge =
    now.getTime() - Date.parse(state.control.lastHeartbeatAt ?? "");
  if (
    !Number.isFinite(heartbeatAge) ||
    heartbeatAge < 0 ||
    heartbeatAge > LIMITS.heartbeatGapMs
  )
    reasons.push(
      "A continuous healthy runtime heartbeat is required; gaps over twenty minutes restart observation.",
    );
  for (const key of BASE_READINESS) {
    const proof = state.control.readiness[key];
    if (proof?.outcome !== "pass")
      reasons.push(`Readiness check ${key} has not passed.`);
    else if (
      !Number.isFinite(Date.parse(proof.checkedAt)) ||
      Date.parse(proof.checkedAt) >
        Date.parse(state.control.observationStartedAt)
    )
      reasons.push(
        `Readiness check ${key} must cover the complete observation period.`,
      );
  }
  return reasons;
}
export function decideAction(
  state: OpsState,
  action: Action,
  now: Date,
  productId?: string,
  orderId?: string,
): Decision {
  if (state.control.mode === "paused")
    return { allowed: false, reasons: ["Operations are paused."] };
  if (["research", "analyze", "draft"].includes(action))
    return { allowed: true, reasons: [] };
  const supported = [
    "publish_social",
    "publish_product",
    "activate_ads",
    "fulfill_order",
    "send_support",
    "refund",
  ];
  if (!supported.includes(action))
    return { allowed: false, reasons: ["Unknown action."] };
  const reasons = liveReadiness(state, now);
  if (state.control.mode !== "live")
    reasons.push(
      "Live operations have not been enabled by the trusted runtime.",
    );
  const checks =
    action === "publish_social"
      ? ["social"]
      : action === "send_support"
        ? ["connectors"]
        : action === "fulfill_order"
          ? ["supplier"]
          : ["supplier", "checkout", "tracking_consent"];
  for (const key of checks)
    if (
      state.control.readiness[key as keyof typeof state.control.readiness]
        ?.outcome !== "pass"
    )
      reasons.push(`Readiness check ${key} has not passed.`);
  if (action === "fulfill_order") {
    const order =
      orderId && Object.hasOwn(state.obligations, orderId)
        ? state.obligations[orderId]
        : undefined;
    const linesMapped =
      !order?.lines ||
      (order.lines.length > 0 &&
        order.lines.every(
          (line) =>
            line.lineItemId &&
            line.productId &&
            line.variantId &&
            line.supplierProductId &&
            line.supplierVariantId &&
            Number.isSafeInteger(line.quantity) &&
            line.quantity > 0,
        ));
    const productMatches =
      !productId ||
      (order?.lines
        ? order.lines.some((line) => line.productId === productId)
        : order?.productId === productId);
    if (
      !order ||
      order.holdReason ||
      !linesMapped ||
      order.source !== "shopify_paid_order" ||
      !order.sourceRef ||
      !order.supplierProductId ||
      !order.supplierVariantId ||
      !Number.isFinite(Date.parse(order.paidAt)) ||
      Date.parse(order.paidAt) > now.getTime() ||
      order.cancelledAt ||
      order.fulfilledAt ||
      order.amountPaidOre <= order.refundedOre ||
      !productMatches
    )
      reasons.push(
        "A persisted paid, unfulfilled order with complete supplier mappings and no fulfillment hold is required.",
      );
  }
  if (["publish_product", "activate_ads"].includes(action)) {
    const product =
      productId && Object.hasOwn(state.products, productId)
        ? state.products[productId]
        : undefined;
    if (!product) reasons.push("Persisted product evidence is required.");
    else reasons.push(...evaluateLaunch(product, now).reasons);
  }
  return { allowed: reasons.length === 0, reasons };
}
