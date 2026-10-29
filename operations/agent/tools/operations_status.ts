import { defineTool } from "eve/tools";
import { z } from "zod";
import { status } from "../../src/runtime.js";
export default defineTool({
  description:
    "Read budgets, readiness, jobs and recent evidence-backed decisions. No customer personal data.",
  inputSchema: z.object({}),
  execute: async () => {
    const current = await status();
    return {
      mode: current.control.mode,
      readiness: current.control.readiness,
      budgets: current.budgets,
      connections: current.configuration,
      jobCounts: current.jobCounts,
      products: current.products.slice(0, 10),
      issues: current.issues.slice(0, 5).map((row) => ({
        key: row.key,
        summary: JSON.stringify(row.document).slice(0, 600),
      })),
      recentEvents: current.audit.slice(0, 8).map((event) => ({
        event: event.event,
        at: event.at,
        actor: event.actor,
      })),
      note: "Bounded operational summary. Detailed records remain in the dashboard and evidence store.",
    };
  },
});
