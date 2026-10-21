import type { Locale } from "@/types/commerce";

/** Public browsing defaults to product testing. Commerce remains opt-in. */
export function isProductTestMode() {
  return (
    process.env.NEXT_PUBLIC_PRODUCT_TEST_MODE === "true" ||
    (process.env.NEXT_PUBLIC_PRODUCT_TEST_MODE !== "false" &&
      process.env.NODE_ENV !== "test")
  );
}

export const productTestCopy = {
  sv: {
    label: "PRODUKTTEST · INGA BESTÄLLNINGAR",
    cta: "Visa mitt intresse",
    note: "Vi utforskar sortimentet. Ingen betalning, beställning eller reservation.",
    price: "Pris ej fastställt",
    title: "En liten gåva. Ett första intresse.",
    intro:
      "Hjälp oss välja vad Noorly ska ta in. En intresseanmälan är kostnadsfri och innebär inget köp. Pris och eventuell lansering är inte bestämda.",
    closed:
      "Intresselistan öppnar snart. Just nu sparar vi inga anmälningar. Du kan fortfarande utforska produkterna och skissa på en presentbox.",
    consent:
      "Jag vill få e-post om de här produktplanerna. Jag kan när som helst be att mina uppgifter tas bort.",
    success:
      "Tack! Ditt intresse har registrerats. Ingen beställning har lagts och ingen vara är reserverad.",
    failure: "Din anmälan kunde inte sparas. Försök igen senare.",
    noScript:
      "Du kan läsa om produkterna utan JavaScript. Intresseformuläret kräver JavaScript.",
    concept: "Presentboxkoncept · innehåll och förpackning är inte fastställda",
  },
  en: {
    label: "PRODUCT TEST · NO ORDERS",
    cta: "Register my interest",
    note: "We are exploring the range. No payment, order or reservation.",
    price: "Price to be confirmed",
    title: "A little gift. A first sign of interest.",
    intro:
      "Help us choose what Noorly should stock. Registering interest is free and creates no purchase. Pricing and any launch are undecided.",
    closed:
      "The interest list opens soon. We are not saving registrations yet. You can still explore the products and sketch a gift box.",
    consent:
      "I would like email about these product plans. I can ask for my details to be deleted at any time.",
    success:
      "Thank you! Your interest has been registered. No order has been placed and no item is reserved.",
    failure: "We could not save your registration. Please try again later.",
    noScript:
      "You can read about the products without JavaScript. The interest form requires JavaScript.",
    concept: "Gift box concept · contents and packaging are not final",
  },
} satisfies Record<Locale, Record<string, string>>;

export function interestHref(
  locale: Locale,
  productHandle?: string,
  variantId?: string,
  boxContents?: string[],
) {
  const query = new URLSearchParams();
  if (productHandle) query.set("product", productHandle);
  if (variantId) query.set("variant", variantId);
  if (boxContents?.length) query.set("box", boxContents.join(","));
  return `/${locale}/interest${query.size ? `?${query}` : ""}`;
}
