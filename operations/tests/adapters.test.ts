import test from "node:test";
import assert from "node:assert/strict";
import {
  createAwAdapter,
  createBufferAdapter,
  createDataForSeoAdapter,
  createMetaAdapter,
  createResendAdapter,
  createShopifyAdapter,
  type BufferPhotoPost,
} from "../src/adapters/index.js";
import { requestJson } from "../src/adapters/http.js";

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const neverFetch: typeof fetch = async () => {
  throw new Error("Unexpected network access");
};
const postInput: BufferPhotoPost = {
  actionKey: "social/test-1",
  text: "En lugn stund hemma",
  title: "Lugn stund",
  dueAt: "2030-01-01T12:00:00Z",
  imageUrls: ["https://assets.example.com/candle.jpg"],
  aiGenerated: false,
};
const bufferConfig = {
  apiKey: "fixture",
  organizationId: "org1",
  channelId: "channel1",
  photoAutopublishVerified: true,
};
const bufferPost = (id = "post1") => ({
  id,
  channelId: "channel1",
  text: postInput.text,
  dueAt: postInput.dueAt,
  status: "scheduled",
  schedulingType: "automatic",
  assets: [{ source: postInput.imageUrls[0] }],
});
const postsResponse = (posts: unknown[]) =>
  json({
    data: {
      posts: {
        edges: posts.map((node) => ({ node })),
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  });
const channelResponse = () =>
  json({
    data: {
      channel: {
        id: "channel1",
        service: "tiktok",
        isDisconnected: false,
        isLocked: false,
        isQueuePaused: false,
      },
    },
  });

test("every connector rejects missing credentials before network access", async () => {
  const options = { fetch: neverFetch };
  const connectors = [
    createAwAdapter({}, options),
    createBufferAdapter({}, options),
    createDataForSeoAdapter({}, options),
    createMetaAdapter({}, options),
    createResendAdapter({}, options),
    createShopifyAdapter({}, options),
  ];
  for (const adapter of connectors) {
    assert.equal(adapter.readiness().ready, false);
    assert.ok(adapter.readiness().missing.length);
  }
  assert.equal((await connectors[1]!.readiness()).ready, false);
  assert.equal(
    (await createBufferAdapter({}, options).readQueue()).status,
    "rejected",
  );
  assert.equal(
    (
      await createResendAdapter({}, options).send({
        actionKey: "mail/one",
        to: ["owner@example.com"],
        subject: "Test",
        text: "Test",
      })
    ).status,
    "rejected",
  );
  assert.equal(
    (await createDataForSeoAdapter({}, options).searchSweden(["ljussand"]))
      .status,
    "rejected",
  );
});

test("an aborted request is unknown and never automatically retried", async () => {
  let calls = 0;
  const fake: typeof fetch = async (_url, init) => {
    calls++;
    return new Promise((_resolve, reject) =>
      init?.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      ),
    );
  };
  assert.equal(
    (
      await requestJson(
        "https://example.com",
        { method: "POST" },
        { fetch: fake, timeoutMs: 5 },
      )
    ).status,
    "unknown",
  );
  assert.equal(calls, 1);
});

test("Buffer deduplicates repeated queue IDs and recovers existing post without mutation", async () => {
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("mutation")) writes++;
    return postsResponse([bufferPost(), bufferPost()]);
  };
  const result = await createBufferAdapter(bufferConfig, {
    fetch: fake,
  }).schedulePhotoPost(postInput);
  assert.equal(result.status, "succeeded");
  assert.equal(result.externalId, "post1");
  assert.equal(writes, 0);
});

test("Buffer refuses two distinct posts with the same action fingerprint", async () => {
  const result = await createBufferAdapter(bufferConfig, {
    fetch: async () =>
      postsResponse([bufferPost("post1"), bufferPost("post2")]),
  }).schedulePhotoPost(postInput);
  assert.equal(result.status, "unknown");
});

test("Buffer lost create acknowledgement triggers lookup, never a second mutation", async () => {
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("OpsBufferChannel")) return channelResponse();
    if (body.query.includes("mutation")) {
      writes++;
      throw new TypeError("Network lost");
    }
    return postsResponse(writes ? [bufferPost()] : []);
  };
  const result = await createBufferAdapter(bufferConfig, {
    fetch: fake,
  }).schedulePhotoPost(postInput);
  assert.equal(result.status, "succeeded");
  assert.equal(result.externalId, "post1");
  assert.equal(writes, 1);
});

test("Buffer unresolved write stays unknown and rejects unsupported AI photo disclosure", async () => {
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("OpsBufferChannel")) return channelResponse();
    if (body.query.includes("mutation")) {
      writes++;
      return json({ problem: "lost" }, 502);
    }
    return postsResponse([]);
  };
  const adapter = createBufferAdapter(bufferConfig, { fetch: fake });
  assert.equal((await adapter.schedulePhotoPost(postInput)).status, "unknown");
  assert.equal(writes, 1);
  assert.equal(
    (await adapter.schedulePhotoPost({ ...postInput, aiGenerated: true }))
      .status,
    "rejected",
  );
  assert.equal(writes, 1);
});

test("Resend uses stable provider idempotency keys and validates the returned ID", async () => {
  const keys: string[] = [];
  const fake: typeof fetch = async (_url, init) => {
    keys.push(new Headers(init?.headers).get("Idempotency-Key")!);
    return json({ id: "email-1" });
  };
  const adapter = createResendAdapter(
    { apiKey: "fixture", from: "Noorly <hello@example.com>" },
    { fetch: fake },
  );
  const input = {
    actionKey: "mail/order-1",
    to: ["owner@example.com"],
    subject: "Order update",
    text: "A factual update.",
  };
  const a = await adapter.send(input),
    b = await adapter.send(input);
  assert.equal(a.externalId, b.externalId);
  assert.deepEqual(keys, ["mail/order-1", "mail/order-1"]);
  const malformed = createResendAdapter(
    { apiKey: "fixture", from: "hello@example.com" },
    { fetch: async () => json({ success: true }) },
  );
  assert.equal((await malformed.send(input)).status, "unknown");
});

