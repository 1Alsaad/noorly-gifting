import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
export default function robots(): MetadataRoute.Robots {
  const production =
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
