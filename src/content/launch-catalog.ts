import { launchBundlePhotos, launchSandChoices } from "./launch-bundle";
import type { Locale, LocalizedText, Product } from "@/types/commerce";

export const candleSandHandle = "candle-sand";
export const teakBowlHandle = "teakb-37-dekorativ-teakskal";

export const launchCatalogCopy = {
  sv: {
    label: "NOORLY · UTVALT FÖR LUGNA STUNDER",
    title: "Små detaljer. Din egen stund.",
    description:
      "Välj ljussand i din färg och doft, eller en dekorativ teakskål med naturlig karaktär. Produkterna köps var för sig.",
    cta: "Välj färg & doft",
    bowlCta: "Upptäck teakskålen",
    availability: "Förbeställning",
    imageNote:
      "Miljöbilden visar en stämning. Se produktbilderna för varje artikel.",
    sandCaption:
      "Bilden visar påsen och vaxkornen för vald färg och doft. Skål och andra tillbehör ingår inte.",
    bowlCaption:
      "Varje teakskål har sin egen form och ådring. Frukten på bilden är dekoration och ingår inte.",
  },
  en: {
    label: "NOORLY · SELECTED FOR SLOWER MOMENTS",
    title: "Little details. A moment of your own.",
    description:
      "Choose candle sand in your colour and scent, or a decorative teak bowl with natural character. Each product is sold separately.",
    cta: "Choose colour & scent",
    bowlCta: "Discover the teak bowl",
    availability: "Pre-order",
    imageNote:
      "Lifestyle imagery expresses a mood. See each item's product photographs.",
    sandCaption:
      "The photograph shows the pouch and wax granules for the selected colour and scent. A bowl and other accessories are not included.",
    bowlCaption:
      "Each teak bowl has its own shape and grain. The fruit in the photograph is styling and is not included.",
  },
} as const;

const sandTitle: LocalizedText = {
  sv: "Ljussand · 300 g",
  en: "Candle sand · 300 g",
};
const sandDescription: LocalizedText = {
  sv: "Skapa en egen ljusstund med 300 g ljussand i vald färg och doft. Varje påse innehåller fyra bomullsvekar.",
  en: "Create your own candle moment with 300 g of candle sand in your chosen colour and scent. Each pouch includes four cotton wicks.",
};
const bowlTitle: LocalizedText = {
  sv: "Dekorativ teakskål",
  en: "Decorative teak bowl",
};
const bowlDescription: LocalizedText = {
  sv: "En dekorativ skål i teak med mjuka former och naturlig ådring. En enkel detalj för bordet, hyllan eller en omtänksam gåva.",
  en: "A decorative teak bowl with soft contours and natural grain. A simple detail for your table, shelf or a thoughtful gift.",
};

/** Read-only fallback photographs and copy. Shopify alone supplies sellable variants. */
export const launchProductDefinitions: ReadonlyArray<{
  id: string;
  handle: string;
  preview: Product;
}> = [
  {
    id: "gid://shopify/Product/11382623273302",
    handle: candleSandHandle,
    preview: {
      id: "noorly-candle-sand-preview",
      handle: candleSandHandle,
      title: sandTitle,
      description: sandDescription,
      price: { amount: 199, currencyCode: "SEK" },
      images: [
        {
          url: launchSandChoices[0].photo.url,
          alt: launchSandChoices[0].photo.alt.sv,
        },
      ],
      variants: [],
      available: false,
      previewOnly: true,
      category: "signature",
      seasons: ["winter"],
      boxEligible: false,
    },
  },
  {
    id: "gid://shopify/Product/11401864216918",
    handle: teakBowlHandle,
    preview: {
      id: "noorly-teak-bowl-preview",
      handle: teakBowlHandle,
      title: bowlTitle,
      description: bowlDescription,
      price: { amount: 550, currencyCode: "SEK" },
      images: launchBundlePhotos.map((photo) => ({
        url: photo.url,
        alt: photo.alt.sv,
      })),
      variants: [],
      available: false,
      previewOnly: true,
      category: "extra",
      seasons: ["winter"],
      boxEligible: false,
    },
  },
];

export function launchCatalogHref(locale: Locale) {
  return `/${locale}/products/${candleSandHandle}`;
}

/** Presentation enriches exact SKUs without changing Shopify's prices, IDs or availability. */
export function presentCatalogProduct(
  product: Product,
  locale: Locale,
): Product {
  if (product.handle === candleSandHandle) {
    const variants = product.variants.map((variant) => {
      const choice = launchSandChoices.find((item) => item.sku === variant.sku);
      if (!choice) return variant;
      return {
        ...variant,
        label: choice.label,
        color: choice.color,
        scent: choice.scent,
        // One selected variant, one corresponding photograph. Other colours
        // and the decorative bowl do not belong in this variant's gallery.
        images: [{ url: choice.photo.url, alt: choice.photo.alt[locale] }],
      };
    });
    return {
      ...product,
      title: sandTitle,
      description: sandDescription,
      variants,
      images: variants[0]?.images?.length
        ? variants[0].images
        : product.images.slice(0, 1).map((image) => {
            const photo = launchSandChoices.find(
              (choice) => choice.photo.url === image.url,
            )?.photo;
            return photo ? { ...image, alt: photo.alt[locale] } : image;
          }),
      included: {
        sv: "300 g ljussand + fyra bomullsvekar. Kärl säljs inte med denna produkt.",
        en: "300 g candle sand + four cotton wicks. A candle vessel is not included.",
      },
      highlights: [
        { sv: "11 färg- och doftval", en: "11 colour and scent options" },
        { sv: "Fyra vekar ingår", en: "Four wicks included" },
      ],
      care: {
        sv: "Använd ett stabilt, obrännbart och värmetåligt ljuskärl. Följ instruktionerna på förpackningen och lämna aldrig levande ljus utan uppsikt.",
        en: "Use a stable, noncombustible, heat-resistant candle vessel. Follow the instructions on the packaging and never leave a burning candle unattended.",
      },
    };
  }
  if (product.handle === teakBowlHandle) {
    const images = product.images.map((image) => {
      const photo = launchBundlePhotos.find((known) => known.url === image.url);
      return photo ? { ...image, alt: photo.alt[locale] } : image;
    });
    return {
      ...product,
      title: bowlTitle,
      description: bowlDescription,
      images,
      variants: product.variants.map((variant) => ({ ...variant, images })),
      included: {
        sv: "En dekorativ teakskål. Ljussand, vekar och dekoration ingår inte.",
        en: "One decorative teak bowl. Candle sand, wicks and styling accessories are not included.",
      },
      highlights: [
        { sv: "Naturlig teak", en: "Natural teak" },
        { sv: "Varierande form och ådring", en: "Individual shape and grain" },
      ],
      care: {
        sv: "Hantera varsamt och torka försiktigt med en mjuk, torr trasa.",
        en: "Handle with care and wipe gently with a soft, dry cloth.",
      },
    };
  }
  return product;
}
