import type { Dictionary } from "./translations";
import type { Locale } from "@/types/commerce";
import { brand } from "@/config/brand";

/** Factual brand and service copy shared by the preparation and sales views. */
export function applyBrandCopy(t: Dictionary, locale: Locale): Dictionary {
  const sv = locale === "sv";
  const contact = brand.supportEmail;
  const delivery = sv
    ? "För Ljusstund ingår leverans inom Sverige. Beräknad leveransperiod anges på produktsidan före betalning."
    : "Shipping within Sweden is included for Ljusstund. The estimated delivery window is shown on the product page before payment.";
  const care = sv
    ? "Teakskålen är dekorativ och får inte användas direkt som ljuskärl. Följ tillverkarens anvisningar för ljussanden och använd ett separat lämpligt obrännbart och värmetåligt kärl för eventuell låga."
    : "The teak bowl is decorative and must not be used directly as a candle vessel. Follow the candle-sand manufacturer's instructions and use a separate suitable noncombustible, heat-resistant container for any flame.";
  return {
    ...t,
    preview: sv ? "Noorly · första upplagan" : "Noorly · first edition",
    delivery: sv ? "Leverans inom Sverige" : "Delivery within Sweden",
    deliveryText: delivery,
    tax: sv
      ? "Leverans inom Sverige ingår för Ljusstund. Du ser hela beloppet i kassan innan du betalar."
      : "Shipping within Sweden is included for Ljusstund. You can review the complete total at checkout before paying.",
    materialText: care,
    footer: { ...t.footer, rights: brand.name },
    home: {
      ...t.home,
      text: sv
        ? "Noorly samlar dekorativa detaljer och ljussand för lugna stunder. Upptäck Ljusstund, vår första upplaga."
        : "Noorly brings together decorative details and candle sand for slower moments. Discover Ljusstund, our first edition.",
      curatedLabel: sv ? "NOORLY · FÖRSTA UPPLAGAN" : "NOORLY · FIRST EDITION",
      curatedText: sv
        ? "Ljusstund kombinerar en dekorativ teakskål med förpackad ljussand. Se produktens exakta innehåll och användningsinformation."
        : "Ljusstund pairs a decorative teak bowl with packaged candle sand. Explore the exact contents and usage information on the product page.",
      buildText: sv
        ? "Vi fokuserar på Ljusstund i vår första upplaga."
        : "Our first edition focuses on Ljusstund.",
      trust: sv
        ? [
            "Utvalt av Noorly",
            "Tydlig produktinformation",
            "Säker kassa hos Shopify",
          ]
        : [
            "Selected by Noorly",
            "Clear product information",
            "Secure Shopify checkout",
          ],
      reviewsLabel: sv ? "VÅR FÖRSTA UPPLAGA" : "OUR FIRST EDITION",
      reviewsText: sv
        ? "Läs om innehållet och hur varje artikel ska användas på produktsidan."
        : "Read about the contents and how to use each item on the product page.",
      corporateText: sv
        ? `Kontakta oss på ${contact} om du vill diskutera en företagsgåva.`
        : `Contact us at ${contact} to discuss a company gift.`,
    },
    builderCopy: {
      ...t.builderCopy,
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
          ? "Vi väljer ut produkter för gåvor och dekoration. På produktsidan hittar du innehåll, material och information om säker användning."
          : "We select items for gifting and decoration. The product page describes the contents, materials and safe usage.",
      },
      faq: {
        ...t.pages.faq,
        extra: sv
          ? `Saknar du svar på en fråga? Skriv till ${contact}.`
          : `Have another question? Email ${contact}.`,
      },
      "shipping-returns": {
        ...t.pages["shipping-returns"],
        text: delivery,
        extra: sv
          ? `Kontakta ${contact} med ditt ordernummer om du har frågor om leverans, ånger, retur eller reklamation. Be om returinstruktioner innan du skickar tillbaka en vara.`
          : `Contact ${contact} with your order number about delivery, cancellation, returns or complaints. Ask for return instructions before sending an item back.`,
      },
      privacy: {
        ...t.pages.privacy,
        text: sv
          ? "Vi använder nödvändig lagring för webbplatsens funktion, varukorgen och dina cookieval. Frivillig analys och marknadsföring aktiveras bara med ditt samtycke."
          : "Necessary storage supports the website, your cart and your cookie choices. Optional analytics and marketing operate only with your consent.",
        extra: sv
          ? `När du kontaktar oss använder vi uppgifterna i din förfrågan för att kunna svara. Betalning hanteras i Shopifys kassa. Kontakta ${contact} för frågor om personuppgifter eller dina rättigheter.`
          : `When you contact us, we use the information in your inquiry to respond. Payments are handled in Shopify checkout. Contact ${contact} for questions about personal data or your rights.`,
      },
      cookies: {
        ...t.pages.cookies,
        text: sv
          ? "Nödvändiga cookies och lokal lagring används för webbplatsens funktion och dina val. Analys och marknadsföring är separata, frivilliga kategorier."
          : "Necessary cookies and local storage support the site and your choices. Analytics and marketing are separate optional categories.",
        extra: sv
          ? "Du kan godkänna eller neka frivilliga kategorier och ändra dig i Cookieinställningar längst ned på sidan. Du kan handla även om du nekar frivilliga cookies."
          : "You can accept or reject optional categories and change your decision in Cookie settings in the footer. Rejecting optional cookies does not prevent you from shopping.",
      },
      terms: {
        ...t.pages.terms,
        text: sv
          ? "På produktsidan visas innehåll, pris och användningsinformation för Ljusstund. Tillgängliga produkter kan läggas i varukorgen. Betalning hanteras i Shopifys kassa, där du granskar totalbeloppet och väljer bland de betalningssätt som erbjuds."
          : "The product page shows Ljusstund's contents, price and usage information. Available products can be added to your cart. Payment is handled in Shopify checkout, where you review the total and choose from the payment methods offered.",
        extra: sv
          ? `Priser anges i SEK. Inga kortuppgifter samlas in på denna webbplats. Frågor om en beställning, ånger, retur eller reklamation skickas till ${contact}.`
          : `Prices are shown in SEK. This website does not collect card details. Email ${contact} about an order, cancellation, return or complaint.`,
      },
    },
    faqs: [
      {
        q: sv ? "Hur beställer jag Ljusstund?" : "How do I order Ljusstund?",
        a: sv
          ? "När produkten är tillgänglig kan du lägga den i varukorgen och fortsätta till Shopifys säkra kassa. Granska innehåll, leveransinformation och totalbelopp innan du betalar."
          : "When the product is available, add it to your cart and continue to secure Shopify checkout. Review the contents, delivery information and total before paying.",
      },
      {
        q: sv ? "Vad ingår i Ljusstund?" : "What is included in Ljusstund?",
        a: sv
          ? "Ljusstund utgår från AWGifts dekorativa teakskål TeakB-37 och förpackad ljussand. Se produktsidan för exakt antal, mängd, färg och eventuell doft."
          : "Ljusstund is based on the AWGifts decorative TeakB-37 bowl and packaged candle sand. See the product page for exact quantities, weight, colour and any fragrance.",
      },
      {
        q: sv
          ? "Kan jag tända ljussand direkt i teakskålen?"
          : "Can I burn candle sand directly in the teak bowl?",
        a: care,
      },
      {
        q: sv ? "Hur tar jag kontakt?" : "How can I get in touch?",
        a: sv ? `Skriv till ${contact}.` : `Email ${contact}.`,
      },
    ],
  };
}

