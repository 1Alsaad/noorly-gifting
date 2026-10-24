import type { Locale, LocalizedText, Product } from "@/types/commerce";

// The owner has confirmed complete sets. This fallback remains informational;
// only Shopify supplies purchasable variant IDs, prices and current availability.
export const legacyLaunchBundleHandle =
  "noorly-ljusstund-presentset-med-glasskal-och-tva-dofter";
export const launchBundleHandle = "noorly-ljusstund-teakskal-och-ljussand";

export const supplierBowlUrl =
  "https://www.awgifts.eu/homeware/tableware-kitchen-accessories/teakb/teakb-37";
export const supplierCandleSandUrl = "https://www.awgifts.se/candles/csand";

// Authenticated AW catalogue images, used under AW Dropship terms section 12.
// These photographs show the supplier's bowl model, not a finished Noorly set.
export const launchBundlePhotos = [
  {
    url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/noorly-teakb37-supplier-bowl-01_d446de8c-20a6-41cc-a742-0439f61c73e6.jpg?v=1792875850",
    alt: {
      sv: "Leverantörsfoto av dekorativ teakskål TeakB-37 med naturlig ådring och vågformad kant",
      en: "Supplier photograph of the decorative TeakB-37 bowl with natural grain and an undulating rim",
    },
  },
  {
    url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/noorly-teakb37-supplier-bowl-03_1c786689-b62a-464e-8bc0-319666866629.jpg?v=1792875850",
    alt: {
      sv: "Leverantörsfoto av insidan på teakskål TeakB-37, sedd snett ovanifrån",
      en: "Supplier photograph showing the inside of the TeakB-37 bowl, viewed from above at an angle",
    },
  },
  {
    url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/noorly-teakb37-supplier-bowl-02_18442787-ab03-499d-9dc9-b3a849a0f252.jpg?v=1792875850",
    alt: {
      sv: "Leverantörsfoto av teakskål TeakB-37 med citrusfrukter som dekoration; frukten ingår inte",
      en: "Supplier photograph of the TeakB-37 bowl styled with citrus fruit; the fruit is not included",
    },
  },
] as const;

// Existing Shopify candle-sand photos and supplier choice names, verified on
// 24 October 2026. These describe the components; they do not define stock or price.
const sandChoices = [
  [
    "11",
    "Vit",
    "White",
    "Doftfri",
    "Unscented",
    "#f3f0e5",
    "csand-11-0.jpg?v=1792429599",
  ],
  [
    "01",
    "Mockabrun",
    "Mocha Brown",
    "Crimson Crystal",
    "Crimson Crystal",
    "#806452",
    "csand-01-0_jpg.jpg?v=1792429030",
  ],
  [
    "02",
    "Lattebeige",
    "Latte Beige",
    "Pure Serenity",
    "Pure Serenity",
    "#d7c5b7",
    "csand-02-0_jpg.jpg?v=1792429059",
  ],
  [
    "03",
    "Vit",
    "White",
    "Starlight Elixir",
    "Starlight Elixir",
    "#e8e4d8",
    "csand-03-0_jpg.jpg?v=1792429089",
  ],
  [
    "04",
    "Chokladbrun",
    "Chocolate Brown",
    "Millionaire Gold",
    "Millionaire Gold",
    "#584239",
    "csand-04-0_jpg.jpg?v=1792429120",
  ],
  [
    "05",
    "Varmgrå",
    "Warm Grey",
    "Azure Noir",
    "Azure Noir",
    "#bcb7b1",
    "csand-05-0.jpg?v=1792429248",
  ],
  [
    "06",
    "Taupeorange",
    "Taupe Orange",
    "Cobalt",
    "Cobalt",
    "#d8a88b",
    "csand-06-0.jpg?v=1792429279",
  ],
  [
    "07",
    "Gammalrosa",
    "Dusty Rose",
    "Maison de Roses",
    "Maison de Roses",
    "#dcb5bd",
    "csand-07-0.jpg?v=1792429313",
  ],
  [
    "08",
    "Honung",
    "Warm Honey",
    "Blush Bloom",
    "Blush Bloom",
    "#e4d4a8",
    "csand-08-0.jpg?v=1792429349",
  ],
  [
    "09",
    "Svart",
    "Black",
    "Spirited",
    "Spirited",
    "#302d2d",
    "csand-09-0.jpg?v=1792429533",
  ],
  [
    "10",
    "Kräm",
    "Cream",
    "Regent Polo",
    "Regent Polo",
    "#eee0a2",
    "csand-10-0.jpg?v=1792429564",
  ],
] as const;

export const launchSandChoices = sandChoices.map(
  ([code, colourSv, colourEn, scentSv, scentEn, hex, filename]) => ({
    sku: `CSand-${code}`,
    label: {
      sv: `${colourSv} · ${scentSv}`,
      en: `${colourEn} · ${scentEn}`,
    } satisfies LocalizedText,
    color: { name: { sv: colourSv, en: colourEn }, hex },
    scent: { sv: scentSv, en: scentEn },
    photo: {
      url: `https://cdn.shopify.com/s/files/1/1073/5317/8454/files/${filename}`,
      alt: {
        sv: `Ljussand ${code === "11" ? "utan doft" : scentSv}, ${colourSv.toLowerCase()}: 300 g påse och vaxkorn`,
        en: `${colourEn} candle sand, ${scentEn}: 300 g pouch and wax granules`,
      },
    },
  }),
);

