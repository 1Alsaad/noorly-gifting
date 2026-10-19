import assert from "node:assert/strict";
import test from "node:test";
import { priceOffer } from "./price-offers.mjs";

const illustration = {
  quantity: 1,
  unitCost: 40,
  inboundPerUnit: 5,
  packaging: 12,
  assembly: 8,
  outbound: 59,
  returnsReserve: 10,
  overhead: 5,
  vatRate: 0.25,
  feeRate: 0.015,
  feeFixed: 1.8,
  customerShipping: 49,
  plannedCpa: 60,
  targetContribution: 40,
  candidatePrice: 249,
};

test("a price floor covers VAT, fees on shipping, every cost, ads and target contribution", () => {
  const result = priceOffer(illustration);
  assert.equal(result.cost, 139);
  assert.ok(Math.abs(result.afterAds - 33.13) < 0.000001);
  assert.ok(Math.abs(result.maximumCpa - 53.13) < 0.000001);
  const atFloor = priceOffer({ ...illustration, candidatePrice: result.floor });
  assert.ok(
    Math.abs(atFloor.afterAds - illustration.targetContribution) < 0.000001,
  );
  assert.ok(result.endingInNine >= result.floor);
});

test("missing supplier quotes remain missing and explicit zero costs are supported", () => {
  assert.deepEqual(priceOffer({ ...illustration, unitCost: null }), {
    status: "missing_inputs",
    missing: ["unitCost"],
  });
  assert.equal(
    priceOffer({ ...illustration, assembly: 0 }).status,
    "calculated_not_launch_approved",
  );
});

test("bundle cost includes every pouch and loss-making CPA stays negative", () => {
  assert.equal(priceOffer({ ...illustration, quantity: 3 }).cost, 229);
  assert.ok(priceOffer({ ...illustration, candidatePrice: 10 }).maximumCpa < 0);
  assert.throws(() => priceOffer({ ...illustration, feeRate: 0.8 }));
  assert.equal(
    priceOffer({ ...illustration, customerShipping: 1000 }).floor,
    0,
  );
});
