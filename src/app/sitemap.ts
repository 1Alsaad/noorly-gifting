import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { getCommerceProvider } from "@/lib/commerce";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (
    process.env.DEPLOYMENT_ENV !== "production" ||
    process.env.NEXT_PUBLIC_COMMERCE_PROVIDER !== "shopify"
  )
    return [];
  const products = await getCommerceProvider().getProducts();
  const paths = [
    "",
    "/shop",
    "/collections/winter",
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
