import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getDictionary, isLocale } from "@/content/translations";
import { LaunchCatalogGrid } from "@/components/product/launch-catalog";
import { launchCatalogCopy } from "@/content/launch-catalog";
import { getLaunchProducts } from "@/lib/commerce/launch-product";
import { pageMetadata } from "@/lib/seo/metadata";
import { TrackView } from "@/components/analytics/track-view";
import { colourProductHref, colourStories } from "@/content/colour-story";
import { launchSandChoices } from "@/content/launch-bundle";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(
    locale,
    "/shop",
    getDictionary(locale).shop,
    launchCatalogCopy[locale].description,
  );
}
export default async function Shop({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const launches = await getLaunchProducts();
  const sandProduct = launches.find(
    ({ product }) => product.handle === "candle-sand",
  )?.product;
  const featuredColours = colourStories
    .slice(0, 4)
    .filter(
      (story) =>
        !sandProduct ||
        sandProduct.previewOnly ||
        sandProduct.variants.some((variant) => variant.sku === story.sku),
    );
  return (
    <div className="section-wrap page-content shop-page">
      <TrackView
        name="product_list_viewed"
        properties={{ locale, source: "shop", quantity: launches.length }}
      />
      <nav
        className="breadcrumb"
        aria-label={locale === "sv" ? "Brödsmulor" : "Breadcrumb"}
      >
        <Link href={`/${locale}`}>{locale === "sv" ? "Hem" : "Home"}</Link>
        <span aria-hidden="true">/</span>
        <span>{locale === "sv" ? "Alla produkter" : "Shop all"}</span>
      </nav>
      <div className="shop-heading">
        <div>
          <p className="shop-kicker">
            {locale === "sv"
              ? "Lite färg i vardagen."
              : "A little everyday colour."}
          </p>
          <h1>{locale === "sv" ? "Alla produkter" : "Shop all"}</h1>
          <p>{launchCatalogCopy[locale].description}</p>
          <span className="shop-count">
            {launches.length} {locale === "sv" ? "produkter" : "products"}
          </span>
        </div>
        <figure className="shop-packaging">
          <Image
            src="/media/packaging/noorly-pouch-family-concept.webp"
            alt={
              locale === "sv"
                ? "Noorlys förpackningskoncept i gammalrosa, honung, mockabrun och vit"
                : "Noorly packaging concept in dusty rose, honey, mocha brown and white"
            }
            width={1536}
            height={1024}
            sizes="(max-width: 680px) 90vw, 50vw"
            loading="eager"
          />
          <figcaption>
            {locale === "sv"
              ? "Förpackningskoncept. Nuvarande förpackning visas på produktsidan."
              : "Packaging concept. The current packaging is shown on the product page."}
          </figcaption>
          <nav
            className="shop-packaging__colours"
            aria-label={
              locale === "sv" ? "Upptäck en färg" : "Explore a colour"
            }
          >
            {featuredColours.map((story) => {
              const choice = launchSandChoices.find(
                (choice) => choice.sku === story.sku,
              )!;
              return (
                <Link
                  key={story.sku}
                  href={colourProductHref(locale, story.sku)}
                  style={{
                    backgroundColor: story.background,
                    color: story.ink,
                  }}
                >
                  {choice.color.name[locale]}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </figure>
      </div>
      <LaunchCatalogGrid locale={locale} launches={launches} />
      <aside className="shop-assistance">
        <div>
          <h2>
            {locale === "sv" ? "Hjälp att välja?" : "Need a hand choosing?"}
          </h2>
          <p>
            {locale === "sv"
              ? "Vi hjälper dig med frågor om färg, doft och material."
              : "We're here for questions about colour, scent and materials."}
          </p>
        </div>
        <Link className="text-link" href={`/${locale}/contact`}>
          {locale === "sv" ? "Kontakta oss" : "Contact us"}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </aside>
    </div>
  );
}
