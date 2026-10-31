import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { teakBowlHandle } from "@/content/launch-catalog";
import type { Locale } from "@/types/commerce";
import "./material-story.css";

export function MaterialStory({ locale }: { locale: Locale }) {
  const copy =
    locale === "sv"
      ? {
          chapter: "Material",
          title: "Teak med\nkaraktär.",
          name: "Alva · Dekorativ teakskål",
          description:
            "Mjuka former. Naturlig ådring. En skål med ett eget uttryck, på bordet eller i hyllan.",
          cta: "Upptäck Alva",
          note: "För dekoration. Bränn aldrig ljus eller ljussand direkt i träskålen.",
        }
      : {
          chapter: "Material",
          title: "Teak with\ncharacter.",
          name: "Alva · Decorative teak bowl",
          description:
            "Soft contours. Natural grain. A bowl with its own character, on your table or shelf.",
          cta: "Discover Alva",
          note: "For decoration. Never burn candles or candle sand directly in the wooden bowl.",
        };

  return (
    <section className="material-story" aria-labelledby="material-story-title">
      <div className="material-story__inner">
        <p className="material-story__chapter">
          <span>03</span>
          {copy.chapter}
        </p>
        <div className="material-story__layout">
          <div className="material-story__visual">
            <span className="material-story__word" aria-hidden="true">
              ALVA
            </span>
            <div className="material-story__picture">
              <Image
                src="/media/products/alva/noorly-alva-studio.webp"
                alt={
                  locale === "sv"
                    ? "Alva teakskål med vågformad kant och naturlig ådring, i en varm studiobild"
                    : "Alva teak bowl with an undulating rim and natural grain in a warm studio setting"
                }
                width={1000}
                height={1000}
                sizes="(max-width: 760px) 90vw, (max-width: 1400px) 52vw, 740px"
                className="material-story__photo"
              />
            </div>
            <p className="material-story__caption">
              {locale === "sv"
                ? "Studiobild. Varje skål har sin egen form och ådring."
                : "Styled studio image. Every bowl has its own shape and grain."}
            </p>
          </div>
          <div className="material-story__content">
            <p className="material-story__name">{copy.name}</p>
            <h2 id="material-story-title">{copy.title}</h2>
            <p className="material-story__description">{copy.description}</p>
            <Link
              href={`/${locale}/products/${teakBowlHandle}`}
              className="material-story__cta"
            >
              {copy.cta}
              <ArrowUpRight size={23} strokeWidth={1.6} aria-hidden="true" />
            </Link>
            <p className="material-story__note">{copy.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
