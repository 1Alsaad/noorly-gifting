import { requestGraphql } from "./http.js";
import {
  actionKeyValid,
  isRecord,
  isString,
  nonempty,
  readiness,
  unavailable,
  type AdapterOptions,
  type Env,
  type ExternalResult,
} from "./types.js";

export const SHOPIFY_API_VERSION = "2026-07";
export const SHOPIFY_REFERENCES = [
  "https://shopify.dev/docs/api/admin-graphql/2026-07/queries/products",
  "https://shopify.dev/docs/api/admin-graphql/2026-07/queries/orders",
  "https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/productUpdate",
];
// Validated together by Shopify AI Toolkit, artifact noorly-ops-shopify revision 1, resolved version 2026-07.
export const SHOPIFY_OPERATIONS = {
  products:
    "query OpsProducts($first: Int!, $after: String) { products(first: $first, after: $after) { nodes { id title handle status variants(first: 100) { nodes { id sku price inventoryQuantity } pageInfo { hasNextPage endCursor } } } pageInfo { hasNextPage endCursor } } }",
  paidOrders:
    "query OpsPaidOrders($first: Int!, $after: String, $query: String!) { orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT) { nodes { id name createdAt displayFinancialStatus totalPriceSet { shopMoney { amount currencyCode } } } pageInfo { hasNextPage endCursor } } }",
  product:
    "query OpsProduct($id: ID!) { product(id: $id) { id title descriptionHtml updatedAt status } }",
  updateProduct:
    "mutation OpsProductUpdate($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id title descriptionHtml updatedAt status } userErrors { field message } } }",
};
export type ShopifyConfig = {
  shopDomain?: string;
  adminAccessToken?: string;
  apiVersion?: string;
};
export type Page<T> = {
  items: T[];
  hasNextPage: boolean;
  endCursor: string | null;
};
export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  status: string;
  variants: Page<{
    id: string;
    sku: string | null;
    price: string;
    inventoryQuantity: number | null;
  }>;
};
export type ShopifyPaidOrder = {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: "PAID";
  amount: string;
  currency: string;
};
export type ShopifyProductCopy = {
  id: string;
  title: string;
  descriptionHtml: string;
  updatedAt: string;
  status: string;
};
export type ProductCopyUpdate = {
  actionKey: string;
  id: string;
  expectedUpdatedAt: string;
  title?: string;
  descriptionHtml?: string;
};
const productId = (value: string) =>
  /^gid:\/\/shopify\/Product\/\d+$/.test(value);
const money = (value: unknown): value is string =>
  isString(value) && /^\d+(?:\.\d+)?$/.test(value);
function pageInfo(
  value: unknown,
): { hasNextPage: boolean; endCursor: string | null } | null {
  return isRecord(value) &&
    typeof value.hasNextPage === "boolean" &&
    (value.endCursor === null || isString(value.endCursor)) &&
    (!value.hasNextPage || nonempty(value.endCursor))
    ? { hasNextPage: value.hasNextPage, endCursor: value.endCursor }
    : null;
}
function parseCopy(value: unknown): ShopifyProductCopy | null {
  if (
    !isRecord(value) ||
    !nonempty(value.id) ||
    !isString(value.title) ||
    !isString(value.descriptionHtml) ||
    !nonempty(value.updatedAt) ||
    !nonempty(value.status)
  )
    return null;
  return {
    id: value.id,
    title: value.title,
    descriptionHtml: value.descriptionHtml,
    updatedAt: value.updatedAt,
    status: value.status,
  };
}
export function shopifyConfigFromEnv(env: Env = process.env): ShopifyConfig {
  return {
    shopDomain: env.SHOPIFY_STORE_DOMAIN,
    adminAccessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION ?? SHOPIFY_API_VERSION,
  };
}

