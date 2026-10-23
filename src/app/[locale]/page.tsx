import Link from "next/link";
import { ArrowUpRight, Gift, Package, Clock3, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { getContentRepository } from "@/lib/content";
import { getDictionary, isLocale } from "@/content/translations";
import { PlannedBundleCard } from "@/components/product/planned-bundle";
import { launchBundleCopy, plannedLaunchBundle } from "@/content/launch-bundle";
import { CinematicExperience } from "@/components/cinematic/cinematic-experience";
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
  const t = getDictionary(locale);
  return pageMetadata(
    locale,
    "",
    t.home.title.replace("\n", " "),
    launchBundleCopy[locale].description,
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
  const season = await getContentRepository().getActiveSeason();
  const products = [plannedLaunchBundle];
  const trustIcons = [Gift, Package, Clock3];
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
      <div className="cinema-collection-handoff">
        <div className="trust-bar">
          {launchBundleCopy[locale].trust.map((text, i) => {
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
          <PlannedBundleCard locale={locale} />
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
      <section className="reviews-placeholder section-wrap">
        <span className="eyebrow">{t.home.reviewsLabel}</span>
        <p className="review-quote">{t.home.reviews}</p>
        <p>{t.home.reviewsText}</p>
      </section>
    </>
  );
}
