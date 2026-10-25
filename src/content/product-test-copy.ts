import type { Dictionary } from "./translations";
import type { Locale } from "@/types/commerce";
import { brand } from "@/config/brand";

/** Factual brand and service copy shared by the preparation and sales views. */
export function applyBrandCopy(t: Dictionary, locale: Locale): Dictionary {
  const sv = locale === "sv";
  const contact = brand.supportEmail;
  const delivery = sv
    ? "Leverans inom Sverige ingår. Förbeställ nu. Vi skickar din beställning så snart produkten finns i lager hos oss."
    : "Shipping within Sweden is included. Pre-order now. We will dispatch your order as soon as the product arrives in stock.";
  const care = sv
    ? "Använd ljussanden i ett stabilt, obrännbart och värmetåligt kärl avsett för ljus. Följ instruktionerna på förpackningen och lämna aldrig ett tänt ljus utan uppsikt."
    : "Use candle sand in a stable, noncombustible, heat-resistant vessel designed for candles. Follow the instructions on the packaging and never leave a burning candle unattended.";
  return {
    ...t,
    preview: sv ? "Noorly · första upplagan" : "Noorly · first edition",
    delivery: sv ? "Leverans inom Sverige" : "Delivery within Sweden",
    deliveryText: delivery,
    tax: sv
      ? "Moms och leverans inom Sverige ingår. Du ser hela beloppet i kassan innan du betalar."
      : "VAT and shipping within Sweden are included. You can review the complete total at checkout before paying.",
    materialText: care,
    footer: { ...t.footer, rights: brand.name },
    home: {
      ...t.home,
      text: sv
        ? "Upptäck ljussand i din favoritfärg och dekorativa teakskålar för hemmet. Välj produkterna var för sig eller tillsammans i vårt paket."
        : "Discover candle sand in your favourite colour and decorative teak bowls for your home. Choose the products individually or together in our bundle.",
      curatedLabel: sv ? "NOORLY · FÖRSTA UPPLAGAN" : "NOORLY · FIRST EDITION",
      curatedText: sv
        ? "Välj färg och doft på din ljussand. Varje påse innehåller 300 g och fyra bomullsvekar. Välj till en dekorativ teakskål genom vårt paketerbjudande, eller köp produkterna var för sig."
        : "Choose your candle sand's colour and scent. Each pouch contains 300 g and four cotton wicks. Choose our bundle to include a decorative teak bowl, or buy the products individually.",
      buildText: sv
        ? "Vår första upplaga består av ljussand och dekorativa teakskålar. Välj enskilda produkter eller vårt paket med båda."
        : "Our first edition features candle sand and decorative teak bowls, available individually or as a bundle.",
      trust: sv
        ? ["Utvalt av Noorly", "Tydlig produktinformation", "Säker betalning"]
        : ["Selected by Noorly", "Clear product information", "Secure payment"],
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
          ? `När du kontaktar oss använder vi uppgifterna i din förfrågan för att kunna svara. Betalning hanteras i vår säkra kassa. Kontakta ${contact} för frågor om personuppgifter eller dina rättigheter.`
          : `When you contact us, we use the information in your inquiry to respond. Payments are handled through our secure checkout. Contact ${contact} for questions about personal data or your rights.`,
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
          ? "På varje produktsida visas innehåll, pris och användningsinformation. Ljussand och teakskål kan förbeställas var för sig eller tillsammans i vårt paket. Betalning sker i vår säkra kassa, där du granskar totalbeloppet och väljer betalningssätt. Vi skickar din beställning så snart produkten finns i lager hos oss."
          : "Each product page shows the contents, price and usage information. Candle sand and the teak bowl can be pre-ordered individually or together in our bundle. Pay through our secure checkout, where you review the total and choose a payment method. We will dispatch your order as soon as the product arrives in stock.",
        extra: sv
          ? `Priser anges i SEK. Inga kortuppgifter samlas in på denna webbplats. Frågor om en beställning, ånger, retur eller reklamation skickas till ${contact}.`
          : `Prices are shown in SEK. This website does not collect card details. Email ${contact} about an order, cancellation, return or complaint.`,
      },
    },
    faqs: [
      {
        q: sv ? "Hur beställer jag?" : "How do I order?",
        a: sv
          ? "Välj en enskild produkt eller vårt paket och välj färg och doft för ljussanden. Lägg varan i påsen och fortsätt till vår säkra kassa. Granska innehåll, leveransinformation och totalbelopp innan du betalar."
          : "Choose an individual product or our bundle, then select the candle sand colour and scent. Add the item to your bag and continue to our secure checkout. Review the contents, delivery information and total before paying.",
      },
      {
        q: sv
          ? "Vad ingår i produkterna?"
          : "What is included in each product?",
        a: sv
          ? "Ljussanden säljs som en påse med 300 g i vald färg och doft, med fyra bomullsvekar. Teakskålen kan köpas separat eller i vårt paket med en påse ljussand och fyra bomullsvekar. Presentbox, frukt och andra dekorationer ingår inte."
          : "Candle sand is sold as one 300 g pouch in your chosen colour and scent, with four cotton wicks. The teak bowl is available separately or in our bundle with one pouch of candle sand and four cotton wicks. A gift box, fruit and other styling decorations are not included.",
      },
      {
        q: sv
          ? "När skickas min beställning?"
          : "When will my order be dispatched?",
        a: delivery,
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
    ? "Ljussand och dekorativa teakskålar finns som enskilda produkter och som paket. Varje påse ljussand innehåller 300 g och fyra bomullsvekar. Beställning och betalning är ännu inte öppna i denna förhandsvisning."
    : "Candle sand and decorative teak bowls are available individually and as a bundle. Each pouch of candle sand contains 300 g and four cotton wicks. Ordering and payment are not yet open in this preview.";
  const contact = brand.supportEmail;
  return {
    ...t,
    available: sv ? "I sortimentet" : "In the range",
    unavailable: sv ? "Beställning är inte öppen" : "Ordering is not open",
    deliveryText: sv
      ? "Leverans inom Sverige ingår. Beställning och betalning är ännu inte öppna i denna förhandsvisning."
      : "Shipping within Sweden is included. Ordering and payment are not yet open in this preview.",
    tax: note,
    checkout: sv ? "Utforska produkterna" : "Explore the products",
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
          ? "Kan jag beställa i förhandsvisningen?"
          : "Can I order in this preview?",
        a: sv
          ? "Nej. Förhandsvisningen tar inte emot beställningar eller betalningar. En intresseförfrågan innebär ingen beställning eller reservation."
          : "No. This preview does not accept orders or payments. An expression of interest is not an order or reservation.",
      },
      ...t.faqs.slice(1),
    ],
  };
}
