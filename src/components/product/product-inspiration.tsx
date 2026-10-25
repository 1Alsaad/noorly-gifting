import Image from "next/image";
import type { Locale } from "@/types/commerce";

const settings = [
  {
    image: "quiet-evening",
    sv: "Kvällsro",
    en: "A quiet evening",
    alt: {
      sv: "AI-skapad miljö: Luma ljussand i en glasinsats inuti Alva teakskål på ett soffbord.",
      en: "AI-styled setting: Luma candle sand in a glass insert inside the Alva teak bowl on a coffee table.",
    },
  },
  {
    image: "dinner-table",
    sv: "Middag för två",
    en: "Dinner for two",
    alt: {
      sv: "AI-skapad miljö: Alva teakskål med Luma ljussand i en glasinsats på ett dukat middagsbord.",
      en: "AI-styled setting: the Alva teak bowl with Luma candle sand in a glass insert on a dinner table.",
    },
  },
  {
    image: "reading-corner",
    sv: "Din läshörna",
    en: "Your reading corner",
    alt: {
      sv: "AI-skapad miljö: Luma ljussand i en glasinsats inuti Alva teakskål på ett sidobord vid en fåtölj.",
      en: "AI-styled setting: Luma candle sand in a glass insert inside the Alva teak bowl on a side table beside an armchair.",
    },
  },
] as const;

export function ProductInspiration({ locale }: { locale: Locale }) {
  return (
    <section
      className="product-inspiration"
      aria-labelledby="product-inspiration-title"
    >
      <h2 id="product-inspiration-title">
        {locale === "sv"
          ? "En plats i din vardag."
          : "A place in your everyday."}
      </h2>
      <p>
        {locale === "sv"
          ? "AI-skapade miljöbilder med glasinsats. Insats och styling ingår inte. Tänd aldrig ljus direkt i träskålen."
          : "AI-styled inspiration with a glass insert. Insert and styling accessories are not included. Never burn candles directly in the wooden bowl."}
      </p>
      <div
        className="inspiration-gallery"
        role="region"
        aria-label={
          locale === "sv" ? "Inspiration för hemmet" : "Home inspiration"
        }
        tabIndex={0}
      >
        {settings.map((setting) => (
          <figure key={setting.image}>
            <Image
              src={`/media/lifestyle/luma-alva-${setting.image}.png`}
              alt={setting.alt[locale]}
              width={1536}
              height={1024}
              sizes="(max-width:680px) 85vw, 33vw"
            />
            <figcaption>{setting[locale]}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
