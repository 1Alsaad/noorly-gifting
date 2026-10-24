import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  launchBundleCopy,
  launchBundleHref,
  launchBundlePhotos,
  plannedLaunchBundle,
  supplierBowlUrl,
  supplierCandleSandUrl,
} from "@/content/launch-bundle";
import type { Locale, Product, ProductImage } from "@/types/commerce";
import type { LaunchProductState } from "@/lib/commerce/launch-product";
import { formatMoney } from "@/lib/utils/money";
import { brand } from "@/config/brand";
import { ProductGallery } from "./product-gallery";
import { ProductPresentation } from "./product-presentation";
import "./planned-bundle.css";

const preparation: LaunchProductState = {
  product: plannedLaunchBundle,
  source: "preparation",
  salesOpen: false,
  purchasable: false,
};

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

function unavailableCopy(locale: Locale, launch: LaunchProductState) {
  if (!launch.salesOpen) return launchBundleCopy[locale].status;
  return locale === "sv"
    ? "Det här presentsetet kan inte beställas just nu. Kontakta oss om du vill veta när det blir tillgängligt."
    : "This gift set is currently unavailable to order. Contact us to ask when it will be available.";
}

function isSupplierPhoto(image: ProductImage) {
  return launchBundlePhotos.some((photo) => photo.url === image.url);
}

function localizePhoto(image: ProductImage, locale: Locale): ProductImage {
  const supplierPhoto = launchBundlePhotos.find(
    (photo) => photo.url === image.url,
  );
  return supplierPhoto ? { ...image, alt: supplierPhoto.alt[locale] } : image;
}

function photoCaption(locale: Locale, images: ProductImage[]) {
  const copy = launchBundleCopy[locale];
  return `${copy.photoCaption}${images.every(isSupplierPhoto) ? ` ${copy.fullSetPhotos}` : ""}`;
}

export function PlannedBundleVisual({
  locale,
  product = plannedLaunchBundle,
}: {
  locale: Locale;
  product?: Product;
}) {
  if (product.images.length) {
    const supplierPhotos = product.images.some(isSupplierPhoto);
    return (
      <div className="planned-bundle-photos">
        <ProductGallery
          images={product.images.map((image) => localizePhoto(image, locale))}
          locale={locale}
          title={
            product.images.every(isSupplierPhoto)
              ? launchBundleCopy[locale].photoTitle
              : product.title[locale]
          }
        />
        {supplierPhotos && (
          <div className="planned-bundle-photo-note">
            <a href={supplierBowlUrl} target="_blank" rel="noopener noreferrer">
              {launchBundleCopy[locale].photoSource} ↗
            </a>
            <p>{photoCaption(locale, product.images)}</p>
          </div>
        )}
      </div>
    );
  }
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

export function PlannedBundleCard({
  locale,
  launch = preparation,
}: {
  locale: Locale;
  launch?: LaunchProductState;
}) {
  const copy = launchBundleCopy[locale];
  const { product } = launch;
  return (
    <article className="planned-bundle-feature">
      <PlannedBundleVisual locale={locale} product={product} />
      <div className="planned-bundle-copy">
        <p className="eyebrow">{copy.label}</p>
        <h2>{product.title[locale]}</h2>
        <p className="launch-product-description">
          {product.description[locale]}
        </p>
        <p className="planned-bundle-price">
          {launch.source === "shopify"
            ? formatMoney(product.price, locale)
            : copy.price}
        </p>
        {launch.source === "preparation" && (
          <div className="planned-bundle-preorder" role="note">
            <strong>{copy.preorderHeading}</strong>
            <p>{copy.preorderExplanation}</p>
          </div>
        )}
        <Link className="button button-dark" href={launchBundleHref(locale)}>
          {launch.purchasable
            ? locale === "sv"
              ? "Se innehåll och köp"
              : "View details and buy"
            : copy.cta}{" "}
          <ArrowUpRight size={17} />
        </Link>
        {!launch.purchasable && (
          <p className="product-note">{unavailableCopy(locale, launch)}</p>
        )}
      </div>
    </article>
  );
}

export function PlannedBundleDetails({
  locale,
  launch = preparation,
}: {
  locale: Locale;
  launch?: LaunchProductState;
}) {
  const copy = launchBundleCopy[locale];
  const supplierPhotos = launch.product.images.some(isSupplierPhoto);
  const product: Product = {
    ...launch.product,
    images: launch.product.images.map((image) => localizePhoto(image, locale)),
    variants: launch.product.variants.map((variant) => ({
      ...variant,
      images: variant.images?.map((image) => localizePhoto(image, locale)),
    })),
    ...(supplierPhotos
      ? {
          included: {
            sv: [
              launch.product.included?.sv,
              photoCaption("sv", launch.product.images),
            ]
              .filter(Boolean)
              .join(" "),
            en: [
              launch.product.included?.en,
              photoCaption("en", launch.product.images),
            ]
              .filter(Boolean)
              .join(" "),
          },
        }
      : {}),
  };
  return (
    <div className="section-wrap page-content launch-product-page">
      <nav
        className="breadcrumb"
        aria-label={locale === "sv" ? "Butik" : "Shop"}
      >
        <Link href={`/${locale}/shop`}>
          {locale === "sv" ? "Presentsetet" : "The gift set"}
        </Link>
        <span aria-hidden>/</span>
        <span>{product.title[locale]}</span>
      </nav>
      {launch.purchasable ? (
        <ProductPresentation product={product} locale={locale}>
          <section className="launch-product-care">
            <h2>
              {locale === "sv" ? "Användning och skötsel" : "Use and care"}
            </h2>
            <p>{copy.provenance}</p>
            {product.care && <p>{product.care[locale]}</p>}
          </section>
        </ProductPresentation>
      ) : (
        <div className="planned-bundle-feature">
          <PlannedBundleVisual locale={locale} product={product} />
          <div className="planned-bundle-copy">
            <p className="eyebrow">{copy.label}</p>
            <h1>{product.title[locale]}</h1>
            <p className="launch-product-description">
              {product.description[locale]}
            </p>
            <p className="planned-bundle-price">
              {launch.source === "shopify"
                ? formatMoney(product.price, locale)
                : copy.price}
            </p>
            {launch.source === "preparation" && (
              <div className="planned-bundle-preorder" role="note">
                <strong>{copy.preorderHeading}</strong>
                <p>{copy.preorderExplanation}</p>
              </div>
            )}
            <p className="product-note">{unavailableCopy(locale, launch)}</p>
            <div className="planned-bundle-interest">
              <a
                className="button button-dark"
                href={
                  launch.source === "preparation"
                    ? interestMailto(locale)
                    : `mailto:${brand.supportEmail}?subject=${encodeURIComponent(product.title[locale])}`
                }
              >
                {launch.source === "preparation"
                  ? copy.interestCta
                  : locale === "sv"
                    ? "Kontakta oss om Ljusstund"
                    : "Ask us about Ljusstund"}{" "}
                <ArrowUpRight size={17} />
              </a>
              <p className="product-note">{copy.interestNote}</p>
            </div>
            {launch.source === "preparation" && (
              <>
                <h2>{copy.contentsTitle}</h2>
                <ul className="planned-bundle-contents">
                  {copy.contents.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            <p>{copy.provenance}</p>
          </div>
        </div>
      )}
    </div>
  );
}
