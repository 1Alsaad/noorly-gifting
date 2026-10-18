import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ConsentBanner,
  ConsentSettingsButton,
} from "../../src/components/consent/consent-banner";
import { getConsent } from "../../src/lib/analytics/consent";

describe("consent controls", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);
  it("offers equally accessible accept and reject actions and saves necessary-only consent", () => {
    render(<ConsentBanner locale="en" />);
    expect(screen.getByRole("button", { name: "Accept all" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Reject optional" }));
    expect(getConsent()).toMatchObject({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    expect(screen.queryByRole("button", { name: "Accept all" })).toBeNull();
  });
  it("allows changing preferences in a labelled keyboard-accessible dialog", () => {
    render(
      <>
        <ConsentBanner locale="en" />
        <ConsentSettingsButton locale="en" />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reject optional" }));
    fireEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
    expect(
      screen.getByRole("dialog", { name: "Your choices, at your pace" }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("checkbox", { name: "Analytics" }));
    fireEvent.click(screen.getByRole("button", { name: "Save my choices" }));
    expect(getConsent()?.analytics).toBe(true);
  });
});
