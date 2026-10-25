import { expect, test } from "@playwright/test";
import { consentCopy } from "../../src/components/consent/copy";

for (const locale of ["sv", "en"] as const) {
  for (const width of [375, 1280]) {
    test(`${locale} consent actions stay readable and usable at ${width}px`, async ({
      page,
    }) => {
      const copy = consentCopy[locale];
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/cookies`);
      await page.mouse.move(0, 0);

      const banner = page.getByRole("region", {
        name: copy.title,
        exact: true,
      });
      const accept = banner.getByRole("button", {
        name: copy.accept,
        exact: true,
      });
      const reject = banner.getByRole("button", {
        name: copy.reject,
        exact: true,
      });
      for (const button of [accept, reject]) {
        await expect(button).toBeVisible();
        await expect(button).toBeInViewport();
        const bounds = await button.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.height).toBeGreaterThanOrEqual(44);
      }
      await expect(accept).toHaveCSS("background-color", "rgb(0, 0, 0)");
      await expect(accept).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(reject).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(reject).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(reject).toHaveCSS("border-color", "rgb(0, 0, 0)");
      const acceptBounds = await accept.boundingBox();
      const rejectBounds = await reject.boundingBox();
      expect(Math.abs(acceptBounds!.width - rejectBounds!.width)).toBeLessThan(
        1,
      );

      await reject.focus();
      await expect(reject).toHaveCSS("outline-style", "solid");
      await expect(reject).toHaveCSS("outline-width", "2px");
      await page.keyboard.press("Enter");
      await expect(banner).toHaveCount(0);
      await page.reload();
      await expect(banner).toHaveCount(0);

      await page
        .getByRole("button", { name: copy.settings, exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: copy.title,
        exact: true,
      });
      const analytics = dialog.getByRole("checkbox", {
        name: copy.analytics,
        exact: true,
      });
      const marketing = dialog.getByRole("checkbox", {
        name: copy.marketing,
        exact: true,
      });
      await expect(analytics).not.toBeChecked();
      await expect(marketing).not.toBeChecked();
      const save = dialog.getByRole("button", { name: copy.save, exact: true });
      await page.mouse.move(0, 0);
      await expect(save).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(save).toHaveCSS("color", "rgb(0, 0, 0)");
      await analytics.check();
      await save.click();
      await expect(dialog).toHaveCount(0);
      await page
        .getByRole("button", { name: copy.settings, exact: true })
        .click();
      await expect(analytics).toBeChecked();
      await expect(marketing).not.toBeChecked();
    });
  }
}
