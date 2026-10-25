import { isProductTestMode } from "@/config/product-test";
import {
  applyBrandCopy,
  applyProductTestCopy,
} from "@/content/product-test-copy";
import { brand } from "@/config/brand";
import type { Locale } from "@/types/commerce";

const en = {
  skip: "Skip to content",
  shop: "All gifts",
  collection: "The winter collection",
  builder: "Build a gift box",
  about: "Our story",
  corporate: "Corporate gifting",
  cart: "Your bag",
  menu: "Open navigation",
  close: "Close",
  language: "Language",
  preview: "A fictional collection · Preview store · No real orders",
  edition: "THE WINTER EDITION · 2026",
  brandTag: "THE ART OF THOUGHTFUL GIVING",
  add: "Add to bag",
  added: "Added to your bag",
  adding: "Adding…",
  error: "Something went wrong. Please try again.",
  unavailable: "Currently unavailable",
  available: "Available",
  variant: "Choose an option",
  from: "From",
  back: "Back",
  next: "Continue",
  remove: "Remove",
  edit: "Edit your box",
  quantity: "Quantity",
  total: "Total",
  subtotal: "Subtotal",
  empty: "Your bag is waiting for a little thoughtfulness.",
  browse: "Discover the gifts",
  tax: "Shipping and taxes are calculated securely at checkout. Every charge is shown before you pay.",
  checkout: "Continue to secure checkout",
  checking: "Preparing checkout…",
  mockCheckoutTitle: "Your preview bag is ready.",
  mockCheckoutText:
    "This is a demonstration checkout. No payment is collected and no order has been placed.",
  returnShop: "Return to the collection",
  cartUpdated: "Your bag has been updated",
  giftMessage: "Your personal message",
  messageHint:
    "Up to 280 characters. We never include your message in analytics.",
  messagePlaceholder: "A few words from you…",
  saveMessage: "Save message",
  giftBox: "Your own gift box",
  individual: "Individual gifts",
  included: "Inside the box",
  delivery: "Thoughtfully packed. Ready to give.",
  deliveryText:
    "Delivery dates, destinations and rates will be confirmed when the store launches.",
  materials: "Materials & care",
  materialText:
    "Sample product specifications. Confirm ingredients, allergens, material origins and care instructions with the supplier before launch.",
  related: "A little more to discover",
  occasion: "Occasion",
  any: "All occasions",
  winter: "Winter",
  newHome: "New home",
  thanks: "A little thank you",
  filter: "Find your gift",
  category: "Gift type",
  all: "All gifts",
  boxes: "Gift boxes",
  items: "Individual pieces",
  price: "Maximum price",
  noResults: "No gifts match your selection. Try another filter.",
  home: {
    eyebrow: "SMALL GESTURES. LASTING FEELINGS.",
    title: "A little warmth,\nbeautifully given.",
    text: "Good things, brought together with care. Meet our small collection of gifts for the slower days of winter.",
    curated: "Thoughtfully brought together",
    curatedLabel: "01 / THE CURATED COLLECTION",
    curatedText:
      "Three ways to say you’re thinking of someone. Each box is a small world of its own.",
    viewAll: "Explore all gifts",
    buildLabel: "02 / MAKE IT PERSONAL",
    buildTitle: "A box as\nthoughtful as you.",
    buildText:
      "A favourite scent. A quiet cup of tea. A few words that mean everything. Choose the little things, and make it theirs.",
    buildCta: "Create your gift box",
    storyLabel: "FEWER THINGS. MORE MEANING.",
    storyTitle: "Made for the moment\nbetween the moments.",
    storyText:
      "Inspired by Nordic winters and the everyday rituals that bring us closer. Simple pieces. Natural textures. A little room to slow down.",
    storyCta: `The story of ${brand.name}`,
    trust: [
      "A small, considered collection",
      "A note in your own words",
      "Secure, hosted checkout",
    ],
    reviewsLabel: "WORDS TO COME",
    reviews: "Every gift starts a story.",
    reviewsText:
      "Customer stories will appear here after launch. We only publish genuine, verified feedback.",
    corporateTitle: "A thoughtful thank you.\nFor the whole team.",
    corporateText:
      "Considered gifts for the people who make a difference. Tell us what you have in mind.",
    newsletterTitle: "A note when the season turns.",
    newsletterText:
      "New collections, quiet inspiration. Only when there’s something worth sharing.",
  },
  footer: {
    text: "Thoughtful gifts. For this season, and the ones to come.",
    explore: "Explore",
    help: "Here to help",
    details: "The details",
    rights: `${brand.name} · Fictional demonstration brand`,
    cookieSettings: "Cookie settings",
    contact: "Contact & support",
    faq: "Questions & answers",
    shipping: "Shipping & returns",
    privacy: "Privacy",
    cookies: "Cookies",
    terms: "Terms",
    accessibility: "Accessibility",
  },
  builderCopy: {
    title: "Make it theirs.",
    intro: "A few thoughtful choices. One personal gift.",
    steps: [
      "The box",
      "A signature",
      "The little extras",
      "A card",
      "Your words",
      "The finishing touch",
    ],
    size: "Start with the right box.",
    small: "The little box",
    large: "The generous box",
    smallText: "A signature piece + 2 little extras",
    largeText: "A signature piece + 3 little extras",
    signature: "Set the mood.",
    extras: "Add their little favourites.",
    choose: "Choose",
    selected: "Selected",
    card: "A small finishing touch.",
    noCard: "Keep it simple, without a card",
    message: "Say it in your own words.",
    review: "A gift, made by you.",
    reviewText:
      "Check every little detail before adding your complete box to the bag.",
    invalid:
      "Please complete this step. Select available products and the required number of extras.",
    count: "Selected",
    resume: "Your choices are saved on this device.",
    clear: "Start again",
    addBox: "Add your gift box to bag",
    completed: "Your personal gift box is in the bag.",
    selectedPrefix: "A thoughtful start",
    note: "Optional. Your message is included with this box.",
    extraRule: "Choose exactly",
    pieces: "pieces",
    packing: "Gift packaging",
    signatureLabel: "Signature piece",
  },
  forms: {
    email: "Email address",
    name: "Your name",
    company: "Company",
    volume: "Number of gifts",
    country: "Delivery country (two-letter code)",
    date: "Desired delivery date",
    message: "Anything else we should know?",
    consent:
      "I agree to the privacy policy and consent to being contacted about this enquiry.",
    newsletterConsent:
      "I agree to receive occasional emails. I can unsubscribe at any time.",
    send: "Send your enquiry",
    subscribe: "Keep me in the loop",
    sending: "Sending…",
    success:
      "Your preview submission was validated. No email has been sent. Connect a delivery provider before launch.",
    realSuccess: "Thank you. Your submission has been received.",
    failure: "We couldn’t send this. Check the fields and try again.",
    spam: "Leave this field empty",
    corporateTitle: "A little gratitude.\nA lasting impression.",
    corporateText:
      "From a team of ten to a company-wide thank you. Share your plans and we’ll help find a thoughtful way to say it.",
  },
  pages: {
    about: {
      eyebrow: "OUR STORY",
      title: "Thoughtfulness,\nin the little things.",
      text: `${brand.name} is a working concept for a seasonal gifting studio inspired by the Nordic way of finding warmth in simple rituals. Our first fictional collection brings together tactile pieces for slower winter days.`,
      extra:
        "We believe a gift can be quiet and still say a great deal. This foundation is designed for a small, considered assortment that changes with the season.",
    },
    faq: {
      eyebrow: "HERE TO HELP",
      title: "A few good questions.",
      text: "Useful details about the collection and your gift.",
      extra:
        "This preview store does not accept orders. Final fulfilment policies must be confirmed before launch.",
    },
    "shipping-returns": {
      eyebrow: "THE PRACTICAL DETAILS",
      title: "From our hands\nto theirs.",
      text: "Preview policy — legal and operational review required. Delivery destinations, dispatch times, shipping prices, return instructions and withdrawal rights must be confirmed by the merchant before launch.",
      extra:
        "Production checkout will display the actual available delivery methods, taxes and total payable amount before payment. Contact the configured customer service team for help.",
    },
    privacy: {
      eyebrow: "YOUR PRIVACY",
      title: "A considered approach\nto your data.",
      text: "Draft policy — legal review required before launch. Necessary cookies support the bag and your preferences. Optional analytics and marketing are disabled until you choose to enable them.",
      extra:
        "The merchant must supply its legal entity, contact details, lawful bases, processors, retention periods, international transfer safeguards and data subject request process. Gift messages and contact details are excluded from analytics.",
    },
    cookies: {
      eyebrow: "YOUR CHOICE",
      title: "A little clarity\nabout cookies.",
      text: "Draft policy — legal review required. Necessary storage keeps your bag and consent choices working. Analytics storage is optional. Marketing is separately optional and no marketing provider is currently configured.",
      extra:
        "You can accept, reject or customize optional categories, and change your choice through Cookie settings in the footer. Rejecting optional storage preserves the complete shopping experience.",
    },
    terms: {
      eyebrow: "THE DETAILS",
      title: "Clear expectations.\nThoughtful service.",
      text: "Draft terms — legal review required. This fictional preview cannot accept real purchases. The legal seller, registration and VAT numbers, prices, delivery terms, right of withdrawal, return exceptions and complaints process must be approved before launch.",
      extra:
        "All sample prices are in SEK. Once configured, payments are completed at the commerce provider’s secure checkout. This website never collects card details.",
    },
    accessibility: {
      eyebrow: "OPEN TO EVERYONE",
      title: "Thoughtful by design.",
      text: "We are working towards WCAG 2.2 AA. The foundation includes keyboard navigation, visible focus, accessible dialogs, clear labels and an equivalent shopping experience with reduced motion.",
      extra:
        "All products are available through the standard shop, with still photographs and clear product options. Automated checks do not replace a complete accessibility audit; contact customer service about barriers.",
    },
  },
  faqs: [
    {
      q: "Can I order from this website?",
      a: "This is a clearly marked preview. Real orders become available when the shop opens for purchases.",
    },
    {
      q: "Can I include a personal message?",
      a: "Yes. Add up to 280 characters to your own gift box, and review or edit it in your bag.",
    },
    {
      q: "Where can I see all the products?",
      a: "Visit the shop to see each product, its photographs and available options.",
    },
    {
      q: "How are payments handled?",
      a: "Payments are handled through our secure checkout. No card information is collected on this website.",
    },
  ],
  notFound: {
    title: "A little off the path.",
    text: "We couldn’t find this page. The collection is a good place to begin again.",
  },
  retry: "Try again",
  errorTitle: "A small pause.",
  errorText: "We couldn’t load this part of the collection. Please try again.",
  collectionText:
    "The quiet comforts of winter, brought together with care. Discover warm scents, soft textures and small gestures for the people you’re thinking of.",
  collectionTitle: "The warmth\nof winter.",
  collectionLabel: "SEASONAL STORIES / WINTER 2026",
};

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };
export type Dictionary = Widen<typeof en>;
const sv: Dictionary = {
  ...en,
  skip: "Hoppa till innehållet",
  shop: "Alla gåvor",
  collection: "Vinterkollektionen",
  builder: "Bygg en presentbox",
  about: "Vår berättelse",
  corporate: "Företagsgåvor",
  cart: "Din påse",
  menu: "Öppna menyn",
  close: "Stäng",
  language: "Språk",
  preview:
    "En fiktiv kollektion · Förhandsvisning · Inga riktiga beställningar",
  edition: "VINTERUTGÅVAN · 2026",
  brandTag: "KONSTEN ATT GE MED OMTANKE",
  add: "Lägg i påsen",
  added: "Tillagd i din påse",
  adding: "Lägger till…",
  error: "Något gick fel. Försök igen.",
  unavailable: "Tillfälligt slut",
  available: "I lager",
  variant: "Välj ett alternativ",
  from: "Från",
  back: "Tillbaka",
  next: "Fortsätt",
  remove: "Ta bort",
  edit: "Ändra din box",
  quantity: "Antal",
  total: "Totalt",
  subtotal: "Delsumma",
  empty: "Din påse väntar på lite omtanke.",
  browse: "Upptäck gåvorna",
  tax: "Frakt och skatt beräknas i den säkra kassan. Du ser hela beloppet innan du betalar.",
  checkout: "Fortsätt till säker kassa",
  checking: "Förbereder kassan…",
  mockCheckoutTitle: "Din påse är redo för förhandsvisning.",
  mockCheckoutText:
    "Det här är en demokassa. Ingen betalning tas emot och ingen beställning har lagts.",
  returnShop: "Tillbaka till kollektionen",
  cartUpdated: "Din påse har uppdaterats",
  giftMessage: "Din personliga hälsning",
  messageHint: "Högst 280 tecken. Din hälsning ingår aldrig i analysdata.",
  messagePlaceholder: "Några ord från dig…",
  saveMessage: "Spara hälsning",
  giftBox: "Din egen presentbox",
  individual: "Enskilda gåvor",
  included: "I presentboxen",
  delivery: "Omsorgsfullt packat. Redo att ges.",
  deliveryText:
    "Leveranstider, destinationer och priser bekräftas inför butikens lansering.",
  materials: "Material & skötsel",
  materialText:
    "Exempelspecifikationer. Bekräfta ingredienser, allergener, materialursprung och skötselråd med leverantören före lansering.",
  related: "Lite mer att upptäcka",
  occasion: "Tillfälle",
  any: "Alla tillfällen",
  winter: "Vinter",
  newHome: "Nytt hem",
  thanks: "Ett litet tack",
  filter: "Hitta din gåva",
  category: "Typ av gåva",
  all: "Alla gåvor",
  boxes: "Presentboxar",
  items: "Enskilda produkter",
  price: "Högsta pris",
  noResults: "Inga gåvor matchar ditt val. Prova ett annat filter.",
  home: {
    eyebrow: "SMÅ GESTER. VARMA KÄNSLOR.",
    title: "Lite värme,\nvackert given.",
    text: "Fina ting, samlade med omsorg. Upptäck vår lilla kollektion för vinterns långsammare dagar.",
    curated: "Sammansatt med omtanke",
    curatedLabel: "01 / DEN UTVALDA KOLLEKTIONEN",
    curatedText:
      "Tre sätt att visa att du tänker på någon. Varje box är en liten värld i sig.",
    viewAll: "Upptäck alla gåvor",
    buildLabel: "02 / GÖR DET PERSONLIGT",
    buildTitle: "En box med\ndin omtanke.",
    buildText:
      "En älskad doft. En stilla kopp te. Några ord som betyder allt. Välj de små sakerna, och gör gåvan till deras.",
    buildCta: "Skapa din presentbox",
    storyLabel: "FÄRRE SAKER. MER MENING.",
    storyTitle: "För stunderna\nmellan stunderna.",
    storyText:
      "Inspirerat av nordiska vintrar och vardagens små ritualer som för oss närmare. Enkla ting. Naturliga texturer. Lite utrymme att sakta ner.",
    storyCta: `Berättelsen om ${brand.name}`,
    trust: [
      "En liten, genomtänkt kollektion",
      "En hälsning med dina egna ord",
      "Säker, extern kassa",
    ],
    reviewsLabel: "BERÄTTELSER SOM KOMMER",
    reviews: "Varje gåva börjar en berättelse.",
    reviewsText:
      "Kundberättelser visas här efter lansering. Vi publicerar bara äkta, verifierade omdömen.",
    corporateTitle: "Ett omtänksamt tack.\nTill hela teamet.",
    corporateText:
      "Genomtänkta gåvor till dem som gör skillnad. Berätta vad du har i tankarna.",
    newsletterTitle: "En hälsning när säsongen vänder.",
    newsletterText:
      "Nya kollektioner, stilla inspiration. Bara när vi har något fint att berätta.",
  },
  footer: {
    text: "Omtänksamma gåvor. För den här säsongen, och de som kommer.",
    explore: "Upptäck",
    help: "Vi hjälper dig",
    details: "Detaljerna",
    rights: `${brand.name} · Fiktivt demonstrationsvarumärke`,
    cookieSettings: "Cookieinställningar",
    contact: "Kontakt & kundservice",
    faq: "Frågor & svar",
    shipping: "Frakt & returer",
    privacy: "Integritet",
    cookies: "Cookies",
    terms: "Villkor",
    accessibility: "Tillgänglighet",
  },
  builderCopy: {
    title: "Gör den till deras.",
    intro: "Några omtänksamma val. En personlig gåva.",
    steps: [
      "Boxen",
      "En signatur",
      "Det lilla extra",
      "Ett kort",
      "Dina ord",
      "Sista touchen",
    ],
    size: "Börja med rätt box.",
    small: "Den lilla boxen",
    large: "Den generösa boxen",
    smallText: "En signaturprodukt + 2 små favoriter",
    largeText: "En signaturprodukt + 3 små favoriter",
    signature: "Sätt stämningen.",
    extras: "Välj deras små favoriter.",
    choose: "Välj",
    selected: "Vald",
    card: "En liten sista touch.",
    noCard: "Utan kort, helt enkelt",
    message: "Säg det med dina egna ord.",
    review: "En gåva, skapad av dig.",
    reviewText:
      "Se över de små detaljerna innan du lägger din färdiga box i påsen.",
    invalid:
      "Gör klart det här steget. Välj tillgängliga produkter och rätt antal favoriter.",
    count: "Valda",
    resume: "Dina val sparas på den här enheten.",
    clear: "Börja om",
    addBox: "Lägg din presentbox i påsen",
    completed: "Din personliga presentbox finns nu i påsen.",
    selectedPrefix: "En omtänksam början",
    note: "Valfritt. Din hälsning följer med den här boxen.",
    extraRule: "Välj exakt",
    pieces: "produkter",
    packing: "Presentförpackning",
    signatureLabel: "Signaturprodukt",
  },
  forms: {
    email: "E-postadress",
    name: "Ditt namn",
    company: "Företag",
    volume: "Antal gåvor",
    country: "Leveransland (två bokstäver)",
    date: "Önskat leveransdatum",
    message: "Något mer vi borde veta?",
    consent:
      "Jag godkänner integritetspolicyn och att bli kontaktad om denna förfrågan.",
    newsletterConsent:
      "Jag vill få enstaka utskick och kan avsluta prenumerationen när som helst.",
    send: "Skicka din förfrågan",
    subscribe: "Håll mig uppdaterad",
    sending: "Skickar…",
    success:
      "Din testförfrågan har validerats. Inget mejl har skickats. Anslut en leveransleverantör före lansering.",
    realSuccess: "Tack. Vi har tagit emot din förfrågan.",
    failure: "Det gick inte att skicka. Kontrollera fälten och försök igen.",
    spam: "Lämna det här fältet tomt",
    corporateTitle: "Lite tacksamhet.\nEtt bestående intryck.",
    corporateText:
      "Från ett team på tio till ett tack för hela företaget. Berätta om dina planer så hittar vi ett omtänksamt sätt att säga det.",
  },
  pages: {
    about: {
      eyebrow: "VÅR BERÄTTELSE",
      title: "Omtanke,\ni de små sakerna.",
      text: `${brand.name} är ett arbetskoncept för en säsongsbaserad presentstudio inspirerad av nordisk värme i enkla ritualer. Vår första fiktiva kollektion samlar taktila ting för vinterns långsamma dagar.`,
      extra:
        "Vi tror att en gåva kan vara stilla och ändå säga väldigt mycket. Grunden är skapad för ett litet, genomtänkt sortiment som förändras med säsongen.",
    },
    faq: {
      eyebrow: "VI HJÄLPER DIG",
      title: "Några bra frågor.",
      text: "Praktiska detaljer om kollektionen och din gåva.",
      extra:
        "Den här förhandsvisningen tar inte emot beställningar. Slutliga leveransvillkor måste bekräftas före lansering.",
    },
    "shipping-returns": {
      eyebrow: "DET PRAKTISKA",
      title: "Från våra händer\ntill deras.",
      text: "Preliminär policy — juridisk och operativ granskning krävs. Leveransländer, tider, fraktpriser, returvillkor och ångerrätt måste bekräftas av säljaren före lansering.",
      extra:
        "Produktionskassan visar tillgängliga leveranssätt, skatter och det totala beloppet före betalning. Kontakta den konfigurerade kundservicen för hjälp.",
    },
    privacy: {
      eyebrow: "DIN INTEGRITET",
      title: "Omtanke även\nom dina uppgifter.",
      text: "Utkast — juridisk granskning krävs före lansering. Nödvändiga cookies stödjer påsen och dina val. Valfri analys och marknadsföring är avstängda tills du godkänner dem.",
      extra:
        "Säljaren måste ange juridisk person, kontaktuppgifter, rättsliga grunder, personuppgiftsbiträden, lagringstider, överföringar och rutiner för rättighetsbegäranden. Hälsningar och kontaktuppgifter ingår aldrig i analysdata.",
    },
    cookies: {
      eyebrow: "DITT VAL",
      title: "Lite klarhet\nom cookies.",
      text: "Utkast — juridisk granskning krävs. Nödvändig lagring håller påsen och dina samtyckesval fungerande. Analys är valfritt. Marknadsföring är ett separat val och ingen leverantör är ansluten.",
      extra:
        "Du kan godkänna, neka eller anpassa valfria kategorier och ändra ditt val via Cookieinställningar i sidfoten. Hela köpupplevelsen fungerar även om du nekar.",
    },
    terms: {
      eyebrow: "DETALJERNA",
      title: "Tydliga förväntningar.\nOmtänksam service.",
      text: "Utkast — juridisk granskning krävs. Denna fiktiva förhandsvisning tar inte emot riktiga köp. Säljaruppgifter, organisations- och momsnummer, priser, leveransvillkor, ångerrätt, undantag och reklamationer måste granskas före lansering.",
      extra:
        "Alla exempelpriser anges i SEK. När butiken är konfigurerad sker betalning i leverantörens säkra kassa. Webbplatsen samlar aldrig in kortuppgifter.",
    },
    accessibility: {
      eyebrow: "ÖPPET FÖR ALLA",
      title: "Omtanke i formen.",
      text: "Vi arbetar mot WCAG 2.2 AA. Grunden inkluderar tangentbordsnavigering, synligt fokus, tillgängliga dialoger, tydliga etiketter och en komplett upplevelse med minskad rörelse.",
      extra:
        "Alla produkter finns i butiken med stillbilder och tydliga produktval. Automatiska kontroller ersätter inte en fullständig tillgänglighetsgranskning. Kontakta kundservice vid hinder.",
    },
  },
  faqs: [
    {
      q: "Kan jag beställa från den här webbplatsen?",
      a: "Det här är en tydligt märkt förhandsvisning. Riktiga beställningar blir tillgängliga när butiken öppnar för köp.",
    },
    {
      q: "Kan jag lägga till en personlig hälsning?",
      a: "Ja. Lägg till högst 280 tecken i din egen presentbox, och granska eller ändra den i påsen.",
    },
    {
      q: "Var hittar jag alla produkter?",
      a: "I butiken hittar du varje produkt, dess bilder och tillgängliga alternativ.",
    },
    {
      q: "Hur fungerar betalningen?",
      a: "Betalning hanteras i vår säkra kassa. Inga kortuppgifter samlas in på den här webbplatsen.",
    },
  ],
  notFound: {
    title: "Lite utanför stigen.",
    text: "Vi hittade inte den här sidan. Kollektionen är ett fint ställe att börja om.",
  },
  retry: "Försök igen",
  errorTitle: "En liten paus.",
  errorText: "Vi kunde inte ladda den här delen av kollektionen. Försök igen.",
  collectionText:
    "Vinterns stilla välbehag, samlat med omsorg. Upptäck varma dofter, mjuka texturer och små gester till dem du tänker på.",
  collectionTitle: "Vinterns\nvärme.",
  collectionLabel: "SÄSONGENS BERÄTTELSER / VINTER 2026",
};
export function getDictionary(locale: Locale): Dictionary {
  const dictionary = applyBrandCopy(locale === "sv" ? sv : en, locale);
  return isProductTestMode()
    ? applyProductTestCopy(dictionary, locale)
    : dictionary;
}
export function isLocale(value: string): value is Locale {
  return value === "sv" || value === "en";
}
