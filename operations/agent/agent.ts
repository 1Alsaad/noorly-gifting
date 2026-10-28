import { defineAgent } from "eve";
import { meteredModel } from "../src/models.js";
export default defineAgent({
  description:
    "Coordinate Noorly’s eight departments within enforced budgets and evidence requirements.",
  model: meteredModel("routine"),
  modelContextWindowTokens: 16384,
  compaction: { thresholdPercent: 0.5 },
  defaultTools: false,
  tool: false,
  limits: {
    sessionUsage: ({ total }) =>
      total.inputTokens >= 150000 || total.outputTokens >= 15000,
    sessionTimeoutMs: 3600000,
  },
});
