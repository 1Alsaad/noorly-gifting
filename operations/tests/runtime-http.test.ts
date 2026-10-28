import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handleHttp } from "../src/http.js";
import { runtimeFixture } from "./runtime-fixtures.js";
import { fingerprint } from "../src/effects.js";

const env = {
  OPS_OPERATOR_PASSWORD: "operator-".repeat(5),
  OPS_SERVICE_TOKEN: "service-".repeat(5),
  CRON_SECRET: "cron-".repeat(8),
  SHOPIFY_STORE_DOMAIN: "test.myshopify.com",
  SHOPIFY_WEBHOOK_SECRET: "webhook-test-secret",
  NOORLY_CATALOG_TOKEN: "catalog-".repeat(5),
  NOORLY_CATALOG_SIGNING_SECRET: "signing-".repeat(5),
};
const basic = `Basic ${Buffer.from(`noorly:${env.OPS_OPERATOR_PASSWORD}`).toString("base64")}`;
const req = (path: string, init: RequestInit = {}) =>
  new Request(`https://ops.example.com${path}`, init);
function hook(
  payload: unknown,
  topic = "orders/paid",
  extra: Record<string, string> = {},
) {
  const body = JSON.stringify(payload);
  return req("/webhooks/shopify", {
    method: "POST",
    body,
    headers: {
      "x-shopify-hmac-sha256": createHmac("sha256", env.SHOPIFY_WEBHOOK_SECRET)
        .update(body)
        .digest("base64"),
      "x-shopify-shop-domain": env.SHOPIFY_STORE_DOMAIN,
      "x-shopify-event-id": "event-1",
      "x-shopify-topic": topic,
      ...extra,
    },
  });
}
test("dashboard and mutations require credentials; basic writes enforce origin", async () => {
  const f = runtimeFixture();
  const deps = { ...f.deps, env };
  assert.equal((await handleHttp(req("/"), undefined, deps)).status, 401);
  assert.equal(
    (
      await handleHttp(
        req("/api/tick", { method: "POST", headers: { authorization: basic } }),
        undefined,
        deps,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handleHttp(
        req("/api/control", {
          method: "POST",
          headers: { authorization: basic, origin: "https://evil.example" },
          body: '{"mode":"paused"}',
        }),
        undefined,
        deps,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleHttp(
        req("/api/control", {
          method: "POST",
          headers: { authorization: basic, origin: "https://ops.example.com" },
          body: '{"mode":"live"}',
        }),
        undefined,
        deps,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleHttp(
        req("/api/import", {
          method: "POST",
          headers: { authorization: basic, origin: "https://ops.example.com" },
          body: "{}",
        }),
        undefined,
        deps,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await handleHttp(
        req("/api/control", {
          method: "POST",
          headers: { authorization: basic, origin: "https://ops.example.com" },
          body: '{"mode":"paused"}',
        }),
        undefined,
        deps,
      )
    ).status,
    200,
  );
  assert.equal((await f.store.getControl()).mode, "paused");
});
test("valid Shopify replay enqueues once; unsigned and wrong-shop requests enqueue nothing", async () => {
  const f = runtimeFixture();
  const deps = { ...f.deps, env };
  const payload = { id: 123, admin_graphql_api_id: "gid://shopify/Order/123" };
  assert.equal(
    (
      await handleHttp(
        hook(payload, "orders/paid", { "x-shopify-hmac-sha256": "invalid" }),
        undefined,
        deps,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await handleHttp(
        hook(payload, "orders/paid", {
          "x-shopify-shop-domain": "other.myshopify.com",
        }),
        undefined,
        deps,
      )
    ).status,
    401,
  );
  assert.equal(Object.keys((await f.store.snapshot()).jobs).length, 0);
  assert.equal((await handleHttp(hook(payload), undefined, deps)).status, 202);
  assert.equal((await handleHttp(hook(payload), undefined, deps)).status, 202);
  const jobs = Object.values((await f.store.snapshot()).jobs);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].payload.orderId, "gid://shopify/Order/123");
});
test("refund webhook reconciles the parent order rather than the refund GID", async () => {
  const f = runtimeFixture();
  assert.equal(
    (
      await handleHttp(
        hook(
          {
            id: 456,
            order_id: 123,
            admin_graphql_api_id: "gid://shopify/Refund/456",
          },
          "refunds/create",
        ),
        undefined,
        { ...f.deps, env },
      )
    ).status,
    202,
  );
  assert.equal(
    Object.values((await f.store.snapshot()).jobs)[0].payload.orderId,
    "gid://shopify/Order/123",
  );
});
test("malformed and oversized requests fail before any work", async () => {
  const f = runtimeFixture();
  const deps = { ...f.deps, env };
  const headers = { authorization: `Bearer ${env.OPS_SERVICE_TOKEN}` };
  assert.equal(
    (
      await handleHttp(
        req("/api/control", { method: "POST", headers, body: "{" }),
        undefined,
        deps,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleHttp(
        req("/api/control", {
          method: "POST",
          headers,
          body: "x".repeat(1001),
        }),
        undefined,
        deps,
      )
    ).status,
    413,
  );
  assert.equal((await handleHttp(hook(null), undefined, deps)).status, 400);
  assert.equal(Object.keys((await f.store.snapshot()).jobs).length, 0);
});
test("catalog requires server bearer and returns exact body signature", async () => {
  const f = runtimeFixture();
  const deps = { ...f.deps, env };
  await f.records.put("catalog", "active", {
    schemaVersion: 1,
    version: 1,
    publishedAt: f.now().toISOString(),
    products: [],
  });
  assert.equal(
    (await handleHttp(req("/api/catalog"), undefined, deps)).status,
    401,
  );
  const response = await handleHttp(
    req("/api/catalog", {
      headers: { authorization: `Bearer ${env.NOORLY_CATALOG_TOKEN}` },
    }),
    undefined,
    deps,
  );
  assert.equal(response.status, 200);
  const raw = await response.text();
  assert.equal(
    response.headers.get("x-noorly-signature"),
    createHmac("sha256", env.NOORLY_CATALOG_SIGNING_SECRET)
      .update(`${response.headers.get("x-noorly-timestamp")}.${raw}`)
      .digest("hex"),
  );
});
test("authenticated output escapes injected markup and redacts credentials", async () => {
  const f = runtimeFixture();
  await f.records.put("issue", "x", {
    message: `<script>alert(1)</script> ${env.OPS_SERVICE_TOKEN} https://u:secret@example.com/x?token=leak`,
  });
  const response = await handleHttp(
    req("/", { headers: { authorization: basic } }),
    undefined,
    { ...f.deps, env },
  );
  const text = await response.text();
  assert.equal(response.status, 200);
  assert(!text.includes("<script>"));
  assert(!text.includes(env.OPS_SERVICE_TOKEN));
  assert(!text.includes("token=leak"));
  assert(!text.includes("u:secret"));
});
test("read-only preview is available only on localhost in non-production demo mode", async () => {
  const f = runtimeFixture();
  const local = () => new Request("http://127.0.0.1:8080/preview");
  assert.equal(
    (await handleHttp(local(), undefined, { ...f.deps, isDemo: true })).status,
    200,
  );
  assert.equal(
    (await handleHttp(req("/preview"), undefined, { ...f.deps, isDemo: true }))
      .status,
    404,
  );
  assert.equal((await handleHttp(local(), undefined, f.deps)).status, 404);
  assert.equal(
    (
      await handleHttp(local(), undefined, {
        ...f.deps,
        isDemo: true,
        env: { NODE_ENV: "production" },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await handleHttp(
        req("/api/control", { method: "POST", body: '{"mode":"live"}' }),
        undefined,
        { ...f.deps, isDemo: true },
      )
    ).status,
    401,
  );
});
test("trusted review accepts an existing Shopify URL and stores the required exact-byte hash", async () => {
  const f = runtimeFixture();
  const url = "https://cdn.shopify.com/s/files/1/existing-photo.jpg";
  const value = {
    url,
    sha256: "a".repeat(64),
    reviewedAt: f.now().toISOString(),
    noFaces: true,
    swedishText: true,
    authorizedPhotography: true,
    factualClaims: true,
    reviewer: "trusted-test-review",
    evidenceRef: "verified:image",
  };
  const response = await handleHttp(
    req("/api/asset-review", {
      method: "POST",
      headers: { authorization: `Bearer ${env.OPS_SERVICE_TOKEN}` },
      body: JSON.stringify(value),
    }),
    undefined,
    { ...f.deps, env },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(
    await f.records.get("asset-review", fingerprint(url)),
    value,
  );
});
