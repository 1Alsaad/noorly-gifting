import { afterEach, describe, expect, it, vi } from "vitest";
import {
  launchBundleCopy,
  launchBundleHandle,
  launchBundleHref,
  legacyLaunchBundleHandle,
} from "@/content/launch-bundle";
import { getDictionary } from "@/content/translations";

afterEach(() => vi.unstubAllEnvs());

describe("Noorly public stock and product copy", () => {
  it("describes teak bowls and packaged candle sand, not the old glass set", () => {
    for (const locale of ["sv", "en"] as const) {
      const copy = launchBundleCopy[locale];
      const text = [
        copy.description,
        copy.preorderExplanation,
        copy.provenance,
        copy.contents.join(" "),
      ].join(" ");
      expect(text).toContain("TeakB-37");
      expect(text).not.toMatch(/ELYSIA|Candledust|Nordic Lights|Dark Honey/);
      expect(copy.provenance).toMatch(
        locale === "sv" ? /träskålen/i : /wooden bowl/i,
      );
    }
    expect(launchBundleHref("sv")).toContain(launchBundleHandle);
    expect(legacyLaunchBundleHandle).not.toBe(launchBundleHandle);
  });

  it("has no fictional or demo copy in public information", () => {
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    for (const locale of ["sv", "en"] as const) {
      const t = getDictionary(locale);
      const visible = [
        t.footer.rights,
        t.pages.about.text,
        t.pages.terms.text,
        t.pages["shipping-returns"].text,
        t.pages.privacy.text,
        t.home.text,
        t.home.reviewsText,
      ].join(" ");
      expect(visible).not.toMatch(
        /fictional|fiktiv|demonstration|demo store|mock|preview submission|arbetskoncept|utkast/i,
      );
    }
  });
});
