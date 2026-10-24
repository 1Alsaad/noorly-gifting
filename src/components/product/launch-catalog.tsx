import Link from "next/link";
import { ProductCard } from "./product-card";
import { ProductPresentation } from "./product-presentation";
import {
  candleSandHandle,
  launchCatalogCopy,
  presentCatalogProduct,
} from "@/content/launch-catalog";
import type { LaunchProductState } from "@/lib/commerce/launch-product";
import type { Locale } from "@/types/commerce";
import { getDictionary } from "@/content/translations";
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
            {sand
              ? locale === "sv"
                ? "Så använder du ljussand"
                : "Using candle sand"
              : locale === "sv"
                ? "För dekoration"
                : "For decoration"}
          </h2>
          <p>{product.care?.[locale]}</p>
        </section>
        <p className="product-note catalog-photo-note">
          {sand
            ? launchCatalogCopy[locale].sandCaption
            : launchCatalogCopy[locale].bowlCaption}
        </p>
      </ProductPresentation>
      <div className="catalog-back-link">
        <Link className="text-link" href={`/${locale}/shop`}>
          {locale === "sv" ? "Se båda produkterna" : "Explore both products"} ↗
        </Link>
      </div>
    </div>
  );
}
