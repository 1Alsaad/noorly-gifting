"use client";

import { useRef, useState } from "react";
import { useCart } from "@/features/cart/cart-provider";
import { cartErrorCode, type CartErrorCode } from "@/features/cart/cart-errors";
import type { Locale } from "@/types/commerce";

export function useProductCheckout(locale: Locale) {
  const { addLines, checkout, loading } = useCart();
  const busy = useRef(false);
  const addedVariant = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<CartErrorCode | null>(null);

  async function start(variantId: string, canPurchase: boolean) {
    if (!canPurchase || loading || busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      // A failed checkout retry must not add another unit to the same bag.
      if (addedVariant.current !== variantId) {
        await addLines([{ merchandiseId: variantId, quantity: 1 }]);
        addedVariant.current = variantId;
      }
      const url = await checkout(locale);
      window.location.assign(url);
    } catch (cause) {
      setError(cartErrorCode(cause));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  function reset() {
    addedVariant.current = null;
    setError(null);
  }

  function markAdded(variantId: string) {
    addedVariant.current = variantId;
  }

  return { start, reset, markAdded, pending, loading, error };
}
