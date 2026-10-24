import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommerceError } from "@/lib/commerce/errors";
import { launchProductDefinitions } from "@/content/launch-catalog";

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("@/lib/env/server", () => ({ getEnv: vi.fn(() => ({})) }));
vi.mock("@/lib/commerce", () => ({
  getCommerceProvider: () => ({ getProductByHandle: lookup }),
}));
import { GET } from "@/app/api/health/route";

describe("public catalog health", () => {
  beforeEach(() => {
    lookup.mockReset();
  });

  it("leaves the ordinary health check independent of Shopify", async () => {
    const response = await GET(new Request("https://example.com/api/health"));
    expect(response.status).toBe(200);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("checks both fixed launch products and returns no product data", async () => {
    lookup.mockImplementation(async (handle: string) => {
      const definition = launchProductDefinitions.find(
        (item) => item.handle === handle,
      );
      return definition
        ? { id: definition.id, handle, privateField: "private-value" }
        : null;
    });
    const response = await GET(
      new Request("https://example.com/api/health?catalog=1&handle=arbitrary"),
    );
    expect(lookup).toHaveBeenCalledTimes(2);
    for (const { handle } of launchProductDefinitions)
      expect(lookup).toHaveBeenCalledWith(handle);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["requestId", "status"]);
    expect(body.status).toBe("ok");
    expect(JSON.stringify(body)).not.toContain("private-value");
  });

  it("does not report ready when either separate product is unpublished or substituted", async () => {
    lookup.mockImplementation(async (handle: string) =>
      handle === launchProductDefinitions[0].handle
        ? { ...launchProductDefinitions[0] }
        : null,
    );
    const missing = await GET(
      new Request("https://example.com/api/health?catalog=1"),
    );
    expect(missing.status).toBe(503);
    expect((await missing.json()).status).toBe("catalog_unpublished");
    lookup.mockResolvedValue({ id: "substituted", handle: "wrong-product" });
    const wrong = await GET(
      new Request("https://example.com/api/health?catalog=1"),
    );
    expect(wrong.status).toBe(503);
    expect((await wrong.json()).status).toBe("invalid_launch_product");
  });

  it("reports safe failure categories without revealing provider content", async () => {
    lookup.mockRejectedValue(
      new CommerceError("invalid_provider_response", 502),
    );
    const response = await GET(
      new Request("https://example.com/api/health?catalog=1"),
    );
    expect(response.status).toBe(503);
    expect((await response.json()).status).toBe("invalid_provider_response");
    lookup.mockImplementation(async () => {
      throw new Error("secret-token customer@example.com");
    });
    const unknown = await GET(
      new Request("https://example.com/api/health?catalog=1"),
    );
    const text = await unknown.text();
    expect(text).toContain("catalog_unavailable");
    expect(text).not.toMatch(/secret-token|customer@example/);
  });
});
