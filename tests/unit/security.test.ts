import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseEnv } from "../../src/lib/env/schema";
import { verifyShopifyHmac } from "../../src/lib/security/webhook";
import { formSchema } from "../../src/lib/security/forms";
import { winterScenes } from "../../src/features/seasonal-experience/winter-scenes";
import { contentSecurityPolicy } from "../../src/lib/security/csp";

describe("configuration and request security", () => {
  it("permits a credential-free local mock, but fails closed for production", () => {
    expect(parseEnv({}).NEXT_PUBLIC_COMMERCE_PROVIDER).toBe("mock");
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(
      "Invalid configuration",
    );
    expect(
      parseEnv({
        NODE_ENV: "production",
        ALLOW_MOCK_COMMERCE: "true",
        CART_COOKIE_SECRET: "a".repeat(32),
      }).ALLOW_MOCK_COMMERCE,
    ).toBe(true);
    expect(() =>
      parseEnv({ NEXT_PUBLIC_COMMERCE_PROVIDER: "shopify" }),
    ).toThrow("SHOPIFY_STORE_DOMAIN");
  });
  it("never reveals invalid credential values", () => {
    expect(() => parseEnv({ CART_COOKIE_SECRET: "secret-value" })).toThrow(
      "CART_COOKIE_SECRET",
    );
    try {
      parseEnv({ CART_COOKIE_SECRET: "secret-value" });
    } catch (error) {
      expect(String(error)).not.toContain("secret-value");
    }
  });
  it("verifies the exact raw bytes using constant-time HMAC comparison", () => {
    const raw = Buffer.from('{"id":1}');
    const signature = createHmac("sha256", "webhook-secret")
      .update(raw)
      .digest("base64");
    expect(verifyShopifyHmac(raw, signature, "webhook-secret")).toBe(true);
    expect(
      verifyShopifyHmac(Buffer.from('{ "id":1}'), signature, "webhook-secret"),
    ).toBe(false);
    expect(verifyShopifyHmac(raw, "invalid", "webhook-secret")).toBe(false);
    expect(verifyShopifyHmac(raw, null, "webhook-secret")).toBe(false);
  });
  it("requires explicit form consent, UUID idempotency token and an empty honeypot", () => {
    const form = {
      kind: "newsletter",
      email: "reader@example.com",
      consent: true,
      website: "",
      submissionId: "ff9007c8-90aa-456f-a41b-d295517b53da",
    };
    expect(formSchema.safeParse(form).success).toBe(true);
    expect(formSchema.safeParse({ ...form, website: "spam" }).success).toBe(
      false,
    );
    expect(formSchema.safeParse({ ...form, consent: false }).success).toBe(
      false,
    );
    expect(
      formSchema.safeParse({ ...form, submissionId: "same" }).success,
    ).toBe(false);
  });
  it("allows scene video origins only as media sources", () => {
    const directives = contentSecurityPolicy("nonce-value", true)
      .split("; ")
      .map((directive) => directive.split(" "));
    const media = directives.find(([name]) => name === "media-src")!;
    for (const scene of winterScenes) {
      for (const asset of [scene.media.desktop, scene.media.mobile]) {
        const origin = new URL(asset.video).origin;
        expect(media).toContain(origin);
        for (const directive of directives.filter(
          ([name]) => name !== "media-src",
        )) {
          expect(directive).not.toContain(origin);
        }
        expect(asset.poster).toMatch(/^\/media\/winter\/.*\.webp$/);
      }
    }
    expect(media).not.toContain("*");
    expect(media).not.toContain("https:");
  });
  it("uses nonce scripts and prevents framing and object embeds", () => {
    const policy = contentSecurityPolicy("nonce-value", true);
    expect(policy).toContain("'nonce-nonce-value'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  });
});
