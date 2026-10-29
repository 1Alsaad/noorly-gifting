import { createHash } from "node:crypto";
import { requestGraphql } from "./http.js";
import { SHOPIFY_API_VERSION, type ShopifyConfig } from "./shopify.js";
import { SHOPIFY_CATALOG_OPERATIONS as operations } from "./shopify-catalog-operations.js";
import {
  actionKeyValid,
  isRecord,
  isString,
  nonempty,
  readiness,
  unavailable,
  type AdapterOptions,
  type ExternalResult,
} from "./types.js";
export { SHOPIFY_CATALOG_OPERATIONS } from "./shopify-catalog-operations.js";

export type ShopifyProductMedia = {
  id: string;
  mediaContentType: string;
  status: string;
  imageUrl: string | null;
};

export const SHOPIFY_CATALOG_REFERENCES = [
  "https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/productCreate",
  "https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/productVariantsBulkUpdate",
  "https://shopify.dev/docs/apps/build/sales-channels/product-publishing",
  "https://shopify.dev/docs/api/admin-graphql/2026-07/objects/InventoryLevel",
  "https://shopify.dev/docs/api/admin-graphql/2026-07/objects/Order",
];
export type CatalogProduct = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  status: string;
  updatedAt: string;
  tags: string[];
  variants: {
    id: string;
    price: string;
    inventoryItemId: string;
    sku: string | null;
    inventoryTracked: boolean;
  }[];
};
export type DraftProductInput = {
  actionKey: string;
  handle: string;
  title: string;
  descriptionHtml: string;
};
export type MoneyAmount = { amount: string; currency: string };
export type OrderAccounting = {
  id: string;
  name: string;
  test: boolean;
  updatedAt: string;
  financialStatus: string;
  totalReceived: MoneyAmount;
  totalRefunded: MoneyAmount;
  transactions: {
    id: string;
    kind: string;
    status: string;
    test: boolean;
    processedAt: string | null;
    amount: MoneyAmount;
  }[];
  refunds: { id: string; createdAt: string | null; amount: MoneyAmount }[];
  lineItems: {
    id: string;
    productId: string | null;
    variantId: string | null;
    quantity: number;
    discountedTotal: MoneyAmount;
  }[];
};
const gid = (kind: string, value: unknown): value is string =>
  typeof value === "string" &&
  new RegExp(`^gid://shopify/${kind}/\\d+$`).test(value);
const priceValid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d+(?:\.\d{1,2})?$/.test(value) &&
  Number.isFinite(Number(value));
const money = (value: unknown): MoneyAmount | null =>
  isRecord(value) &&
  isRecord(value.shopMoney) &&
  priceValid(value.shopMoney.amount) &&
  nonempty(value.shopMoney.currencyCode)
    ? { amount: value.shopMoney.amount, currency: value.shopMoney.currencyCode }
    : null;
const safeCopy = (text: string) =>
  text.length <= 50_000 &&
  !/<\s*(script|iframe|object)|\bon[a-z]+\s*=|javascript\s*:/i.test(text);
const marker = (actionKey: string) =>
  `noorly-op-${createHash("sha256").update(actionKey).digest("hex").slice(0, 24)}`;
function parseProduct(row: unknown): CatalogProduct | null {
  if (
    !isRecord(row) ||
    !gid("Product", row.id) ||
    !nonempty(row.handle) ||
    !isString(row.title) ||
    !isString(row.descriptionHtml) ||
    !nonempty(row.status) ||
    !nonempty(row.updatedAt) ||
    !Array.isArray(row.tags) ||
    !row.tags.every(isString) ||
    !isRecord(row.variants) ||
    !Array.isArray(row.variants.nodes) ||
    !isRecord(row.variants.pageInfo) ||
    row.variants.pageInfo.hasNextPage !== false
  )
    return null;
  const variants: CatalogProduct["variants"] = [];
  for (const variant of row.variants.nodes) {
    if (
      !isRecord(variant) ||
      !gid("ProductVariant", variant.id) ||
      !priceValid(variant.price) ||
      !isRecord(variant.inventoryItem) ||
      !gid("InventoryItem", variant.inventoryItem.id) ||
      !(
        variant.inventoryItem.sku === null ||
        isString(variant.inventoryItem.sku)
      ) ||
      typeof variant.inventoryItem.tracked !== "boolean"
    )
      return null;
    variants.push({
      id: variant.id,
      price: variant.price,
      inventoryItemId: variant.inventoryItem.id,
      sku: variant.inventoryItem.sku,
      inventoryTracked: variant.inventoryItem.tracked,
    });
  }
  if (new Set(variants.map((v) => v.id)).size !== variants.length) return null;
  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    descriptionHtml: row.descriptionHtml,
    status: row.status,
    updatedAt: row.updatedAt,
    tags: row.tags,
    variants,
  };
}