export function createShopifyAdapter(
  config: ShopifyConfig,
  options: AdapterOptions = {},
) {
  const ready = () =>
    readiness(
      {
        SHOPIFY_STORE_DOMAIN:
          config.shopDomain &&
          /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(config.shopDomain),
        SHOPIFY_ADMIN_ACCESS_TOKEN: config.adminAccessToken,
        SHOPIFY_ADMIN_API_VERSION:
          (config.apiVersion ?? SHOPIFY_API_VERSION) === SHOPIFY_API_VERSION,
      },
      [
        "Product updates are copy-only and require a fresh expectedUpdatedAt; caller must serialize changes to avoid concurrent-edit races.",
        "List methods return bounded pages. The caller must follow cursors, including variant truncation.",
        "This connector does not place supplier orders or request fulfillment.",
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
  async function getProduct(
    id: string,
  ): Promise<ExternalResult<ShopifyProductCopy>> {
    if (!ready().ready) return unavailable(ready());
    if (!productId(id))
      return { status: "rejected", reason: "Invalid Shopify product ID" };
    const result = await gql(SHOPIFY_OPERATIONS.product, { id });
    if (result.status !== "succeeded")
      return { status: result.status, reason: result.reason };
    if (result.data?.product === null)
      return { status: "rejected", reason: "Shopify product was not found" };
    const product = parseCopy(result.data?.product);
    if (!product || product.id !== id)
      return { status: "unknown", reason: "Invalid Shopify product response" };
    return { status: "succeeded", externalId: id, data: product };
  }
  return {
    readiness: ready,
    getProduct,
    async listProducts(
      input: { first?: number; after?: string } = {},
    ): Promise<ExternalResult<Page<ShopifyProduct>>> {
      if (!ready().ready) return unavailable(ready());
      const first = input.first ?? 50;
      if (!Number.isInteger(first) || first < 1 || first > 100)
        return {
          status: "rejected",
          reason: "Product page size must be 1–100",
        };
      const result = await gql(SHOPIFY_OPERATIONS.products, {
        first,
        after: input.after,
      });
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      const connection = result.data?.products;
      const info = isRecord(connection) ? pageInfo(connection.pageInfo) : null;
      if (!isRecord(connection) || !Array.isArray(connection.nodes) || !info)
        return { status: "unknown", reason: "Invalid Shopify product page" };
      const products: ShopifyProduct[] = [];
      for (const row of connection.nodes) {
        if (
          !isRecord(row) ||
          !nonempty(row.id) ||
          !isString(row.title) ||
          !isString(row.handle) ||
          !nonempty(row.status) ||
          !isRecord(row.variants) ||
          !Array.isArray(row.variants.nodes)
        )
          return { status: "unknown", reason: "Invalid Shopify product data" };
        const variantPage = pageInfo(row.variants.pageInfo);
        if (!variantPage)
          return {
            status: "unknown",
            reason: "Missing variant pagination data",
          };
        const variants: ShopifyProduct["variants"]["items"] = [];
        for (const variant of row.variants.nodes) {
          if (
            !isRecord(variant) ||
            !nonempty(variant.id) ||
            !(variant.sku === null || isString(variant.sku)) ||
            !money(variant.price) ||
            !(
              variant.inventoryQuantity === null ||
              Number.isInteger(variant.inventoryQuantity)
            )
          )
            return { status: "unknown", reason: "Invalid Shopify variant" };
          variants.push({
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            inventoryQuantity: variant.inventoryQuantity as number | null,
          });
        }
        products.push({
          id: row.id,
          title: row.title,
          handle: row.handle,
          status: row.status,
          variants: { items: variants, ...variantPage },
        });
      }
      return { status: "succeeded", data: { items: products, ...info } };
    },
    async listPaidOrders(input: {
      since: string;
      first?: number;
      after?: string;
    }): Promise<ExternalResult<Page<ShopifyPaidOrder>>> {
      if (!ready().ready) return unavailable(ready());
      const first = input.first ?? 50;
      if (
        !Number.isFinite(Date.parse(input.since)) ||
        !Number.isInteger(first) ||
        first < 1 ||
        first > 100
      )
        return {
          status: "rejected",
          reason: "Invalid paid-order date or page size",
        };
      const result = await gql(SHOPIFY_OPERATIONS.paidOrders, {
        first,
        after: input.after,
        query: `financial_status:paid test:false created_at:>='${new Date(input.since).toISOString()}'`,
      });
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      const connection = result.data?.orders;
      const info = isRecord(connection) ? pageInfo(connection.pageInfo) : null;
      if (!isRecord(connection) || !Array.isArray(connection.nodes) || !info)
        return { status: "unknown", reason: "Invalid Shopify order page" };
      const orders: ShopifyPaidOrder[] = [];
      for (const row of connection.nodes) {
        const price =
          isRecord(row) && isRecord(row.totalPriceSet)
            ? row.totalPriceSet.shopMoney
            : null;
        if (
          !isRecord(row) ||
          !nonempty(row.id) ||
          !nonempty(row.name) ||
          !nonempty(row.createdAt) ||
          row.displayFinancialStatus !== "PAID" ||
          !isRecord(price) ||
          !money(price.amount) ||
          !nonempty(price.currencyCode)
        )
          return {
            status: "unknown",
            reason: "Paid-order response failed validation; no sales inferred",
          };
        orders.push({
          id: row.id,
          name: row.name,
          createdAt: row.createdAt,
          financialStatus: "PAID",
          amount: price.amount,
          currency: price.currencyCode,
        });
      }
      return { status: "succeeded", data: { items: orders, ...info } };
    },
    async updateProductCopy(
      input: ProductCopyUpdate,
    ): Promise<ExternalResult<ShopifyProductCopy>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !actionKeyValid(input.actionKey) ||
        !productId(input.id) ||
        !nonempty(input.expectedUpdatedAt) ||
        (input.title === undefined && input.descriptionHtml === undefined) ||
        (input.title !== undefined &&
          (!nonempty(input.title) || input.title.length > 255)) ||
        (input.descriptionHtml !== undefined &&
          (input.descriptionHtml.length > 50_000 ||
            /<\s*(script|iframe|object)|\bon[a-z]+\s*=|javascript\s*:/i.test(
              input.descriptionHtml,
            )))
      )
        return {
          status: "rejected",
          reason: "Invalid or unsafe product copy update",
        };
      const matches = (product: ShopifyProductCopy) =>
        (input.title === undefined || product.title === input.title) &&
        (input.descriptionHtml === undefined ||
          product.descriptionHtml === input.descriptionHtml);
      const current = await getProduct(input.id);
      if (current.status !== "succeeded" || !current.data) return current;
      if (matches(current.data))
        return {
          ...current,
          reason: "Requested copy already present; no write",
        };
      if (current.data.updatedAt !== input.expectedUpdatedAt)
        return {
          status: "rejected",
          reason: "Product changed since the approved snapshot",
        };
      const result = await gql(
        SHOPIFY_OPERATIONS.updateProduct,
        {
          product: {
            id: input.id,
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.descriptionHtml !== undefined
              ? { descriptionHtml: input.descriptionHtml }
              : {}),
          },
        },
        true,
      );
      if (result.status === "succeeded") {
        const payload = result.data?.productUpdate;
        if (
          isRecord(payload) &&
          Array.isArray(payload.userErrors) &&
          payload.userErrors.length
        )
          return {
            status: "rejected",
            reason: "Shopify rejected the product update",
          };
        const product =
          isRecord(payload) && Array.isArray(payload.userErrors)
            ? parseCopy(payload.product)
            : null;
        if (product && product.id === input.id && matches(product))
          return { status: "succeeded", externalId: product.id, data: product };
      } else if (result.status === "rejected")
        return { status: result.status, reason: result.reason };
      const recovered = await getProduct(input.id);
      if (
        recovered.status === "succeeded" &&
        recovered.data &&
        matches(recovered.data)
      )
        return {
          ...recovered,
          reason: "Product update confirmed by read-only reconciliation",
        };
      return {
        status: "unknown",
        reason: "Product update outcome unresolved; do not retry automatically",
      };
    },
  };
}
