import type { OpsStore, PaidOrderObligation } from "./core/types.js";
import type { RecordStore } from "./records.js";
import { fingerprint, runEffect } from "./effects.js";
import type { ExternalResult } from "./adapters/types.js";
import type { ReconciledOrder } from "./order-reconciliation.js";

export type SupplierQuote = {
  id: string;
  sourceRef: string;
  requestFingerprint: string;
  currency: "SEK";
  amountOre: number;
  shippingCountry: "SE";
  expiresAt: string;
};
export type SupplierSubmission = {
  id: string;
  orderId: string;
  actionKey: string;
  requestFingerprint: string;
  state: "accepted" | "paid" | "fulfilled";
  chargedOre?: number;
  receiptId?: string;
  sourceRef: string;
};
export type SupplierTracking = {
  externalId: string;
  state: "accepted" | "shipped" | "delivered" | "cancelled";
  observedAt: string;
  sourceRef: string;
  tracking: { company: string; number: string; url?: string }[];
};
/** An authenticated, verified integration implements this contract. There is intentionally no AW implementation. */
export interface SupplierFulfillmentPort {
  readiness(): {
    provider: string;
    mode: "native-shopify" | "manual-api";
    orderSubmission: "verified" | "unavailable";
    reason?: string;
  };
  quote(input: {
    orderId: string;
    lines: NonNullable<PaidOrderObligation["lines"]>;
    requestFingerprint: string;
  }): Promise<ExternalResult<SupplierQuote>>;
  submit(input: {
    actionKey: string;
    orderId: string;
    lines: NonNullable<PaidOrderObligation["lines"]>;
    quote: SupplierQuote;
    maximumChargeOre: number;
  }): Promise<ExternalResult<SupplierSubmission>>;
  reconcile(input: {
    actionKey: string;
    orderId: string;
    requestFingerprint: string;
  }): Promise<ExternalResult<SupplierSubmission | null>>;
  readTracking(externalId: string): Promise<ExternalResult<SupplierTracking>>;
}
type FulfillmentPlan = {
  orderId: string;
  actionKey: string;
  lines: NonNullable<PaidOrderObligation["lines"]>;
  requestFingerprint: string;
  quote: SupplierQuote;
  reservationId: string;
  createdAt: string;
};
export type FulfillmentCoordinatorDependencies = {
  store: OpsStore;
  records: RecordStore;
  supplier: SupplierFulfillmentPort;
  reconcileOrder: (id: string) => Promise<ExternalResult<ReconciledOrder>>;
  now: () => Date;
  isDemo: () => boolean;
};
const unknown = (reason: string): ExternalResult<never> => ({
  status: "unknown",
  reason,
});
const exactSubmission = (
  value: SupplierSubmission | null | undefined,
  plan: FulfillmentPlan,
): value is SupplierSubmission =>
  Boolean(
    value &&
    value.id &&
    value.orderId === plan.orderId &&
    value.actionKey === plan.actionKey &&
    value.requestFingerprint === plan.requestFingerprint &&
    value.sourceRef &&
    ["accepted", "paid", "fulfilled"].includes(value.state),
  );

