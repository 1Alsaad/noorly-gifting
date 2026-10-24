import type { Locale, Product } from "@/types/commerce";

// This public presentation is an inventory-backed sourcing update, not a
// Shopify purchasable variant. Do not assume 20 fully assembled kits from 20 bowls.
export const launchBundleHandle =
  "noorly-ljusstund-presentset-med-glasskal-och-tva-dofter";

export const supplierBowlUrl =
  "https://www.awgifts.eu/homeware/tableware-kitchen-accessories/teakb/teakb-37";
export const supplierCandleSandUrl = "https://www.awgifts.se/candles/csand";

export const launchBundleCopy = {
  sv: {
    label: "NOORLY LJUSSTUND · FÖRSTA UPPLAGAN",
    title: "Noorly Ljusstund",
    description:
      "En dekorativ teakskål och förpackad ljussand, noga utvalda för en lugnare stund. Vi har fått in vår första omgång teakskålar och ljussand.",
    price: "Planerat setpris: 799 kr inklusive leverans inom Sverige",
    preorderHeading: "Första omgången finns på plats",
    preorderExplanation:
      "Vi har teakskålar och ljussand i lager. Exakt innehåll och antal kompletta presentset fastställs innan köp öppnar. Leveransdatum visas innan beställning.",
    status:
      "Beställning och betalning är ännu inte öppna. Vi publicerar slutlig specifikation och användningsinformation före säljstart.",
    contentsTitle: "Produkterna vi utgår från",
    contents: [
      "Dekorativ teakskål, modell TeakB-37 från AWGifts",
      "Förpackad ljussand från AWGifts; exakt färg, doft och mängd specificeras inför försäljning",
      "Tydliga produkt- och skötselanvisningar för respektive artikel",
    ],
    provenance:
      "Teakskålen är en dekorativ träskål, inte en värmetålig ljusbehållare. Tänd aldrig vekar eller ljussand direkt i träskålen. Om ljussanden ska brinna krävs ett separat lämpligt, obrännbart och värmetåligt kärl samt tillverkarens användningsanvisningar.",
    photos: "TEAKB-37 · TEAKSKÅL",
    supplierLink: "Se leverantörens originalbilder av teakskålen",
    supplierSandLink: "Se AWGifts sortiment av ljussand",
    trust: [
      "Teakskålar i lager",
      "Förpackad ljussand i lager",
      "Sverige · leveransvillkor före köp",
    ],
    cta: "Upptäck Ljusstund",
    interestCta: "Fråga om första omgången",
    interestNote:
      "Öppnar ditt e-postprogram. Det här är inte en beställning eller reservation, och ingen betalning sker.",
    imageNote:
      "Miljöbilden visar en stämning och återger inte nödvändigtvis innehållet i Ljusstund.",
    film:
      "Stämningsfilm. Skålen och produkterna i filmen visar inte det faktiska presentsetet.",
  },
  en: {
    label: "NOORLY LJUSSTUND · FIRST EDITION",
    title: "Noorly Ljusstund",
    description:
      "A decorative teak bowl and individually packaged candle sand, selected for slower moments. Our first supply of teak bowls and candle-sand products has arrived.",
    price: "Planned set price: SEK 799 including shipping within Sweden",
    preorderHeading: "Our first batch has arrived",
    preorderExplanation:
      "We have teak bowls and candle sand in stock. The exact contents and quantity of complete gift sets will be confirmed before orders open. A delivery date will be given before purchase.",
    status:
      "Ordering and payment are not yet open. Final specifications and usage instructions will be provided before sales begin.",
    contentsTitle: "The products behind the set",
    contents: [
      "Decorative teakwood bowl, AWGifts model TeakB-37",
      "Packaged candle sand from AWGifts; exact colour, fragrance and quantity will be specified before sale",
      "Clear product-specific usage and care instructions",
    ],
    provenance:
      "The teak bowl is a decorative wooden bowl, not a heat-resistant candle vessel. Never burn a wick or candle sand directly inside the wooden bowl. Using candle sand with a flame requires a separate suitable noncombustible heat-resistant container and the manufacturer's instructions.",
    photos: "TEAKB-37 · TEAK BOWL",
    supplierLink: "View the supplier's original photos of the teak bowl",
    supplierSandLink: "Explore AWGifts candle-sand products",
    trust: [
      "Teak bowls in stock",
      "Packaged candle sand in stock",
      "Sweden · shipping terms before purchase",
    ],
    cta: "Discover Ljusstund",
    interestCta: "Ask about the first edition",
    interestNote:
      "Opens your email application. This is not an order or reservation, and no payment is taken.",
    imageNote:
      "Lifestyle imagery expresses a mood and does not necessarily depict the Ljusstund contents.",
    film:
      "Concept film. Its bowl and products do not depict the actual gift set.",
  },
} as const;

export function launchBundleHref(locale: Locale) {
  return `/${locale}/products/${launchBundleHandle}`;
}

/** Informational presentation only; exact sellable bundle is not confirmed. */
export const plannedLaunchBundle: Product = {
  id: "noorly-ljusstund-first-edition",
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
