import { defineSchedule } from "eve/schedules";
import operations from "../channels/operations.js";
import { tick } from "../../src/runtime.js";

export default defineSchedule({
  cron: "*/15 * * * *",
  async run({ to, appAuth }) {
    await tick(async (job, prompt) => {
      const delivery = await to(operations, { jobKey: job.dedupKey }).send(
        prompt,
        { auth: appAuth, idempotencyKey: job.dedupKey },
      );
      return JSON.parse(JSON.stringify(delivery));
    });
  },
});
