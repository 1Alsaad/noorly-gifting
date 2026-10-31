import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getContentRepository } from "@/lib/content";
import { getDictionary, isLocale } from "@/content/translations";
import { LaunchCatalogGrid } from "@/components/product/launch-catalog";
import { CandleSandGuide } from "@/components/product/candle-sand-guide";
import {
  launchCatalogCopy,
  presentCatalogProduct,
} from "@/content/launch-catalog";
import { getLaunchProducts } from "@/lib/commerce/launch-product";
import { CinematicExperience } from "@/components/cinematic/cinematic-experience";
import { ColourStudio } from "@/components/home/colour-studio";
import { MaterialStory } from "@/components/home/material-story";
import { PurchaseAnswers } from "@/components/product/purchase-confidence";
import { StructuredData } from "@/components/ui/structured-data";
import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo/metadata";
import "@/components/home/storefront.css";
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
    locale === "sv" ? "Ljussand & teakskålar" : "Candle sand & teak bowls",
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
  const [season, launches] = await Promise.all([
    getContentRepository().getActiveSeason(),
    getLaunchProducts(),
  ]);
  const products = launches.map(({ product }) =>
    presentCatalogProduct(product, locale),
  );
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
      <CinematicExperience
        locale={locale}
        products={products}
        scenes={season.scenes}
      />
      <div className="storefront-shopping cinema-collection-handoff">
        <ColourStudio
          locale={locale}
          product={products.find((product) => product.handle === "candle-sand")}
        />
        <section
          className="section-wrap collection-section storefront-collection"
          id="gifts"
          tabIndex={-1}
        >
          <div className="section-heading">
            <div>
              <p className="campaign-chapter">
                <span>02</span>
                {locale === "sv" ? "Kollektionen" : "The collection"}
              </p>
              <h2>{launchCatalogCopy[locale].title}</h2>
              <p>{launchCatalogCopy[locale].description}</p>
            </div>
            <Link className="text-link" href={`/${locale}/shop`}>
              {locale === "sv" ? "Se alla produkter" : "Shop all"}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <LaunchCatalogGrid locale={locale} launches={launches} />
          <p className="storefront-dispatch">{t.deliveryText}</p>
        </section>
      </div>
      <MaterialStory locale={locale} />
      <CandleSandGuide locale={locale} editorial />
      <section className="storefront-faq section-wrap">
        <div>
          <h2>{locale === "sv" ? "Bra att veta" : "Good to know"}</h2>
          <Link className="text-link" href={`/${locale}/contact`}>
            {locale === "sv" ? "Kontakta oss" : "Contact us"}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <PurchaseAnswers locale={locale} />
      </section>
    </>
  );
}
