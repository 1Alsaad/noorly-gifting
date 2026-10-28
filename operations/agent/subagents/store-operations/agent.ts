import { defineAgent } from "eve";
import { meteredModel } from "../../../src/models.js";
export default defineAgent({
  description:
    "Coordinate configurable product descriptions, variants, prices, stock, navigation and customer policies. Preserve commitments and historical orders during retirement. Publish only through the trusted release process.",
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
