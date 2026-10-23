import { describe, expect, it } from "vitest";
import {
  prepareMetaPurchaseContract,
  type MetaPurchaseInput,
} from "@/lib/analytics/meta-purchase-contract";

const now = Date.parse("2026-10-21T15:00:00Z");
const paid: MetaPurchaseInput = {
  shop: "noorly-test.myshopify.com",
  orderId: "1234",
  financialStatus: "paid",
  test: false,
  cancelled: false,
  marketingConsent: true,
  shopifyMarketingAllowed: true,
  paidAt: "2026-10-21T14:00:00Z",
  currency: "SEK",
  total: "599.00",
};

describe("offline Meta purchase contract", () => {
  it("keeps the paid timestamp, value and stable identity across webhook retries", () => {
    const first = prepareMetaPurchaseContract(paid, now)!;
    const retry = prepareMetaPurchaseContract(paid, now + 60_000)!;
    expect(first).toEqual(retry);
    expect(first).toMatchObject({
      eventName: "Purchase",
      eventTime: Date.parse(paid.paidAt) / 1000,
      currency: "SEK",
      value: 599,
    });
    expect(first.eventId).toMatch(/^[a-f0-9]{64}$/);
    expect(
      prepareMetaPurchaseContract({ ...paid, orderId: "1235" }, now)?.eventId,
    ).not.toBe(first.eventId);
    expect(
      prepareMetaPurchaseContract(
        { ...paid, shop: "another.myshopify.com" },
        now,
      )?.eventId,
    ).not.toBe(first.eventId);
  });

  it.each([
    { financialStatus: "pending" },
    { financialStatus: "partially_paid" },
    { financialStatus: "refunded" },
    { test: true },
    { test: undefined },
    { cancelled: true },
    { marketingConsent: false },
    { marketingConsent: undefined },
    { shopifyMarketingAllowed: false },
    { shopifyMarketingAllowed: undefined },
    { total: "0.00" },
    { total: "-599" },
    { total: "599,00" },
    { currency: "sek" },
    { orderId: 1234 },
    { paidAt: "2026-10-21T16:00:00Z" },
    { paidAt: "invalid" },
  ])("refuses ineligible or incomplete purchase data: %j", (change) => {
    expect(prepareMetaPurchaseContract({ ...paid, ...change }, now)).toBeNull();
  });

  it("does not carry customer details, URLs or webhook identifiers into the contract", () => {
    const contract = prepareMetaPurchaseContract(
      {
        ...paid,
        customer: { email: "private@example.com" },
        giftMessage: "Private message",
        checkoutUrl: "https://example.com/?token=private",
        webhookId: "retry-specific-id",
      },
      now,
    );
    expect(Object.keys(contract!)).toEqual([
      "eventName",
      "eventId",
      "eventTime",
      "currency",
      "value",
    ]);
    expect(JSON.stringify(contract)).not.toContain("private");
  });
});
