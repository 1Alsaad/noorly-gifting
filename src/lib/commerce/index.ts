import "server-only";
import { getEnv } from "@/lib/env/server";
import type { CommerceProvider } from "@/types/commerce";
import { MockCommerceProvider } from "./providers/mock";
import { ShopifyCommerceProvider } from "./providers/shopify";

export function getCommerceProvider(): CommerceProvider {
  const env = getEnv();
  if (env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify") {
    return new ShopifyCommerceProvider({
      domain: env.SHOPIFY_STORE_DOMAIN!,
      token: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      apiVersion: env.SHOPIFY_STOREFRONT_API_VERSION,
    });
  }
  return new MockCommerceProvider(
    env.CART_COOKIE_SECRET || "local-development-cookie-key-do-not-deploy",
  );
}
