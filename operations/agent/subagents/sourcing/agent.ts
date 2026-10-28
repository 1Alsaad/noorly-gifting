import { defineAgent } from "eve";
import { meteredModel } from "../../../src/models.js";
export default defineAgent({
  description:
    "Qualify exact supplier variants, Sweden shipping and delivery promises. Prioritize AW Dropship. A private API schema and authenticated fulfillment test are mandatory before eligibility.",
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
