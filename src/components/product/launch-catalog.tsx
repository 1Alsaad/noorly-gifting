import Link from "next/link";
import { ProductCard } from "./product-card";
import { ProductPresentation } from "./product-presentation";
import { ProductInspiration } from "./product-inspiration";
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
import { managedCatalogCopy } from "@/content/managed-catalog-copy";

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
            {product.managedCatalog
              ? managedCatalogCopy[locale].cta
              : product.handle === candleSandHandle
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
  offers,
}: {
  launch: LaunchProductState;
  locale: Locale;
  offers?: LaunchProductState[];
}) {
  const product = presentCatalogProduct(launch.product, locale);
  const t = getDictionary(locale);
  if (product.managedCatalog) {
    return (
      <div className="section-wrap page-content catalog-product-page">
        <nav className="breadcrumb" aria-label={t.shop}>
          <Link href={`/${locale}/shop`}>{t.shop}</Link>
          <span aria-hidden>/</span>
          <span>{product.title[locale]}</span>
        </nav>
        <ProductPresentation
          key={`${product.id}-${product.managedCatalog.version}`}
          product={product}
          locale={locale}
        >
          {product.care && (
            <details className="product-materials">
              <summary>
                {locale === "sv" ? "Användning och skötsel" : "Use and care"}
              </summary>
              <p>{product.care[locale]}</p>
            </details>
          )}
        </ProductPresentation>
        <div className="catalog-back-link">
          <Link className="text-link" href={`/${locale}/shop`}>
            {locale === "sv" ? "Se alla produkter" : "Explore all products"} ↗
          </Link>
        </div>
      </div>
    );
  }
  const sand = product.handle === candleSandHandle;
  const bundle = product.handle === launchBundleHandle;
  return (
    <div className="section-wrap page-content catalog-product-page">
      <nav className="breadcrumb" aria-label={t.shop}>
        <Link href={`/${locale}/shop`}>{t.shop}</Link>
        <span aria-hidden>/</span>
        <span>{product.title[locale]}</span>
      </nav>
      <ProductPresentation
        key={product.id}
        product={product}
        locale={locale}
        offers={
          !bundle
            ? offers?.map(({ product: item }) =>
                presentCatalogProduct(item, locale),
              )
            : undefined
        }
      >
        <details className="catalog-photo-details">
          <summary>
            {locale === "sv" ? "Om produktbilderna" : "About the photographs"}
          </summary>
          <p className="product-note catalog-photo-note">
            {bundle
              ? launchCatalogCopy[locale].bundleCaption
              : sand
                ? launchCatalogCopy[locale].sandCaption
                : launchCatalogCopy[locale].bowlCaption}
          </p>
        </details>
        {!bundle && !offers && (
          <Link
            className="text-link catalog-pair-link"
            href={`/${locale}/products/${launchBundleHandle}`}
          >
            {locale === "sv"
              ? "Se paketet med teakskål + ljussand"
              : "See the teak bowl + candle sand bundle"}{" "}
            ↗
          </Link>
        )}
      </ProductPresentation>
      <ProductInspiration locale={locale} />
      <div className="catalog-back-link">
        <Link className="text-link" href={`/${locale}/shop`}>
          {locale === "sv" ? "Se alla produkter" : "Explore all products"} ↗
        </Link>
      </div>
    </div>
  );
}
