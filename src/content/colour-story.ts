import type { Locale } from "@/types/commerce";

/** Art direction is separate from the supplier's exact product colours. */
export const colourStories = [
  {
    sku: "CSand-07",
    tone: "rose",
    pouch: "/media/packaging/noorly-pouch-rose-concept.webp",
    background: "#ef9ba9",
    ink: "#4b1e2d",
    word: { sv: "ROSA", en: "ROSE" },
    mood: {
      sv: "Lite färg. Mycket känsla.",
      en: "A little colour. A whole mood.",
    },
  },
  {
    sku: "CSand-08",
    tone: "honey",
    pouch: "/media/packaging/noorly-pouch-honey-concept.webp",
    background: "#f3d35c",
    ink: "#49351a",
    word: { sv: "HONUNG", en: "HONEY" },
    mood: { sv: "Gör plats för värme.", en: "Make room for warmth." },
  },
  {
    sku: "CSand-01",
    tone: "mocha",
    pouch: "/media/packaging/noorly-pouch-mocha-concept.webp",
    background: "#9b6045",
    ink: "#fff6e9",
    word: { sv: "MOCKA", en: "MOCHA" },
    mood: { sv: "Mjuka toner. Din stund.", en: "Soft tones. Your moment." },
  },
  {
    sku: "CSand-11",
    tone: "ivory",
    pouch: "/media/packaging/noorly-pouch-ivory-concept.webp",
    background: "#ede6d4",
    ink: "#353a2e",
    word: { sv: "VIT", en: "WHITE" },
    mood: { sv: "En stilla favorit.", en: "A quiet favourite." },
  },
] as const;

export function colourStory(sku?: string) {
  return colourStories.find((story) => story.sku === sku);
}

export function colourProductHref(locale: Locale, sku: string) {
  return `/${locale}/products/candle-sand?colour=${encodeURIComponent(sku)}`;
}
