import type { LocalizedText, Product, ProductCategory } from "@/types/commerce";
import { candleSand } from "./candle-sand";

const text = (sv: string, en: string): LocalizedText => ({ sv, en });
function product(
  handle: string,
  title: LocalizedText,
  description: LocalizedText,
  amount: number,
  category: ProductCategory,
  boxEligible = false,
): Product {
  return {
    id: `mock-product-${handle}`,
    handle,
    title,
    description,
    price: { amount, currencyCode: "SEK" },
    images: [{ url: `/media/products/${handle}.svg`, alt: title.en }],
    variants: [
      {
        id: `${handle}-default`,
        title: "Standard",
        price: { amount, currencyCode: "SEK" },
        available: true,
      },
    ],
    available: true,
    category,
    seasons: ["winter"],
    boxEligible,
    fulfilment: {
      materials: text(
        "Exempelmaterial. Slutliga material och innehåll bekräftas före lansering.",
        "Sample materials. Final materials and ingredients must be confirmed before launch.",
      ),
    },
  };
}

/** Fictional development catalogue. Replace product claims and prices before launch. */
export const mockProducts: Product[] = [
  candleSand,
  product(
    "winter-evening",
    text("Vinterkväll", "Winter Evening"),
    text(
      "En stilla kväll, inslagen. Vinterljus, skogste och mörk choklad i vår stora presentask.",
      "A quiet evening, wrapped. Winter candle, forest tea and dark chocolate in our large gift box.",
    ),
    795,
    "box",
  ),
  product(
    "quiet-morning",
    text("Lugn morgon", "Quiet Morning"),
    text(
      "En mjuk början på dagen med skogste, mörk choklad och en servett i linne.",
      "A gentle start to the day with forest tea, dark chocolate and a linen napkin.",
    ),
    595,
    "box",
  ),
  product(
    "new-home",
    text("Nytt hem", "New Home"),
    text(
      "Varma detaljer för ett nytt kapitel. Ett vinterljus, linne och choklad i en omtänksam gåva.",
      "Warm details for a new chapter. A winter candle, linen and chocolate in one thoughtful gift.",
    ),
    745,
    "box",
  ),
  product(
    "winter-candle",
    text("Vinterljus", "Winter Candle"),
    text(
      "Ett mjukt ljus för långa kvällar. En enkel glasburk och en stilla doft inspirerad av skogen.",
      "A soft light for long evenings. A simple glass vessel and a quiet scent inspired by the forest.",
    ),
    295,
    "signature",
    true,
  ),
  product(
    "forest-tea",
    text("Skogste", "Forest Tea"),
    text(
      "Ett fylligt te för långsamma stunder. Ingrediensförteckning och allergener läggs till före lansering.",
      "A full-bodied tea for slow moments. Ingredients and allergens will be added before launch.",
    ),
    125,
    "extra",
    true,
  ),
  product(
    "dark-chocolate",
    text("Mörk choklad", "Dark Chocolate"),
    text(
      "En liten paus i mörk choklad. Ingredienser och allergener måste bekräftas före lansering.",
      "A small pause in dark chocolate. Ingredients and allergens must be confirmed before launch.",
    ),
    95,
    "extra",
    true,
  ),
  product(
    "linen-napkin",
    text("Servett i linne", "Linen Napkin"),
    text(
      "Naturlig struktur i en lugn sandton. En liten vardagsdetalj att behålla länge.",
      "Natural texture in a quiet sand shade. A small everyday detail to keep for years.",
    ),
    145,
    "extra",
    true,
  ),
  product(
    "greeting-card",
    text("Hälsningskort", "Greeting Card"),
    text(
      "Ett enkelt kort med plats för dina egna ord. Lägg till en personlig hälsning i din presentask.",
      "A simple card with space for your own words. Add a personal message to your gift box.",
    ),
    35,
    "card",
    true,
  ),
  product(
    "small-box",
    text("Liten presentask", "Small Gift Box"),
    text(
      "En stadig ask för ett signaturljus och två tillval, omsorgsfullt packade.",
      "A sturdy box for one signature candle and two extras, carefully packed.",
    ),
    65,
    "packaging",
    true,
  ),
  product(
    "large-box",
    text("Stor presentask", "Large Gift Box"),
    text(
      "En rymlig ask för ett signaturljus och två till tre tillval.",
      "A generous box for one signature candle and two to three extras.",
    ),
    95,
    "packaging",
    true,
  ),
];
mockProducts
  .find((item) => item.handle === "winter-candle")!
  .variants.push({
    id: "winter-candle-large",
    title: "Large · coming soon",
    price: { amount: 395, currencyCode: "SEK" },
    available: false,
  });
