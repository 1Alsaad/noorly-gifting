import type { Dictionary } from "./translations";
import type { Locale } from "@/types/commerce";
import { productTestCopy } from "@/config/product-test";

export function applyProductTestCopy(
  t: Dictionary,
  locale: Locale,
): Dictionary {
  const sv = locale === "sv";
  const copy = productTestCopy[locale];
  return {
    ...t,
    preview: copy.label,
    available: sv ? "Produktidé" : "Product idea",
    unavailable: sv ? "Inte till försäljning" : "Not on sale",
    delivery: sv ? "Vi testar intresset" : "We are testing interest",
    deliveryText: copy.note,
    tax: copy.note,
    checkout: copy.cta,
    add: copy.cta,
    footer: {
      ...t.footer,
      rights: sv
        ? "NOORLY · Produktutveckling"
        : "NOORLY · Product development",
    },
    home: {
      ...t.home,
      text: copy.intro,
      curatedLabel: sv ? "PRESENTBOXAR VI UTFORSKAR" : "GIFT BOX IDEAS",
      curatedText: copy.concept,
      buildText: sv
        ? "Skissa på en möjlig presentbox. Förpackning, passform och tillval är inte färdigställda. Du beställer ingenting."
        : "Sketch a possible gift box. Packaging, fit and extras are not final. You are not placing an order.",
      trust: sv
        ? ["Ingen betalning", "Ingen beställning", "Hjälp oss välja sortiment"]
        : ["No payment", "No order", "Help choose the range"],
      newsletterTitle: sv
        ? "Vilken gåva vill du se?"
        : "Which gift would you like to see?",
      newsletterText: copy.intro,
      reviewsLabel: sv ? "UNDER UTVECKLING" : "IN DEVELOPMENT",
      reviewsText: sv
        ? "Vi har inte börjat sälja och har inga kundomdömen att visa."
        : "We have not started selling and have no customer reviews to share.",
      corporateText: sv
        ? "Vi utforskar även företagsgåvor. Inga offerter, leveranser eller beställningar erbjuds ännu."
        : "We are also exploring corporate gifts. Quotes, deliveries and orders are not available yet.",
    },
    builderCopy: {
      ...t.builderCopy,
      intro: copy.concept,
      reviewText: copy.note,
      addBox: copy.cta,
      note: sv
        ? "En lokal skiss. Din hälsning skickas inte med intresseanmälan."
        : "A local sketch. Your message is not sent with an interest registration.",
    },
    pages: {
      ...t.pages,
      about: { ...t.pages.about, text: copy.intro, extra: copy.concept },
      faq: { ...t.pages.faq, extra: copy.note },
      "shipping-returns": {
        ...t.pages["shipping-returns"],
        text: copy.note,
        extra: sv
          ? "Vi tar inte emot beställningar eller förbeställningar. Pris, lager och leverans är inte fastställda."
          : "We accept neither orders nor pre-orders. Pricing, stock and delivery are not confirmed.",
      },
      terms: {
        ...t.pages.terms,
        text: copy.note,
        extra: sv
          ? "En intresseanmälan är inte ett avtal om köp och ger ingen reservation eller leveransgaranti."
          : "An interest registration is not a purchase contract and provides no reservation or delivery guarantee.",
      },
    },
    faqs: [
      {
        q: sv
          ? "Kan jag beställa eller förbeställa?"
          : "Can I order or pre-order?",
        a: copy.note,
      },
      {
        q: sv
          ? "Vad innebär en intresseanmälan?"
          : "What does registering interest mean?",
        a: copy.intro,
      },
      {
        q: sv ? "Är presentboxarna färdiga?" : "Are the gift boxes ready?",
        a: copy.concept,
      },
      t.faqs[2],
    ],
  };
}
