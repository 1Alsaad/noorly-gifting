import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  launchBundleCopy,
  launchBundleHref,
  supplierBowlUrl,
  supplierCandleSandUrl,
} from "@/content/launch-bundle";
import type { Locale } from "@/types/commerce";
import { brand } from "@/config/brand";
import "./planned-bundle.css";

function interestMailto(locale: Locale) {
  const subject =
    locale === "sv"
      ? "Noorly Ljusstund – intresse för 799 kr"
      : "Noorly Ljusstund – interest at SEK 799";
  const body =
    locale === "sv"
      ? "Hej Noorly! Jag är intresserad av Ljusstund till det planerade priset 799 kr. Jag förstår att detta inte är en beställning eller reservation."
      : "Hello Noorly! I am interested in Ljusstund at the planned SEK 799 price. I understand this is not an order or reservation.";
  return `mailto:${brand.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function PlannedBundleVisual({ locale }: { locale: Locale }) {
  return (
    <div className="planned-bundle-visual">
      <span className="eyebrow">NOORLY</span>
      <span className="planned-bundle-mark">Ljusstund</span>
      <p>{launchBundleCopy[locale].photos}</p>
      <div className="planned-bundle-source-links">
        <a href={supplierBowlUrl} target="_blank" rel="noopener noreferrer">
          {launchBundleCopy[locale].supplierLink} ↗
        </a>
        <a
          href={supplierCandleSandUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {launchBundleCopy[locale].supplierSandLink} ↗
        </a>
      </div>
    </div>
  );
}

export function PlannedBundleCard({ locale }: { locale: Locale }) {
  const copy = launchBundleCopy[locale];
  return (
    <article className="planned-bundle-feature">
      <PlannedBundleVisual locale={locale} />
      <div className="planned-bundle-copy">
        <p className="eyebrow">{copy.label}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <p className="planned-bundle-price">{copy.price}</p>
        <div className="planned-bundle-preorder" role="note">
          <strong>{copy.preorderHeading}</strong>
          <p>{copy.preorderExplanation}</p>
        </div>
        <Link className="button button-dark" href={launchBundleHref(locale)}>
          {copy.cta} <ArrowUpRight size={17} />
        </Link>
        <p className="product-note">{copy.status}</p>
      </div>
    </article>
  );
}

export function PlannedBundleDetails({ locale }: { locale: Locale }) {
  const copy = launchBundleCopy[locale];
  return (
    <div className="section-wrap page-content">
      <nav
        className="breadcrumb"
        aria-label={locale === "sv" ? "Butik" : "Shop"}
      >
        <Link href={`/${locale}/shop`}>
          {locale === "sv" ? "Presentsetet" : "The gift set"}
        </Link>
        <span aria-hidden>/</span>
        <span>{copy.title}</span>
      </nav>
      <div className="planned-bundle-feature">
        <PlannedBundleVisual locale={locale} />
        <div className="planned-bundle-copy">
          <p className="eyebrow">{copy.label}</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <p className="planned-bundle-price">{copy.price}</p>
          <div className="planned-bundle-preorder" role="note">
            <strong>{copy.preorderHeading}</strong>
            <p>{copy.preorderExplanation}</p>
          </div>
          <p className="product-note">{copy.status}</p>
          <div className="planned-bundle-interest">
            <a className="button button-dark" href={interestMailto(locale)}>
              {copy.interestCta} <ArrowUpRight size={17} />
            </a>
            <p className="product-note">{copy.interestNote}</p>
          </div>
          <h2>{copy.contentsTitle}</h2>
          <ul className="planned-bundle-contents">
            {copy.contents.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{copy.provenance}</p>
        </div>
      </div>
    </div>
  );
}
