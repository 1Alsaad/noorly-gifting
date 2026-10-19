import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const environment = vi.hoisted(() => ({
  NODE_ENV: "test",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_COMMERCE_PROVIDER: "mock",
  PRODUCT_INTEREST_ENABLED: false,
  FORM_DELIVERY_URL: undefined as string | undefined,
  FORM_DELIVERY_TOKEN: undefined as string | undefined,
}));
vi.mock("@/lib/env/server", () => ({ getEnv: () => environment }));
vi.mock("@/lib/security/redis", () => ({
  hasDurableStore: () => false,
  redisCommand: vi.fn(),
}));
vi.mock("@/lib/commerce", () => ({
  getCommerceProvider: () => ({
    getProducts: async () => [
      { handle: "candle-sand", variants: [{ id: "candle-sand-11" }] },
    ],
  }),
}));
import { POST } from "@/app/api/forms/route";
import { POST as cartPost } from "@/app/api/cart/route";

function request(data: unknown) {
  return new Request("http://localhost:3000/api/forms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      "x-forwarded-for": crypto.randomUUID(),
    },
    body: JSON.stringify(data),
  });
}
function interest() {
  return {
    kind: "product_interest",
    productHandle: "candle-sand",
    variantId: "candle-sand-11",
    boxContents: [],
    locale: "sv",
    email: "interested@example.com",
    consent: true,
    website: "",
    submissionId: crypto.randomUUID(),
  };
}

afterEach(() => vi.unstubAllEnvs());

describe("truthful product interest processing", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    environment.PRODUCT_INTEREST_ENABLED = false;
    environment.FORM_DELIVERY_URL = undefined;
    environment.FORM_DELIVERY_TOKEN = undefined;
    vi.restoreAllMocks();
  });

  it("never returns mock success when registrations are closed or delivery is absent", async () => {
    expect((await POST(request(interest()))).status).toBe(503);
    environment.PRODUCT_INTEREST_ENABLED = true;
    expect((await POST(request(interest()))).status).toBe(503);
  });

  it("rejects missing consent, unknown products and mismatched variants", async () => {
    environment.PRODUCT_INTEREST_ENABLED = true;
    for (const patch of [
      { consent: false },
      { productHandle: "invented" },
      { variantId: "another-product-variant" },
      { boxContents: ["invented"] },
    ]) {
      expect((await POST(request({ ...interest(), ...patch }))).status).toBe(400);
    }
  });

  it("confirms only a successful receiver and does not deliver a duplicate twice", async () => {
    environment.PRODUCT_INTEREST_ENABLED = true;
    environment.FORM_DELIVERY_URL = "https://forms.example.test/receive";
    environment.FORM_DELIVERY_TOKEN = "private-token";
    const receiver = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));
    const data = interest();
    const first = await (await POST(request(data))).json();
    expect(first).toMatchObject({ ok: true, mock: false });
    expect(JSON.stringify(first)).not.toContain(data.email);
    const duplicate = await (await POST(request(data))).json();
    expect(duplicate).toMatchObject({ ok: true, duplicate: true, mock: false });
    expect(receiver).toHaveBeenCalledTimes(1);
  });

  it("rejects direct checkout calls while product testing is enabled", async () => {
    const response = await cartPost(request({ type: "checkout", locale: "sv" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: "PRODUCT_TEST_NO_ORDERS",
    });
  });
});
