import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/admin-preview/route";
import { POST as cartPost } from "@/app/api/cart/route";
import { createAdminPreviewSession } from "@/lib/security/admin-preview";

const fixture = "test-only-generated-password-1234567890";
function request(body: string, headers: Record<string, string> = {}) {
  return new Request("https://noorly.example/api/admin-preview", {
    method: "POST",
    headers: {
      origin: "https://noorly.example",
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": crypto.randomUUID(),
      ...headers,
    },
    body,
  });
}
describe("admin preview login boundary", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PREVIEW_PASSWORD", fixture);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://noorly.example");
    vi.stubEnv("ALLOW_MOCK_COMMERCE", "true");
    vi.stubEnv(
      "CART_COOKIE_SECRET",
      "test-only-cookie-secret-1234567890abcdef",
    );
  });
  afterEach(() => vi.unstubAllEnvs());

  it("redirects successful login with a secure HttpOnly cookie without exposing the password", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(request(`password=${fixture}`));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://noorly.example/sv");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("set-cookie")).not.toContain(fixture);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("denies wrong passwords, unconfigured login, cross-origin and oversized requests", async () => {
    const wrong = await POST(request("password=wrong"));
    expect(wrong.headers.get("location")).toContain("error=invalid");
    expect(wrong.headers.get("set-cookie")).toBeNull();
    expect(
      (
        await POST(
          request(`password=${fixture}`, { origin: "https://evil.example" }),
        )
      ).status,
    ).toBe(403);
    expect((await POST(request("password=" + "a".repeat(1100)))).status).toBe(
      413,
    );
    vi.stubEnv("ADMIN_PREVIEW_PASSWORD", "");
    expect((await POST(request(`password=${fixture}`))).status).toBe(503);
  });
  it("validates the public origin despite an internal framework request hostname", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(
      new Request("http://localhost:3000/api/admin-preview", {
        method: "POST",
        headers: {
          origin: "https://noorly.example",
          "content-type": "application/x-www-form-urlencoded",
        },
        body: `password=${fixture}`,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://noorly.example/sv");
  });
  it("expires the cookie on logout and throttles repeated attempts in one instance", async () => {
    const response = await POST(request("action=logout"));
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    const headers = { "x-forwarded-for": crypto.randomUUID() };
    for (let i = 0; i < 10; i++)
      expect((await POST(request("password=wrong", headers))).status).toBe(303);
    expect((await POST(request("password=wrong", headers))).status).toBe(429);
  });
  it("does not unlock the cart API when the preview cookie is valid", async () => {
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "false");
    const response = await cartPost(
      new Request("https://noorly.example/api/cart", {
        method: "POST",
        headers: {
          cookie: `noorly_admin_preview=${createAdminPreviewSession()}`,
        },
        body: JSON.stringify({ type: "checkout", locale: "sv" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: "STOREFRONT_CLOSED" });
  });
});