/** Read-only preparation copy layers on the same factual brand information. */
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
    available: sv ? "I sortimentet" : "In the range",
    unavailable: sv ? "Köp öppnar snart" : "Ordering opens soon",
    deliveryText: sv
      ? "Svensk leverans planeras. Leveranstid och fraktvillkor anges innan du kan beställa."
      : "Shipping within Sweden is planned. Delivery dates and shipping terms will be shown before you can order.",
    tax: note,
    checkout: sv ? "Utforska Ljusstund" : "Explore Ljusstund",
    add: sv ? "Läs om produkten" : "Read about the product",
    home: {
      ...t.home,
      buildText: note,
      newsletterTitle: sv ? "En hälsning från Noorly" : "A note from Noorly",
      newsletterText: note,
      reviewsText: note,
    },
    builderCopy: {
      ...t.builderCopy,
      intro: note,
      reviewText: note,
      addBox: sv ? "Läs mer" : "Find out more",
    },
    pages: {
      ...t.pages,
      faq: { ...t.pages.faq, extra: note },
      "shipping-returns": {
        ...t.pages["shipping-returns"],
        text: sv
          ? "Vi planerar leverans inom Sverige. När beställningar öppnar ser du totalpris, frakt och beräknad leveranstid innan du betalar."
          : "We plan to ship within Sweden. When ordering opens, the total price, shipping and estimated delivery date will be shown before payment.",
        extra: sv
          ? `Vi tar ännu inte emot betalningar eller beställningar. Frågor om kommande leverans- och returvillkor skickas till ${contact}.`
          : `We are not yet accepting payments or orders. Email ${contact} with questions about the forthcoming delivery and return terms.`,
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
        q: sv
          ? "Kan jag beställa Ljusstund idag?"
          : "Can I order Ljusstund today?",
        a: sv
          ? "Inte ännu. Vi har skålar och ljussand i lager, men slutför paketets innehåll och köpvillkor innan kassan öppnar."
          : "Not yet. We have bowls and candle sand in stock, but we are finalising the set contents and purchase terms before checkout opens.",
      },
      ...t.faqs.slice(1),
    ],
  };
}
