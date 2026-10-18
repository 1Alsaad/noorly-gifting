import { z } from "zod";

const optional = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);
const optionalUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.url().optional(),
);
export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DEPLOYMENT_ENV: z
      .enum(["development", "preview", "production"])
      .default("development"),
    NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_BRAND_NAME: z.string().default("Stilla"),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["sv", "en"]).default("sv"),
    NEXT_PUBLIC_COMMERCE_PROVIDER: z.enum(["mock", "shopify"]).default("mock"),
    ALLOW_MOCK_COMMERCE: z.preprocess(
      (v) => v === "true" || v === true,
      z.boolean(),
    ),
    SHOPIFY_STORE_DOMAIN: optional,
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: optional,
    SHOPIFY_STOREFRONT_API_VERSION: z.preprocess(
      (v) => v || undefined,
      z
        .string()
        .regex(/^\d{4}-(01|04|07|10)$/)
        .default("2026-07"),
    ),
    SHOPIFY_WEBHOOK_SECRET: optional,
    CART_COOKIE_SECRET: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().min(32).optional(),
    ),
    NEXT_PUBLIC_GA4_MEASUREMENT_ID: optional,
    GA4_API_SECRET: optional,
    NEXT_PUBLIC_POSTHOG_KEY: optional,
    NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
    NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
    SENTRY_AUTH_TOKEN: optional,
    RATE_LIMIT_PROVIDER_URL: optionalUrl,
    RATE_LIMIT_PROVIDER_TOKEN: optional,
    FORM_DELIVERY_URL: optionalUrl,
    FORM_DELIVERY_TOKEN: optional,
    ANALYTICS_DELIVERY_URL: optionalUrl,
    ANALYTICS_DELIVERY_TOKEN: optional,
    OUTBOX_CRON_SECRET: optional,
  })
  .superRefine((env, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify") {
      if (
        !env.SHOPIFY_STORE_DOMAIN ||
        !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(env.SHOPIFY_STORE_DOMAIN)
      )
        issue(
          "SHOPIFY_STORE_DOMAIN",
          "Use the shop-name.myshopify.com hostname",
        );
      if (!env.SHOPIFY_STOREFRONT_ACCESS_TOKEN)
        issue("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "Required for Shopify");
    }
    if (env.NODE_ENV === "production") {
      if (
        env.NEXT_PUBLIC_COMMERCE_PROVIDER === "mock" &&
        !env.ALLOW_MOCK_COMMERCE
      )
        issue(
          "ALLOW_MOCK_COMMERCE",
          "Production mock requires explicit opt-in",
        );
      if (!env.CART_COOKIE_SECRET)
        issue("CART_COOKIE_SECRET", "Required in production");
      for (const field of [
        "RATE_LIMIT_PROVIDER_URL",
        "FORM_DELIVERY_URL",
        "ANALYTICS_DELIVERY_URL",
      ] as const) {
        if (env[field] && !env[field].startsWith("https://"))
          issue(field, "Production provider endpoints require HTTPS");
      }
      if (
        !env.ALLOW_MOCK_COMMERCE &&
        !env.NEXT_PUBLIC_SITE_URL.startsWith("https://")
      )
        issue("NEXT_PUBLIC_SITE_URL", "Production requires HTTPS");
    }
  });
export type Environment = z.infer<typeof envSchema>;

export function parseEnv(values: Record<string, unknown>): Environment {
  const result = envSchema.safeParse(values);
  if (!result.success) {
    // Only field names are disclosed. Values can contain credentials.
    throw new Error(
      `Invalid configuration: ${[...new Set(result.error.issues.map((i) => i.path.join(".")))].join(", ")}`,
    );
  }
  return result.data;
}
