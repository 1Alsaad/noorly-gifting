import test from "node:test";
import assert from "node:assert/strict";
import { createShopifyCatalogAdapter } from "../src/adapters/index.js";
const json = (value: unknown) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });
const config = {
  shopDomain: "fixture.myshopify.com",
  adminAccessToken: "fixture",
};
const product = (overrides: Record<string, unknown> = {}) => ({
  id: "gid://shopify/Product/1",
  handle: "candle-sand",
  title: "Ljussand",
  descriptionHtml: "<p>Lugn hemma</p>",
  status: "DRAFT",
  updatedAt: "2026-10-28T10:00:00Z",
  tags: [],
  variants: {
    nodes: [
      {
        id: "gid://shopify/ProductVariant/2",
        price: "199.00",
        inventoryItem: {
          id: "gid://shopify/InventoryItem/3",
          sku: "AW-1",
          tracked: true,
        },
      },
    ],
    pageInfo: { hasNextPage: false, endCursor: null },
  },
  ...overrides,
});

test("Shopify media reader completes pagination and rejects changing product snapshots", async () => {
  let changed = false;
  let reads = 0;
  const fake: typeof fetch = async (_url, init) => {
    reads++;
    const request = JSON.parse(String(init?.body));
    const second = Boolean(request.variables.after);
    return json({
      data: {
        product: {
          id: "gid://shopify/Product/1",
          updatedAt:
            changed && second ? "2026-10-28T11:00:00Z" : "2026-10-28T10:00:00Z",
          media: {
            nodes: [
              {
                id: `gid://shopify/MediaImage/${second ? "2" : "1"}`,
                mediaContentType: "IMAGE",
                status: "READY",
                image: {
                  url: `https://cdn.shopify.com/${second ? "2" : "1"}.jpg`,
                },
              },
            ],
            pageInfo: {
              hasNextPage: !second,
              endCursor: second ? null : "next",
            },
          },
        },
      },
    });
  };
  const adapter = createShopifyCatalogAdapter(config, { fetch: fake });
  const result = await adapter.readMedia("gid://shopify/Product/1");
  assert.equal(result.status, "succeeded");
  assert.equal(result.data?.length, 2);
  assert.equal(reads, 2);
  changed = true;
  assert.equal(
    (await adapter.readMedia("gid://shopify/Product/1")).status,
    "unknown",
  );
});

test("draft product is never activated and a lost acknowledgement reconciles without duplication", async () => {
  let created: ReturnType<typeof product> | null = null;
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("mutation")) {
      writes++;
      assert.equal(body.variables.product.status, "DRAFT");
      created = product({ ...body.variables.product });
      throw new TypeError("Connection lost after submission");
    }
    return json({ data: { productByIdentifier: created } });
  };
  const adapter = createShopifyCatalogAdapter(config, { fetch: fake });
  const input = {
    actionKey: "catalog/draft/1",
    handle: "candle-sand",
    title: "Ljussand",
    descriptionHtml: "<p>Lugn hemma</p>",
  };
  assert.equal((await adapter.createDraft(input)).status, "succeeded");
  assert.equal((await adapter.createDraft(input)).status, "succeeded");
  assert.equal(writes, 1);
});

test("catalog handle collisions and incomplete variant pages fail closed", async () => {
  let row = product();
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    if (JSON.parse(String(init?.body)).query.includes("mutation")) writes++;
    return json({ data: { productByIdentifier: row } });
  };
  const adapter = createShopifyCatalogAdapter(config, { fetch: fake });
  assert.equal(
    (
      await adapter.createDraft({
        actionKey: "different-owner",
        handle: "candle-sand",
        title: "Ljussand",
        descriptionHtml: "<p>Lugn hemma</p>",
      })
    ).status,
    "rejected",
  );
  row = product({
    variants: { nodes: [], pageInfo: { hasNextPage: true, endCursor: "next" } },
  });
  assert.equal(
    (await adapter.readProduct({ id: "gid://shopify/Product/1" })).status,
    "unknown",
  );
  assert.equal(writes, 0);
});

test("price writes compare prior price, disallow partial updates, and read back", async () => {
  let price = "199.00";
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("mutation")) {
      assert.ok(body.query.includes("allowPartialUpdates: false"));
      writes++;
      price = body.variables.variants[0].price;
      return json({
        data: {
          productVariantsBulkUpdate: {
            productVariants: [{ id: "gid://shopify/ProductVariant/2", price }],
            userErrors: [],
          },
        },
      });
    }
    const row = product();
    row.variants.nodes[0]!.price = price;
    return json({ data: { productByIdentifier: row } });
  };
  const adapter = createShopifyCatalogAdapter(config, { fetch: fake });
  const input = {
    actionKey: "price/1",
    productId: "gid://shopify/Product/1",
    expectedUpdatedAt: "2026-10-28T10:00:00Z",
    variants: [
      {
        id: "gid://shopify/ProductVariant/2",
        expectedPrice: "200.00",
        price: "249.00",
      },
    ],
  };
  assert.equal((await adapter.updatePrices(input)).status, "rejected");
  assert.equal(writes, 0);
  input.variants[0]!.expectedPrice = "199.00";
  assert.equal((await adapter.updatePrices(input)).status, "succeeded");
  assert.equal(writes, 1);
});