test("keyword research pins Sweden and Swedish, and rejects foreign geography", async () => {
  let location = 2752;
  const fake: typeof fetch = async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload[0].location_name, "Sweden");
    assert.equal(payload[0].language_name, "Swedish");
    assert.equal(payload[0].search_partners, false);
    return json({
      status_code: 20000,
      tasks: [
        {
          id: "task1",
          status_code: 20000,
          result: [
            {
              keyword: "ljussand",
              location_code: location,
              language_code: "sv",
              search_volume: 170,
              monthly_searches: [{ year: 2026, month: 9, search_volume: 210 }],
            },
          ],
        },
      ],
    });
  };
  const adapter = createDataForSeoAdapter(
    { login: "fixture", password: "fixture" },
    { fetch: fake },
  );
  const result = await adapter.searchSweden(["ljussand"]);
  assert.equal(result.data?.[0]?.estimatedMonthlySearches, 170);
  assert.equal(result.data?.[0]?.country, "SE");
  location = 2840;
  assert.equal((await adapter.searchSweden(["ljussand"])).status, "unknown");
});

test("Shopify copy update blocks stale snapshots and reconciles ambiguous writes", async () => {
  let updated = false;
  let writes = 0;
  const fake: typeof fetch = async (url, init) => {
    assert.ok(String(url).includes("/admin/api/2026-07/graphql.json"));
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("mutation")) {
      writes++;
      updated = true;
      throw new TypeError("Lost response");
    }
    return json({
      data: {
        product: {
          id: "gid://shopify/Product/1",
          title: updated ? "New title" : "Old title",
          descriptionHtml: "<p>Original</p>",
          updatedAt: "2026-10-28T10:00:00Z",
          status: "ACTIVE",
        },
      },
    });
  };
  const adapter = createShopifyAdapter(
    { shopDomain: "fixture.myshopify.com", adminAccessToken: "fixture" },
    { fetch: fake },
  );
  const input = {
    actionKey: "copy/1",
    id: "gid://shopify/Product/1",
    expectedUpdatedAt: "2026-10-27T10:00:00Z",
    title: "New title",
  };
  assert.equal((await adapter.updateProductCopy(input)).status, "rejected");
  assert.equal(writes, 0);
  assert.equal(
    (
      await adapter.updateProductCopy({
        ...input,
        expectedUpdatedAt: "2026-10-28T10:00:00Z",
      })
    ).status,
    "succeeded",
  );
  assert.equal(writes, 1);
});

test("Meta cannot activate a campaign with a mismatched spend cap", async () => {
  let writes = 0;
  const fake: typeof fetch = async (_url, init) => {
    if (init?.method === "POST") writes++;
    return json({
      id: "22",
      account_id: "11",
      name: "Fixture",
      status: "PAUSED",
      spend_cap: "10000",
    });
  };
  const adapter = createMetaAdapter(
    { accessToken: "fixture", adAccountId: "act_11", graphVersion: "v24.0" },
    { fetch: fake },
  );
  assert.equal(
    (
      await adapter.setCampaignStatus({
        actionKey: "activate/22",
        campaignId: "22",
        status: "ACTIVE",
        expectedSpendCapMinor: 20000,
      })
    ).status,
    "rejected",
  );
  assert.equal(writes, 0);
});

test("Meta creates only paused campaigns, validates SEK, and reads the result back", async () => {
  let createdName = "";
  let writes = 0;
  const fake: typeof fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (init?.method === "POST") {
      writes++;
      const payload = JSON.parse(String(init.body));
      assert.equal(payload.status, "PAUSED");
      assert.equal(payload.spend_cap, 50000);
      assert.equal(payload.objective, "OUTCOME_SALES");
      createdName = payload.name;
      return json({ id: "22" });
    }
    if (path.endsWith("/act_11"))
      return json({
        id: "act_11",
        account_id: "11",
        currency: "SEK",
        timezone_name: "Europe/Stockholm",
      });
    if (path.endsWith("/campaigns")) return json({ data: [] });
    return json({
      id: "22",
      account_id: "11",
      name: createdName,
      status: "PAUSED",
      spend_cap: "50000",
    });
  };
  const adapter = createMetaAdapter(
    { accessToken: "fixture", adAccountId: "11", graphVersion: "v24.0" },
    { fetch: fake },
  );
  const result = await adapter.createPausedCampaign({
    actionKey: "campaign/p1",
    name: "Fixture",
    spendCapMinor: 50000,
  });
  assert.equal(result.status, "succeeded");
  assert.equal(result.data?.status, "PAUSED");
  assert.equal(writes, 1);
});

test("AW authenticates documented read access but never duplicates native fulfillment", async () => {
  let calls = 0;
  const fake: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(String(url), "https://api.aiku.io/dropshipping/clients");
    assert.equal(init?.method, "GET");
    return json({ data: [{ id: 123 }] });
  };
  const adapter = createAwAdapter(
    {
      apiToken: "fixture",
      environment: "production",
      fulfillmentMode: "native-shopify",
    },
    { fetch: fake },
  );
  const auth = await adapter.qualifyAuthentication();
  assert.equal(auth.data?.clientReadAccess, true);
  assert.equal(auth.data?.orderWriteAccess, "unverified");
  assert.equal((await adapter.submitOrder()).status, "rejected");
  assert.equal(calls, 1);
});