/** No deletes, inventory writes, supplier fulfillment, refunds, or payments. The executor owns release signatures and eligibility. */
export function createShopifyCatalogAdapter(
  config: ShopifyConfig,
  options: AdapterOptions = {},
) {
  const ready = () =>
    readiness(
      {
        SHOPIFY_STORE_DOMAIN: /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(
          config.shopDomain ?? "",
        ),
        SHOPIFY_ADMIN_ACCESS_TOKEN: config.adminAccessToken,
        SHOPIFY_ADMIN_API_VERSION:
          (config.apiVersion ?? SHOPIFY_API_VERSION) === SHOPIFY_API_VERSION,
      },
      [
        "Caller must serialize catalog changes and verify a signed release, supplier integration, and evidence before activation.",
        "Stock reads reflect Shopify location inventory; supplier freshness and fulfillment mapping must be verified separately.",
        "Catalog writes are limited to products with at most 100 variants; larger catalogs fail closed.",
        "Orders older than 60 days require approved read_all_orders access. Payment fees and supplier costs are not inferred.",
      ],
    );
  const gql = (
    query: string,
    variables: Record<string, unknown>,
    write = false,
  ) =>
    requestGraphql(
      `https://${config.shopDomain}/admin/api/${config.apiVersion ?? SHOPIFY_API_VERSION}/graphql.json`,
      { "X-Shopify-Access-Token": config.adminAccessToken ?? "" },
      query,
      variables,
      options,
      write,
    );
  async function readProduct(
    identifier: { id: string } | { handle: string },
  ): Promise<ExternalResult<CatalogProduct | null>> {
    if (!ready().ready) return unavailable(ready());
    if (
      "id" in identifier
        ? !gid("Product", identifier.id)
        : !/^[a-z0-9][a-z0-9-]{0,199}$/.test(identifier.handle)
    )
      return { status: "rejected", reason: "Invalid product identifier" };
    const result = await gql(operations.product, { identifier });
    if (result.status !== "succeeded")
      return { status: result.status, reason: result.reason };
    if (result.data?.productByIdentifier === null)
      return { status: "succeeded", data: null };
    const product = parseProduct(result.data?.productByIdentifier);
    if (
      !product ||
      ("id" in identifier
        ? product.id !== identifier.id
        : product.handle !== identifier.handle)
    )
      return {
        status: "unknown",
        reason: "Invalid, mismatched, or truncated catalog product",
      };
    return { status: "succeeded", externalId: product.id, data: product };
  }
  async function readPublication(
    productId: string,
    publicationId: string,
  ): Promise<
    ExternalResult<{ productId: string; status: string; published: boolean }>
  > {
    if (!ready().ready) return unavailable(ready());
    if (!gid("Product", productId) || !gid("Publication", publicationId))
      return {
        status: "rejected",
        reason: "Invalid product or publication ID",
      };
    const result = await gql(operations.publication, {
      id: productId,
      publicationId,
    });
    if (result.status !== "succeeded")
      return { status: result.status, reason: result.reason };
    const row = result.data?.product;
    if (
      !isRecord(row) ||
      row.id !== productId ||
      !nonempty(row.status) ||
      typeof row.publishedOnPublication !== "boolean"
    )
      return { status: "unknown", reason: "Invalid publication state" };
    return {
      status: "succeeded",
      externalId: productId,
      data: {
        productId,
        status: row.status,
        published: row.publishedOnPublication,
      },
    };
  }
  function mutationRejected(
    result: ExternalResult<Record<string, unknown>>,
    field: string,
  ): ExternalResult<never> | null {
    if (result.status === "rejected")
      return { status: "rejected", reason: result.reason };
    const payload = result.data?.[field];
    return isRecord(payload) &&
      Array.isArray(payload.userErrors) &&
      payload.userErrors.length > 0
      ? { status: "rejected", reason: `Shopify rejected ${field}` }
      : null;
  }
  return {
    readiness: ready,
    readProduct,
    readPublication,
    async readMedia(
      productId: string,
    ): Promise<ExternalResult<ShopifyProductMedia[]>> {
      if (!ready().ready) return unavailable(ready());
      if (!gid("Product", productId))
        return { status: "rejected", reason: "Invalid product ID" };
      let after: string | undefined;
      let snapshotAt: string | undefined;
      const cursors = new Set<string>();
      const media = new Map<string, ShopifyProductMedia>();
      for (let page = 0; page < 10; page++) {
        const result = await gql(operations.media, { id: productId, after });
        if (result.status !== "succeeded")
          return { status: result.status, reason: result.reason };
        const product = result.data?.product;
        if (
          !isRecord(product) ||
          product.id !== productId ||
          !nonempty(product.updatedAt) ||
          !isRecord(product.media) ||
          !Array.isArray(product.media.nodes) ||
          !isRecord(product.media.pageInfo) ||
          typeof product.media.pageInfo.hasNextPage !== "boolean"
        )
          return {
            status: "unknown",
            reason: "Invalid Shopify product media connection",
          };
        if (snapshotAt && product.updatedAt !== snapshotAt)
          return {
            status: "unknown",
            reason: "Product changed while media pages were being read",
          };
        snapshotAt = product.updatedAt;
        for (const row of product.media.nodes) {
          if (
            !isRecord(row) ||
            !nonempty(row.id) ||
            !nonempty(row.mediaContentType) ||
            !nonempty(row.status)
          )
            return { status: "unknown", reason: "Invalid Shopify media row" };
          let imageUrl: string | null = null;
          if (row.mediaContentType === "IMAGE") {
            if (
              row.image !== null &&
              (!isRecord(row.image) || !nonempty(row.image.url))
            )
              return { status: "unknown", reason: "Invalid Shopify image URL" };
            imageUrl = isRecord(row.image) ? (row.image.url as string) : null;
          }
          const parsed = {
            id: row.id,
            mediaContentType: row.mediaContentType,
            status: row.status,
            imageUrl,
          };
          const prior = media.get(row.id);
          if (prior && JSON.stringify(prior) !== JSON.stringify(parsed))
            return {
              status: "unknown",
              reason: "Conflicting duplicate Shopify media IDs",
            };
          media.set(row.id, parsed);
        }
        if (!product.media.pageInfo.hasNextPage)
          return {
            status: "succeeded",
            externalId: productId,
            data: [...media.values()],
          };
        const cursor = product.media.pageInfo.endCursor;
        if (!nonempty(cursor) || cursors.has(cursor))
          return {
            status: "unknown",
            reason: "Shopify media cursor did not advance",
          };
        cursors.add(cursor);
        after = cursor;
      }
      return {
        status: "unknown",
        reason:
          "Shopify media collection exceeds the bounded page limit; no partial result returned",
      };
    },
    async createDraft(
      input: DraftProductInput,
    ): Promise<ExternalResult<CatalogProduct>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !actionKeyValid(input.actionKey) ||
        !/^[a-z0-9][a-z0-9-]{0,199}$/.test(input.handle) ||
        !nonempty(input.title) ||
        input.title.length > 255 ||
        !safeCopy(input.descriptionHtml)
      )
        return { status: "rejected", reason: "Invalid draft product input" };
      const matches = (p: CatalogProduct) =>
        p.handle === input.handle &&
        p.title === input.title &&
        p.descriptionHtml === input.descriptionHtml &&
        p.status === "DRAFT" &&
        p.tags.includes(marker(input.actionKey));
      const before = await readProduct({ handle: input.handle });
      if (before.status !== "succeeded")
        return { status: before.status, reason: before.reason };
      if (before.data)
        return matches(before.data)
          ? {
              status: "succeeded",
              externalId: before.data.id,
              data: before.data,
            }
          : {
              status: "rejected",
              reason:
                "Product handle already belongs to another product or release state",
            };
      const result = await gql(
        operations.createDraft,
        {
          product: {
            handle: input.handle,
            title: input.title,
            descriptionHtml: input.descriptionHtml,
            status: "DRAFT",
            tags: [marker(input.actionKey)],
          },
        },
        true,
      );
      const rejected = mutationRejected(result, "productCreate");
      if (rejected) return rejected;
      // Even a valid write response is read back: handle, draft status, and action ownership must all agree.
      const confirmed = await readProduct({ handle: input.handle });
      if (
        confirmed.status === "succeeded" &&
        confirmed.data &&
        matches(confirmed.data)
      )
        return {
          status: "succeeded",
          externalId: confirmed.data.id,
          data: confirmed.data,
        };
      return {
        status: "unknown",
        reason:
          "Draft creation unconfirmed; retain action and reconcile by handle before retrying",
      };
    },
    async updatePrices(input: {
      actionKey: string;
      productId: string;
      expectedUpdatedAt: string;
      variants: { id: string; expectedPrice: string; price: string }[];
    }): Promise<ExternalResult<CatalogProduct>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !actionKeyValid(input.actionKey) ||
        !gid("Product", input.productId) ||
        !nonempty(input.expectedUpdatedAt) ||
        input.variants.length < 1 ||
        input.variants.length > 100 ||
        new Set(input.variants.map((v) => v.id)).size !==
          input.variants.length ||
        input.variants.some(
          (v) =>
            !gid("ProductVariant", v.id) ||
            !priceValid(v.expectedPrice) ||
            !priceValid(v.price) ||
            Number(v.price) <= 0,
        )
      )
        return { status: "rejected", reason: "Invalid price update" };
      const before = await readProduct({ id: input.productId });
      if (before.status !== "succeeded")
        return { status: before.status, reason: before.reason };
      if (!before.data)
        return { status: "rejected", reason: "Product not found" };
      const matches = (p: CatalogProduct) =>
        input.variants.every((v) =>
          p.variants.some(
            (actual) =>
              actual.id === v.id && Number(actual.price) === Number(v.price),
          ),
        );
      if (matches(before.data))
        return {
          status: "succeeded",
          externalId: before.data.id,
          data: before.data,
        };
      if (
        before.data.updatedAt !== input.expectedUpdatedAt ||
        input.variants.some(
          (v) =>
            !before.data!.variants.some(
              (actual) =>
                actual.id === v.id &&
                Number(actual.price) === Number(v.expectedPrice),
            ),
        )
      )
        return {
          status: "rejected",
          reason:
            "Product or variant price changed since the approved snapshot",
        };
      const result = await gql(
        operations.updatePrices,
        {
          productId: input.productId,
          variants: input.variants.map((v) => ({ id: v.id, price: v.price })),
        },
        true,
      );
      const rejected = mutationRejected(result, "productVariantsBulkUpdate");
      if (rejected) return rejected;
      const confirmed = await readProduct({ id: input.productId });
      if (
        confirmed.status === "succeeded" &&
        confirmed.data &&
        matches(confirmed.data)
      )
        return {
          status: "succeeded",
          externalId: confirmed.data.id,
          data: confirmed.data,
        };
      return {
        status: "unknown",
        reason: "Price update unconfirmed; reconcile before retrying",
      };
    },
    async setStatus(input: {
      actionKey: string;
      productId: string;
      expectedUpdatedAt: string;
      status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    }): Promise<ExternalResult<CatalogProduct>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !actionKeyValid(input.actionKey) ||
        !gid("Product", input.productId) ||
        !nonempty(input.expectedUpdatedAt) ||
        !["DRAFT", "ACTIVE", "ARCHIVED"].includes(input.status)
      )
        return { status: "rejected", reason: "Invalid product status update" };
      const before = await readProduct({ id: input.productId });
      if (before.status !== "succeeded")
        return { status: before.status, reason: before.reason };
      if (!before.data)
        return { status: "rejected", reason: "Product not found" };
      if (before.data.status === input.status)
        return {
          status: "succeeded",
          externalId: before.data.id,
          data: before.data,
        };
      if (before.data.updatedAt !== input.expectedUpdatedAt)
        return {
          status: "rejected",
          reason: "Product changed since the approved status snapshot",
        };
      const result = await gql(
        operations.status,
        { product: { id: input.productId, status: input.status } },
        true,
      );
      const rejected = mutationRejected(result, "productUpdate");
      if (rejected) return rejected;
      const confirmed = await readProduct({ id: input.productId });
      if (
        confirmed.status === "succeeded" &&
        confirmed.data?.status === input.status
      )
        return {
          status: "succeeded",
          externalId: confirmed.data.id,
          data: confirmed.data,
        };
      return {
        status: "unknown",
        reason:
          "Product status update unconfirmed; no delete or replacement was attempted",
      };
    },
    async publish(input: {
      actionKey: string;
      productId: string;
      publicationId: string;
    }): Promise<
      ExternalResult<{ productId: string; status: string; published: boolean }>
    > {
      if (!ready().ready) return unavailable(ready());
      if (!actionKeyValid(input.actionKey))
        return { status: "rejected", reason: "Invalid action key" };
      const before = await readPublication(
        input.productId,
        input.publicationId,
      );
      if (before.status !== "succeeded") return before;
      if (before.data!.status !== "ACTIVE")
        return {
          status: "rejected",
          reason: "Only an explicitly activated product can be published",
        };
      if (before.data!.published) return before;
      const result = await gql(
        operations.publish,
        {
          id: input.productId,
          input: [{ publicationId: input.publicationId }],
        },
        true,
      );
      const rejected = mutationRejected(result, "publishablePublish");
      if (rejected) return rejected;
      const confirmed = await readPublication(
        input.productId,
        input.publicationId,
      );
      if (
        confirmed.status === "succeeded" &&
        confirmed.data!.status === "ACTIVE" &&
        confirmed.data!.published
      )
        return confirmed;
      return {
        status: "unknown",
        reason: "Product publication unconfirmed; reconcile before retrying",
      };
    },
    async readStock(input: {
      inventoryItemId: string;
      locationId: string;
    }): Promise<
      ExternalResult<{
        inventoryItemId: string;
        locationId: string;
        sku: string | null;
        tracked: boolean;
        available: number;
        updatedAt: string;
        observedAt: string;
      }>
    > {
      if (!ready().ready) return unavailable(ready());
      if (
        !gid("InventoryItem", input.inventoryItemId) ||
        !gid("Location", input.locationId)
      )
        return {
          status: "rejected",
          reason: "Invalid inventory item or location ID",
        };
      const result = await gql(operations.inventory, {
        id: input.inventoryItemId,
        locationId: input.locationId,
      });
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      const row = result.data?.inventoryItem;
      if (
        !isRecord(row) ||
        row.id !== input.inventoryItemId ||
        !(row.sku === null || isString(row.sku)) ||
        typeof row.tracked !== "boolean" ||
        !isRecord(row.inventoryLevel) ||
        !isRecord(row.inventoryLevel.location) ||
        row.inventoryLevel.location.id !== input.locationId ||
        !nonempty(row.inventoryLevel.updatedAt) ||
        !Array.isArray(row.inventoryLevel.quantities)
      )
        return {
          status: "unknown",
          reason: "Inventory level missing or mismatched; stock is unverified",
        };
      const available = row.inventoryLevel.quantities.filter(
        (q) => isRecord(q) && q.name === "available",
      );
      if (
        available.length !== 1 ||
        !isRecord(available[0]) ||
        !Number.isSafeInteger(available[0].quantity)
      )
        return {
          status: "unknown",
          reason: "Authoritative available quantity is missing",
        };
      return {
        status: "succeeded",
        data: {
          inventoryItemId: input.inventoryItemId,
          locationId: input.locationId,
          sku: row.sku,
          tracked: row.tracked,
          available: Number(available[0].quantity),
          updatedAt: row.inventoryLevel.updatedAt,
          observedAt: new Date((options.now ?? Date.now)()).toISOString(),
        },
      };
    },
    async readOrderAccounting(
      id: string,
    ): Promise<ExternalResult<OrderAccounting>> {
      if (!ready().ready) return unavailable(ready());
      if (!gid("Order", id))
        return { status: "rejected", reason: "Invalid order ID" };
      const result = await gql(operations.accounting, { id });
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      const row = result.data?.order;
      if (
        !isRecord(row) ||
        row.id !== id ||
        !nonempty(row.name) ||
        typeof row.test !== "boolean" ||
        !nonempty(row.updatedAt) ||
        !nonempty(row.displayFinancialStatus) ||
        !Array.isArray(row.transactions) ||
        !Array.isArray(row.refunds) ||
        !isRecord(row.lineItems) ||
        !Array.isArray(row.lineItems.nodes) ||
        !isRecord(row.lineItems.pageInfo) ||
        row.lineItems.pageInfo.hasNextPage !== false
      )
        return {
          status: "unknown",
          reason: "Order accounting is invalid or truncated",
        };
      const totalReceived = money(row.totalReceivedSet),
        totalRefunded = money(row.totalRefundedSet);
      if (!totalReceived || !totalRefunded)
        return { status: "unknown", reason: "Invalid order money totals" };
      const transactions: OrderAccounting["transactions"] = [],
        refunds: OrderAccounting["refunds"] = [],
        lineItems: OrderAccounting["lineItems"] = [];
      for (const transaction of row.transactions) {
        const amount = isRecord(transaction)
          ? money(transaction.amountSet)
          : null;
        if (
          !isRecord(transaction) ||
          !gid("OrderTransaction", transaction.id) ||
          !nonempty(transaction.kind) ||
          !nonempty(transaction.status) ||
          typeof transaction.test !== "boolean" ||
          !(
            transaction.processedAt === null ||
            isString(transaction.processedAt)
          ) ||
          !amount
        )
          return {
            status: "unknown",
            reason: "Invalid payment transaction; no paid sales inferred",
          };
        transactions.push({
          id: transaction.id,
          kind: transaction.kind,
          status: transaction.status,
          test: transaction.test,
          processedAt: transaction.processedAt,
          amount,
        });
      }
      for (const refund of row.refunds) {
        const amount = isRecord(refund) ? money(refund.totalRefundedSet) : null;
        if (
          !isRecord(refund) ||
          !gid("Refund", refund.id) ||
          !(refund.createdAt === null || isString(refund.createdAt)) ||
          !amount
        )
          return { status: "unknown", reason: "Invalid refund accounting" };
        refunds.push({ id: refund.id, createdAt: refund.createdAt, amount });
      }
      for (const line of row.lineItems.nodes) {
        const amount = isRecord(line) ? money(line.discountedTotalSet) : null;
        if (
          !isRecord(line) ||
          !gid("LineItem", line.id) ||
          !Number.isSafeInteger(line.quantity) ||
          Number(line.quantity) < 0 ||
          !(
            line.product === null ||
            (isRecord(line.product) && gid("Product", line.product.id))
          ) ||
          !(
            line.variant === null ||
            (isRecord(line.variant) && gid("ProductVariant", line.variant.id))
          ) ||
          !amount
        )
          return { status: "unknown", reason: "Invalid order line accounting" };
        lineItems.push({
          id: line.id,
          quantity: Number(line.quantity),
          productId: isRecord(line.product)
            ? (line.product.id as string)
            : null,
          variantId: isRecord(line.variant)
            ? (line.variant.id as string)
            : null,
          discountedTotal: amount,
        });
      }
      if (
        [transactions, refunds, lineItems].some(
          (rows) => new Set(rows.map((r) => r.id)).size !== rows.length,
        )
      )
        return {
          status: "unknown",
          reason: "Duplicate accounting identifiers could double-count money",
        };
      return {
        status: "succeeded",
        externalId: id,
        data: {
          id,
          name: row.name,
          test: row.test,
          updatedAt: row.updatedAt,
          financialStatus: row.displayFinancialStatus,
          totalReceived,
          totalRefunded,
          transactions,
          refunds,
          lineItems,
        },
      };
    },
  };
}
