import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { getCommerceProvider } from "@/lib/commerce";
import { isStorefrontOpen } from "@/lib/commerce/launch";
import { getStorefrontCatalogue } from "@/lib/commerce/launch-product";
import { getManagedCatalog } from "@/lib/commerce/managed-catalog";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (
    !isStorefrontOpen() ||
    process.env.DEPLOYMENT_ENV !== "production" ||
    process.env.NEXT_PUBLIC_COMMERCE_PROVIDER !== "shopify"
  )
    return [];
  const managed = await getManagedCatalog();
  const products = await getStorefrontCatalogue(getCommerceProvider());
  const paths = [
    "",
    "/shop",
    ...(!managed ? ["/collections/winter"] : []),
    "/about",
    "/faq",
    "/shipping-returns",
    "/privacy",
    "/cookies",
    "/terms",
    "/accessibility",
    ...products
      .filter((p) => p.category !== "packaging")
      .map((p) => `/products/${p.handle}`),
  ];
  return brand.supportedLocales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${brand.siteUrl}/${locale}${path}`,
      alternates: {
        languages: {
          sv: `${brand.siteUrl}/sv${path}`,
          en: `${brand.siteUrl}/en${path}`,
        },
      },
    })),
  );
}
