import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRedirectUrl,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import nextConfig from "../../next.config";

function resolve(url: string, headers?: Record<string, string>) {
  return unstable_getResponseFromNextConfig({ url, headers, nextConfig });
}

describe("canonical public storefront", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEPLOYMENT_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://noorlynordic.com");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("moves legacy product links to the cart's origin and preserves path and query", async () => {
    const response = await resolve(
      "https://noorly-gifting.vercel.app/sv/products/candle-sand?variant=55883112317270&utm_source=launch",
    );
    expect(response.status).toBe(308);
    expect(getRedirectUrl(response)).toBe(
      "https://noorlynordic.com/sv/products/candle-sand?variant=55883112317270&utm_source=launch",
    );
  });

  it("uses the configured canonical origin, never a forwarded host", async () => {
    const response = await resolve(
      "https://noorly-gifting.vercel.app/en/cart?next=https%3A%2F%2Fevil.example",
      { "x-forwarded-host": "evil.example", "x-forwarded-proto": "http" },
    );
    expect(getRedirectUrl(response)).toBe(
      "https://noorlynordic.com/en/cart?next=https%3A%2F%2Fevil.example",
    );
  });

  it.each([
    "noorlynordic.com",
    "www.noorlynordic.com",
    "noorly-gifting-git-preview-1alsaads-projects.vercel.app",
    "noorly-giftingXvercelYapp",
    "noorly-gifting.vercel.app.evil.example",
  ])("does not redirect the unrelated host %s", async (host) => {
    const response = await resolve(`https://${host}/sv/products/candle-sand`);
    expect(getRedirectUrl(response)).toBeNull();
  });

  it.each([
    { node: "production", deployment: "preview", vercel: "production" },
    { node: "production", deployment: "production", vercel: "preview" },
    { node: "production", deployment: "production", vercel: "development" },
    { node: "development", deployment: "production", vercel: "production" },
  ])("keeps preview and development deployments local: %j", async (env) => {
    vi.stubEnv("NODE_ENV", env.node);
    vi.stubEnv("DEPLOYMENT_ENV", env.deployment);
    vi.stubEnv("VERCEL_ENV", env.vercel);
    const response = await resolve(
      "https://noorly-gifting.vercel.app/sv/products/candle-sand",
    );
    expect(getRedirectUrl(response)).toBeNull();
  });

  it.each([
    "http://noorlynordic.com",
    "https://user:password@noorlynordic.com",
    "https://noorly-gifting.vercel.app",
    "not-a-url",
  ])("does not generate an unsafe or looping destination: %s", async (site) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", site);
    const response = await resolve(
      "https://noorly-gifting.vercel.app/sv/products/candle-sand",
    );
    expect(getRedirectUrl(response)).toBeNull();
  });
});
