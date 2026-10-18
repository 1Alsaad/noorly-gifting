import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommerceProvider } from "@/lib/commerce";
import { getDictionary, isLocale } from "@/content/translations";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductCard } from "@/components/product/product-card";
import { StructuredData } from "@/components/ui/structured-data";
import { TrackView } from "@/components/analytics/track-view";
import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo/metadata";
type Props = { params: Promise<{ locale: string; handle: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) return {};
  const p = await getCommerceProvider().getProductByHandle(handle);
  return p
    ? pageMetadata(
        locale,
        `/products/${handle}`,
        p.title[locale],
        p.description[locale],
      )
    : {};
}
export default async function ProductDetail({ params }: Props) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();
  const provider = getCommerceProvider();
  const product = await provider.getProductByHandle(handle);
  if (!product) notFound();
  const t = getDictionary(locale);
  const related = (await provider.getProducts())
    .filter((p) => p.category === "box" && p.handle !== handle)
    .slice(0, 3);
  const url = `${brand.siteUrl}/${locale}/products/${product.handle}`;
  return (
    <div className="section-wrap page-content">
      <TrackView
        name="product_viewed"
        properties={{
          locale,
          product_id: product.id,
          product_handle: handle,
          currency: "SEK",
          value: product.price.amount,
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title[locale],
          description: product.description[locale],
          image: product.images.map((i) => new URL(i.url, brand.siteUrl).href),
          sku: product.id,
          offers: {
            "@type": "Offer",
            price: product.price.amount,
            priceCurrency: product.price.currencyCode,
            url,
            availability: product.available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: t.shop,
              item: `${brand.siteUrl}/${locale}/shop`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: product.title[locale],
              item: url,
            },
          ],
        }}
      />
      <nav className="breadcrumb" aria-label={t.shop}>
        <Link href={`/${locale}/shop`}>{t.shop}</Link>
        <span aria-hidden>/</span>
        <span>{product.title[locale]}</span>
      </nav>
      <div className="product-detail">
        <div className="product-detail-image">
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt}
            fill
            sizes="(max-width:760px) 90vw, 50vw"
            priority
          />
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">
            {product.category === "box" ? t.boxes : t.edition}
          </p>
          <h1>{product.title[locale]}</h1>
          <p>{product.description[locale]}</p>
          <ProductPurchase product={product} locale={locale} />
          <div className="delivery-note">
            <h2>{t.delivery}</h2>
            <p>{t.deliveryText}</p>
            <Link className="text-link" href={`/${locale}/shipping-returns`}>
              {t.footer.shipping} ↗
            </Link>
          </div>
          <details className="product-materials">
            <summary>{t.materials}</summary>
            <p>{product.fulfilment?.materials[locale] ?? t.materialText}</p>
          </details>
        </div>
      </div>
      <section className="related-products">
        <div className="section-heading">
          <h2>{t.related}</h2>
        </div>
        <div className="product-grid three">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
