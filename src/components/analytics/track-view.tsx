"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { CONSENT_EVENT } from "@/lib/analytics/consent";
import { trackShopifyProductView } from "@/lib/analytics/shopify";
import { trackMetaViewContent } from "@/lib/analytics/meta";
export function TrackView({
  name,
  properties,
}: {
  name:
    | "product_viewed"
    | "product_list_viewed"
    | "cart_viewed"
    | "seasonal_collection_viewed";
  properties: Record<string, string | number | boolean>;
}) {
  const serialized = JSON.stringify(properties);
  useEffect(() => {
    trackEvent(
      { name, properties: JSON.parse(serialized) },
      `${name}:${serialized}`,
    );
    if (name !== "product_viewed") return;
    const details = JSON.parse(serialized) as {
      product_handle?: string;
      product_id?: string;
      value?: number;
    };
    if (!details.product_handle) return;
    let sent = false;
    let shopifySent = false;
    const onConsent = () => {
      if (
        !shopifySent &&
        details.product_id &&
        details.product_handle &&
        details.value !== undefined
      )
        shopifySent = trackShopifyProductView(
          details.product_id,
          details.product_handle,
          details.value,
        );
      if (!sent && details.product_handle)
        sent = trackMetaViewContent(details.product_handle, details.value);
    };
    onConsent();
    window.addEventListener(CONSENT_EVENT, onConsent);
    window.addEventListener("storage", onConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener("storage", onConsent);
    };
  }, [name, serialized]);
  return null;
}
