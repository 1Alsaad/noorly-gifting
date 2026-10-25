import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Gift, Package, Clock3, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/content/translations";
import { LaunchCatalogGrid } from "@/components/product/launch-catalog";
import {
  launchCatalogCopy,
  launchCatalogHref,
  presentCatalogProduct,
} from "@/content/launch-catalog";
import { getLaunchProducts } from "@/lib/commerce/launch-product";
import { StructuredData } from "@/components/ui/structured-data";
import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(
    locale,
    "",
    launchCatalogCopy[locale].title,
    launchCatalogCopy[locale].description,
  );
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const launches = await getLaunchProducts();
  const products = launches.map(({ product }) =>
    presentCatalogProduct(product, locale),
  );
  const heroImage = products[0]?.images[0];
  const copy = launchCatalogCopy[locale];
  const trustIcons = [Gift, Package, Clock3];
  const trust = launches.some((launch) => launch.source === "shopify")
    ? locale === "sv"
      ? ["Utvalt av Noorly", "Se innehåll och produktbilder", "Säker betalning"]
      : [
          "Selected by Noorly",
          "Explore the contents and photographs",
          "Secure payment",
        ]
    : t.home.trust;
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: brand.name,
          url: brand.siteUrl,
        }}
      />
      <section
        className="catalog-home section-wrap"
        aria-labelledby="home-title"
      >
        <div className="catalog-home-copy">
          <p className="eyebrow">{copy.label}</p>
          <h1 id="home-title">{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="catalog-home-actions">
            <Link
              className="button button-dark"
              href={launchCatalogHref(locale)}
            >
              {copy.cta}
              <ArrowUpRight size={17} />
            </Link>
            <a className="text-link" href="#gifts">
              {locale === "sv"
                ? "Upptäck kollektionen"
                : "Explore the collection"}
              <ArrowRight size={17} />
            </a>
          </div>
          <p className="product-note">{t.deliveryText}</p>
        </div>
        {heroImage && (
          <Link className="catalog-home-photo" href={launchCatalogHref(locale)}>
            <Image
              src={heroImage.url}
              alt={heroImage.alt}
              fill
              sizes="(max-width: 760px) 88vw, 45vw"
              loading="eager"
            />
          </Link>
        )}
      </section>
      <div>
        <div className="trust-bar">
          {trust.map((text, i) => {
            const Icon = trustIcons[i];
            return (
              <div key={text}>
                <Icon size={18} strokeWidth={1.2} />
                <span>{text}</span>
              </div>
            );
          })}
        </div>
        <section
          className="section-wrap collection-section"
          id="gifts"
          tabIndex={-1}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">{launchCatalogCopy[locale].label}</p>
              <h2>{launchCatalogCopy[locale].title}</h2>
              <p>{launchCatalogCopy[locale].description}</p>
            </div>
          </div>
          <LaunchCatalogGrid locale={locale} launches={launches} />
        </section>
      </div>
      <section className="story-section section-wrap">
        <p className="eyebrow">{t.home.storyLabel}</p>
        <h2>{t.home.storyTitle}</h2>
        <p>{t.home.storyText}</p>
        <Link className="text-link" href={`/${locale}/about`}>
          {t.home.storyCta}
          <ArrowUpRight size={17} />
        </Link>
        <div className="story-mark" aria-hidden>
          ∗
        </div>
      </section>
      <section className="corporate-callout section-wrap">
        <div>
          <p className="eyebrow">{t.corporate}</p>
          <h2>{t.home.corporateTitle}</h2>
        </div>
        <div>
          <p>{t.home.corporateText}</p>
          <Link className="text-link" href={`/${locale}/corporate-gifting`}>
            {t.corporate}
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
