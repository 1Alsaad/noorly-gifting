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
