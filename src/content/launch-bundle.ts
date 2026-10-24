import type { Locale, Product } from "@/types/commerce";

// Matches the separate Shopify draft, not the old AW Gifts candle-sand product.
export const launchBundleHandle =
  "noorly-ljusstund-presentset-med-glasskal-och-tva-dofter";

export const launchBundleCopy = {
  sv: {
    label: "FÖRHANDSBESTÄLLNING KOMMER SNART",
    title: "Noorly Ljusstund",
    description:
      "Noorly Ljusstund är ett planerat presentset med ELYSIA-glasskål och två förseglade doftpåsar från The Candledust. Setet erbjuds som förhandsbeställning när beställningar öppnar.",
    price:
      "Planerat förhandsbeställningspris: 799 kr inklusive leverans inom Sverige",
    preorderHeading:
      "Förhandsbeställning – leverans när varorna kommit in i lager",
    preorderExplanation:
      "Presentsetet finns inte i lager ännu. När förhandsbeställningar öppnar skickar vi din beställning efter att varorna kommit in och setet packats. Vi anger en beräknad leveransperiod innan betalning.",
    status:
      "Förhandsbeställningen har ännu inte öppnat. Det går inte att beställa eller betala nu. Slutligt innehåll och leveransperiod bekräftas före säljstart.",
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
      "Förhandsbeställning kommer snart",
      "Leverans efter att varorna kommit in i lager",
      "799 kr · planerat pris",
    ],
    cta: "Se den kommande förhandsbeställningen",
    interestCta: "Skicka intresseanmälan",
    interestNote:
      "Öppnar ditt e-postprogram. Ingen betalning, ingen beställning och ingen vara reserveras.",
    imageNote:
      "Stämningsbild. Kärlet och produkterna visar inte det planerade presentsetet.",
    film: "Stämningsfilm. Kärlet och produkterna i filmen visar inte det planerade presentsetet.",
  },
  en: {
    label: "PRE-ORDER COMING SOON",
    title: "Noorly Ljusstund",
    description:
      "Noorly Ljusstund is a planned gift set featuring an ELYSIA glass bowl and two sealed fragrance refills from The Candledust. It will be offered as a pre-order when ordering opens.",
    price: "Planned pre-order price: SEK 799 including delivery within Sweden",
    preorderHeading: "Pre-order – ships after stock arrives",
    preorderExplanation:
      "This gift set is not in stock yet. When pre-orders open, we will dispatch your order only after the items arrive and the set has been packed. An estimated delivery window will be provided before payment.",
    status:
      "Pre-orders have not opened yet. Ordering and payment are unavailable for now. Final contents and the estimated delivery window will be confirmed before launch.",
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
      "Pre-order coming soon",
      "Delivery after stock arrives",
      "SEK 799 · planned price",
    ],
    cta: "Explore the upcoming pre-order",
    interestCta: "Send an expression of interest",
    interestNote:
      "Opens your email app. No payment, no order and no stock is reserved.",
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
