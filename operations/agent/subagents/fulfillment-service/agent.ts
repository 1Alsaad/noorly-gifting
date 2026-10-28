import { defineAgent } from "eve";
import { meteredModel } from "../../../src/models.js";
export default defineAgent({
  description:
    "Prioritize paid orders. Require funded supplier reservations and exact order identity; never duplicate orders. Reconcile acceptance/tracking; draft routine support from verified records. Escalate disputes and unverified remedies.",
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
