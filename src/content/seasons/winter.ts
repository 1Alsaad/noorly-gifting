import { brand } from "@/config/brand";
import type { GiftBoxTemplate, Season } from "@/types/content";
import { winterScenes } from "@/features/seasonal-experience/winter-scenes";

const templates: GiftBoxTemplate[] = [
  {
    id: "winter-evening",
    name: { sv: "Vinterkväll", en: "Winter Evening" },
    description: {
      sv: "Ljus, te och choklad för en stilla kväll.",
      en: "Candle, tea and chocolate for a quiet evening.",
    },
    baseProduct: "winter-evening",
    includedProductHandles: ["winter-candle", "forest-tea", "dark-chocolate"],
    optionalProductHandles: ["greeting-card"],
    minimumSelections: 3,
    maximumSelections: 3,
    seasons: ["winter"],
    pricePresentation: "fixed",
    image: {
      url: "/media/products/winter-evening.svg",
      alt: "Winter Evening gift box",
    },
    tags: ["winter", "evening"],
  },
  {
    id: "quiet-morning",
    name: { sv: "Lugn morgon", en: "Quiet Morning" },
    description: {
      sv: "Te, choklad och linne för en mjuk start.",
      en: "Tea, chocolate and linen for a gentle start.",
    },
    baseProduct: "quiet-morning",
    includedProductHandles: ["forest-tea", "dark-chocolate", "linen-napkin"],
    optionalProductHandles: ["greeting-card"],
    minimumSelections: 3,
    maximumSelections: 3,
    seasons: ["winter"],
    pricePresentation: "fixed",
    image: {
      url: "/media/products/quiet-morning.svg",
      alt: "Quiet Morning gift box",
    },
    tags: ["winter", "morning"],
  },
  {
    id: "new-home",
    name: { sv: "Nytt hem", en: "New Home" },
    description: {
      sv: "Värme och textur för ett nytt hem.",
      en: "Warmth and texture for a new home.",
    },
    baseProduct: "new-home",
    includedProductHandles: ["winter-candle", "linen-napkin", "dark-chocolate"],
    optionalProductHandles: ["greeting-card"],
    minimumSelections: 3,
    maximumSelections: 3,
    seasons: ["winter"],
    pricePresentation: "fixed",
    image: { url: "/media/products/new-home.svg", alt: "New Home gift box" },
    tags: ["winter", "new-home"],
  },
];

export const winter: Season = {
  id: "winter",
  slug: "winter",
  name: { sv: "Vinter", en: "Winter" },
  dateRange: { start: "2026-10-01", end: "2027-02-28" },
  active: true,
  theme: { accent: "#344b3e", background: "#f4f0e8", foreground: "#242924" },
  hero: {
    title: { sv: "Stig in i säsongen.", en: "Step into the season." },
    description: {
      sv: "Omtänksamma gåvor, utvalda för vintern.",
      en: "Thoughtful gifts, curated for winter.",
    },
    eyebrow: {
      sv: "Vinterkollektionen · 2026",
      en: "The winter collection · 2026",
    },
  },
  media: {
    desktopPoster: winterScenes[0].media.desktop.poster,
    mobilePoster: winterScenes[0].media.mobile.poster,
  },
  sceneIds: winterScenes.map((scene) => scene.id),
  scenes: winterScenes,
  hotspots: winterScenes.flatMap((scene) => scene.hotspots),
  featuredProductHandles: [
    "winter-candle",
    "forest-tea",
    "linen-napkin",
    "dark-chocolate",
  ],
  curatedBoxes: templates,
  seo: {
    title: { sv: "Omtänksamma vintergåvor", en: "Thoughtful winter gifts" },
    description: {
      sv: `Upptäck vintergåvor och personliga presentaskar från ${brand.name}.`,
      en: `Discover winter gifts and personal gift boxes from ${brand.name}.`,
    },
  },
};