export function createFulfillmentCoordinator(
  deps: FulfillmentCoordinatorDependencies,
) {
  const { store, records, supplier, reconcileOrder, now, isDemo } = deps;
  async function fulfill(
    orderId: string,
  ): Promise<ExternalResult<SupplierSubmission>> {
    if (isDemo())
      return {
        status: "rejected",
        reason: "Demo never submits supplier orders",
      };
    const capability = supplier.readiness();
    if (capability.mode === "native-shopify")
      return {
        status: "rejected",
        reason:
          "Native Shopify integration owns this order; a second manual supplier submission is forbidden",
      };
    if (capability.orderSubmission !== "verified")
      return {
        status: "rejected",
        reason:
          capability.reason ??
          "Authenticated supplier order submission is not verified",
      };
    const locked = await records.withLock(
      `fulfillment:${orderId}`,
      async (): Promise<ExternalResult<SupplierSubmission>> => {
        const imported = await reconcileOrder(orderId);
        if (
          imported.status !== "succeeded" ||
          imported.data?.state !== "eligible"
        )
          return {
            status: "rejected",
            reason:
              "Current complete paid order and supplier mapping are required",
          };
        const obligation = (await store.snapshot()).obligations[orderId];
        if (
          !obligation?.lines?.length ||
          obligation.holdReason ||
          obligation.cancelledAt ||
          obligation.fulfilledAt
        )
          return {
            status: "rejected",
            reason:
              "Order obligation is not eligible for a whole-order purchase",
          };
        const decision = await store.authorizeAction("fulfill_order", {
          orderId,
          productId: obligation.productId,
        });
        if (!decision.allowed)
          return { status: "rejected", reason: decision.reasons.join(" ") };
        const requestFingerprint = fingerprint({
          orderId,
          lines: obligation.lines,
        });
        let plan = await records.get<FulfillmentPlan>(
          "fulfillment-plan",
          orderId,
        );
        if (plan && plan.requestFingerprint !== requestFingerprint)
          return unknown(
            "Order lines changed after a purchase plan was recorded; reconcile before creating another purchase",
          );
        if (!plan) {
          const quoted = await supplier.quote({
            orderId,
            lines: obligation.lines,
            requestFingerprint,
          });
          if (quoted.status !== "succeeded" || !quoted.data)
            return {
              status: quoted.status,
              reason: quoted.reason ?? "Supplier quote unavailable",
            };
          const quote = quoted.data;
          if (
            !quote.id ||
            !quote.sourceRef ||
            quote.requestFingerprint !== requestFingerprint ||
            quote.currency !== "SEK" ||
            quote.shippingCountry !== "SE" ||
            !Number.isSafeInteger(quote.amountOre) ||
            quote.amountOre <= 0 ||
            !Number.isFinite(Date.parse(quote.expiresAt)) ||
            Date.parse(quote.expiresAt) <= now().getTime()
          )
            return {
              status: "rejected",
              reason:
                "Exact current supplier quote including Sweden shipping is required",
            };
          const actionKey = `supplier-order:${orderId}`;
          let reservation;
          try {
            reservation = await store.reserveSpend({
              idempotencyKey: actionKey,
              category: "supplier",
              amountOre: quote.amountOre,
              purpose: "Fulfill verified paid Shopify order",
              productId: obligation.productId,
              orderId,
            });
          } catch {
            return {
              status: "rejected",
              reason:
                "Supplier budget or eligibility did not authorize the purchase",
            };
          }
          if (reservation.status === "released")
            return {
              status: "rejected",
              reason:
                "Previously released purchase requires a separately reviewed replacement action",
            };
          plan = {
            orderId,
            actionKey,
            lines: obligation.lines,
            requestFingerprint,
            quote,
            reservationId: reservation.id,
            createdAt: now().toISOString(),
          };
          await records.put("fulfillment-plan", orderId, plan);
        }
        const frozen = plan;
        let result = await runEffect(
          records,
          frozen.actionKey,
          "supplier_submit",
          {
            orderId,
            lines: frozen.lines,
            quoteId: frozen.quote.id,
            maximumChargeOre: frozen.quote.amountOre,
          },
          async () => {
            // Re-read immediately before dispatch; a refunded or edited order must not use an old reservation.
            const latest = await reconcileOrder(orderId);
            const current = (await store.snapshot()).obligations[orderId];
            if (
              latest.status !== "succeeded" ||
              latest.data?.state !== "eligible" ||
              !current?.lines ||
              fingerprint({ orderId, lines: current.lines }) !==
                frozen.requestFingerprint
            )
              return {
                status: "rejected",
                reason:
                  "Order changed or became ineligible before submission; reservation retained for review",
              };
            if (Date.parse(frozen.quote.expiresAt) <= now().getTime())
              return {
                status: "rejected",
                reason:
                  "Supplier quote expired before submission; reservation retained for review",
              };
            const allowed = await store.authorizeAction("fulfill_order", {
              orderId,
              productId: current.productId,
            });
            if (!allowed.allowed)
              return { status: "rejected", reason: allowed.reasons.join(" ") };
            const submitted = await supplier.submit({
              actionKey: frozen.actionKey,
              orderId,
              lines: frozen.lines,
              quote: frozen.quote,
              maximumChargeOre: frozen.quote.amountOre,
            });
            return submitted.status === "succeeded" &&
              !exactSubmission(submitted.data, frozen)
              ? unknown(
                  "Supplier response did not confirm the exact order and line fingerprint",
                )
              : submitted;
          },
          async () => {
            const read = await supplier.reconcile({
              actionKey: frozen.actionKey,
              orderId,
              requestFingerprint: frozen.requestFingerprint,
            });
            return read.status === "succeeded" &&
              exactSubmission(read.data, frozen)
              ? {
                  status: "succeeded",
                  externalId: read.data.id,
                  data: read.data,
                }
              : unknown(
                  "Supplier submission remains unconfirmed; absence is not proof of no purchase",
                );
          },
        );
        if (result.status !== "succeeded" || !result.data) {
          await records.put("fulfillment-hold", orderId, {
            reason: result.reason ?? "Unknown supplier outcome",
            reservationId: frozen.reservationId,
            at: now().toISOString(),
          });
          return result;
        }
        if (result.data.state === "accepted") {
          const refreshed = await supplier.reconcile({
            actionKey: frozen.actionKey,
            orderId,
            requestFingerprint: frozen.requestFingerprint,
          });
          if (
            refreshed.status === "succeeded" &&
            exactSubmission(refreshed.data, frozen)
          )
            result = {
              status: "succeeded",
              externalId: refreshed.data.id,
              data: refreshed.data,
            };
        }
        const submitted = result.data!;
        if (submitted.state === "paid" || submitted.state === "fulfilled") {
          if (
            !Number.isSafeInteger(submitted.chargedOre) ||
            submitted.chargedOre! < 0 ||
            submitted.chargedOre! > frozen.quote.amountOre ||
            !submitted.receiptId
          )
            return unknown(
              "Supplier payment receipt is missing or exceeds the reserved amount; capacity remains held",
            );
          await store.settleSpend(frozen.reservationId, {
            actualOre: submitted.chargedOre!,
            receiptId: submitted.receiptId,
          });
        }
        await records.put("supplier-order", orderId, {
          ...submitted,
          reservationId: frozen.reservationId,
          observedAt: now().toISOString(),
        });
        await store.appendAudit(
          "supplier.order.confirmed",
          {
            orderId,
            externalId: submitted.id,
            state: submitted.state,
            sourceRef: submitted.sourceRef,
          },
          "trusted_supplier_connector",
        );
        return result;
      },
    );
    return locked.locked && locked.result
      ? locked.result
      : unknown("Another fulfillment worker owns this order");
  }
  async function tracking(
    orderId: string,
  ): Promise<ExternalResult<SupplierTracking>> {
    const previous = await records.get<SupplierSubmission>(
      "supplier-order",
      orderId,
    );
    if (!previous)
      return {
        status: "rejected",
        reason: "No confirmed supplier order is recorded",
      };
    const result = await supplier.readTracking(previous.id);
    if (result.status !== "succeeded" || !result.data) return result;
    if (
      result.data.externalId !== previous.id ||
      !result.data.sourceRef ||
      !Number.isFinite(Date.parse(result.data.observedAt)) ||
      Date.parse(result.data.observedAt) > now().getTime()
    )
      return unknown("Supplier tracking does not match the confirmed order");
    await records.put("supplier-tracking", orderId, result.data);
    // Tracking is evidence, not authorization to mutate Shopify or infer bank payouts/profit.
    return result;
  }
  return { fulfill, tracking };
}

