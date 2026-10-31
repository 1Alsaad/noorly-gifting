import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/types/commerce";
import { candleSandHandle } from "@/content/launch-catalog";
import "./candle-sand-guide.css";

const copy = {
  sv: {
    label: "SÅ FUNGERAR DET",
    title: "Lär känna ljussand",
    steps: [
      [
        "Välj din färg & doft",
        "11 val, även vit och doftfri. 300 g och fyra vekar ingår.",
      ],
      [
        "Välj rätt kärl",
        "Använd ett obrännbart, värmetåligt ljuskärl. Tänd aldrig direkt i en träskål.",
      ],
      [
        "Tänd med omtanke",
        "Följ påsens instruktioner. Lämna aldrig ett tänt ljus utan uppsikt.",
      ],
    ],
    note: "Ljussand säljs separat. En dekorativ teakskål ingår endast i paketet.",
    cta: "Hitta din färg & doft",
  },
  en: {
    label: "HOW IT WORKS",
    title: "Meet candle sand",
    steps: [
      [
        "Choose your colour & scent",
        "11 options, including white and unscented. 300 g and four wicks included.",
      ],
      [
        "Choose the right vessel",
        "Use a noncombustible, heat-resistant candle vessel. Never burn directly in a wooden bowl.",
      ],
      [
        "Light with care",
        "Follow the pouch instructions. Never leave a lit candle unattended.",
      ],
    ],
    note: "Candle sand is sold separately. A decorative teak bowl is included only in the bundle.",
    cta: "Find your colour & scent",
  },
} as const;

export function CandleSandGuide({
  locale,
  showLink = false,
  editorial = false,
}: {
  locale: Locale;
  showLink?: boolean;
  editorial?: boolean;
}) {
  const t = copy[locale];
  return (
    <section
      className={`candle-sand-guide section-wrap${editorial ? " candle-sand-guide--editorial" : ""}`}
      aria-labelledby="candle-sand-guide-title"
    >
      <div className="candle-sand-guide__intro">
        <p className={editorial ? "campaign-chapter" : "eyebrow"}>
          {editorial && <span>04</span>}
          {t.label}
        </p>
        <h2 id="candle-sand-guide-title">
          {editorial
            ? locale === "sv"
              ? "Små korn. Din ljusstund."
              : "Little grains. Your moment."
            : t.title}
        </h2>
        {editorial && (
          <div className="candle-sand-guide__texture" aria-hidden="true">
            <Image
              src="/media/products/candle-sand/csand-08-0.webp"
              alt=""
              width={800}
              height={800}
              sizes="(max-width: 680px) 90vw, 38vw"
            />
          </div>
        )}
      </div>
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
