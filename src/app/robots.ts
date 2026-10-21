import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { isStorefrontOpen } from "@/lib/commerce/launch";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  const production =
    isStorefrontOpen() &&
    process.env.DEPLOYMENT_ENV === "production" &&
    process.env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify";
  return {
    rules: {
      userAgent: "*",
      ...(production
        ? {
            allow: "/",
            disallow: [
              "/api/",
              "/*/cart",
              "/*/mock-checkout",
              "/*/build-a-box",
            ],
          }
        : { disallow: "/" }),
    },
    ...(production ? { sitemap: `${brand.siteUrl}/sitemap.xml` } : {}),
  };
}
