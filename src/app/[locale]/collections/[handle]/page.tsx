import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { getContentRepository } from "@/lib/content";
import { getCommerceProvider } from "@/lib/commerce";
import { ProductCard } from "@/components/product/product-card";
import { TrackView } from "@/components/analytics/track-view";
import { pageMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  return isLocale(locale)
    ? pageMetadata(
        locale,
        `/collections/${handle}`,
        getDictionary(locale).collection,
        getDictionary(locale).collectionText,
      )
    : {};
}
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();
  const season = await getContentRepository().getSeasonBySlug(handle);
  if (!season) notFound();
  const t = getDictionary(locale);
  const products = (await getCommerceProvider().getProducts()).filter(
    (p) => p.category !== "packaging" && p.seasons.includes(season.id),
  );
  return (
    <>
      <TrackView
        name="seasonal_collection_viewed"
        properties={{ locale, season_id: season.id }}
      />
      <div className="collection-hero">
        <Image
          src="/media/winter/candle-room-poster-desktop.webp"
          alt=""
          fill
          sizes="100vw"
          priority
        />
        <div>
          <p className="eyebrow">{t.collectionLabel}</p>
          <h1>{t.collectionTitle}</h1>
          <p>{t.collectionText}</p>
        </div>
      </div>
      <section className="section-wrap page-content">
        <div className="section-heading">
          <h2>{t.collection}</h2>
        </div>
        <div className="product-grid three">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </section>
    </>
  );
}
