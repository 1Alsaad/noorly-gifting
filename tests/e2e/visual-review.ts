import { expect, type Page, type TestInfo } from "@playwright/test";

/** Capture the rendered page only after its lazy images and fonts are ready. */
export async function capturePageForReview(
  page: Page,
  testInfo: TestInfo,
  filename: string,
) {
  if (!process.env.CI) return;
  const images = page.getByRole("main").locator("img");
  for (let index = 0; index < (await images.count()); index++) {
    const image = images.nth(index);
    if (!(await image.isVisible())) continue;
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
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath(filename),
    fullPage: true,
  });
}
