import { installTestSceneMedia } from "./media-fixture";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("product test replaces purchasing and blocks direct cart mutations", async ({
  page,
  request,
}) => {
  await page.goto("/sv/products/candle-sand");
  await page.getByRole("button", { name: "Avvisa valfria" }).click();
  await expect(
    page.getByRole("link", { name: "Visa mitt intresse" }).last(),
  ).toBeVisible();
  await expect(
    page
      .locator(".purchase-panel")
      .getByText("Pris ej fastställt", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Lägg i/ })).toHaveCount(0);
  const data = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(data.join("")).not.toContain('"@type":"Offer"');
  const response = await request.post("/api/cart", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { type: "checkout", locale: "sv" },
  });
  expect(response.status()).toBe(403);
  await page.getByRole("link", { name: "Visa mitt intresse" }).last().click();
  await expect(page).toHaveURL(/\/sv\/interest\?product=candle-sand/);
  await expect(page.getByText(/Intresselistan öppnar snart/)).toContainText(
    "Intresselistan öppnar snart",
  );
  await expect(page.getByRole("textbox", { name: "E-postadress" })).toHaveCount(
    0,
  );
});

test("mobile product test keeps the filmed product separate from its CTA", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installTestSceneMedia(page);
  await page.goto("/sv");
  await page.getByRole("button", { name: "Avvisa valfria" }).click();
  const scene = page.locator('[data-scene="winter-entrance"]');
  await expect(scene).toHaveAttribute("data-enhanced", "true");
  await scene.evaluate((element: HTMLElement) =>
    window.scrollTo({
      top: element.offsetTop + (element.offsetHeight - innerHeight) * 0.8,
      behavior: "instant",
    }),
  );
  const card = page.locator(".cinema-shopping");
  await expect(card).toHaveAttribute("data-visible", "true");
  const media = await page.locator(".cinema-media").boundingBox();
  const shopping = await card.boundingBox();
  expect(media).not.toBeNull();
  expect(shopping).not.toBeNull();
  expect(media!.y + media!.height).toBeLessThanOrEqual(shopping!.y + 2);
  await expect(
    card.getByRole("link", { name: "Utforska presentsetet" }),
  ).toBeVisible();
});

test("interest page is accessible and does not collect data without its backend", async ({
  page,
}) => {
  await page.goto("/en/interest?product=notebook-with-strap&variant=pnb-02");
  await page.getByRole("button", { name: "Reject optional" }).click();
  await expect(
    page.getByRole("heading", { name: "Notebook with strap" }),
  ).toBeVisible();
  await expect(
    page.getByText("Leaves on the same tree", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/The interest list opens soon/)).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole("link", { name: "Language: SV", exact: true }).click();
  await expect(page).toHaveURL(
    /\/sv\/interest\?product=notebook-with-strap&variant=pnb-02$/,
  );
  await expect(
    page.getByRole("heading", { name: "Anteckningsbok med rem" }),
  ).toBeVisible();
  await expect(
    page.getByText("Leaves on the same tree", { exact: true }),
  ).toBeVisible();
});

test("without JavaScript the product remains available with honest test messaging", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/sv/products/candle-sand");
  await expect(
    page.getByRole("heading", { name: "Ljussand", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Visa mitt intresse" }).last(),
  ).toBeVisible();
  await expect(
    page.getByText(/Ingen betalning, beställning eller reservation/).first(),
  ).toBeVisible();
  await context.close();
});
