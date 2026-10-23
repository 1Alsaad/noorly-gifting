import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { launchBundleCopy, launchBundleHref } from "@/content/launch-bundle";
import type { Locale } from "@/types/commerce";
import "./planned-bundle.css";

export function PlannedBundleVisual({ locale }: { locale: Locale }) {
  return (
    <div className="planned-bundle-visual">
      <span className="eyebrow">NOORLY</span>
      <span className="planned-bundle-mark">Ljusstund</span>
      <p>{launchBundleCopy[locale].photos}</p>
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
          <p className="product-note">{copy.status}</p>
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
