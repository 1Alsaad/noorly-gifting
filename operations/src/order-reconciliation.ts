import { getStore, getRecords } from "./database.js";
import {
  createShopifyCatalogAdapter,
  type OrderAccounting,
  type MoneyAmount,
} from "./adapters/shopify-catalog.js";
import {
  SHOPIFY_API_VERSION,
  shopifyConfigFromEnv,
  type ShopifyConfig,
} from "./adapters/shopify.js";
import { requestGraphql } from "./adapters/http.js";
import {
  isRecord,
  nonempty,
  type AdapterOptions,
  type ExternalResult,
} from "./adapters/types.js";
import type { OpsStore, PaidOrderObligation } from "./core/types.js";
import type { RecordStore } from "./records.js";
import type { SupplierBinding } from "./catalog-release.js";

export const ORDER_LIFECYCLE_QUERY = `query OpsOrderLifecycle($id: ID!) { order(id: $id) { id test updatedAt cancelledAt displayFulfillmentStatus currentTotalPriceSet { shopMoney { amount currencyCode } } shippingAddress { countryCodeV2 } lineItems(first: 100) { nodes { id currentQuantity unfulfilledQuantity requiresShipping } pageInfo { hasNextPage endCursor } } fulfillments { id status createdAt trackingInfo { company number url } } } }`;
export type OrderLifecycle = {
  id: string;
  test: boolean;
  updatedAt: string;
  cancelledAt: string | null;
  fulfillmentStatus: string;
  currentTotal: MoneyAmount;
  shippingCountry: string | null;
  lines: {
    id: string;
    currentQuantity: number;
    unfulfilledQuantity: number;
    requiresShipping: boolean;
  }[];
  fulfillments: {
    id: string;
    status: string;
    createdAt: string;
    tracking: {
      company: string | null;
      number: string | null;
      url: string | null;
    }[];
  }[];
};
export type ReconciledOrder = {
  orderId: string;
  sourceUpdatedAt: string;
  observedAt: string;
  sourceRefs: string[];
  currency: "SEK";
  receivedOre: number;
  refundedOre: number;
  capturedOre: number;
  successfulRefundOre: number;
  pendingRefundOre: number;
  state: "eligible" | "held" | "ignored";
  holdReasons: string[];
  lineCount: number;
  obligation?: PaidOrderObligation;
};
const orderIdValid = (id: string) => /^gid:\/\/shopify\/Order\/\d+$/.test(id);
const dateValid = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
/** Exact decimal conversion, with no VAT adjustments or guessed exchange rates. */
export function sekOre(value: MoneyAmount): number {
  if (value.currency !== "SEK" || !/^\d+(?:\.\d{1,2})?$/.test(value.amount))
    throw new Error("Confirmed SEK amount with at most two decimals required");
  const [whole, fraction = ""] = value.amount.split(".");
  const amount = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Amount is outside exact integer range");
  return Number(amount);
}
export function createOrderLifecycleReader(
  config: ShopifyConfig,
  options: AdapterOptions = {},
) {
  return async (id: string): Promise<ExternalResult<OrderLifecycle>> => {
    if (
      !orderIdValid(id) ||
      !config.adminAccessToken ||
      !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(config.shopDomain ?? "") ||
      (config.apiVersion ?? SHOPIFY_API_VERSION) !== SHOPIFY_API_VERSION
    )
      return {
        status: "rejected",
        reason: "Shopify lifecycle configuration or order ID is invalid",
      };
    const result = await requestGraphql(
      `https://${config.shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      { "X-Shopify-Access-Token": config.adminAccessToken },
      ORDER_LIFECYCLE_QUERY,
      { id },
      options,
    );
    if (result.status !== "succeeded")
      return { status: result.status, reason: result.reason };
    const row = result.data?.order;
    if (
      !isRecord(row) ||
      row.id !== id ||
      typeof row.test !== "boolean" ||
      !dateValid(row.updatedAt) ||
      !(row.cancelledAt === null || dateValid(row.cancelledAt)) ||
      !nonempty(row.displayFulfillmentStatus) ||
      !isRecord(row.currentTotalPriceSet) ||
      !isRecord(row.currentTotalPriceSet.shopMoney) ||
      !nonempty(row.currentTotalPriceSet.shopMoney.amount) ||
      !nonempty(row.currentTotalPriceSet.shopMoney.currencyCode) ||
      !(
        row.shippingAddress === null ||
        (isRecord(row.shippingAddress) &&
          nonempty(row.shippingAddress.countryCodeV2))
      ) ||
      !isRecord(row.lineItems) ||
      !Array.isArray(row.lineItems.nodes) ||
      !isRecord(row.lineItems.pageInfo) ||
      row.lineItems.pageInfo.hasNextPage !== false ||
      !Array.isArray(row.fulfillments)
    )
      return {
        status: "unknown",
        reason: "Lifecycle response is missing, invalid, or truncated",
      };
    const lines: OrderLifecycle["lines"] = [],
      fulfillments: OrderLifecycle["fulfillments"] = [];
    for (const line of row.lineItems.nodes) {
      if (
        !isRecord(line) ||
        !nonempty(line.id) ||
        !Number.isSafeInteger(line.currentQuantity) ||
        Number(line.currentQuantity) < 0 ||
        !Number.isSafeInteger(line.unfulfilledQuantity) ||
        Number(line.unfulfilledQuantity) < 0 ||
        typeof line.requiresShipping !== "boolean"
      )
        return { status: "unknown", reason: "Invalid order line lifecycle" };
      lines.push({
        id: line.id,
        currentQuantity: Number(line.currentQuantity),
        unfulfilledQuantity: Number(line.unfulfilledQuantity),
        requiresShipping: line.requiresShipping,
      });
    }
    for (const fulfillment of row.fulfillments) {
      if (
        !isRecord(fulfillment) ||
        !nonempty(fulfillment.id) ||
        !nonempty(fulfillment.status) ||
        !dateValid(fulfillment.createdAt) ||
        !Array.isArray(fulfillment.trackingInfo)
      )
        return { status: "unknown", reason: "Invalid fulfillment lifecycle" };
      const tracking: OrderLifecycle["fulfillments"][number]["tracking"] = [];
      for (const info of fulfillment.trackingInfo) {
        if (
          !isRecord(info) ||
          !["company", "number", "url"].every(
            (key) => info[key] === null || typeof info[key] === "string",
          )
        )
          return { status: "unknown", reason: "Invalid fulfillment tracking" };
        tracking.push({
          company: info.company as string | null,
          number: info.number as string | null,
          url: info.url as string | null,
        });
      }
      fulfillments.push({
        id: fulfillment.id,
        status: fulfillment.status,
        createdAt: fulfillment.createdAt,
        tracking,
      });
    }
    if (
      new Set(lines.map((l) => l.id)).size !== lines.length ||
      new Set(fulfillments.map((f) => f.id)).size !== fulfillments.length
    )
      return { status: "unknown", reason: "Duplicate lifecycle identifiers" };
    return {
      status: "succeeded",
      externalId: id,
      data: {
        id,
        test: row.test,
        updatedAt: row.updatedAt,
        cancelledAt: row.cancelledAt,
        fulfillmentStatus: row.displayFulfillmentStatus,
        currentTotal: {
          amount: row.currentTotalPriceSet.shopMoney.amount,
          currency: row.currentTotalPriceSet.shopMoney.currencyCode,
        },
        shippingCountry: isRecord(row.shippingAddress)
          ? (row.shippingAddress.countryCodeV2 as string)
          : null,
        lines,
        fulfillments,
      },
    };
  };
}

export type OrderReconciliationDependencies = {
  store: OpsStore;
  records: RecordStore;
  readAccounting: (id: string) => Promise<ExternalResult<OrderAccounting>>;
  readLifecycle: (id: string) => Promise<ExternalResult<OrderLifecycle>>;
  now: () => Date;
};
export function createOrderReconciler(deps: OrderReconciliationDependencies) {
  const { store, records, readAccounting, readLifecycle, now } = deps;
  async function reconcileOrder(
    id: string,
  ): Promise<ExternalResult<ReconciledOrder>> {
    if (!orderIdValid(id))
      return { status: "rejected", reason: "Exact Shopify order GID required" };
    const locked = await records.withLock(
      `order:${id}`,
      async (): Promise<ExternalResult<ReconciledOrder>> => {
        async function uncertain(
          reason: string,
        ): Promise<ExternalResult<ReconciledOrder>> {
          const prior = (await store.snapshot()).obligations[id];
          if (prior)
            await store.recordPaidOrder({
              ...prior,
              importedAt: now().toISOString(),
              holdReason: reason,
            });
          return { status: "unknown", reason };
        }
        const [accountingResult, lifecycleResult] = await Promise.all([
          readAccounting(id),
          readLifecycle(id),
        ]);
        if (
          accountingResult.status !== "succeeded" ||
          !accountingResult.data ||
          lifecycleResult.status !== "succeeded" ||
          !lifecycleResult.data
        )
          return uncertain(
            "Authoritative accounting and lifecycle must both be read before importing an obligation",
          );
        const accounting = accountingResult.data,
          lifecycle = lifecycleResult.data;
        if (
          accounting.id !== id ||
          lifecycle.id !== id ||
          !dateValid(accounting.updatedAt) ||
          accounting.updatedAt !== lifecycle.updatedAt
        )
          return uncertain(
            "Order changed between reads; retry the read-only reconciliation",
          );
        const snapshot = await store.snapshot(),
          previous = snapshot.obligations[id];
        const cached = await records.get<ReconciledOrder>(
          "order-reconciliation",
          id,
        );
        if (
          cached &&
          Date.parse(cached.sourceUpdatedAt) > Date.parse(accounting.updatedAt)
        )
          return uncertain(
            "Older provider snapshot ignored; a current read is required",
          );
        const reasons: string[] = [];
        const sourceRefs = [
          `shopify:order:${id}@${accounting.updatedAt}`,
          ...accounting.transactions.map((t) => `shopify:transaction:${t.id}`),
          ...accounting.refunds.map((r) => `shopify:refund:${r.id}`),
        ];
        if (accounting.test || lifecycle.test)
          reasons.push("Test orders must never create supplier purchases.");
        if (Date.parse(accounting.updatedAt) > now().getTime())
          reasons.push("Order timestamp is in the future.");
        if (lifecycle.cancelledAt) reasons.push("Order is cancelled.");
        if (lifecycle.shippingCountry !== "SE")
          reasons.push("Shipping destination is not verified as Sweden.");
        if (lifecycle.fulfillmentStatus !== "UNFULFILLED")
          reasons.push(
            "Order is fulfilled, partially fulfilled, or under another fulfillment process.",
          );
        if (accounting.financialStatus !== "PAID")
          reasons.push("Order is not currently fully paid.");
        let receivedOre = 0,
          refundedOre = 0,
          capturedOre = 0,
          successfulRefundOre = 0,
          pendingRefundOre = 0,
          currentTotalOre = 0;
        try {
          receivedOre = sekOre(accounting.totalReceived);
          refundedOre = sekOre(accounting.totalRefunded);
          currentTotalOre = sekOre(lifecycle.currentTotal);
          for (const transaction of accounting.transactions) {
            const amount = sekOre(transaction.amount);
            if (transaction.test) {
              reasons.push("Test payment transaction present.");
              continue;
            }
            if (
              transaction.status === "SUCCESS" &&
              ["SALE", "CAPTURE"].includes(transaction.kind)
            )
              capturedOre += amount;
            if (
              transaction.status === "SUCCESS" &&
              transaction.kind === "REFUND"
            )
              successfulRefundOre += amount;
            if (
              transaction.kind === "REFUND" &&
              transaction.status !== "FAILURE" &&
              transaction.status !== "ERROR"
            )
              reasons.push(
                "Refund activity requires exact line eligibility review.",
              );
          }
          for (const transaction of accounting.transactions)
            if (
              transaction.kind === "REFUND" &&
              !["SUCCESS", "FAILURE", "ERROR"].includes(transaction.status)
            )
              pendingRefundOre += sekOre(transaction.amount);
          if (
            [capturedOre, successfulRefundOre, pendingRefundOre].some(
              (value) => !Number.isSafeInteger(value),
            )
          )
            throw new Error("Overflow");
        } catch {
          return uncertain(
            "Confirmed SEK money amounts are required; no allocation or exchange rate was guessed",
          );
        }
        if (
          refundedOre > 0 ||
          successfulRefundOre > 0 ||
          accounting.refunds.length
        )
          reasons.push(
            "Refunded order is held until remaining line quantities are independently verified.",
          );
        if (
          currentTotalOre <= 0 ||
          receivedOre < currentTotalOre ||
          capturedOre < currentTotalOre
        )
          reasons.push(
            "Successful captured payments do not cover the current order total.",
          );
        const paidTransactions = accounting.transactions.filter(
          (t) =>
            t.status === "SUCCESS" &&
            !t.test &&
            ["SALE", "CAPTURE"].includes(t.kind) &&
            dateValid(t.processedAt) &&
            Date.parse(t.processedAt) <= now().getTime(),
        );
        const paidAt =
          paidTransactions
            .map((t) => t.processedAt!)
            .sort()
            .at(-1) ?? previous?.paidAt;
        if (!paidAt) reasons.push("Confirmed payment timestamp missing.");
        if (
          new Set(accounting.lineItems.map((l) => l.id)).size !==
            accounting.lineItems.length ||
          accounting.lineItems.length !== lifecycle.lines.length
        )
          reasons.push(
            "Accounting and lifecycle lines are incomplete or duplicated.",
          );
        const lines: NonNullable<PaidOrderObligation["lines"]> = [];
        for (const line of accounting.lineItems) {
          const life = lifecycle.lines.find((l) => l.id === line.id);
          if (!life) {
            reasons.push("An accounting line has no lifecycle match.");
            continue;
          }
          if (!life.requiresShipping) continue;
          if (life.currentQuantity === 0) continue;
          if (life.unfulfilledQuantity !== life.currentQuantity)
            reasons.push(
              "Partially fulfilled line cannot be submitted as a new whole-order shipment.",
            );
          const binding = line.productId
            ? await records.get<SupplierBinding>(
                "supplier-binding",
                line.productId,
              )
            : undefined;
          const mapping =
            binding?.variants.filter((v) => v.variantId === line.variantId) ??
            [];
          if (
            !line.productId ||
            !line.variantId ||
            !binding?.evidenceRef ||
            mapping.length !== 1
          )
            reasons.push(`Supplier mapping missing for order line ${line.id}.`);
          const mapped = mapping.length === 1 ? mapping[0] : undefined;
          const priorLine = previous?.lines?.find(
            (prior) => prior.lineItemId === line.id,
          );
          if (
            priorLine &&
            mapped &&
            (priorLine.supplierProductId !== mapped.supplierProductId ||
              priorLine.supplierVariantId !== mapped.supplierVariantId)
          )
            reasons.push(
              "Supplier mapping changed after the paid order was imported.",
            );
          if (binding) sourceRefs.push(binding.evidenceRef);
          lines.push({
            lineItemId: line.id,
            productId: line.productId ?? "",
            variantId: line.variantId ?? "",
            quantity: life.currentQuantity,
            supplierProductId: mapped?.supplierProductId ?? "",
            supplierVariantId: mapped?.supplierVariantId ?? "",
          });
        }
        if (!lines.length)
          reasons.push("No complete physical order lines are eligible.");
        if (previous?.fulfilledAt)
          reasons.push("Previously fulfilled obligation remains closed.");
        if (previous?.cancelledAt)
          reasons.push("Previously cancelled obligation remains closed.");
        const result: ReconciledOrder = {
          orderId: id,
          sourceUpdatedAt: accounting.updatedAt,
          observedAt: now().toISOString(),
          sourceRefs: [...new Set(sourceRefs)],
          currency: "SEK",
          receivedOre,
          refundedOre,
          capturedOre,
          successfulRefundOre,
          pendingRefundOre,
          state: reasons.length ? "held" : "eligible",
          holdReasons: [...new Set(reasons)],
          lineCount: lines.length,
        };
        // Totals belong to the order once. Never duplicate the total against every line or invent refund allocation.
        if ((paidAt && !(accounting.test || lifecycle.test)) || previous) {
          const first = lines[0];
          const fulfilledAt =
            previous?.fulfilledAt ??
            (lifecycle.fulfillmentStatus === "FULFILLED"
              ? lifecycle.fulfillments
                  .filter(
                    (f) => f.status === "SUCCESS" && dateValid(f.createdAt),
                  )
                  .map((f) => f.createdAt)
                  .sort()
                  .at(-1)
              : undefined);
          const obligation: PaidOrderObligation = {
            orderId: id,
            productId: first?.productId || previous?.productId || "unmapped",
            paidAt: paidAt ?? previous!.paidAt,
            amountPaidOre: receivedOre,
            refundedOre,
            source: "shopify_paid_order",
            sourceRef: result.sourceRefs[0]!,
            supplierProductId: first?.supplierProductId ?? "",
            supplierVariantId: first?.supplierVariantId ?? "",
            importedAt: result.observedAt,
            sourceUpdatedAt: accounting.updatedAt,
            lines,
            holdReason: reasons.length
              ? result.holdReasons.join(" ")
              : undefined,
            ...(lifecycle.cancelledAt
              ? { cancelledAt: lifecycle.cancelledAt }
              : {}),
            ...(fulfilledAt ? { fulfilledAt } : {}),
          };
          await store.recordPaidOrder(obligation);
          result.obligation = obligation;
        } else result.state = "ignored";
        await records.put("order-reconciliation", id, result);
        await records.put("order-tracking", id, {
          orderId: id,
          sourceUpdatedAt: lifecycle.updatedAt,
          observedAt: result.observedAt,
          fulfillments: lifecycle.fulfillments,
        });
        await store.appendAudit(
          "order.reconciled",
          {
            orderId: id,
            state: result.state,
            lineCount: lines.length,
            sourceUpdatedAt: result.sourceUpdatedAt,
            sourceRefs: result.sourceRefs,
          },
          "trusted_shopify_connector",
        );
        if (result.state === "eligible")
          await store.enqueueJob({
            dedupKey: `fulfillment:${id}`,
            type: "fulfillment",
            payload: { orderId: id },
          });
        return { status: "succeeded", externalId: id, data: result };
      },
    );
    return locked.locked && locked.result
      ? locked.result
      : {
          status: "unknown",
          reason: "Order reconciliation is already running",
        };
  }
  return { reconcileOrder };
}
export async function orderReconciler() {
  const config = shopifyConfigFromEnv(),
    adapter = createShopifyCatalogAdapter(config);
  return createOrderReconciler({
    store: await getStore(),
    records: await getRecords(),
    readAccounting: adapter.readOrderAccounting,
    readLifecycle: createOrderLifecycleReader(config),
    now: () => new Date(),
  });
}
