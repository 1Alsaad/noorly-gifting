"use client";

import { useEffect, type CSSProperties } from "react";
import type { Locale, Product } from "@/types/commerce";
import { trackEvent } from "@/lib/analytics/client";
import { hotspotIsVisible } from "@/features/seasonal-experience/progress";
import type { Hotspot } from "@/features/seasonal-experience/types";

interface Props {
  hotspot: Hotspot;
  product: Product;
  locale: Locale;
  progress: number;
  onSelect: (
    product: Product,
    trigger: HTMLButtonElement,
    hotspot: Hotspot,
  ) => void;
}

export function HotspotButton({
  hotspot,
  product,
  locale,
  progress,
  onSelect,
}: Props) {
  const visible = hotspotIsVisible(hotspot, progress);
  useEffect(() => {
    if (visible) {
      trackEvent(
        {
          name: "hotspot_impression",
          properties: {
            locale,
            scene_id: hotspot.sceneId,
            hotspot_id: hotspot.id,
            product_handle: product.handle,
          },
        },
        `hotspot-impression:${hotspot.id}`,
      );
    }
  }, [visible, hotspot.id, hotspot.sceneId, locale, product.handle]);

  if (!visible) return null;
  const position = {
    "--hotspot-x": `${hotspot.desktop.x * 100}%`,
    "--hotspot-y": `${hotspot.desktop.y * 100}%`,
    "--hotspot-mobile-x": `${hotspot.mobile.x * 100}%`,
    "--hotspot-mobile-y": `${hotspot.mobile.y * 100}%`,
  } as CSSProperties;
  return (
    <button
      type="button"
      className={`cinema-hotspot ${hotspot.pulse ? "cinema-hotspot-pulse" : ""}`}
      style={position}
      aria-label={hotspot.label[locale]}
      aria-haspopup="dialog"
      data-align={hotspot.tooltipAlignment ?? "left"}
      data-testid={`hotspot-${hotspot.id}`}
      onClick={(event) => onSelect(product, event.currentTarget, hotspot)}
    >
      <span className="cinema-hotspot-symbol" aria-hidden="true">
        +
      </span>
      <span className="cinema-hotspot-label">{product.title[locale]}</span>
    </button>
  );
}
