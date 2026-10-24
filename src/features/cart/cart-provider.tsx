"use client";

import { isProductTestMode } from "@/config/product-test";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Cart,
  CartAttribute,
  CartLineInput,
  Locale,
} from "@/types/commerce";
import {
  trackEvent,
  getAnalyticsCheckoutAttributes,
} from "@/lib/analytics/client";
import { getMetaCheckoutAttributes, trackMetaInitiateCheckout } from "@/lib/analytics/meta";

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addLines(lines: CartLineInput[]): Promise<void>;
  replaceBundle(bundleId: string, lines: CartLineInput[]): Promise<void>;
  updateLine(lineId: string, quantity: number): Promise<void>;
  removeLines(lineIds: string[]): Promise<void>;
  updateAttributes(attributes: CartAttribute[]): Promise<void>;
  checkout(locale: Locale): Promise<string>;
};
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  useEffect(() => {
    if (isProductTestMode()) return;
    const abort = new AbortController();
    const startedAt = revision.current;
    fetch("/api/cart", { signal: abort.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("cart_unavailable");
        const data = await r.json();
        if (startedAt === revision.current) setCart(data.cart);
      })
      .catch((e) => {
        if (e.name !== "AbortError" && startedAt === revision.current)
          setError("cart_unavailable");
      });
    return () => abort.abort();
  }, []);
  const mutate = useCallback(async (payload: Record<string, unknown>) => {
    if (busy.current) throw new Error("request_in_progress");
    busy.current = true;
    revision.current += 1;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("cart_update_failed");
      if (data.cart) setCart(data.cart);
      return data as { cart?: Cart; url?: string };
    } catch (e) {
      setError("cart_update_failed");
      throw e;
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);
  const addLines = useCallback(
    async (lines: CartLineInput[]) => {
      const data = await mutate({ type: "add", lines });
      trackEvent({
        name: "add_to_cart",
        properties: {
          currency: "SEK",
          quantity: lines.reduce((n, l) => n + l.quantity, 0),
          value:
            lines.reduce((sum, line) => {
              const variant = data.cart?.lines.find(
                (item) => item.merchandiseId === line.merchandiseId,
              )?.variant;
              return (
                sum +
                Math.round((variant?.price.amount ?? 0) * 100) * line.quantity
              );
            }, 0) / 100,
          source: "storefront",
        },
      });
    },
    [mutate],
  );
  const updateLine = useCallback(
    async (lineId: string, quantity: number) => {
      await mutate({ type: "update", lineId, quantity });
      trackEvent({ name: "cart_updated", properties: { quantity } });
    },
    [mutate],
  );
  const removeLines = useCallback(
    async (lineIds: string[]) => {
      await mutate({ type: "remove", lineIds });
      trackEvent({
        name: "remove_from_cart",
        properties: { quantity: lineIds.length },
      });
    },
    [mutate],
  );
  const updateAttributes = useCallback(
    async (attributes: CartAttribute[]) => {
      await mutate({ type: "attributes", attributes });
    },
    [mutate],
  );
  const replaceBundle = useCallback(
    async (bundleId: string, lines: CartLineInput[]) => {
      await mutate({ type: "replace_bundle", bundleId, lines });
      trackEvent({ name: "cart_updated", properties: { bundle_id: bundleId } });
    },
    [mutate],
  );
  const checkout = useCallback(
    async (locale: Locale) => {
      try {
        const attributes = Object.entries({
          ...getAnalyticsCheckoutAttributes(),
          ...getMetaCheckoutAttributes(),
        }).map(([key, value]) => ({ key, value }));
        const data = await mutate({ type: "checkout", locale, attributes });
        if (!data.url) {
          setError("checkout_unavailable");
          throw new Error("checkout_unavailable");
        }
        trackEvent({
          name: "begin_checkout",
          properties: {
            locale,
            currency: "SEK",
            value: cart?.total.amount,
            quantity: cart?.totalQuantity,
          },
        });
        trackMetaInitiateCheckout(cart?.total.amount);
        return data.url;
      } catch (e) {
        trackEvent({ name: "checkout_error", properties: { source: "cart" } });
        throw e;
      }
    },
    [mutate, cart],
  );
  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addLines,
        replaceBundle,
        updateLine,
        removeLines,
        updateAttributes,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartProvider is required");
  return value;
}
