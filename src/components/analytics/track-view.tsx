"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/client";
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
  }, [name, serialized]);
  return null;
}