export const launchBundleCopy = {
  sv: {
    label: "NOORLY LJUSSTUND · FÖRSTA UPPLAGAN",
    title: "Noorly Ljusstund",
    description:
      "En dekorativ teakskål och 300 g ljussand i vald färg och doft, noga utvalda för en lugnare stund. Fyra bomullsvekar ingår.",
    price: "Planerat setpris: 799 kr inklusive leverans inom Sverige",
    preorderHeading: "Första upplagan är förberedd",
    preorderExplanation:
      "Setets innehåll är bekräftat: en TeakB-37-skål, en påse med 300 g ljussand och fyra bomullsvekar. Vi gör kassan redo för beställningar.",
    status: "Beställning och betalning är ännu inte öppna.",
    contentsTitle: "Det här ingår",
    contents: [
      "En dekorativ teakskål, modell TeakB-37 från AWGifts",
      "En påse med 300 g ljussand i vald färg och doft",
      "Fyra bomullsvekar",
    ],
    provenance:
      "Teakskålen är en dekorativ träskål, inte en värmetålig ljusbehållare. Tänd aldrig vekar eller ljussand direkt i träskålen. Om ljussanden ska brinna krävs ett separat lämpligt, obrännbart och värmetåligt kärl. Ett sådant kärl ingår inte. Följ alltid tillverkarens användningsanvisningar på förpackningen.",
    photos: "TEAKB-37 · TEAKSKÅL",
    photoTitle: "TeakB-37 · dekorativ teakskål",
    photoSource: "Produktbilder från leverantören",
    photoCaption:
      "Leverantörens bilder av teakskålen visar modellen TeakB-37. Form och ådring varierar naturligt. Frukten är dekoration och ingår inte.",
    sandPhotoCaption:
      "Ljussandsbilderna visar påsen och vaxkornen för respektive färg och doft. En påse med 300 g och fyra bomullsvekar ingår i setet.",
    fullSetPhotos:
      "Bilderna visar artiklarna var för sig. Det kompletta Ljusstund-setet är ännu inte fotograferat.",
    supplierLink: "Se leverantörens originalbilder av teakskålen",
    supplierSandLink: "Se AWGifts sortiment av ljussand",
    trust: [
      "Teakskålar i lager",
      "Förpackad ljussand i lager",
      "Sverige · leveransvillkor före köp",
    ],
    cta: "Upptäck Ljusstund",
    interestCta: "Skicka intresseanmälan",
    interestNote:
      "Öppnar ditt e-postprogram. Ingen betalning, ingen beställning och ingen vara reserveras.",
    imageNote:
      "Miljöbilden visar en stämning och återger inte nödvändigtvis innehållet i Ljusstund.",
    film: "Stämningsfilm. Skålen och produkterna i filmen visar inte det faktiska presentsetet.",
  },
  en: {
    label: "NOORLY LJUSSTUND · FIRST EDITION",
    title: "Noorly Ljusstund",
    description:
      "A decorative teak bowl and 300 g of candle sand in your chosen colour and scent, selected for slower moments. Four cotton wicks are included.",
    price: "Planned set price: SEK 799 including shipping within Sweden",
    preorderHeading: "Our first edition is prepared",
    preorderExplanation:
      "The contents are confirmed: one TeakB-37 bowl, one 300 g pouch of candle sand and four cotton wicks. We are preparing checkout for orders.",
    status: "Ordering and payment are not yet open.",
    contentsTitle: "Included in your set",
    contents: [
      "One decorative teakwood bowl, AWGifts model TeakB-37",
      "One 300 g pouch of candle sand in your chosen colour and scent",
      "Four cotton wicks",
    ],
    provenance:
      "The teak bowl is a decorative wooden bowl, not a heat-resistant candle vessel. Never burn a wick or candle sand directly inside the wooden bowl. Using candle sand with a flame requires a separate suitable noncombustible heat-resistant container. That container is not included. Always follow the manufacturer's instructions on the packaging.",
    photos: "TEAKB-37 · TEAK BOWL",
    photoTitle: "TeakB-37 · decorative teak bowl",
    photoSource: "Supplier product photographs",
    photoCaption:
      "The supplier's teak-bowl photographs show model TeakB-37. Shape and grain vary naturally. The fruit is styling and is not included.",
    sandPhotoCaption:
      "The candle-sand photographs show the pouch and wax granules for each colour and scent. One 300 g pouch and four cotton wicks are included in the set.",
    fullSetPhotos:
      "The photographs show the individual products. The complete Ljusstund set has not yet been photographed.",
    supplierLink: "View the supplier's original photos of the teak bowl",
    supplierSandLink: "Explore AWGifts candle-sand products",
    trust: [
      "Teak bowls in stock",
      "Packaged candle sand in stock",
      "Sweden · shipping terms before purchase",
    ],
    cta: "Discover Ljusstund",
    interestCta: "Send an expression of interest",
    interestNote:
      "Opens your email app. No payment, no order and no stock is reserved.",
    imageNote:
      "Lifestyle imagery expresses a mood and does not necessarily depict the Ljusstund contents.",
    film: "Concept film. Its bowl and products do not depict the actual gift set.",
  },
} as const;

export function launchBundleHref(locale: Locale) {
  return `/${locale}/products/${launchBundleHandle}`;
}

/** Informational presentation only; Shopify defines the actual offer. */
export const plannedLaunchBundle: Product = {
  id: "noorly-ljusstund-first-edition",
  handle: launchBundleHandle,
  title: { sv: launchBundleCopy.sv.title, en: launchBundleCopy.en.title },
  description: {
    sv: launchBundleCopy.sv.description,
    en: launchBundleCopy.en.description,
  },
  price: { amount: 799, currencyCode: "SEK" },
  images: launchBundlePhotos.map((photo) => ({
    url: photo.url,
    alt: photo.alt.sv,
  })),
  variants: [],
  available: false,
  previewOnly: true,
  category: "box",
  seasons: ["winter"],
  boxEligible: false,
};
