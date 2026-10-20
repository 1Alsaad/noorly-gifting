import { readFile, appendFile } from "node:fs/promises";
import { approvedBriefs, localDate, planPost, runDaily } from "./agent.mjs";
import { gatewayAgent, metaPublisher, redisStore, requireEnv, verifyImage } from "./adapters.mjs";

async function main() {
  const env = process.env;
  const config = JSON.parse(await readFile(new URL("./briefs.json", import.meta.url), "utf8"));
  const date = localDate(new Date(), config.timezone);
  const live = env.SOCIAL_PUBLISH === "true";
  if (live && env.NOORLY_SOCIAL_ENABLED !== "true") throw new Error("SOCIAL_PUBLISHING_DISABLED");
  // Validate content before spending model credits or contacting Meta.
  const briefs = approvedBriefs(config);
  requireEnv(env, ["AI_GATEWAY_API_KEY", "AI_GATEWAY_MODEL"]);
  const agent = gatewayAgent(env);
  await agent.verifyModel();
  const planner = (history) => planPost({ config, history, ...agent });
  if (!live) {
    for (const brief of briefs) await verifyImage(brief.imageUrl);
    const plan = await planner([]);
    // The preview contains only public approved brief data and proposed captions.
    console.log(JSON.stringify({ mode: "dry-run", date, ...plan }, null, 2));
    if (env.GITHUB_STEP_SUMMARY)
      await appendFile(env.GITHUB_STEP_SUMMARY, `Daily social preview for ${date}\n\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\`\n`);
    return;
  }
  requireEnv(env, [
    "META_GRAPH_VERSION", "META_PAGE_ID", "META_INSTAGRAM_ACCOUNT_ID",
    "META_PAGE_ACCESS_TOKEN", "RATE_LIMIT_PROVIDER_URL", "RATE_LIMIT_PROVIDER_TOKEN",
  ]);
  const publisher = metaPublisher(env, config);
  await publisher.preflight();
  const namespace = `noorly:social:${env.META_PAGE_ID}:${env.META_INSTAGRAM_ACCOUNT_ID}`;
  const store = redisStore(env, namespace);
  const record = await runDaily({
    config, date, store, planner, publisher,
    beforePublish: async () => {
      await store.assertLease();
      if (localDate(new Date(), config.timezone) !== date) throw new Error("SOCIAL_DATE_CHANGED");
    },
  });
  const summary = { date, instagram: record.channels.instagram, facebook: record.channels.facebook };
  console.log(JSON.stringify(summary, null, 2));
  if (env.GITHUB_STEP_SUMMARY)
    await appendFile(env.GITHUB_STEP_SUMMARY, `Daily social publishing result\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n`);
}

main().catch((error) => {
  // Do not leak fetch URLs, response bodies, authorization headers or secrets.
  const message = /^[A-Z0-9_:,a-z]+$/.test(error.message) ? error.message : "SOCIAL_AGENT_FAILED";
  console.error(message);
  process.exitCode = 1;
});
