import { expect, test } from "@playwright/test";

test("mobile choices stay compact without enabling preview checkout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/products/candle-sand");
  const reject = page.getByRole("button", { name: "Reject optional" });
  if (await reject.isVisible()) await reject.click();
  const pink = page.getByRole("radio", {
    name: "Dusty Rose · Maison de Roses",
  });
  await pink.check();
  await expect(pink).toBeChecked();
  const choices = await page.locator(".purchase-variant-group").boundingBox();
  const price = await page.locator(".purchase-price-group").boundingBox();
  expect(choices!.y + choices!.height).toBeLessThanOrEqual(price!.y + 1);
  await expect(page.locator(".selected-variant")).toHaveText(
    "Dusty Rose · Maison de Roses",
  );
  await expect(page.locator(".purchase-answers details[open]")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add to bag", exact: true }),
  ).toHaveCount(1);
  await page.getByText("Delivery & pre-orders", { exact: true }).click();
  await expect(
    page.getByText(/An arrival date is not yet confirmed/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Checkout", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("inline offers fit a narrow phone and keep preview purchases disabled", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/en/products/teakb-37-dekorativ-teakskal");
  const offers = page.getByRole("region", {
    name: "Your moment, your choice.",
  });
  await expect(offers.getByRole("radio")).toHaveCount(3);
  await expect(
    offers.getByRole("button", { name: "Checkout with Luma + Alva" }),
  ).toBeDisabled();
  const inspiration = page.getByRole("region", { name: "Home inspiration" });
  await expect(inspiration.getByRole("img")).toHaveCount(3);
  await expect(
    page.getByText(/Styling accessories are not included/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
