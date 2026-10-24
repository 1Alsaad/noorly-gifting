import type { Dictionary } from "./translations";
import type { Locale } from "@/types/commerce";
import { brand } from "@/config/brand";

/** Customer-facing read-only storefront copy. Never imply an order can be paid. */
export function applyProductTestCopy(
  t: Dictionary,
  locale: Locale,
): Dictionary {
  const sv = locale === "sv";
  const note = sv
    ? "Vi har fått in teakskålar och förpackad ljussand. Beställning öppnar när det färdiga paketet och leveransvillkoren är fastställda."
    : "We have received teak bowls and packaged candle sand. Ordering will open when the finished set and delivery terms are confirmed.";
  const contact = brand.supportEmail;
  return {
    ...t,
    preview: sv ? "Första upplagan" : "First edition",
    available: sv ? "I sortimentet" : "In the range",
    unavailable: sv ? "Köp öppnar snart" : "Ordering opens soon",
    delivery: sv ? "Leverans inom Sverige" : "Delivery in Sweden",
    deliveryText: sv
      ? "Svensk leverans planeras. Leveranstid och fraktvillkor anges innan du kan beställa."
      : "Shipping within Sweden is planned. Delivery dates and shipping terms will be shown before you can order.",
    tax: note,
    checkout: sv ? "Utforska Ljusstund" : "Explore Ljusstund",
    add: sv ? "Läs om produkten" : "Read about the product",
    footer: {
      ...t.footer,
      rights: brand.name,
    },
    home: {
      ...t.home,
      text: sv
        ? "Noorly samlar dekorativa detaljer och ljussand för lugna stunder. Vår första omgång teakskålar och förpackad ljussand har kommit in."
        : "Noorly brings together decorative details and candle sand for slower moments. Our first batch of teak bowls and packaged candle sand has arrived.",
      curatedLabel: sv ? "NOORLY · FÖRSTA UPPLAGAN" : "NOORLY · FIRST EDITION",
      curatedText: sv
        ? "Vår första produktidé utgår från en dekorativ teakskål och ljussand. Exakt paketinnehåll visas före köp."
        : "Our first selection is based on a decorative teak bowl and candle sand. Exact contents will be shown before purchase.",
      buildText: note,
      trust: sv
        ? [
            "Teakskålar i lager",
            "Förpackad ljussand i lager",
            "Information före beställning",
          ]
        : [
            "Teak bowls in stock",
            "Packaged candle sand in stock",
            "Full details before ordering",
          ],
      newsletterTitle: sv ? "En hälsning från Noorly" : "A note from Noorly",
      newsletterText: note,
      reviewsLabel: sv ? "VÅR FÖRSTA UPPLAGA" : "OUR FIRST EDITION",
      reviewsText: note,
      corporateText: sv
        ? `Kontakta oss på ${contact} om du vill diskutera en företagsgåva.`
        : `Contact us at ${contact} to discuss a company gift.`,
    },
    builderCopy: {
      ...t.builderCopy,
      intro: note,
      reviewText: note,
      addBox: sv ? "Läs mer" : "Find out more",
      note: sv
        ? "Anpassade gåvoboxar erbjuds inte i den första upplagan."
        : "Custom gift boxes are not part of the first edition.",
    },
    pages: {
      ...t.pages,
      about: {
        ...t.pages.about,
        text: sv
          ? "Noorly är en gåvobutik med fokus på utvalda naturmaterial och lugna vardagsstunder. Vår första upplaga bygger på teakskålar och förpackad ljussand."
          : "Noorly is a gifting brand focused on selected natural materials and quiet everyday moments. Our first edition centres on teak bowls and packaged candle sand.",
        extra: sv
          ? "Vi väljer ut produkter som kan ges bort eller användas som dekoration. Du får information om innehåll, material och säker användning före köp."
          : "We select items for gifting and decoration. The exact contents, materials and safe usage instructions will be provided before purchase.",
      },
      faq: {
        ...t.pages.faq,
        extra: note,
      },
      "shipping-returns": {
        ...t.pages["shipping-returns"],
        text: sv
          ? "Vi planerar leverans inom Sverige. När beställningar öppnar ser du totalpris, frakt och beräknad leveranstid innan du betalar."
          : "We plan to ship within Sweden. When ordering opens, the total price, shipping and estimated delivery date will be shown before payment.",
        extra: sv
          ? `Vi tar ännu inte emot betalningar eller beställningar. Vid framtida distansköp gäller som huvudregel 14 dagars ångerrätt enligt lag. Frågor: ${contact}.`
          : `We are not yet accepting payments or orders. When distance sales open, the statutory withdrawal right generally applies for 14 days. Questions: ${contact}.`,
      },
      privacy: {
        ...t.pages.privacy,
        text: sv
          ? "Vi använder nödvändig lagring för att webbplatsen ska fungera och komma ihåg dina cookieval. Frivillig analys och marknadsföring aktiveras bara med ditt samtycke."
          : "Necessary storage keeps the website running and remembers your cookie preferences. Optional analytics and marketing operate only with your consent.",
        extra: sv
          ? `Om du skriver till oss behandlar vi uppgifterna i din förfrågan för att kunna svara. Kontakta ${contact} för frågor om personuppgifter eller dina rättigheter.`
          : `When you email us, we process the information in your inquiry to respond. Contact ${contact} for questions about personal data or your rights.`,
      },
      cookies: {
        ...t.pages.cookies,
        text: sv
          ? "Nödvändiga cookies och lokal lagring används för webbplatsens funktion och dina val. Analys och marknadsföring är separata, frivilliga kategorier."
          : "Necessary cookies and local storage support the site and your choices. Analytics and marketing are separate optional categories.",
        extra: sv
          ? "Du kan godkänna eller neka frivilliga kategorier och ändra dig i Cookieinställningar längst ned på sidan."
          : "You can accept or reject optional categories and change your decision in Cookie settings in the footer.",
      },
      terms: {
        ...t.pages.terms,
        text: sv
          ? "Noorlys webbplats visar vår första upplaga. Beställningsfunktionen är inte öppen ännu och du kan inte ingå ett köpeavtal eller betala här."
          : "Noorly's site introduces our first edition. Ordering is not open yet, and no purchase contract or payment can be completed here.",
        extra: sv
          ? `Föreslaget pris och innehåll bekräftas före säljstart. En intresseförfrågan skapar ingen beställning eller reservation. Vid frågor, skriv till ${contact}.`
          : `The proposed price and contents will be confirmed before launch. An expression of interest is not an order or reservation. Questions: ${contact}.`,
      },
    },
    faqs: [
      {
        q: sv ? "Kan jag beställa Ljusstund idag?" : "Can I order Ljusstund today?",
        a: sv
          ? "Inte ännu. Vi har skålar och ljussand i lager, men slutför paketets innehåll och köpvillkor innan kassan öppnar."
          : "Not yet. We have bowls and candle sand in stock, but we are finalising the set contents and purchase terms before checkout opens.",
      },
      {
        q: sv ? "Vad ingår i Ljusstund?" : "What is included in Ljusstund?",
        a: sv
          ? "Vi utgår från AWGifts teakskål TeakB-37 och förpackad ljussand. Exakt antal, färger och eventuella dofter anges innan köp."
          : "The selection is based on AWGifts TeakB-37 teak bowl and packaged candle sand. Exact quantities, colours and fragrances will be stated before purchase.",
      },
      {
        q: sv
          ? "Kan jag tända ljussand direkt i teakskålen?"
          : "Can I burn candle sand directly in the teak bowl?",
        a: sv
          ? "Nej. Teakskålen är en dekorativ träskål, inte ett värmetåligt ljuskärl. Följ tillverkarens anvisningar och använd separat lämpligt obrännbart kärl för eventuell låga."
          : "No. The teak bowl is decorative wood, not a heat-resistant candle vessel. Follow the manufacturer's instructions and use a separate suitable noncombustible container for any flame.",
      },
      {
        q: sv ? "Hur tar jag kontakt?" : "How can I get in touch?",
        a: sv ? `Skriv till ${contact}.` : `Email ${contact}.`,
      },
    ],
  };
}
