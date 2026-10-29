import test from "node:test";
import assert from "node:assert/strict";
import {
  socialQueue,
  socialDraftFingerprint,
  prepareSocial,
} from "../src/runtime.js";
import type { SocialDraft } from "../src/schemas.js";
import { stockholmSlot } from "../src/config.js";
import {
  createBufferAdapter,
  type BufferPhotoPost,
  type BufferPost,
} from "../src/adapters/buffer.js";
import { fingerprint } from "../src/effects.js";
import {
  runtimeFixture,
  observe,
  productEvidence,
} from "./runtime-fixtures.js";

const hash = "a".repeat(64);
const image =
  "https://cdn.shopify.com/s/files/1/0123/files/existing-photo.jpg?v=1";
async function ready(start = "2026-10-22T22:30:00Z") {
  const f = runtimeFixture(start);
  await observe(f);
  await f.store.setMode("live", "test-verifier");
  await f.store.recordEvidence(productEvidence(f.now()));
  await f.records.put("handoff", "tiktok", {
    verified: true,
    oldSchedulerDisabled: true,
    importedPostIds: [],
  });
  await f.records.put("social-draft", "draft", {
    productId: "gid://shopify/Product/1",
    text: "En svensk beskrivning.",
    language: "sv",
    imageUrls: [image],
    aiGenerated: false,
    claimsEvidenceRefs: ["https://example.com/evidence"],
    state: "prepared",
  });
  await f.records.put("asset-review", fingerprint(image), {
    url: image,
    sha256: hash,
    noFaces: true,
    swedishText: true,
    authorizedPhotography: true,
    factualClaims: true,
  });
  const draft = await f.records.get<SocialDraft>("social-draft", "draft");
  await f.records.put("social-copy-review", socialDraftFingerprint(draft!), {
    productId: draft!.productId,
    reviewedAt: f.now().toISOString(),
    factualClaims: true,
    swedishText: true,
    reviewer: "trusted-review",
    evidenceRef: "verified:caption",
  });
  f.deps.verifyAsset = async () => true;
  return f;
}
const post = (input: BufferPhotoPost): BufferPost => ({
  id: "post-1",
  channelId: "tiktok-1",
  text: input.text,
  dueAt: input.dueAt,
  status: "scheduled",
  imageUrls: input.imageUrls,
  schedulingType: "automatic",
});
test("Stockholm posting slots retain wall time across spring and autumn DST", () => {
  assert.equal(
    stockholmSlot("2026-03-29", "09:17").toISOString(),
    "2026-03-29T07:17:00.000Z",
  );
  assert.equal(
    stockholmSlot("2026-10-25", "09:17").toISOString(),
    "2026-10-25T08:17:00.000Z",
  );
});
test("social queue requires handoff and old scheduler shutdown before any API call", async () => {
  const f = await ready();
  await f.records.put("handoff", "tiktok", {
    verified: true,
    oldSchedulerDisabled: false,
  });
  let calls = 0;
  const buffer = {
    ...createBufferAdapter({}),
    readQueue: async () => {
      calls++;
      return { status: "succeeded" as const, data: [] };
    },
  };
  assert.equal(
    (await socialQueue({ ...f.deps, now: f.now(), buffer })).status,
    "blocked",
  );
  assert.equal(calls, 0);
});
test("next-day scheduling on the autumn clock change uses tomorrow, not 24 hours", async () => {
  const f = await ready("2026-10-21T22:30:00Z"); // observation ends Oct 25 00:30 Swedish time
  let scheduled: BufferPhotoPost | undefined;
  const buffer = {
    ...createBufferAdapter({}),
    readQueue: async () => ({ status: "succeeded" as const, data: [] }),
    schedulePhotoPost: async (input: BufferPhotoPost) => {
      scheduled = input;
      return {
        status: "succeeded" as const,
        externalId: "post-1",
        data: post(input),
      };
    },
  };
  await socialQueue({ ...f.deps, now: f.now(), buffer });
  assert.equal(scheduled?.dueAt, "2026-10-26T08:17:00.000Z");
  assert.equal(
    (await f.records.get<{ state: string }>("social-draft", "draft"))?.state,
    "scheduled",
  );
});
test("invalid review is persisted as blocked and never reaches publishing", async () => {
  const f = await ready();
  await f.records.put("asset-review", fingerprint(image), {
    sha256: hash,
    noFaces: false,
  });
  let writes = 0;
  const buffer = {
    ...createBufferAdapter({}),
    readQueue: async () => ({ status: "succeeded" as const, data: [] }),
    schedulePhotoPost: async () => {
      writes++;
      return { status: "unknown" as const };
    },
  };
  await socialQueue({ ...f.deps, now: f.now(), buffer });
  assert.equal(writes, 0);
  assert.equal(
    (await f.records.get<{ state: string }>("social-draft", "draft"))?.state,
    "blocked",
  );
});
test("uncertain Buffer submission reconciles by reading after restart without another write", async () => {
  const f = await ready();
  const input: BufferPhotoPost = {
    actionKey: "tiktok:2026-10-27:09:17",
    text: "En svensk beskrivning.",
    dueAt: "2026-10-27T08:17:00.000Z",
    imageUrls: [image],
    aiGenerated: false,
  };
  await f.records.claimEffect(
    input.actionKey,
    "publish_social",
    fingerprint(input),
  );
  await f.records.finishEffect(input.actionKey, "unknown", {
    status: "unknown",
  });
  await f.records.put("social-lock", "unresolved", {
    key: input.actionKey,
    post: input,
    draftKey: "draft",
  });
  let writes = 0;
  let reads = 0;
  const buffer = {
    ...createBufferAdapter({}),
    readQueue: async () => ({
      status: "succeeded" as const,
      data: [post(input)],
    }),
    findScheduledPost: async () => {
      reads++;
      return { status: "succeeded" as const, data: post(input) };
    },
    schedulePhotoPost: async () => {
      writes++;
      return { status: "unknown" as const };
    },
  };
  await socialQueue({ ...f.deps, now: f.now(), buffer });
  assert.equal(reads, 1);
  assert.equal(writes, 0);
  assert.equal(
    (await f.records.get<{ resolved: boolean }>("social-lock", "unresolved"))
      ?.resolved,
    true,
  );
  assert.equal(
    (await f.records.get<{ state: string }>("social-draft", "draft"))?.state,
    "scheduled",
  );
});
test("image approval cannot authorize a different unreviewed caption or changed image bytes", async () => {
  const f = await ready();
  const draft = await f.records.get<SocialDraft>("social-draft", "draft");
  await f.records.put("social-draft", "draft", {
    ...draft,
    text: "New unverified claim",
    state: "prepared",
  });
  let writes = 0;
  const buffer = {
    ...createBufferAdapter({}),
    readQueue: async () => ({ status: "succeeded" as const, data: [] }),
    schedulePhotoPost: async () => {
      writes++;
      return { status: "unknown" as const };
    },
  };
  await socialQueue({ ...f.deps, now: f.now(), buffer });
  assert.equal(writes, 0);
  await f.records.put("social-draft", "draft", { ...draft, state: "prepared" });
  await socialQueue({
    ...f.deps,
    now: f.now(),
    buffer,
    verifyAsset: async () => false,
  });
  assert.equal(writes, 0);
  assert.equal(
    (await f.records.get<{ state: string }>("social-draft", "draft"))?.state,
    "blocked",
  );
});
test("repeated preparation cannot reset a published draft to a fresh publishing candidate", async () => {
  const f = await ready();
  const stored = await f.records.get<SocialDraft>("social-draft", "draft");
  const {
    productId,
    text,
    title,
    language,
    imageUrls,
    aiGenerated,
    claimsEvidenceRefs,
  } = stored!;
  const draft = {
    productId,
    text,
    title,
    language,
    imageUrls,
    aiGenerated,
    claimsEvidenceRefs,
  };
  const result = await prepareSocial(draft, { records: f.records });
  await f.records.put("social-draft", result.id, {
    ...draft,
    state: "scheduled",
  });
  assert.equal(
    (await prepareSocial(draft, { records: f.records })).state,
    "scheduled",
  );
});
