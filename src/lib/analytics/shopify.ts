"use client";

import { getConsent } from "./consent";
import {
  getClientBrowserParameters,
  sendShopifyAnalytics,
} from "./vendor/shopify-analytics.js";

const SHOP_ID = "gid://shopify/Shop/107353178454";
const STORAGE_KEY = "noorly-shopify-analytics-v1";
const VISITOR_TTL = 180 * 86400_000;
const SESSION_TTL = 30 * 60_000;
const UUID = /^[0-9a-f-]{36}$/i;
let lastPage: string | null = null;

type Identity = {
  visitor: string;
  visit: string;
  createdAt: number;
  lastSeenAt: number;
};

function enabled() {
  return (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify" &&
    process.env.NEXT_PUBLIC_PRODUCT_TEST_MODE === "false" &&
    ["noorlynordic.com", "www.noorlynordic.com"].includes(location.hostname)
  );
}

/** Do not collect private/account routes or arbitrary search/hash parameters. */
function publicPath(path: string) {
  return /^\/(sv|en)(\/(shop|cart|about|contact|terms|privacy|shipping-returns|products\/[a-z0-9-]{1,100}|collections\/[a-z0-9-]{1,100}))?\/?$/.test(
    path,
  );
}

function permitted() {
  if (!enabled() || !getConsent()?.analytics) return false;
  const privacy = (
    window as Window & {
      Shopify?: {
        customerPrivacy?: { analyticsProcessingAllowed?: () => boolean };
      };
    }
  ).Shopify?.customerPrivacy;
  // When Shopify's privacy API is present, a denial is authoritative too.
  return (
    !privacy?.analyticsProcessingAllowed || privacy.analyticsProcessingAllowed()
  );
}

/** Noorly-owned identifiers only; never read/write Shopify consent cookies. */
function identity(): Identity | null {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(STORAGE_KEY);
    let stored: Identity | null = null;
    try {
      stored = raw ? (JSON.parse(raw) as Identity) : null;
    } catch {
      // Replace invalid optional analytics storage, never affect the cart.
    }
    if (
      !stored ||
      !UUID.test(stored.visitor) ||
      !UUID.test(stored.visit) ||
      !Number.isFinite(stored.createdAt) ||
      !Number.isFinite(stored.lastSeenAt) ||
      stored.createdAt > now ||
      stored.lastSeenAt > now ||
      now - stored.createdAt > VISITOR_TTL
    ) {
      stored = {
        visitor: crypto.randomUUID(),
        visit: crypto.randomUUID(),
        createdAt: now,
        lastSeenAt: now,
      };
    } else if (now - stored.lastSeenAt > SESSION_TTL) {
      stored.visit = crypto.randomUUID();
    }
    stored.lastSeenAt = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return stored;
  } catch {
    return null;
  }
}

export function updateShopifyAnalyticsConsent() {
  if (typeof window === "undefined") return;
  if (!getConsent()?.analytics) {
    lastPage = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Optional storage. */
    }
  }
}

function basePayload(path: string) {
  if (!permitted() || !publicPath(path) || location.pathname !== path)
    return null;
  const ids = identity();
  if (!ids) return null;
  const browser = getClientBrowserParameters();
  let referrer = "";
  try {
    referrer = document.referrer ? new URL(document.referrer).origin : "";
  } catch {
    /* Empty referrer. */
  }
  return {
    ...browser,
    // Dedicated storefront IDs are not a native-checkout session bridge.
    uniqueToken: ids.visitor,
    visitToken: ids.visit,
    url: `https://noorlynordic.com${path}`,
    canonicalUrl: `https://noorlynordic.com${path}`,
    path,
    search: "",
    referrer,
    shopId: SHOP_ID,
    shopifySalesChannel: "headless",
    currency: "SEK",
    acceptedLanguage: path.startsWith("/sv") ? "SV" : "EN",
    hasUserConsent: true,
    analyticsAllowed: true,
    marketingAllowed: false,
    saleOfDataAllowed: false,
    gdprEnforced: true,
  };
}

/** Return means dispatched, not verified in Shopify reports. No pre-consent queue. */
export function trackShopifyPageView(path: string): boolean {
  try {
    updateShopifyAnalyticsConsent();
    if (lastPage === path) return false;
    const payload = basePayload(path);
    if (!payload) return false;
    lastPage = path;
    void sendShopifyAnalytics({
      eventName: "PAGE_VIEW_2",
      payload: {
        ...payload,
        pageType: /^\/(sv|en)\/?$/.test(path)
          ? "index"
          : path.includes("/products/")
            ? "product"
            : "page",
      },
    }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

export function trackShopifyProductView(
  productId: string,
  handle: string,
  value: number,
): boolean {
  try {
    if (
      !/^gid:\/\/shopify\/Product\/\d+$/.test(productId) ||
      !/^[a-z0-9-]{1,100}$/.test(handle) ||
      !Number.isFinite(value) ||
      value < 0
    )
      return false;
    const path = location.pathname;
    if (!new RegExp(`^/(sv|en)/products/${handle}/?$`).test(path)) return false;
    const payload = basePayload(path);
    if (!payload) return false;
    void sendShopifyAnalytics({
      eventName: "PRODUCT_VIEW",
      payload: {
        ...payload,
        resourceId: productId,
        totalValue: value,
        products: [
          {
            productGid: productId,
            name: handle,
            brand: "NOORLY",
            price: value.toFixed(2),
            quantity: 1,
          },
        ],
      },
    }).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}
