import Link from "next/link";
import { interestHref, isProductTestMode } from "@/config/product-test";
import type { Locale } from "@/types/commerce";
import "./offer-comparison.css";

/** Format research only. Live bundle prices must come from the checkout provider. */
export function OfferComparison({
  locale,
  productHandle,
  variantId,
}: {
  locale: Locale;
  productHandle: string;
  variantId: string;
}) {
  if (!isProductTestMode() || productHandle !== "candle-sand") return null;
  const sv = locale === "sv";
  const formats = [
    { quantity: 1, name: sv ? "En stilla stund" : "A quiet moment" },
    { quantity: 2, name: sv ? "Två tillfällen" : "Two occasions" },
    { quantity: 3, name: sv ? "Fler stunder" : "More moments" },
  ];
  return (
    <section className="offer-comparison" aria-labelledby="offer-heading">
      <h2 id="offer-heading">
        {sv ? "Vilket format passar dig?" : "Which format suits you?"}
      </h2>
      <p className="offer-context">
        {sv
          ? "Planerade format. Pris och lansering är inte fastställda. Ingen beställning eller reservation."
          : "Proposed formats. Prices and launch are undecided. No order or reservation."}
      </p>
      <div className="offer-grid">
        {formats.map(({ quantity, name }) => (
          <article
            key={quantity}
            className={`offer-card${quantity === 3 ? " offer-featured" : ""}`}
          >
            <p className="offer-quantity">
              {quantity}{" "}
              {sv
                ? quantity === 1
                  ? "påse"
                  : "påsar"
                : quantity === 1
                  ? "pouch"
                  : "pouches"}
            </p>
            <h3>{name}</h3>
            <p>
              {quantity * 300} g · {quantity * 4} {sv ? "vekar" : "wicks"}
            </p>
            <p className="offer-price-pending">
              {sv ? "Pris ej fastställt" : "Price to be confirmed"}
            </p>
            <Link
              className="text-link"
              href={interestHref(
                locale,
                productHandle,
                variantId,
                Array.from({ length: quantity }, () => productHandle),
              )}
            >
              {sv ? "Utforska formatet" : "Explore this format"}
              <span className="sr-only">
                {" "}
                · {quantity} {sv ? "påsar" : "pouches"}
              </span>
              <span aria-hidden> ↗</span>
            </Link>
          </article>
        ))}
      </div>
      <p className="offer-context">
        {sv
          ? "300 g och fyra vekar per påse. Samma färg och doft som ditt val ovan. Kärl, presentask och presentinslagning ingår inte i dessa formatförslag."
          : "300 g and four wicks per pouch. The same colour and fragrance selected above. These proposed formats exclude vessels, gift boxes and gift wrapping."}
      </p>
    </section>
  );
}
