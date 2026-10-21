import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function priceOffer(input) {
  const required = [
    "quantity",
    "unitCost",
    "inboundPerUnit",
    "packaging",
    "assembly",
    "outbound",
    "returnsReserve",
    "overhead",
    "vatRate",
    "feeRate",
    "feeFixed",
    "customerShipping",
    "plannedCpa",
    "targetContribution",
    "candidatePrice",
  ];
  const missing = required.filter(
    (key) =>
      typeof input[key] !== "number" ||
      !Number.isFinite(input[key]) ||
      input[key] < 0,
  );
  if (missing.length) return { status: "missing_inputs", missing };
  if (!Number.isInteger(input.quantity) || input.quantity < 1)
    throw new Error("Quantity must be a positive integer.");
  const retainedPerGrossKrona = 1 / (1 + input.vatRate) - input.feeRate;
  if (retainedPerGrossKrona <= 0)
    throw new Error("Payment fee rate leaves no retained revenue.");
  const cost =
    input.quantity * (input.unitCost + input.inboundPerUnit) +
    input.packaging +
    input.assembly +
    input.outbound +
    input.returnsReserve +
    input.overhead;
  const grossCollected = input.candidatePrice + input.customerShipping;
  const paymentFee = grossCollected * input.feeRate + input.feeFixed;
  const beforeAds = grossCollected / (1 + input.vatRate) - cost - paymentFee;
  const floor = Math.max(
    0,
    (cost + input.feeFixed + input.plannedCpa + input.targetContribution) /
      retainedPerGrossKrona -
      input.customerShipping,
  );
  const endingInNine = Math.max(0, Math.ceil((floor + 1) / 10) * 10 - 1);
  return {
    status: "calculated_not_launch_approved",
    cost,
    grossCollected,
    paymentFee,
    beforeAds,
    afterAds: beforeAds - input.plannedCpa,
    maximumCpa: beforeAds - input.targetContribution,
    floor,
    endingInNine,
    pricePerPouch: input.candidatePrice / input.quantity,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!process.argv[2])
    throw new Error(
      "Usage: node scripts/price-offers.mjs path/to/verified-inputs.json",
    );
  const input = JSON.parse(await fs.readFile(process.argv[2], "utf8"));
  console.log(JSON.stringify(priceOffer(input), null, 2));
}
