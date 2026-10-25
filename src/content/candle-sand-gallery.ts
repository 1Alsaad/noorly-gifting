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

function whiteSandSupplierGallery(locale: Locale): ProductImage[] {
  return whiteSandPhotos.map(([filename, sv, en]) => ({
    url: `/media/products/candle-sand/csand-11-supplier-${filename}`,
    alt: locale === "sv" ? sv : en,
  }));
}

// Each SKU's own supplier page was inspected on 2026-10-25. These are
// the matching lit-bowl and two pouch photographs, not the generic white
// styling/range shots that the supplier repeats on every colour page.
const colourPhotos: Record<string, readonly string[]> = {
  "CSand-01": ["5ghb.jpg", "5gau.jpg", "5gav.jpg"],
  "CSand-02": ["5ghc.jpg", "5gb5.jpg", "5gb6.jpg"],
  "CSand-03": ["5ghd.jpg", "5gbh.png", "5gbi.jpg"],
  "CSand-04": ["5ghe.jpg", "5gbt.png", "5gbu.jpg"],
  "CSand-05": ["5ghf.jpg", "5gc5.png", "5gc6.jpg"],
  "CSand-06": ["5ghg.jpg", "5gcg.png", "5gch.jpg"],
  "CSand-07": ["5ghj.jpg", "5gcr.png", "5gcs.jpg"],
  "CSand-08": ["5ghk.jpg", "5gd2.png", "5gd3.jpg"],
  "CSand-09": ["5ghl.jpg", "5gdf.png", "5gdg.jpg"],
  "CSand-10": ["5ghm.jpg", "5gdt.png", "5gdu.jpg"],
};

export function candleSandSupplierGallery(
  sku: string,
  locale: Locale,
  label: string,
): ProductImage[] {
  if (sku === "CSand-11") return whiteSandSupplierGallery(locale);
  const photos = colourPhotos[sku];
  if (!photos) return [];
  const descriptions =
    locale === "sv"
      ? [
          "ljussand med tända vekar i en träskål",
          "300 g påse i dagsljus",
          "300 g påse mot ljus bakgrund",
        ]
      : [
          "candle sand with lit wicks in a wooden bowl",
          "300 g pouch in daylight",
          "300 g pouch against a light background",
        ];
  return [
    ...photos.map((filename, index) => ({
      url: `/media/products/candle-sand/${sku.toLowerCase()}-supplier-${filename}`,
      alt: `${label}: ${descriptions[index]}`,
    })),
    {
      url: "/media/products/candle-sand/csand-11-supplier-5gwo.jpg",
      alt:
        locale === "sv"
          ? "Leverantörens allmänna bildguide: häll, placera veken, tänd och återanvänd ljussanden"
          : "Supplier's general illustrated guide: pour, insert a wick, light and reuse candle sand",
    },
  ];
}
