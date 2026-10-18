import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  analyticsEventSchema,
  eventNames,
} from "../../src/lib/analytics/schema";
import {
  getConsent,
  parseConsent,
  saveConsent,
} from "../../src/lib/analytics/consent";
import {
  trackEvent,
  updateAnalyticsConsent,
} from "../../src/lib/analytics/client";

describe("privacy-conscious analytics", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    window.gtag = vi.fn();
    updateAnalyticsConsent();
  });
  it("provides the complete event taxonomy and strips non-allowlisted PII", () => {
    expect(eventNames).toContain("purchase");
    expect(eventNames).toContain("cinematic_progress_milestone");
    expect(
      analyticsEventSchema.parse({
        name: "add_to_cart",
        properties: {
          product_handle: "winter-candle",
          email: "private@example.com",
          gift_message: "Private",
        },
      }).properties,
    ).toEqual({ product_handle: "winter-candle" });
    expect(
      analyticsEventSchema.safeParse({ name: "not_defined" }).success,
    ).toBe(false);
    expect(
      analyticsEventSchema.safeParse({
        name: "add_to_cart",
        properties: { quantity: -1 },
      }).success,
    ).toBe(false);
  });
  it("does not track, create identifiers or load scripts before consent", () => {
    expect(trackEvent({ name: "page_viewed" })).toBe(false);
    expect(sessionStorage.length).toBe(0);
    expect(document.querySelector("script[data-stilla-analytics]")).toBeNull();
  });
  it("sends a deduplicated event only once after consent", () => {
    saveConsent({ analytics: true, marketing: false });
    const event = {
      name: "hotspot_impression",
      properties: { hotspot_id: "candle" },
    } as const;
    expect(trackEvent(event, "test:hotspot:candle")).toBe(true);
    expect(trackEvent(event, "test:hotspot:candle")).toBe(false);
    expect(sessionStorage.getItem("stilla-analytics-session")).toMatch(
      /^[a-f0-9-]{36}$/,
    );
  });
  it("cannot report a browser purchase and clears analytics identifiers on withdrawal", () => {
    saveConsent({ analytics: true, marketing: true });
    expect(trackEvent({ name: "purchase" })).toBe(false);
    trackEvent({ name: "page_viewed" });
    saveConsent({ analytics: false, marketing: false });
    updateAnalyticsConsent();
    expect(sessionStorage.getItem("stilla-analytics-session")).toBeNull();
    expect(trackEvent({ name: "page_viewed" })).toBe(false);
  });
  it("expires preferences and treats invalid storage as no consent", () => {
    expect(parseConsent("invalid")).toBeNull();
    expect(
      parseConsent(
        JSON.stringify({
          version: 1,
          necessary: true,
          analytics: true,
          marketing: false,
          updatedAt: 1,
        }),
        181 * 86400_000,
      ),
    ).toBeNull();
    saveConsent({ analytics: false, marketing: false });
    expect(getConsent()?.necessary).toBe(true);
  });
});