export type RefundAuthority = {
  requestId: string;
  orderId: string;
  sourceUpdatedAt: string;
  amountOre: number;
  reason: "cancelled-before-fulfillment" | "approved-return";
  sourceRefs: string[];
  supplierResolutionRef: string;
  checkedAt: string;
};
/** Read-only eligibility contract. A separate verified refund adapter and durable effect are required for any refund. */
export async function assessRefundEligibility(
  input: { orderId: string; requestId: string; amountOre: number },
  deps: Pick<
    FulfillmentCoordinatorDependencies,
    "store" | "records" | "reconcileOrder" | "now"
  >,
): Promise<
  ExternalResult<{ eligible: boolean; reason: string; maximumOre?: number }>
> {
  if (!Number.isSafeInteger(input.amountOre) || input.amountOre <= 0)
    return {
      status: "rejected",
      reason: "Positive exact refund amount is required",
    };
  const result = await deps.reconcileOrder(input.orderId);
  if (result.status !== "succeeded" || !result.data)
    return unknown("Current paid/refund accounting could not be confirmed");
  if (result.data.pendingRefundOre > 0)
    return {
      status: "rejected",
      reason:
        "A refund transaction is already pending; reconcile it before another refund",
    };
  const verified = await deps.records.get<RefundAuthority>(
      "refund-authority",
      input.requestId,
    ),
    facts = result.data;
  const age = deps.now().getTime() - Date.parse(verified?.checkedAt ?? "");
  if (
    !verified ||
    verified.requestId !== input.requestId ||
    verified.orderId !== input.orderId ||
    verified.sourceUpdatedAt !== facts.sourceUpdatedAt ||
    verified.amountOre !== input.amountOre ||
    !verified.supplierResolutionRef ||
    new Set(verified.sourceRefs).size < 2 ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > 86400000
  )
    return {
      status: "rejected",
      reason:
        "A current exact return/cancellation decision and supplier resolution are required",
    };
  const allowed = await deps.store.authorizeAction("refund", {
    orderId: input.orderId,
  });
  if (!allowed.allowed)
    return { status: "rejected", reason: allowed.reasons.join(" ") };
  const maximumOre = Math.max(
    0,
    Math.min(facts.receivedOre, facts.capturedOre) -
      Math.max(facts.refundedOre, facts.successfulRefundOre),
  );
  if (input.amountOre > maximumOre)
    return {
      status: "rejected",
      reason: "Refund exceeds confirmed captured funds remaining",
    };
  if (
    facts.holdReasons.some((reason) =>
      /Test|timestamp|currency|pending/i.test(reason),
    )
  )
    return {
      status: "rejected",
      reason: "Payment uncertainty must be resolved before a refund",
    };
  return {
    status: "succeeded",
    data: {
      eligible: true,
      reason: "Read-only policy assessment passed; no refund was sent",
      maximumOre,
    },
  };
}
