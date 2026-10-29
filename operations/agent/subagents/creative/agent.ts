import { defineAgent } from "eve";
import { meteredModel } from "../../../src/models.js";
export default defineAgent({
  description:
    "Prepare Swedish no-faces creative from authorized photos. Require Swedish text on every slide, exact immutable visual reviews and truthful claims. Never mark your own output reviewed.",
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
