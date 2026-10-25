/** Analytics-only build of @shopify/hydrogen-react 2026.4.4; see README.md. */
export function getClientBrowserParameters(): Record<string, string>;
export function sendShopifyAnalytics(event: {
  eventName: "PAGE_VIEW_2" | "PRODUCT_VIEW";
  payload: Record<string, unknown>;
}): Promise<void>;
