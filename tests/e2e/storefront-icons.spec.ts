import { expect, test, type Locator } from "@playwright/test";

async function expectVisibleVectorArrow(control: Locator, label: string) {
  await expect(control).toHaveAccessibleName(label);
  await expect(control).not.toContainText(/[↗↖→←⇢➜]/);
  const icon = control.locator("svg");
  await expect(icon).toHaveCount(1);
  await expect(icon).toHaveAttribute("aria-hidden", "true");
  await expect(icon).toBeVisible();
  expect(await icon.locator("path, polyline, line").count()).toBeGreaterThan(0);
  const bounds = await icon.boundingBox();
  expect(bounds?.width).toBeGreaterThan(0);
  expect(bounds?.height).toBeGreaterThan(0);
}

test("cinema and gallery arrows render as SVGs and retain named navigation", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Media decoding has its own three-engine suite; this journey exercises the
  // same cinema CTA with the static poster, then the actual product gallery.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const reject = page.getByRole("button", {
    name: "Reject optional",
    exact: true,
  });
  if (await reject.isVisible()) await reject.click();
  const productLink = page
    .locator('[data-scene="winter-entrance"]')
    .getByRole("link", { name: "Choose colour & scent", exact: true });
  await expectVisibleVectorArrow(productLink, "Choose colour & scent");
  await productLink.click();
  await expect(page).toHaveURL("/en/products/candle-sand");

  const trigger = page.getByRole("link", { name: /Open full-size image/ });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const next = dialog.getByRole("button", { name: "Next image", exact: true });
  const previous = dialog.getByRole("button", {
    name: "Previous image",
    exact: true,
  });
  await expectVisibleVectorArrow(next, "Next image");
  await expectVisibleVectorArrow(previous, "Previous image");
  await next.click();
  await expect(dialog.getByRole("img")).toHaveAttribute(
    "src",
    /csand-11-supplier-5ghn/,
  );
  await previous.click();
  await expect(dialog.getByRole("img")).toHaveAttribute("src", /csand-11-0/);
  if (process.env.CI && testInfo.project.name === "webkit") {
    await expect
      .poll(() =>
        dialog
          .getByRole("img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("webkit-gallery-svg-arrows.png"),
    });
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
