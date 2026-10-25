import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  launchBundleCopy,
  launchBundleHref,
  launchBundlePhotos,
  launchSandChoices,
  plannedLaunchBundle,
} from "@/content/launch-bundle";
import type {
  Locale,
  Product,
  ProductImage,
  ProductVariant,
} from "@/types/commerce";
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

function sandPhotoChoice(image: ProductImage) {
  return launchSandChoices.find((choice) => choice.photo.url === image.url);
}

function variantSandChoice(variant: ProductVariant) {
  const values = [
    variant.sku ?? "",
    variant.title,
    ...(variant.selectedOptions?.map((option) => option.value) ?? []),
  ];
  const codes = new Set(
    values.flatMap((value) =>
      (value.match(/\bCSand-(?:0[1-9]|1[01])\b/gi) ?? []).map((code) =>
        code.toLowerCase(),
      ),
    ),
  );
  // Never guess between different components or match an ambiguous colour alone.
  if (codes.size > 1) return undefined;
  if (codes.size === 1)
    return launchSandChoices.find((choice) =>
      codes.has(choice.sku.toLowerCase()),
    );

  return launchSandChoices.find((choice) =>
    values.some((value) =>
      [choice.label.sv, choice.label.en].some(
        (label) => label.toLowerCase() === value.trim().toLowerCase(),
      ),
    ),
  );
}

function localizePhoto(image: ProductImage, locale: Locale): ProductImage {
  const supplierPhoto = launchBundlePhotos.find(
    (photo) => photo.url === image.url,
  );
  const knownPhoto = supplierPhoto ?? sandPhotoChoice(image)?.photo;
  return knownPhoto ? { ...image, alt: knownPhoto.alt[locale] } : image;
}

function uniquePhotos(images: ProductImage[]) {
  return images.filter(
    (image, index) =>
      images.findIndex((item) => item.url === image.url) === index,
  );
}

function presentVariant(
  variant: ProductVariant,
  locale: Locale,
): ProductVariant {
  const choice = variantSandChoice(variant);
  const images = variant.images?.map((image) => localizePhoto(image, locale));
  if (!choice) return { ...variant, images };
  return {
    ...variant,
    label: choice.label,
    color: choice.color,
    scent: choice.scent,
    images: uniquePhotos([
      { url: choice.photo.url, alt: choice.photo.alt[locale] },
      ...(images ?? []).filter((image) => {
        const photographedChoice = sandPhotoChoice(image);
        return !photographedChoice || photographedChoice.sku === choice.sku;
      }),
      ...launchBundlePhotos.map((photo) => ({
        url: photo.url,
        alt: photo.alt[locale],
      })),
    ]),
  };
}

function photoCaption(locale: Locale, images: ProductImage[]) {
  const copy = launchBundleCopy[locale];
  const bowlPhotos = images.some(isSupplierPhoto);
  const sandPhotos = images.some((image) => sandPhotoChoice(image));
  if (!bowlPhotos && !sandPhotos) return "";
  return [
    bowlPhotos ? copy.photoCaption : "",
    sandPhotos ? copy.sandPhotoCaption : "",
    images.every((image) => isSupplierPhoto(image) || sandPhotoChoice(image))
      ? copy.fullSetPhotos
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function PlannedBundleVisual({
  locale,
  product = plannedLaunchBundle,
}: {
  locale: Locale;
  product?: Product;
}) {
  const firstVariant = product.variants[0];
  const images =
    firstVariant && variantSandChoice(firstVariant)
      ? (presentVariant(firstVariant, locale).images ?? product.images)
      : product.images;
  if (images.length) {
    const caption = photoCaption(locale, images);
    return (
      <div className="planned-bundle-photos">
        <ProductGallery
          images={images.map((image) => localizePhoto(image, locale))}
          locale={locale}
          title={
            images.every(isSupplierPhoto)
              ? launchBundleCopy[locale].photoTitle
              : product.title[locale]
          }
        />
        {caption && (
          <div className="planned-bundle-photo-note">
            <p>{caption}</p>
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
  const variants = launch.product.variants.map((variant) =>
    presentVariant(variant, locale),
  );
  const variantPhotos = variants.flatMap((variant) => variant.images ?? []);
  const galleryImages = uniquePhotos(
    variants.length > 1 && variants.every((variant) => variant.images?.length)
      ? variantPhotos
      : [...launch.product.images, ...variantPhotos],
  );
  const caption = photoCaption(locale, galleryImages);
  const product: Product = {
    ...launch.product,
    images: launch.product.images.map((image) => localizePhoto(image, locale)),
    variants,
    ...(caption
      ? {
          included: {
            sv: [launch.product.included?.sv, photoCaption("sv", galleryImages)]
              .filter(Boolean)
              .join(" "),
            en: [launch.product.included?.en, photoCaption("en", galleryImages)]
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
