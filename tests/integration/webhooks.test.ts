import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ ids: new Set<string>(), fail: false }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  getEnv: () => ({
    NODE_ENV: "test",
    NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
    NEXT_PUBLIC_COMMERCE_PROVIDER: "shopify",
    SHOPIFY_STORE_DOMAIN: "stilla-test.myshopify.com",
    SHOPIFY_WEBHOOK_SECRET: "test-webhook-secret",
  }),
}));
vi.mock("@/lib/security/redis", () => ({
  hasDurableStore: () => true,
  redisCommand: vi.fn(async (command: (string | number)[]) => {
    if (state.fail) throw new Error("offline");
    const key = String(command[3]);
    if (state.ids.has(key)) return 0;
    state.ids.add(key);
    return 1;
  }),
}));
import { POST } from "../../src/app/api/webhooks/shopify/route";
import { redisCommand } from "../../src/lib/security/redis";

const paidOrder = {
  id: 1234,
  financial_status: "paid",
  currency: "SEK",
  total_price: "995.00",
  note_attributes: [
    { name: "_stilla_analytics_consent", value: "granted" },
    {
      name: "_stilla_analytics_session",
      value: "ff9007c8-90aa-456f-a41b-d295517b53da",
    },
  ],
  customer: { email: "private@example.com", first_name: "Private" },
};
function request(payload: unknown, signature?: string, topic = "orders/paid") {
  const body = JSON.stringify(payload);
  return new Request("https://shop.example.com/api/webhooks/shopify", {
    method: "POST",
    body,
    headers: {
      "x-shopify-hmac-sha256":
        signature ??
        createHmac("sha256", "test-webhook-secret")
          .update(body)
          .digest("base64"),
      "x-shopify-shop-domain": "stilla-test.myshopify.com",
      "x-shopify-topic": topic,
    },
  });
}
describe("verified paid order ingestion", () => {
  beforeEach(() => {
    state.ids.clear();
    state.fail = false;
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());
  it("rejects invalid signatures before writing anything", async () => {
    expect((await POST(request(paidOrder, "invalid"))).status).toBe(401);
    expect(redisCommand).not.toHaveBeenCalled();
  });
  it("atomically queues only one event for repeated paid order deliveries and strips all PII", async () => {
    expect((await POST(request(paidOrder))).status).toBe(200);
    const repeat = await POST(request(paidOrder));
    expect(await repeat.json()).toMatchObject({ ok: true, duplicate: true });
    expect(state.ids.size).toBe(1);
    const queued = vi.mocked(redisCommand).mock.calls[0]?.[0].join(" ");
    expect(queued).toContain("purchase");
    expect(queued).not.toContain("private@example.com");
    expect(queued).not.toContain("Private");
  });
  it("does not report unpaid, test or non-consented purchases", async () => {
    expect(
      (await POST(request({ ...paidOrder, financial_status: "pending" })))
        .status,
    ).toBe(400);
    expect(
      await (await POST(request({ ...paidOrder, test: true }))).json(),
    ).toMatchObject({ ignored: true });
    expect(
      await (await POST(request({ ...paidOrder, note_attributes: [] }))).json(),
    ).toMatchObject({ analytics: "not_consented" });
    expect(redisCommand).not.toHaveBeenCalled();
  });
  it("returns a retryable failure when durable enqueue fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    state.fail = true;
    const response = await POST(request(paidOrder));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: "TEMPORARILY_UNAVAILABLE",
    });
    state.fail = false;
    expect((await POST(request(paidOrder))).status).toBe(200);
    expect(state.ids.size).toBe(1);
  });
});
