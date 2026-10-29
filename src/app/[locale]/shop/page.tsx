import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { LaunchCatalogGrid } from "@/components/product/launch-catalog";
import { launchCatalogCopy } from "@/content/launch-catalog";
import { getLaunchProducts } from "@/lib/commerce/launch-product";
import { pageMetadata } from "@/lib/seo/metadata";
import { TrackView } from "@/components/analytics/track-view";
import { getManagedCatalog } from "@/lib/commerce/managed-catalog";
import { managedCatalogCopy } from "@/content/managed-catalog-copy";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const managed = await getManagedCatalog();
  return pageMetadata(
    locale,
    "/shop",
    getDictionary(locale).shop,
    (managed ? managedCatalogCopy : launchCatalogCopy)[locale].description,
  );
}
export default async function Shop({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const managed = await getManagedCatalog();
  const launches = await getLaunchProducts();
  return (
    <div className="section-wrap page-content">
      <TrackView
        name="product_list_viewed"
        properties={{ locale, source: "shop", quantity: launches.length }}
      />
      <div className="page-heading">
        <p className="eyebrow">{t.edition}</p>
        <h1>{t.shop}</h1>
        <p>
          {
            (managed ? managedCatalogCopy : launchCatalogCopy)[locale]
              .description
          }
        </p>
      </div>
      <LaunchCatalogGrid locale={locale} launches={launches} />
      {managed && !launches.length && <p>{managedCatalogCopy[locale].empty}</p>}
    </div>
  );
}
