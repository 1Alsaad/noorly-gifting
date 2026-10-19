import type { CinematicScene } from "./types";

export const winterScenes: CinematicScene[] = [
  {
    id: "winter-entrance",
    seasonId: "winter",
    name: { sv: "Entrén", en: "The entrance" },
    media: {
      desktop: {
        video:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_3HdOg0854ky23xVGpsB15oIg3ri/58984439-9e2b-4cf7-8c93-1bf92b4ea876.mp4",
        poster: "/media/winter/entrance-poster-desktop.webp",
      },
      mobile: {
        video:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_3HdOg0854ky23xVGpsB15oIg3ri/58984439-9e2b-4cf7-8c93-1bf92b4ea876.mp4",
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
    },
    hotspots: [],
  },
  {
    id: "winter-candle-room",
    seasonId: "winter",
    name: { sv: "Ett varmt välkomnande", en: "A warmer welcome" },
    media: {
      desktop: {
        video:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_3HdOg0854ky23xVGpsB15oIg3ri/be114901-8392-4460-af09-29eb6fea0d89.mp4",
        poster: "/media/winter/candle-room-poster-desktop.webp",
      },
      mobile: {
        video:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_3HdOg0854ky23xVGpsB15oIg3ri/be114901-8392-4460-af09-29eb6fea0d89.mp4",
        poster: "/media/winter/candle-room-poster-mobile.webp",
      },
    },
    copy: {
      eyebrow: {
        sv: "SMÅ SAKER. STOR OMTANKE.",
        en: "LITTLE THINGS. LASTING WARMTH.",
      },
      title: {
        sv: "Ge en stund\nav stillhet.",
        en: "Give a moment\nof stillness.",
      },
      description: {
        sv: "Doften av skog. Ett varmt sken. Något utvalt med omtanke.",
        en: "A trace of forest. A warm glow. Something chosen with care.",
      },
    },
    hotspots: [
      {
        id: "winter-candle",
        sceneId: "winter-candle-room",
        productHandle: "winter-candle",
        visibleFrom: 0.2,
        visibleTo: 0.85,
        desktop: { x: 0.69, y: 0.61 },
        mobile: { x: 0.62, y: 0.56 },
        label: { sv: "Upptäck vinterljuset", en: "Discover the winter candle" },
        tooltipAlignment: "left",
        pulse: false,
        action: "drawer",
        analytics: { placement: "candle-room" },
      },
    ],
  },
];
