import { createHash } from "node:crypto";

export const CHANNELS = ["instagram", "facebook"];

export function localDate(now, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (key) => parts.find((part) => part.type === key).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function approvedBriefs(config) {
  const origin = new URL(config.siteOrigin);
  if (origin.protocol !== "https:" || origin.origin !== config.siteOrigin)
    throw new Error("CONFIG_SITE_ORIGIN_INVALID");
  const briefs = config.briefs.filter((brief) => brief.approved === true);
  if (!briefs.length) throw new Error("NO_APPROVED_SOCIAL_BRIEFS");
  const ids = new Set();
  for (const brief of briefs) {
    const image = new URL(brief.imageUrl);
    const link = new URL(brief.linkPath, origin);
    if (
      !/^[a-z0-9-]+$/.test(brief.id) ||
      ids.has(brief.id) ||
      typeof brief.topic !== "string" ||
      !brief.topic.trim() ||
      !Array.isArray(brief.facts) ||
      !brief.facts.length ||
      brief.facts.some((fact) => typeof fact !== "string" || !fact.trim()) ||
      typeof brief.imageDescription !== "string" ||
      !brief.imageDescription.trim() ||
      image.origin !== origin.origin ||
      image.username ||
      image.password ||
      link.origin !== origin.origin ||
      link.username ||
      link.password
    )
      throw new Error("APPROVED_BRIEF_INVALID");
    ids.add(brief.id);
  }
  return briefs;
}

export function validateDraft(draft, briefs, history = []) {
  const brief = briefs.find((item) => item.id === draft?.briefId);
  if (!brief) throw new Error("DRAFT_BRIEF_INVALID");
  for (const channel of CHANNELS) {
    const caption = draft[channel];
    if (
      typeof caption !== "string" ||
      caption.trim().length < 20 ||
      caption.length > 2000 ||
      /https?:\/\/|www\.|<[^>]*>/.test(caption) ||
      (caption.match(/#/g) || []).length > 5 ||
      /\b(SEK|kr|gratis|rea|rabatt|fri frakt|garanti)\b|\d\s*%/i.test(caption)
    )
      throw new Error("DRAFT_CAPTION_INVALID");
    const normalized = caption.trim().toLocaleLowerCase("sv-SE");
    if (
      history.some((item) =>
        CHANNELS.some(
          (key) => item[key]?.trim().toLocaleLowerCase("sv-SE") === normalized,
        ),
      )
    )
      throw new Error("DRAFT_DUPLICATE_CAPTION");
  }
  return brief;
}

export function contentHash(draft) {
  return createHash("sha256").update(JSON.stringify(draft)).digest("hex");
}

// The model can revise copy twice; it can never change accounts or media URLs.
export async function planPost({ config, history, generate, review }) {
  const briefs = approvedBriefs(config);
  let feedback = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const draft = await generate({ config, briefs, history, feedback });
    try {
      const brief = validateDraft(draft, briefs, history);
      const verdict = await review({ config, brief, draft });
      if (
        verdict?.approved === true &&
        Array.isArray(verdict.issues) &&
        !verdict.issues.length
      )
        return { draft, brief, hash: contentHash(draft) };
      feedback = Array.isArray(verdict?.issues)
        ? verdict.issues
        : ["Review did not approve this draft."];
    } catch (error) {
      feedback = [error.message];
    }
  }
  throw new Error("CONTENT_REVIEW_FAILED");
}

// Commit intent before any public mutation. An uncertain response is held for
// reconciliation because Meta does not provide an exactly-once publish contract.
export async function publishRecord({
  record,
  save,
  publisher,
  beforePublish,
}) {
  const errors = [];
  for (const channel of CHANNELS) {
    const state = record.channels[channel];
    if (state.status === "published") continue;
    if (state.status === "publishing" || state.status === "unknown") {
      errors.push(`${channel}:RECONCILIATION_REQUIRED`);
      continue;
    }
    try {
      if (channel === "instagram" && !state.containerId) {
        state.containerId = await publisher.createContainer(record);
        await save(record);
      }
      if (channel === "instagram")
        await publisher.waitForContainer(state.containerId);
      await beforePublish();
      state.status = "publishing";
      await save(record);
    } catch {
      // No public API has been called yet. Keep this channel retryable.
      // If an intent write succeeded remotely but its response was lost, the
      // persisted publishing marker conservatively prevents a later replay.
      errors.push(`${channel}:PREPARATION_FAILED`);
      continue;
    }
    try {
      const result = await publisher.publish(channel, record);
      if (!result?.id) throw new Error("PUBLISH_ID_MISSING");
      state.status = "published";
      state.id = result.id;
      state.publishedAt = new Date().toISOString();
      await save(record);
    } catch {
      state.status = "unknown";
      // If this save fails, the earlier publishing marker still prevents replay.
      await save(record);
      errors.push(`${channel}:RECONCILIATION_REQUIRED`);
    }
  }
  if (errors.length) throw new Error(errors.join(","));
  return record;
}

export async function runDaily({
  config,
  date,
  store,
  planner,
  publisher,
  beforePublish,
}) {
  if (!(await store.acquire())) throw new Error("SOCIAL_RUN_ALREADY_LOCKED");
  try {
    let record = await store.load(date);
    if (!record) {
      const plan = await planner(await store.history());
      record = {
        date,
        ...plan,
        channels: {
          instagram: { status: "pending" },
          facebook: { status: "pending" },
        },
      };
      await store.save(record);
    }
    if (record.date !== date) throw new Error("JOURNAL_DATE_INVALID");
    // Removing approval or changing any approved media/facts also stops retries.
    const brief = approvedBriefs(config).find(
      (item) => item.id === record.brief.id,
    );
    if (JSON.stringify(brief) !== JSON.stringify(record.brief))
      throw new Error("SAVED_BRIEF_CHANGED_REVIEW_REQUIRED");
    validateDraft(record.draft, [brief]);
    await publishRecord({
      record,
      save: (value) => store.save(value),
      publisher,
      beforePublish,
    });
    await store.remember(record);
    return record;
  } finally {
    await store.release();
  }
}