test("publishing requires explicit ACTIVE state and retirement archives without deletion", async () => {
  let status = "DRAFT";
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("OpsPublicationState"))
      return json({
        data: {
          product: {
            id: "gid://shopify/Product/1",
            status,
            publishedOnPublication: false,
          },
        },
      });
    if (body.query.includes("mutation")) {
      writes++;
      assert.ok(body.query.includes("productUpdate"));
      assert.equal(body.variables.product.status, "ARCHIVED");
      status = "ARCHIVED";
      return json({
        data: {
          productUpdate: {
            product: { id: "gid://shopify/Product/1", status },
            userErrors: [],
          },
        },
      });
    }
    return json({ data: { productByIdentifier: product({ status }) } });
  };
  const adapter = createShopifyCatalogAdapter(config, { fetch: fake });
  assert.equal(
    (
      await adapter.publish({
        actionKey: "publish/1",
        productId: "gid://shopify/Product/1",
        publicationId: "gid://shopify/Publication/5",
      })
    ).status,
    "rejected",
  );
  assert.equal(
    (
      await adapter.setStatus({
        actionKey: "retire/1",
        productId: "gid://shopify/Product/1",
        expectedUpdatedAt: "2026-10-28T10:00:00Z",
        status: "ARCHIVED",
      })
    ).status,
    "succeeded",
  );
  assert.equal(writes, 1);
});

test("missing supplier location does not become zero stock", async () => {
  const adapter = createShopifyCatalogAdapter(config, {
    fetch: async () =>
      json({
        data: {
          inventoryItem: {
            id: "gid://shopify/InventoryItem/3",
            sku: "AW-1",
            tracked: true,
            inventoryLevel: null,
          },
        },
      }),
  });
  assert.equal(
    (
      await adapter.readStock({
        inventoryItemId: "gid://shopify/InventoryItem/3",
        locationId: "gid://shopify/Location/4",
      })
    ).status,
    "unknown",
  );
});

test("accounting preserves successful and pending transactions separately and rejects duplicate IDs", async () => {
  const amount = (amount: string) => ({
    shopMoney: { amount, currencyCode: "SEK" },
  });
  const tx = {
    id: "gid://shopify/OrderTransaction/7",
    kind: "SALE",
    status: "SUCCESS",
    test: false,
    processedAt: "2026-10-28T10:00:00Z",
    amountSet: amount("249.00"),
  };
  let duplicate = false;
  const fake: typeof fetch = async () =>
    json({
      data: {
        order: {
          id: "gid://shopify/Order/6",
          name: "#1001",
          test: false,
          updatedAt: "2026-10-28T10:00:00Z",
          displayFinancialStatus: "PARTIALLY_REFUNDED",
          totalReceivedSet: amount("249.00"),
          totalRefundedSet: amount("49.00"),
          transactions: duplicate
            ? [tx, tx]
            : [
                tx,
                {
                  ...tx,
                  id: "gid://shopify/OrderTransaction/8",
                  kind: "REFUND",
                  status: "PENDING",
                  amountSet: amount("49.00"),
                },
              ],
          refunds: [
            {
              id: "gid://shopify/Refund/9",
              createdAt: "2026-10-28T11:00:00Z",
              totalRefundedSet: amount("49.00"),
            },
          ],
          lineItems: {
            nodes: [
              {
                id: "gid://shopify/LineItem/10",
                quantity: 1,
                product: { id: "gid://shopify/Product/1" },
                variant: { id: "gid://shopify/ProductVariant/2" },
                discountedTotalSet: amount("249.00"),
              },
            ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      },
    });
  const adapter = createShopifyCatalogAdapter(config, { fetch: fake });
  const result = await adapter.readOrderAccounting("gid://shopify/Order/6");
  assert.equal(result.status, "succeeded");
  assert.equal(result.data?.transactions[1]?.status, "PENDING");
  assert.equal(result.data?.totalReceived.amount, "249.00");
  duplicate = true;
  assert.equal(
    (await adapter.readOrderAccounting("gid://shopify/Order/6")).status,
    "unknown",
  );
});
