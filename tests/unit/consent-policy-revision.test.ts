import { beforeEach, describe, expect, it } from "vitest";
import {
  CONSENT_KEY,
  getConsent,
  consentSnapshot,
  saveConsent,
} from "@/lib/analytics/consent";

beforeEach(() => localStorage.clear());
function previous(analytics: boolean, marketing: boolean) {
  localStorage.setItem(
    "stilla-consent-v1",
    JSON.stringify({
      version: 1,
      necessary: true,
      analytics,
      marketing,
      updatedAt: Date.now(),
    }),
  );
}
describe("shopping pixel consent policy revision", () => {
  it("requires fresh analytics consent for Clarity while preserving earlier refusal", () => {
    const state = {
      version: 1,
      necessary: true,
      analytics: true,
      marketing: true,
      updatedAt: Date.now(),
    };
    localStorage.setItem("noorly-consent-v2", JSON.stringify(state));
    expect(getConsent()).toBeNull();
    localStorage.setItem(
      "noorly-consent-v2",
      JSON.stringify({ ...state, analytics: false }),
    );
    expect(getConsent()).toBeNull();
    localStorage.setItem(
      "noorly-consent-v2",
      JSON.stringify({ ...state, analytics: false, marketing: false }),
    );
    expect(getConsent()).toMatchObject({ analytics: false, marketing: false });
  });
  it("does not reuse old interest-only permissions", () => {
    previous(true, true);
    expect(getConsent()).toBeNull();
    expect(consentSnapshot()).toBe("");
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
  });
  it("continues respecting previous rejection without granting anything", () => {
    previous(false, false);
    expect(getConsent()).toMatchObject({ analytics: false, marketing: false });
  });
  it("records fresh independent choices under the new policy key", () => {
    previous(true, true);
    saveConsent({ analytics: true, marketing: false });
    expect(getConsent()).toMatchObject({ analytics: true, marketing: false });
    expect(localStorage.getItem(CONSENT_KEY)).not.toBeNull();
  });
});
