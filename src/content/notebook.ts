import type { Product } from "@/types/commerce";

const covers = [
  {
    sku: "PNB-01",
    title: "Waves in the same sea",
    url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/pnb-01.jpg?v=1792429635",
  },
  {
    sku: "PNB-02",
    title: "Leaves on the same tree",
    url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/pnb-02.jpg?v=1792429645",
  },
  {
    sku: "PNB-03",
    title: "Flowers in the same garden",
    url: "https://cdn.shopify.com/s/files/1/1073/5317/8454/files/pnb-03.jpg?v=1792429657",
  },
];
const price = { amount: 0, currencyCode: "SEK" as const };

/** Supplier-backed research candidate. Zero is a placeholder, never a free offer. */
export const notebook: Product = {
  id: "mock-product-notebook-with-strap",
  handle: "notebook-with-strap",
  title: { sv: "Anteckningsbok med rem", en: "Notebook with strap" },
  description: {
    sv: "Plats för tankar, planer och små minnen. En anteckningsbok med 200 olinjerade sidor och tre omslag att utforska.",
    en: "Room for thoughts, plans and little memories. A notebook with 200 unlined pages and three covers to explore.",
  },
  price,
  images: covers.map((cover) => ({ url: cover.url, alt: cover.title })),
  variants: covers.map((cover) => ({
    id: cover.sku.toLowerCase(),
    sku: cover.sku,
    title: cover.title,
    price,
    available: true,
    images: [{ url: cover.url, alt: cover.title }],
  })),
  available: true,
  previewOnly: true,
  category: "extra",
  seasons: ["winter"],
  boxEligible: true,
  highlights: [
    { sv: "200 olinjerade sidor", en: "200 unlined pages" },
    { sv: "Tre omslag med rem", en: "Three covers with a strap" },
  ],
  fulfilment: {
    materials: {
      sv: "Papper och PVC. Omslaget är inte läder. Leverantörens mått: 18 × 12,5 × 2 cm. Passform i presentask måste verifieras.",
      en: "Paper and PVC. The cover is not leather. Supplier dimensions: 18 × 12.5 × 2 cm. Gift box fit must be verified.",
    },
    dimensions: "18 × 12.5 × 2 cm",
    weightGrams: 300,
  },
};
