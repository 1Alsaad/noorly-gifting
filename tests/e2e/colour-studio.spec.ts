import { expect, test, type Locator } from "@playwright/test";
import { launchSandChoices } from "../../src/content/launch-bundle";

test("colour choices work by keyboard without motion and carry through to the mobile product page", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  const reject = page.getByRole("button", {
    name: "Reject optional",
    exact: true,
  });
  if (await reject.isVisible()) await reject.click();
  const studio = page.locator(".colour-studio");
  await studio.scrollIntoViewIfNeeded();
  const photo = studio.locator(".colour-studio__photo");
  const expectLoadedPhoto = () =>
    expect
      .poll(() =>
        photo.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
  const loadSectionImages = async (section: Locator) => {
    await section.scrollIntoViewIfNeeded();
    const images = section.locator("img");
    for (let index = 0; index < (await images.count()); index++) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    await page.evaluate(() => document.fonts.ready);
  };
  await expectLoadedPhoto();
  await page.evaluate(() => document.fonts.ready);
  if (process.env.CI) {
    await studio.screenshot({
      path: testInfo.outputPath("colour-studio-desktop-1440.png"),
    });
    for (const [selector, filename] of [
      [".material-story", "material-story-desktop-1440.png"],
      [".candle-sand-guide--editorial", "candle-sand-guide-desktop-1440.png"],
    ]) {
      const scene = page.locator(selector);
      await loadSectionImages(scene);
      await scene.screenshot({ path: testInfo.outputPath(filename) });
    }
  }

  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 390, height: 844 });
  const rose = studio.getByRole("button", { name: "Dusty Rose", exact: true });
  await rose.focus();
  await page.keyboard.press("Tab");
  const honey = studio.getByRole("button", { name: "Warm Honey", exact: true });
  await expect(honey).toBeFocused();
  await page.keyboard.press("Space");
  await expect(honey).toHaveAttribute("aria-pressed", "true");
  await expect(
    studio.getByRole("link", { name: "Discover Warm Honey" }),
  ).toHaveAttribute("href", "/en/products/candle-sand?colour=CSand-08");
  await rose.focus();
  await page.keyboard.press("Enter");
  await expect(rose).toHaveAttribute("aria-pressed", "true");
  await expect(honey).toHaveAttribute("aria-pressed", "false");
  const choice = launchSandChoices.find(({ sku }) => sku === "CSand-07")!;
  await expect(photo).toHaveAttribute("alt", choice.photo.alt.en);
  expect(
    await photo.evaluate((image: HTMLImageElement) =>
      new URL(image.src).searchParams.get("url"),
    ),
  ).toBe(choice.photo.url);
  await expectLoadedPhoto();
  await expect
    .poll(() =>
      studio.evaluate((element) => ({
        animation: getComputedStyle(
          element.querySelector(".colour-studio__picture")!,
        ).animationName,
        transition: getComputedStyle(element).transitionProperty,
        running: element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running").length,
      })),
    )
    .toEqual({ animation: "none", transition: "none", running: 0 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  if (process.env.CI) {
    await studio.screenshot({
      path: testInfo.outputPath("colour-studio-mobile-390.png"),
    });
  }

  await studio.getByRole("link", { name: "Discover Dusty Rose" }).click();
  await expect(page).toHaveURL("/en/products/candle-sand?colour=CSand-07");
  await expect(
    page.getByRole("radio", {
      name: "Dusty Rose · Maison de Roses",
      exact: true,
    }),
  ).toBeChecked();
  const gallery = page.getByRole("link", { name: /Open full-size image/ });
  await expect(gallery).toHaveAttribute("href", /csand-07-0\.webp$/);
  await expect
    .poll(() =>
      gallery
        .locator("img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  if (process.env.CI) {
    await page.screenshot({
      path: testInfo.outputPath("selected-product-mobile-390.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/en/shop");
    await loadSectionImages(page.getByRole("main"));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath("shop-desktop-1440.png"),
      fullPage: true,
    });
  }
});
