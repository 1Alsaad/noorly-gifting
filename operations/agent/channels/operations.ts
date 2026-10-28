import { defineChannel, GET, POST } from "eve/channels";
import { handleHttp } from "../../src/http.js";
import { redactOperationalData } from "../../src/redaction.js";

export default defineChannel({
  async receive({ message, target, ...send }, { from }) {
    return from(String(target.jobKey)).send(message, send);
  },
  routes: [
    ...["/health", "/api/status", "/api/catalog"].map((path) =>
      GET(path, (request) => handleHttp(request)),
    ),
    ...[
      "/webhooks/shopify",
      "/api/control",
      "/api/verification",
      "/api/import",
      "/api/asset-review",
      "/api/tick",
    ].map((path) =>
      POST(path, (request, { from }) =>
        handleHttp(request, async (job, prompt) => {
          const delivery = await from(job.dedupKey).send(prompt, {
            auth: {
              authenticator: "noorly-scheduler",
              principalId: "noorly-runtime",
              principalType: "runtime",
              attributes: {},
            },
            idempotencyKey: job.dedupKey,
          });
          // Acceptance is durable handoff, not proof of completed department work.
          return JSON.parse(JSON.stringify(delivery));
        }),
      ),
    ),
  ],
  events: {
    "content.completed": async (event) => {
      if (event.data.phase === "reply") {
        const { getStore } = await import("../../src/database.js");
        await (
          await getStore()
        ).appendAudit(
          "department.reply",
          redactOperationalData({
            reply: String(event.data.value).slice(0, 12000),
          }),
          "agent",
        );
      }
    },
  },
});
