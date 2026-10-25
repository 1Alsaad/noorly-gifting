import Link from "next/link";
import { Check, Hand, Truck, ShieldCheck } from "lucide-react";
import type { Locale, Product, ProductVariant } from "@/types/commerce";
import { candleSandHandle, teakBowlHandle } from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
import { bundleValue } from "@/lib/commerce/bundle-value";
import { formatMoney } from "@/lib/utils/money";
import "./purchase-confidence.css";

export function ProductProof({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const sv = locale === "sv";
  const sand = product.handle === candleSandHandle;
  const bowl = product.handle === teakBowlHandle;
  const bundle = product.handle === launchBundleHandle;
  if (!sand && !bowl && !bundle) return null;
  const labels = bowl
    ? [
        sv ? "Handgjord" : "Handmade",
        sv ? "Naturlig teak" : "Natural teak",
        sv ? "Unik ådring" : "Unique grain",
      ]
    : [
        ...(bundle ? [sv ? "Handgjord teakskål" : "Handmade teak bowl"] : []),
        "300 g",
        sv ? "4 bomullsvekar ingår" : "4 cotton wicks included",
      ];
  return (
    <ul
      className="product-proof"
      aria-label={sv ? "Produktfördelar" : "Product details"}
    >
      {labels.map((label, index) => (
        <li key={label}>
          {(bowl || bundle) && index === 0 ? (
            <Hand size={15} aria-hidden="true" />
          ) : (
            <Check size={15} aria-hidden="true" />
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}

export function BundleValue({
  variant,
  locale,
}: {
  variant?: ProductVariant;
  locale: Locale;
}) {
  const value = bundleValue(variant);
  if (!value) return null;
  const money = (amount: number) =>
    formatMoney({ amount, currencyCode: "SEK" }, locale);
  return (
    <div className="bundle-value" aria-live="polite">
      <strong>
        {locale === "sv" ? "Spara" : "Save"} {money(value.saving)}
      </strong>
      <span>
        {locale === "sv"
          ? "Jämfört med att köpa innehållet separat idag:"
          : "Compared with buying the contents separately today:"}{" "}
        {money(value.separate)}.
      </span>
    </div>
  );
}

export function PurchaseConfidence({ locale }: { locale: Locale }) {
  const sv = locale === "sv";
  return (
    <div className="purchase-confidence">
      <p className="purchase-dispatch">
        <Truck size={18} aria-hidden="true" />
        <span>
          <strong>
            {sv
              ? "Förbeställning · frakt inom Sverige ingår"
              : "Pre-order · Sweden delivery included"}
          </strong>
          {sv
            ? "Vi skickar så snart produkten finns i lager hos oss. Ingen bekräftad lagerankomstdag ännu."
            : "We dispatch as soon as the product arrives in stock. An arrival date is not yet confirmed."}
        </span>
      </p>
      <p className="purchase-payment">
        <ShieldCheck size={16} aria-hidden="true" />
        {sv
          ? "Säker betalning. Kontrollera hela beställningen innan du betalar."
          : "Secure payment. Review your full order before paying."}
      </p>
    </div>
  );
}

export function PurchaseAnswers({ locale }: { locale: Locale }) {
  const sv = locale === "sv";
  return (
    <div className="purchase-answers">
      <details>
        <summary>
          {sv ? "Leverans & förbeställning" : "Delivery & pre-orders"}
        </summary>
        <p>
          {sv
            ? "Leverans inom Sverige ingår i priset. Vi skickar när produkterna finns i lager hos oss. Du får en orderbekräftelse via e-post och spårningsinformation när sådan finns tillgänglig."
            : "Delivery within Sweden is included. We dispatch when the products arrive in stock. You receive an order confirmation by email and tracking information when available."}
        </p>
        <Link className="text-link" href={`/${locale}/shipping-returns`}>
          {sv ? "Läs leveransvillkoren" : "Read delivery terms"} ↗
        </Link>
      </details>
      <details>
        <summary>
          {sv ? "Retur & kundservice" : "Returns & customer care"}
        </summary>
        <p>
          {sv
            ? "14 dagars ångerrätt efter mottagandet. Behåll varan oanvänd och otänd om du överväger en retur. Du betalar returfrakten vid ånger. Läs fullständiga villkor för ångerrätt, återbetalning och reklamation."
            : "14-day withdrawal period after receipt. Keep goods unused and unlit when considering a return. You pay return postage when changing your mind. Read the full withdrawal, refund and faulty-goods terms."}
        </p>
        <Link className="text-link" href={`/${locale}/shipping-returns`}>
          {sv ? "Returvillkor" : "Return terms"} ↗
        </Link>
        <Link className="text-link" href={`/${locale}/contact`}>
          {sv ? "Kontakta Noorly" : "Contact Noorly"} ↗
        </Link>
      </details>
    </div>
  );
}
