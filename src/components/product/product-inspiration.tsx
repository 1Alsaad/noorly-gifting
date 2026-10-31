import Image from "next/image";
import type { Locale } from "@/types/commerce";
import "./product-inspiration.css";

export function ProductInspiration({ locale }: { locale: Locale }) {
  const sv = locale === "sv";
  const details = sv
    ? [
        [
          "Naturlig form.",
          "Teakens ådring och skålens böljande kant ger varje Alva sitt eget uttryck.",
        ],
        [
          "En plats hemma.",
          "På soffbordet, i hyllan eller på en byrå. Låt träet ta plats.",
        ],
        [
          "Ljussand för sig.",
          "Alva är dekorativ. Använd alltid ett separat, obrännbart och värmetåligt ljuskärl för ljussand.",
        ],
      ]
    : [
        [
          "Natural character.",
          "Teak grain and a softly undulating rim give every Alva its own character.",
        ],
        [
          "A place at home.",
          "On a coffee table, shelf or sideboard. Give the wood room to shine.",
        ],
        [
          "Candle sand, separately.",
          "Alva is decorative. Always use a separate, noncombustible, heat-resistant candle vessel for candle sand.",
        ],
      ];
  return (
    <section
      className="product-inspiration product-inspiration--editorial"
      aria-labelledby="product-inspiration-title"
    >
      <div className="inspiration-heading">
        <p>{sv ? "NOORLY HEMMA" : "NOORLY AT HOME"}</p>
        <h2 id="product-inspiration-title">
          {sv ? "Lite mer\nkänsla." : "Make yourself\nat home."}
        </h2>
      </div>
      <div
        className="inspiration-editorial"
        role="region"
        aria-label={sv ? "Inspiration för hemmet" : "Home inspiration"}
      >
        <figure>
          <Image
            src="/media/products/alva/noorly-alva-editorial.webp"
            alt={
              sv
                ? "Miljöbild av Alva teakskål på ett ljust stenbord i varmt dagsljus"
                : "Styled scene of the Alva teak bowl on a pale stone console in warm daylight"
            }
            width={1536}
            height={1024}
            sizes="(max-width: 760px) 90vw, 55vw"
          />
          <figcaption>
            {sv
              ? "Miljöbild. Varje skål har sin egen form och ådring. Styling ingår inte."
              : "Styled scene. Each bowl has its own shape and grain. Accessories are not included."}
          </figcaption>
        </figure>
        <ol>
          {details.map(([title, description], index) => (
            <li key={title}>
              <span aria-hidden="true">0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
