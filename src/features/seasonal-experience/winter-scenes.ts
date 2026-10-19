import type { CinematicScene } from "./types";

export const winterScenes: CinematicScene[] = [
  {
    id: "winter-entrance",
    seasonId: "winter",
    name: { sv: "Vinterberättelsen", en: "A winter story" },
    media: {
      desktop: {
        video:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_3HdOg0854ky23xVGpsB15oIg3ri/46439a25-f450-49f4-b8b1-785e0d1bc834.mp4",
        poster: "/media/winter/entrance-poster-desktop.webp",
      },
      mobile: {
        video:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_3HdOg0854ky23xVGpsB15oIg3ri/0e98a61d-fd67-4fee-8c28-793ca27c6fce.mp4",
        poster: "/media/winter/entrance-poster-mobile.webp",
      },
    },
    copy: {
      eyebrow: {
        sv: "VINTERKOLLEKTIONEN · 2026",
        en: "THE WINTER COLLECTION · 2026",
      },
      title: { sv: "Kliv in i\nsäsongen.", en: "Step into\nthe season." },
      description: {
        sv: "Omtänksamma gåvor. Stilla stunder.\nEn vinter att dela.",
        en: "Thoughtful gifts. Quieter moments.\nA winter worth sharing.",
      },
      beat: {
        sv: "Från vinterkylan.\nTill en varmare stund.",
        en: "In from the cold.\nInto something warmer.",
      },
    },
    hotspots: [],
    shopping: { productHandle: "winter-candle", visibleFrom: 10 / 15 },
  },
];
