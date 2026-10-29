import { defineAgent } from "eve";
import { meteredModel } from "../../../src/models.js";
export default defineAgent({
  description:
    "Calculate contribution from every quoted cost including fees, shipping, advertising, returns/reprints and labor; no VAT. Missing costs block launch. Reconcile actual Shopify orders and refunds.",
  model: meteredModel("routine"),
  modelContextWindowTokens: 16384,
  compaction: { thresholdPercent: 0.5 },
  defaultTools: false,
  limits: {
    sessionUsage: ({ total }) =>
      total.inputTokens >= 60000 || total.outputTokens >= 6000,
    sessionTimeoutMs: 3600000,
  },
});
