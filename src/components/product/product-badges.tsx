import {
  Flag,
  Hand,
  Leaf,
  TreeDeciduous,
  Truck,
  LockKeyhole,
} from "lucide-react";
import type { Locale, Product } from "@/types/commerce";
import { teakBowlHandle } from "@/content/launch-catalog";

// Product-specific supplier evidence checked 25 October 2026:
// https://www.awgifts.eu/candles/csand (Vegan, Handmade), including CSand-11/02.
// Brand origin does not imply Swedish manufacture.
export function ProductBadges({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const sv = locale === "sv";
  const bowl = product.handle === teakBowlHandle;
  const badges = [
    { Icon: Flag, text: sv ? "Grundat i Sverige" : "Founded in Sweden" },
    bowl
      ? { Icon: TreeDeciduous, text: sv ? "Naturlig teak" : "Natural teak" }
      : { Icon: Leaf, text: sv ? "Vegansk ljussand" : "Vegan candle sand" },
    {
      Icon: Hand,
      text: bowl
        ? sv
          ? "Handgjord teakskål"
          : "Handmade teak bowl"
        : sv
          ? "Handgjord"
          : "Handmade",
    },
    {
      Icon: Truck,
      text: sv ? "Frakt i Sverige ingår" : "Sweden delivery included",
    },
  ];
  return (
    <ul
      className="product-trust-badges"
      aria-label={
        sv ? "Om produkten och Noorly" : "About the product and Noorly"
      }
    >
      {badges.map(({ Icon, text }) => (
        <li key={text}>
          <Icon size={18} aria-hidden="true" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

// Enabled methods read from Shopify Payments and supportedDigitalWallets,
// 25 October 2026. Wallet visibility varies by the buyer's device.
export function PaymentBadges({ locale }: { locale: Locale }) {
  return (
    <div className="purchase-payments">
      <p>
        <LockKeyhole size={13} aria-hidden="true" />
        {locale === "sv" ? "Säker betalning" : "Secure payment"}
      </p>
      <ul
        aria-label={locale === "sv" ? "Betalningsmetoder" : "Payment methods"}
      >
        <li className="payment-visa">Visa</li>
        <li className="payment-mastercard">
          <span aria-hidden="true" className="mastercard-mark" />
          Mastercard
        </li>
        <li className="payment-shop">Shop Pay</li>
        <li>Apple Pay</li>
        <li>Google Pay</li>
      </ul>
    </div>
  );
}
