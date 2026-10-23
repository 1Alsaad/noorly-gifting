import type { Locale, Product } from "@/types/commerce";

// Matches the separate Shopify draft, not the old AW Gifts candle-sand product.
export const launchBundleHandle =
  "noorly-ljusstund-presentset-med-glasskal-och-tva-dofter";

export const launchBundleCopy = {
  sv: {
    label: "PLANERAT PRESENTSET",
    title: "Noorly Ljusstund",
    description:
      "En glasskål, två dofter och en liten stund att ge bort. Vi planerar ett presentset med ELYSIA och två förseglade refillpåsar från The Candledust.",
    price: "Planerat pris: 799 kr inklusive leverans inom Sverige",
    status:
      "Under utveckling. Vi tar inte emot beställningar eller förbeställningar ännu. Slutligt innehåll och leveranstid bekräftas före säljstart.",
    contentsTitle: "Det här planerar vi att lägga i asken",
    contents: [
      "En ELYSIA glasskål",
      "The Candledust Nordic Lights, 350 g, i förseglad originalpåse",
      "The Candledust Dark Honey, 350 g, i förseglad originalpåse",
      "Leverantörens medföljande vekar",
      "Noorly presentförpackning och ett svenskt instruktions- och skötselkort",
    ],
    provenance:
      "Totalt 700 g ljussand. Refillpåsarna behåller The Candledusts originalförpackningar. Noorly väljer ut och sätter samman presentsetet.",
    photos: "Produktbilder kommer när setet är färdigställt.",
    trust: [
      "Två dofter · 700 g",
      "Förseglade originalpåsar",
      "Under utveckling",
    ],
    cta: "Utforska presentsetet",
    imageNote:
      "Stämningsbild. Kärlet och produkterna visar inte det planerade presentsetet.",
    film: "Stämningsfilm. Kärlet och produkterna i filmen visar inte det planerade presentsetet.",
  },
  en: {
    label: "PLANNED GIFT SET",
    title: "Noorly Ljusstund",
    description:
      "A glass bowl, two fragrances and a quiet moment to give. We are planning a gift set with ELYSIA and two sealed refill pouches from The Candledust.",
    price: "Planned price: SEK 799 including delivery within Sweden",
    status:
      "In development. We are not accepting orders or pre-orders yet. Final contents and delivery timing will be confirmed before sales open.",
    contentsTitle: "What we plan to include",
    contents: [
      "One ELYSIA glass bowl",
      "The Candledust Nordic Lights, 350 g, in its sealed original pouch",
      "The Candledust Dark Honey, 350 g, in its sealed original pouch",
      "The supplier's included wicks",
      "Noorly gift packaging and a Swedish instruction and care card",
    ],
    provenance:
      "700 g of candle sand in total. The refill pouches retain The Candledust's original packaging. Noorly selects and brings the gift set together.",
    photos: "Product photographs will follow once the set is finalised.",
    trust: [
      "Two fragrances · 700 g",
      "Sealed original pouches",
      "In development",
    ],
    cta: "Explore the gift set",
    imageNote:
      "Concept image. The vessel and products shown do not depict the planned gift set.",
    film: "Concept film. The vessel and products shown do not depict the planned gift set.",
  },
} as const;

export function launchBundleHref(locale: Locale) {
  return `/${locale}/products/${launchBundleHandle}`;
}

/** Presentation only: no Shopify IDs, stock, purchase controls or borrowed photos. */
export const plannedLaunchBundle: Product = {
  id: "planned-noorly-ljusstund",
  handle: launchBundleHandle,
  title: { sv: launchBundleCopy.sv.title, en: launchBundleCopy.en.title },
  description: {
    sv: launchBundleCopy.sv.description,
    en: launchBundleCopy.en.description,
  },
  price: { amount: 799, currencyCode: "SEK" },
  images: [],
  variants: [],
  available: false,
  previewOnly: true,
  category: "box",
  seasons: ["winter"],
  boxEligible: false,
};
