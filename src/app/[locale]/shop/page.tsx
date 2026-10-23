import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { PlannedBundleCard } from "@/components/product/planned-bundle";
import { launchBundleCopy } from "@/content/launch-bundle";
import { pageMetadata } from "@/lib/seo/metadata";
import { TrackView } from "@/components/analytics/track-view";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return isLocale(locale)
    ? pageMetadata(
        locale,
        "/shop",
        getDictionary(locale).shop,
        launchBundleCopy[locale].description,
      )
    : {};
}
export default async function Shop({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="section-wrap page-content">
      <TrackView
        name="product_list_viewed"
        properties={{ locale, source: "shop", quantity: 1 }}
      />
      <div className="page-heading">
        <p className="eyebrow">{t.edition}</p>
        <h1>{t.shop}</h1>
        <p>{launchBundleCopy[locale].description}</p>
      </div>
      <PlannedBundleCard locale={locale} />
    </div>
  );
}
