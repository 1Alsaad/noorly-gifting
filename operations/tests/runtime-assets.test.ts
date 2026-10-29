import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verifyAssetBytes } from "../src/assets.js";

test("asset verification hashes the fetched bytes and forbids redirects", async () => {
  const bytes = Buffer.from("reviewed-image-fixture");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const mocked: typeof fetch = async (_url, init) => {
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    return new Response(bytes, { headers: { "content-type": "image/png" } });
  };
  assert.equal(
    await verifyAssetBytes(`https://cdn.shopify.com/${hash}.png`, hash, {
      fetch: mocked,
    }),
    true,
  );
  assert.equal(
    await verifyAssetBytes(
      `https://cdn.shopify.com/${"b".repeat(64)}.png`,
      "b".repeat(64),
      { fetch: mocked },
    ),
    false,
  );
});
test("untrusted hosts never fetch and oversized/non-image responses never authorize publication", async () => {
  let calls = 0;
  const oversized: typeof fetch = async () => {
    calls++;
    return new Response("x", {
      headers: {
        "content-type": "image/jpeg",
        "content-length": String(10 * 1024 * 1024 + 1),
      },
    });
  };
  const hash = "a".repeat(64);
  assert.equal(
    await verifyAssetBytes("http://127.0.0.1/private", hash, {
      fetch: oversized,
    }),
    false,
  );
  assert.equal(
    await verifyAssetBytes("https://evil.example/image", hash, {
      fetch: oversized,
    }),
    false,
  );
  assert.equal(calls, 0);
  assert.equal(
    await verifyAssetBytes("https://cdn.shopify.com/image", hash, {
      fetch: oversized,
    }),
    false,
  );
  const html: typeof fetch = async () =>
    new Response("html", { headers: { "content-type": "text/html" } });
  assert.equal(
    await verifyAssetBytes("https://assets.example.com/image", hash, {
      env: { OPS_ASSET_HOSTS: "assets.example.com" },
      fetch: html,
    }),
    false,
  );
});
