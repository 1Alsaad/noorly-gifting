import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { PlannedBundleCard } from "@/components/product/planned-bundle";
import { getLaunchProduct } from "@/lib/commerce/launch-product";
import { pageMetadata } from "@/lib/seo/metadata";
import { TrackView } from "@/components/analytics/track-view";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { product } = await getLaunchProduct();
  return pageMetadata(
    locale,
    "/shop",
    getDictionary(locale).shop,
    product.description[locale],
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
  const launch = await getLaunchProduct();
  return (
    <div className="section-wrap page-content">
      <TrackView
        name="product_list_viewed"
        properties={{ locale, source: "shop", quantity: 1 }}
      />
      <div className="page-heading">
        <p className="eyebrow">{t.edition}</p>
        <h1>{t.shop}</h1>
        <p>{launch.product.description[locale]}</p>
      </div>
      <PlannedBundleCard locale={locale} launch={launch} />
    </div>
  );
}
