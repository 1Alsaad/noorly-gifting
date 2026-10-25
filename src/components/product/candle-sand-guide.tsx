import Link from "next/link";
import type { Locale } from "@/types/commerce";
import { candleSandHandle } from "@/content/launch-catalog";
import "./candle-sand-guide.css";

const copy = {
  sv: {
    label: "NYFIKEN PÅ LJUSSAND?",
    title: "En liten guide till din ljusstund.",
    steps: [
      [
        "Välj din färg & doft",
        "Varje färg har sin egen doft. Vill du ha det doftfritt? Välj vit, doftfri ljussand.",
      ],
      [
        "Använd ett lämpligt kärl",
        "Du behöver ett obrännbart, värmetåligt kärl avsett för ljus. Tänd inte ljussand direkt i en träskål.",
      ],
      [
        "Följ påsens anvisningar",
        "300 g ljussand och fyra bomullsvekar ingår. Följ produktens instruktioner för vekar och användning. Lämna aldrig ett tänt ljus utan uppsikt.",
      ],
    ],
    note: "Skålen i filmen är en del av miljön. Ljussanden säljs separat; se produktbilder och innehåll för ditt val.",
    cta: "Hitta din färg & doft",
  },
  en: {
    label: "NEW TO CANDLE SAND?",
    title: "A little guide to your candle moment.",
    steps: [
      [
        "Choose your colour & scent",
        "Each colour has its own fragrance. Prefer no fragrance? Choose white, unscented candle sand.",
      ],
      [
        "Use a suitable vessel",
        "You need a noncombustible, heat-resistant vessel designed for candles. Never burn candle sand directly in a wooden bowl.",
      ],
      [
        "Follow the pouch instructions",
        "300 g of candle sand and four cotton wicks are included. Follow the product instructions for wicks and use. Never leave a lit candle unattended.",
      ],
    ],
    note: "The bowl in the film is part of the setting. Candle sand is sold separately; check the product photographs and contents for your selection.",
    cta: "Find your colour & scent",
  },
} as const;

export function CandleSandGuide({
  locale,
  showLink = false,
}: {
  locale: Locale;
  showLink?: boolean;
}) {
  const t = copy[locale];
  return (
    <section
      className="candle-sand-guide section-wrap"
      aria-labelledby="candle-sand-guide-title"
    >
      <p className="eyebrow">{t.label}</p>
      <h2 id="candle-sand-guide-title">{t.title}</h2>
      <ol>
        {t.steps.map(([title, description], index) => (
          <li key={title}>
            <span className="guide-step" aria-hidden="true">
              0{index + 1}
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <p className="product-note">{t.note}</p>
      {showLink && (
        <Link
          className="button button-dark"
          href={`/${locale}/products/${candleSandHandle}`}
        >
          {t.cta} ↗
        </Link>
      )}
    </section>
  );
}
