import { Flag, Hand, Truck, ShieldCheck } from "lucide-react";
import type { Locale } from "@/types/commerce";
import "./brand-proof.css";

/** Claims are scoped to the brand or the specific product, never the whole range. */
export function BrandProof({ locale }: { locale: Locale }) {
  const sv = locale === "sv";
  const items = [
    { Icon: Flag, label: sv ? "Grundat i Sverige" : "Founded in Sweden" },
    {
      Icon: Hand,
      label: sv ? "Handgjorda teakskålar" : "Handmade teak bowls",
    },
    {
      Icon: Truck,
      label: sv ? "Frakt inom Sverige ingår" : "Sweden delivery included",
    },
    { Icon: ShieldCheck, label: sv ? "Säker betalning" : "Secure payment" },
  ];
  return (
    <div className="brand-proof" aria-label={sv ? "Om Noorly" : "About Noorly"}>
      {items.map(({ Icon, label }) => (
        <span key={label}>
          <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}
