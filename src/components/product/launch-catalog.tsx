import Link from "next/link";
import { ProductCard } from "./product-card";
import { ProductPresentation } from "./product-presentation";
import { CandleSandGuide } from "./candle-sand-guide";
import {
  candleSandHandle,
  launchCatalogCopy,
  presentCatalogProduct,
} from "@/content/launch-catalog";
import type { LaunchProductState } from "@/lib/commerce/launch-product";
import type { Locale } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
import { launchBundleHandle } from "@/content/launch-bundle";
import "./launch-catalog.css";

export function LaunchCatalogGrid({
  launches,
  locale,
}: {
  launches: LaunchProductState[];
  locale: Locale;
}) {
  return (
    <div className="launch-catalog-grid">
      {launches.map(({ product }) => (
        <div key={product.id}>
          <ProductCard
            product={presentCatalogProduct(product, locale)}
            locale={locale}
          />
          <Link
            className="text-link catalog-product-cta"
            href={`/${locale}/products/${product.handle}`}
          >
            {product.handle === candleSandHandle
              ? launchCatalogCopy[locale].cta
              : product.handle === launchBundleHandle
                ? launchCatalogCopy[locale].bundleCta
                : launchCatalogCopy[locale].bowlCta}{" "}
            ↗
          </Link>
        </div>
      ))}
    </div>
  );
}

export function LaunchProductDetails({
  launch,
  locale,
}: {
  launch: LaunchProductState;
  locale: Locale;
}) {
  const product = presentCatalogProduct(launch.product, locale);
  const t = getDictionary(locale);
  const sand = product.handle === candleSandHandle;
  const bundle = product.handle === launchBundleHandle;
  return (
    <div className="section-wrap page-content catalog-product-page">
      <nav className="breadcrumb" aria-label={t.shop}>
        <Link href={`/${locale}/shop`}>{t.shop}</Link>
        <span aria-hidden>/</span>
        <span>{product.title[locale]}</span>
      </nav>
      <ProductPresentation key={product.id} product={product} locale={locale}>
        <section className="catalog-use-note">
          <h2>
            {bundle
              ? locale === "sv"
                ? "Användning och skötsel"
                : "Use and care"
              : sand
                ? locale === "sv"
                  ? "Så använder du ljussand"
                  : "Using candle sand"
                : locale === "sv"
                  ? "Skötsel"
                  : "Care"}
          </h2>
          <p>{product.care?.[locale]}</p>
        </section>
        <p className="product-note catalog-photo-note">
          {bundle
            ? launchCatalogCopy[locale].bundleCaption
            : sand
              ? launchCatalogCopy[locale].sandCaption
              : launchCatalogCopy[locale].bowlCaption}
        </p>
      </ProductPresentation>
      {!bundle && (
        <aside className="catalog-bundle-offer">
          <div>
            <p className="eyebrow">
              {locale === "sv" ? "VÅRT PAKET" : "OUR BUNDLE"}
            </p>
            <h2>
              {locale === "sv"
                ? "Teakskål + ljussand"
                : "Teak bowl + candle sand"}
            </h2>
            <p>
              {locale === "sv"
                ? "Välj båda i ett paket: en dekorativ teakskål, 300 g ljussand i din färg och doft och fyra bomullsvekar."
                : "Choose both in one bundle: a decorative teak bowl, 300 g of candle sand in your chosen colour and scent, and four cotton wicks."}
            </p>
          </div>
          <Link
            className="button button-dark"
            href={`/${locale}/products/${launchBundleHandle}`}
          >
            {launchCatalogCopy[locale].bundleCta} ↗
          </Link>
        </aside>
      )}
      {(sand || bundle) && <CandleSandGuide locale={locale} />}
      <div className="catalog-back-link">
        <Link className="text-link" href={`/${locale}/shop`}>
          {locale === "sv" ? "Se alla produkter" : "Explore all products"} ↗
        </Link>
      </div>
    </div>
  );
}
