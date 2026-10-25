import {
  launchBundleHandle,
  legacyLaunchBundleHandle,
} from "@/content/launch-bundle";
import { LaunchProductDetails } from "@/components/product/launch-catalog";
import {
  candleSandHandle,
  launchProductDefinitions,
  presentCatalogProduct,
} from "@/content/launch-catalog";
import { isProductTestMode } from "@/config/product-test";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCommerceProvider } from "@/lib/commerce";
import { getLaunchProduct } from "@/lib/commerce/launch-product";
import { getDictionary, isLocale } from "@/content/translations";
import { ProductPresentation } from "@/components/product/product-presentation";
import { ProductCard } from "@/components/product/product-card";
import { StructuredData } from "@/components/ui/structured-data";
import { TrackView } from "@/components/analytics/track-view";
import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo/metadata";
type Props = { params: Promise<{ locale: string; handle: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) return {};
  if (handle === legacyLaunchBundleHandle)
    return pageMetadata(
      locale,
      `/products/${launchBundleHandle}`,
      getDictionary(locale).shop,
      "",
    );
  if (launchProductDefinitions.some((item) => item.handle === handle)) {
    const launch = await getLaunchProduct(handle);
    const product = presentCatalogProduct(launch.product, locale);
    const metadata = pageMetadata(
      locale,
      `/products/${handle}`,
      product.title[locale],
      product.description[locale],
    );
    return {
      ...metadata,
      openGraph: {
        ...metadata.openGraph,
        images: product.images.map((image) => ({
          url: image.url,
          alt: image.alt,
        })),
      },
    };
  }
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
  if (handle === legacyLaunchBundleHandle)
    redirect(`/${locale}/products/${launchBundleHandle}`);
  const provider = getCommerceProvider();
  // The existing local mock catalogue remains useful for preview checkout tests.
  // Public routes resolve the verified separate products and their native bundle.
  if (
    launchProductDefinitions.some((item) => item.handle === handle) &&
    (provider.name === "shopify" ||
      process.env.NOORLY_PUBLIC_PREVIEW === "true" ||
      handle !== candleSandHandle)
  ) {
    const launch = await getLaunchProduct(handle);
    const product = presentCatalogProduct(launch.product, locale);
    return (
      <>
        {launch.source === "shopify" && (
          <>
            <TrackView
              name="product_viewed"
              properties={{
                locale,
                product_id: product.id,
                product_handle: handle,
                currency: product.price.currencyCode,
                value: product.price.amount,
              }}
            />
            <StructuredData
              data={{
                "@context": "https://schema.org",
                "@type": "Product",
                name: product.title[locale],
                description: product.description[locale],
                image: product.images.map((image) => image.url),
                ...(launch.purchasable
                  ? {
                      offers: product.variants
                        .filter((variant) => variant.available)
                        .map((variant) => ({
                          "@type": "Offer",
                          price: variant.price.amount,
                          priceCurrency: variant.price.currencyCode,
                          url: `${brand.siteUrl}/${locale}/products/${handle}`,
                          availability: "https://schema.org/PreOrder",
                        })),
                    }
                  : {}),
              }}
            />
          </>
        )}
        <LaunchProductDetails locale={locale} launch={launch} />
      </>
    );
  }
  if (process.env.NOORLY_PUBLIC_PREVIEW === "true") notFound();
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
          ...(!isProductTestMode() && !product.previewOnly
            ? {
                offers: {
                  "@type": "Offer",
                  price: product.price.amount,
                  priceCurrency: product.price.currencyCode,
                  url,
                  availability: product.available
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              }
            : {}),
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
      <ProductPresentation product={product} locale={locale}>
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
        {product.care && (
          <details className="product-materials">
            <summary>
              {locale === "sv"
                ? "Så använder du ljussand"
                : "How to use candle sand"}
            </summary>
            <p>{product.care[locale]}</p>
          </details>
        )}
      </ProductPresentation>
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
