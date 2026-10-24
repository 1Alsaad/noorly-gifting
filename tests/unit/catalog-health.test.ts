import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommerceError } from "@/lib/commerce/errors";
import { launchBundleHandle } from "@/content/launch-bundle";

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

  it("checks only the fixed launch product and returns no product data", async () => {
    lookup.mockResolvedValue({ id: "private-id", price: 799, variants: [] });
    const response = await GET(
      new Request("https://example.com/api/health?catalog=1&handle=arbitrary"),
    );
    expect(lookup).toHaveBeenCalledWith(launchBundleHandle);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["requestId", "status"]);
    expect(body.status).toBe("ok");
    expect(JSON.stringify(body)).not.toContain("private-id");
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
