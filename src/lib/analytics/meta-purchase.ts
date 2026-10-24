/** Minimal privacy-preserving Meta Purchase payload from a verified Shopify paid order.
 * Only consented Meta click identifiers are included; no buyer name, email or IP.
 */
export interface MetaPurchaseInput {
  id: string;
  createdAt: string;
  currency: string;
  value: number;
  siteUrl: string;
  fbp?: string;
  fbc?: string;
}

export function buildMetaPurchasePayload(input: MetaPurchaseInput) {
  const validCookie = (value?: string) =>
    value && /^fb\.\d+\.\d+\.[A-Za-z0-9_-]{1,160}$/.test(value);
  if (
    !/^[a-f0-9]{64}$/.test(input.id) ||
    !/^[A-Z]{3}$/.test(input.currency) ||
    !Number.isFinite(input.value) ||
    input.value < 0 ||
    (!validCookie(input.fbp) && !validCookie(input.fbc))
  )
    return null;
  const time = Date.parse(input.createdAt);
  if (!Number.isFinite(time)) return null;
  const origin = new URL(input.siteUrl);
  if (origin.protocol !== "https:") return null;
  return {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(time / 1000),
        event_id: input.id,
        action_source: "website",
        event_source_url: origin.origin,
        user_data: {
          ...(validCookie(input.fbp) ? { fbp: input.fbp } : {}),
          ...(validCookie(input.fbc) ? { fbc: input.fbc } : {}),
        },
        custom_data: { currency: input.currency, value: input.value },
      },
    ],
  };
}
