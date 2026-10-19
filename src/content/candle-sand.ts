import type { LocalizedText, Product, ProductVariant } from "@/types/commerce";

const text = (sv: string, en: string): LocalizedText => ({ sv, en });

// Supplier facts and image provenance: docs/candle-sand-research.md.
// SEK prices and availability are demonstration values, not a supplier offer.
const options = [
  ["11", "Vit", "White", "Doftfri", "Unscented", "#f3f0e5"],
  [
    "01",
    "Mockabrun",
    "Mocha Brown",
    "Crimson Crystal",
    "Crimson Crystal",
    "#806452",
  ],
  [
    "02",
    "Lattebeige",
    "Latte Beige",
    "Pure Serenity",
    "Pure Serenity",
    "#d7c5b7",
  ],
  ["03", "Vit", "White", "Starlight Elixir", "Starlight Elixir", "#e8e4d8"],
  [
    "04",
    "Chokladbrun",
    "Chocolate Brown",
    "Millionaire Gold",
    "Millionaire Gold",
    "#584239",
  ],
  ["05", "Varmgrå", "Warm Grey", "Azure Noir", "Azure Noir", "#bcb7b1"],
  ["06", "Taupeorange", "Taupe Orange", "Cobalt", "Cobalt", "#d8a88b"],
  [
    "07",
    "Gammalrosa",
    "Dusty Rose",
    "Maison de Roses",
    "Maison de Roses",
    "#dcb5bd",
  ],
  ["08", "Honung", "Warm Honey", "Blush Bloom", "Blush Bloom", "#e4d4a8"],
  ["09", "Svart", "Black", "Spirited", "Spirited", "#302d2d"],
  ["10", "Kräm", "Cream", "Regent Polo", "Regent Polo", "#eee0a2"],
] as const;

const variants: ProductVariant[] = options.map(
  ([code, sv, en, scentSv, scentEn, hex]) => ({
    id: `candle-sand-${code}`,
    sku: `CSand-${code}`,
    title: `${en} · ${scentEn}`,
    label: text(`${sv} · ${scentSv}`, `${en} · ${scentEn}`),
    color: { name: text(sv, en), hex },
    scent: text(scentSv, scentEn),
    price: { amount: 295, currencyCode: "SEK" },
    available: true,
    images: [
      {
        url: `/media/products/candle-sand/csand-${code}-0.webp`,
        alt: `Candle sand — ${en}, ${scentEn}: pouch and wax granules`,
      },
      {
        url: `/media/products/candle-sand/csand-${code}-2.webp`,
        alt: `Candle sand — ${en}, ${scentEn}: 300 g pouch`,
      },
      {
        url: `/media/products/candle-sand/csand-${code}-1.webp`,
        alt: `Candle sand — ${en}, ${scentEn}: supplier styling photograph; vessel not included`,
      },
    ],
  }),
);

export const candleSand: Product = {
  id: "mock-product-candle-sand",
  handle: "candle-sand",
  title: text("Ljussand", "Candle Sand"),
  description: text(
    "Ett ljus, på ditt sätt. Häll vaxkornen i ett lämpligt ljuskärl, sätt i en veke och skapa en stilla stund. Välj bland tio doftande färgval eller doftfri vit.",
    "Candlelight, your way. Pour the wax granules into a suitable candle vessel, insert a wick and make a quiet moment. Choose from ten scented colour options or unscented white.",
  ),
  price: variants[0].price,
  images: variants[0].images!,
  variants,
  available: true,
  previewOnly: true,
  category: "signature",
  seasons: ["winter"],
  boxEligible: false,
  highlights: [
    text("300 g ljussand", "300 g candle sand"),
    text("4 bomullsvekar ingår", "4 cotton wicks included"),
    text(
      "Cirka 60 timmars total brinntid*",
      "Around 60 hours total burn time*",
    ),
  ],
  included: text(
    "En påse med 300 g ljussand och fyra bomullsvekar. Kärl och dekorationer på bilderna ingår inte. *Leverantörens ungefärliga brinntid; faktisk tid varierar med användningen.",
    "One 300 g pouch of candle sand and four cotton wicks. Vessels and decorations in the photographs are not included. *Supplier's approximate burn time; actual time varies with use.",
  ),
  care: text(
    "Använd ett stabilt, obrännbart och värmetåligt kärl avsett för ljus. Lämna cirka 5–10 mm veke ovanför ytan och trimma före varje användning. Tillsätt inte oljor, torkade blommor eller andra brännbara dekorationer. Lämna aldrig ett tänt ljus utan uppsikt. Följ alltid säkerhetsanvisningarna på förpackningen.",
    "Use a stable, non-combustible, heat-resistant vessel intended for candles. Leave about 5–10 mm of wick above the surface and trim before each use. Do not add oils, dried flowers or combustible decorations. Never leave a burning candle unattended. Always follow the safety instructions on the pack.",
  ),
  fulfilment: {
    materials: text(
      "Vax av stearinsyra, bomullsvekar. Tillverkad i England. Doft varierar med valt alternativ; CSand-11 är utan tillsatt doft.",
      "Stearic acid wax and cotton wicks. Made in England. Fragrance depends on the selected option; CSand-11 has no added fragrance.",
    ),
    weightGrams: 300,
    dimensions: "9 × 6 × 19 cm",
  },
};
