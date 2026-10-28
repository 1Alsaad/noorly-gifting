import { defineTool } from "eve/tools";
import { z } from "zod";
import { keywordResearch } from "../../src/runtime.js";
export default defineTool({
  description:
    "Fetch a cached daily batch of Swedish estimated keyword volumes. Uses confirmed prepaid credits and hard budget reservations. No topups.",
  inputSchema: z.object({
    keywords: z.array(z.string().min(1).max(80)).min(1).max(1000),
  }),
  execute: ({ keywords }) => keywordResearch(keywords),
});
