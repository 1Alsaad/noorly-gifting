import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDictionary, isLocale } from "@/content/translations";
import { LaunchCatalogGrid } from "@/components/product/launch-catalog";
import { launchCatalogCopy } from "@/content/launch-catalog";
import { getLaunchProducts } from "@/lib/commerce/launch-product";
import { pageMetadata } from "@/lib/seo/metadata";
import { TrackView } from "@/components/analytics/track-view";
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
          <h1>{locale === "sv" ? "Alla produkter" : "Shop all"}</h1>
          <p>{launchCatalogCopy[locale].description}</p>
        </div>
        <span className="shop-count">
          {launches.length} {locale === "sv" ? "produkter" : "products"}
        </span>
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
