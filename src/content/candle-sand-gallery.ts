import type { Locale, ProductImage } from "@/types/commerce";

// Supplier's CSand-11 carousel, inspected 2026-10-25:
// https://www.aw-dropship.eu/candles/csand/csand-11
// Keep white unscented photos with CSand-11; omit range shots labelled
// with other fragrances and the generic fragrance marketing graphic.
const whiteSandPhotos = [
  [
    "5ghn.jpg",
    "Närbild av vit ljussand med tända vekar i en träskål",
    "Close-up of white candle sand with lit wicks in a wooden bowl",
  ],
  [
    "5gef.jpg",
    "Vit ljussand med tre tända vekar i en träskål",
    "White candle sand with three lit wicks in a wooden bowl",
  ],
  [
    "5gwo.jpg",
    "Leverantörens bildguide: häll, placera veken, tänd och återanvänd ljussanden",
    "Supplier's illustrated guide: pour, insert a wick, light and reuse candle sand",
  ],
  [
    "5gea.jpg",
    "Vit ljussand formad i mjuka vågor i en träskål",
    "White candle sand shaped into soft waves in a wooden bowl",
  ],
  [
    "5geb.jpg",
    "En hand placerar en otänd veke i vit ljussand",
    "A hand placing an unlit wick in white candle sand",
  ],
  [
    "5gec.jpg",
    "Vit ljussand med otända vekar i en träskål",
    "White candle sand with unlit wicks in a wooden bowl",
  ],
  [
    "5ge8.jpg",
    "Doftfri vit ljussand, förpackning med 300 gram",
    "Unscented white candle sand, 300 g pouch",
  ],
  [
    "5ge7.png",
    "Doftfri vit ljussand, förpackning i dagsljus",
    "Unscented white candle sand pouch in daylight",
  ],
] as const;

export function whiteSandSupplierGallery(locale: Locale): ProductImage[] {
  return whiteSandPhotos.map(([filename, sv, en]) => ({
    url: `/media/products/candle-sand/csand-11-supplier-${filename}`,
    alt: locale === "sv" ? sv : en,
  }));
}
