import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Gift,
  PenLine,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getCommerceProvider } from "@/lib/commerce";
import { getContentRepository } from "@/lib/content";
import { getDictionary, isLocale } from "@/content/translations";
import { ProductCard } from "@/components/product/product-card";
import { CinematicExperience } from "@/components/cinematic/cinematic-experience";
import { EnquiryForm } from "@/components/forms/enquiry-form";
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
  return pageMetadata(locale, "", t.home.title.replace("\n", " "), t.home.text);
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [products, season] = await Promise.all([
    getCommerceProvider().getProducts(),
    getContentRepository().getActiveSeason(),
  ]);
  const boxes = products.filter((p) => p.category === "box");
  const trustIcons = [Gift, PenLine, ShieldCheck];
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
      <div className="trust-bar">
        {t.home.trust.map((text, i) => {
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
            <p className="eyebrow">{t.home.curatedLabel}</p>
            <h2>{t.home.curated}</h2>
            <p className="section-intro">{t.home.curatedText}</p>
          </div>
          <Link className="text-link" href={`/${locale}/shop`}>
            {t.home.viewAll}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid three">
          {boxes.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              index={index}
            />
          ))}
        </div>
      </section>
      <section className="builder-feature">
        <div className="builder-feature-image">
          <Image
            src="/media/products/gift-box-editorial.webp"
            alt={t.builder}
            fill
            sizes="(max-width:760px) 100vw, 50vw"
          />
          <span className="image-note">{t.edition}</span>
        </div>
        <div className="builder-feature-copy">
          <p className="eyebrow">{t.home.buildLabel}</p>
          <h2>{t.home.buildTitle}</h2>
          <p>{t.home.buildText}</p>
          <Link className="button button-dark" href={`/${locale}/build-a-box`}>
            {t.home.buildCta}
            <ArrowUpRight size={17} />
          </Link>
          <span className="build-footnote">{t.delivery}</span>
        </div>
      </section>
      <section className="story-section section-wrap">
        <p className="eyebrow">{t.home.storyLabel}</p>
        <h2>{t.home.storyTitle}</h2>
        <p>{t.home.storyText}</p>
        <Link className="text-link" href={`/${locale}/about`}>
          {t.home.storyCta.replace("STILLA", brand.name)}
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
      <section className="newsletter section-wrap">
        <div>
          <p className="eyebrow">
            {brand.name} / {t.edition}
          </p>
          <h2>{t.home.newsletterTitle}</h2>
          <p>{t.home.newsletterText}</p>
        </div>
        <EnquiryForm locale={locale} kind="newsletter" />
      </section>
    </>
  );
}
