import { randomUUID } from "node:crypto";
import { getStore, getRecords, demoMode } from "./database.js";
import {
  DEPARTMENTS,
  configurationStatus,
  stockholmDay,
  stockholmSlot,
  TIKTOK_SLOTS,
  fxRate,
} from "./config.js";
import {
  proposalSchema,
  socialDraftSchema,
  type SocialDraft,
} from "./schemas.js";
import {
  createShopifyAdapter,
  shopifyConfigFromEnv,
} from "./adapters/shopify.js";
import { createBufferAdapter, bufferConfigFromEnv } from "./adapters/buffer.js";
import {
  createDataForSeoAdapter,
  dataForSeoConfigFromEnv,
} from "./adapters/dataforseo.js";
import { createAwAdapter, awConfigFromEnv } from "./adapters/aw.js";
import { fingerprint, runEffect } from "./effects.js";
import { evaluateLaunch, liveReadiness } from "./core/policy.js";
import type { Job, OpsStore } from "./core/types.js";
import type { RecordStore } from "./records.js";
import { notifyOwner, type NotificationOptions } from "./notifications.js";
import { safeText, redactOperationalData } from "./redaction.js";
import { catalogReleaseService } from "./catalog-release.js";
import { orderReconciler } from "./order-reconciliation.js";
import { verifyAssetBytes } from "./assets.js";

export type Dispatch = (job: Job, prompt: string) => Promise<unknown>;
export type RuntimeDependencies = {
  store?: OpsStore;
  records?: RecordStore;
  env?: NodeJS.ProcessEnv;
  isDemo?: boolean;
  now?: Date;
  shopify?: ReturnType<typeof createShopifyAdapter>;
  buffer?: ReturnType<typeof createBufferAdapter>;
  sendNotification?: NotificationOptions["send"];
  executeCatalog?: (id: string) => Promise<unknown>;
  reconcileOrder?: (id: string) => Promise<unknown>;
  verifyAsset?: (url: string, sha256: string) => Promise<boolean>;
};
async function context(deps: RuntimeDependencies = {}) {
  const [store, records] = await Promise.all([
    deps.store ?? getStore(),
    deps.records ?? getRecords(),
  ]);
  return {
    ...deps,
    store,
    records,
    env: deps.env ?? process.env,
    isDemo: deps.isDemo ?? demoMode(),
    now: deps.now ?? new Date(),
  };
}
type Context = Awaited<ReturnType<typeof context>>;
export async function status(deps: RuntimeDependencies = {}) {
  const { store, records, env, isDemo } = await context(deps);
  const snapshot = await store.snapshot();
  return redactOperationalData(
    {
      demo: isDemo,
      configuration: configurationStatus(env),
      control: snapshot.control,
      budgets: snapshot.budgets,
      month: snapshot.month,
      departments: DEPARTMENTS,
      jobCounts: Object.fromEntries(
        ["queued", "leased", "completed", "dead"].map((s) => [
          s,
          Object.values(snapshot.jobs).filter((j) => j.state === s).length,
        ]),
      ),
      jobs: Object.values(snapshot.jobs)
        .slice(-60)
        .map(({ payload: _payload, ...j }) => j),
      products: Object.values(snapshot.products).map((p) => ({
        id: p.id,
        title: p.title,
        launch: evaluateLaunch(p, new Date()),
      })),
      proposals: await records.list("proposal", 30),
      issues: await records.list("issue", 30),
      audit: await store.readAudit(50),
    },
    env,
  );
}
export async function issue(
  key: string,
  message: string,
  deps: RuntimeDependencies = {},
) {
  const ctx = await context(deps);
  const { store, records, env, now } = ctx;
  const clean = safeText(message, env).slice(0, 2000);
  const safeKey = fingerprint(key);
  await records.withLock(`issue:${safeKey}`, async () => {
    const previous = await records.get<{ message: string }>("issue", safeKey);
    if (previous?.message === clean) return;
    await records.put("issue", safeKey, {
      message: clean,
      at: now.toISOString(),
      resolved: false,
    });
    await store.appendAudit("issue.changed", { key: safeKey, message: clean });
  });
  // Dedupe is durable; unchanged alerts remain eligible after missing credentials/cap.
  await notifyOwner(
    records,
    {
      key: `issue:${safeKey}:${fingerprint(clean)}`,
      subject: "Noorly needs attention",
      text: clean,
    },
    { env, now, isDemo: ctx.isDemo, send: ctx.sendNotification },
  );
}
export async function submitProposal(input: unknown) {
  const proposal = proposalSchema.parse(input);
  const id = randomUUID();
  await (
    await getRecords()
  ).put("proposal", id, {
    ...proposal,
    id,
    status: "proposed",
    trusted: false,
    createdAt: new Date().toISOString(),
  });
  await (
    await getStore()
  ).appendAudit(
    "proposal.created",
    { id, department: proposal.department, kind: proposal.kind },
    "agent",
  );
  return {
    id,
    status: "proposed",
    note: "Proposals do not certify facts, spend money, or bypass publication gates.",
  };
}
export function socialDraftFingerprint(draft: SocialDraft) {
  const {
    productId,
    text,
    title,
    language,
    imageUrls,
    aiGenerated,
    claimsEvidenceRefs,
  } = draft;
  return fingerprint(
    socialDraftSchema.parse({
      productId,
      text,
      title,
      language,
      imageUrls,
      aiGenerated,
      claimsEvidenceRefs,
    }),
  );
}
export async function prepareSocial(
  input: unknown,
  deps: Pick<RuntimeDependencies, "records"> = {},
) {
  const draft = socialDraftSchema.parse(input);
  const id = socialDraftFingerprint(draft);
  const records = deps.records ?? (await getRecords());
  const locked = await records.withLock(`social-draft:${id}`, async () => {
    const previous = await records.get<{ state: string }>("social-draft", id);
    if (previous) return { id, state: previous.state };
    await records.put("social-draft", id, {
      ...draft,
      id,
      createdAt: new Date().toISOString(),
      state: "prepared",
    });
    return { id, state: "prepared" };
  });
  return {
    id,
    state: locked.locked ? locked.result!.state : "busy",
    remaining:
      "Trusted caption and visual asset reviews, byte verification and queue handoff are required before automatic publication.",
  };
}
export async function keywordResearch(keywords: string[]) {
  const adapter = createDataForSeoAdapter(dataForSeoConfigFromEnv());
  if (!adapter.readiness().ready)
    return { status: "blocked", ...adapter.readiness() };
  if (demoMode())
    return { status: "blocked", reason: "Demo never makes paid requests." };
  const [store, records] = await Promise.all([getStore(), getRecords()]);
  const key = `keywords:${stockholmDay()}:${fingerprint([...new Set(keywords)].sort())}`;
  const cached = await records.get("research", key);
  if (cached) return cached;
  const amountOre = Math.ceil(0.09 * fxRate() * 100);
  const reservation = await store.reserveSpend({
    idempotencyKey: key,
    category: "software",
    amountOre,
    purpose: "Batched Swedish keyword estimates",
    funding: "prepaid",
    prepaidAccount: "dataforseo",
  });
  const result = await runEffect(
    records,
    key,
    "keyword_research",
    { keywords },
    () => adapter.searchSweden(keywords),
  );
  // A provider rejection can still be billable. Reconcile uncertain charges; never release them from a model assertion.
  if (result.status === "succeeded") {
    await store.settleSpend(reservation.id, {
      actualOre: amountOre,
      receiptId: `dataforseo:${result.externalId ?? key}`,
    });
    await records.put("research", key, result);
  } else
    await issue(
      key,
      `Keyword request ${result.status}; retained its reservation for billing reconciliation.`,
    );
  return result;
}
async function reconcileShopify(ctx: Context, orderId?: string) {
  const { store, records, env, now } = ctx;
  const adapter =
    ctx.shopify ?? createShopifyAdapter(shopifyConfigFromEnv(env));
  if (!adapter.readiness().ready) {
    await issue(
      "shopify-access",
      "Shopify backend access is missing. Connected chat access is not a deployment credential.",
      ctx,
    );
    return { status: "blocked" };
  }
  if (ctx.isDemo)
    return { status: "blocked", reason: "Demo does not contact the store." };
  const reconcile =
    ctx.reconcileOrder ?? (await orderReconciler()).reconcileOrder;
  // Refund and cancellation webhooks need the exact order even after it leaves PAID.
  if (orderId) return reconcile(orderId);
  // Overlap the sync window so late events are reconciled. Upserts and order IDs deduplicate.
  const last = await records.get<{ at: string }>("sync", "shopify");
  const since = new Date(
    last ? Date.parse(last.at) - 7 * 86400000 : now.getTime() - 30 * 86400000,
  ).toISOString();
  let after: string | undefined;
  let count = 0;
  for (let page = 0; page < 20; page++) {
    const result = await adapter.listPaidOrders({ since, first: 100, after });
    if (result.status !== "succeeded" || !result.data)
      throw new Error(`Shopify reconciliation ${result.status}`);
    for (const order of result.data.items) {
      await records.put("shopify-order", order.id, order);
      count++;
      await reconcile(order.id);
    }
    if (!result.data.hasNextPage) {
      await records.put("sync", "shopify", { at: now.toISOString() });
      return { status: "succeeded", count };
    }
    if (!result.data.endCursor || result.data.endCursor === after)
      throw new Error("Shopify cursor stalled");
    after = result.data.endCursor;
  }
  throw new Error(
    "Shopify sync exceeds bounded pages; cursor must be reconciled before accepting a complete sync",
  );
}
export async function socialQueue(deps: RuntimeDependencies = {}) {
  const ctx = await context(deps);
  const { store, records, env, now } = ctx;
  const allowed = await store.authorizeAction("publish_social");
  if (!allowed.allowed) return { status: "blocked", reasons: allowed.reasons };
  if (ctx.isDemo)
    return { status: "blocked", reason: "Demo does not publish." };
  const handoff = await records.get<{
    verified: boolean;
    oldSchedulerDisabled: boolean;
    importedPostIds: string[];
  }>("handoff", "tiktok");
  if (!handoff?.verified || !handoff.oldSchedulerDisabled)
    return {
      status: "blocked",
      reason: "Existing Make/Buffer queue ownership has not been transferred.",
    };
  const adapter = ctx.buffer ?? createBufferAdapter(bufferConfigFromEnv(env));
  const locked = await records.withLock("buffer:tiktok", async () => {
    const unresolved = await records.get<{
      key: string;
      post: Parameters<typeof adapter.schedulePhotoPost>[0];
      draftKey?: string;
      resolved?: boolean;
    }>("social-lock", "unresolved");
    if (unresolved && !unresolved.resolved) {
      const reconciled = await runEffect(
        records,
        unresolved.key,
        "publish_social",
        unresolved.post,
        async () => ({
          status: "unknown",
          reason: "Uncertain writes are never repeated",
        }),
        async () => {
          const found = await adapter.findScheduledPost(unresolved.post);
          return found.status === "succeeded" && found.data
            ? {
                status: "succeeded",
                externalId: found.data.id,
                data: found.data,
              }
            : { status: "unknown", reason: "Post remains unconfirmed" };
        },
      );
      if (reconciled.status !== "succeeded")
        return {
          status: "blocked",
          reason: "Previous Buffer submission remains unconfirmed.",
        };
      if (unresolved.draftKey) {
        const draft = await records.get("social-draft", unresolved.draftKey);
        if (draft && typeof draft === "object")
          await records.put("social-draft", unresolved.draftKey, {
            ...draft,
            state: "scheduled",
            externalId: reconciled.externalId,
          });
      }
      await records.put("social-lock", "unresolved", {
        ...unresolved,
        resolved: true,
      });
    }
    const queue = await adapter.readQueue();
    if (queue.status !== "succeeded" || !queue.data)
      throw new Error("Buffer queue could not be read completely");
    for (const post of queue.data)
      await records.put("social-published", post.id, {
        ...post,
        adopted: true,
      });
    if (queue.data.length >= 10) return { status: "succeeded", scheduled: 0 };
    const drafts = await records.list<SocialDraft & { state: string }>(
      "social-draft",
      100,
    );
    const approvedDrafts: typeof drafts = [];
    for (const row of drafts) {
      if (!["prepared", "blocked"].includes(row.document.state)) continue;
      const draft = row.document;
      const evidence = (await store.snapshot()).products[draft.productId];
      const copy = await records.get<{
        reviewedAt: string;
        factualClaims: boolean;
        swedishText: boolean;
        productId: string;
        reviewer: string;
        evidenceRef: string;
      }>("social-copy-review", socialDraftFingerprint(draft));
      const age = now.getTime() - Date.parse(copy?.reviewedAt ?? "");
      let valid = Boolean(
        evidence &&
        evaluateLaunch(evidence, now).allowed &&
        !draft.aiGenerated &&
        copy?.factualClaims &&
        copy.swedishText &&
        copy.productId === draft.productId &&
        copy.reviewer &&
        copy.evidenceRef &&
        age >= 0 &&
        age <= 7 * 86400000,
      );
      for (const url of draft.imageUrls) {
        const review = await records.get<{
          url: string;
          sha256: string;
          noFaces: boolean;
          swedishText: boolean;
          authorizedPhotography: boolean;
          factualClaims: boolean;
        }>("asset-review", fingerprint(url));
        valid =
          valid &&
          Boolean(
            review?.noFaces &&
            review.swedishText &&
            review.authorizedPhotography &&
            review.factualClaims &&
            review.url === url &&
            /^[a-f0-9]{64}$/.test(review.sha256),
          );
      }
      row.document.state = valid ? "prepared" : "blocked";
      if (valid) approvedDrafts.push(row);
      else await records.put("social-draft", row.key, row.document);
    }
    let remaining = 10 - queue.data.length;
    let scheduled = 0;
    // Add a calendar day, not 24 hours: Sweden has 23/25-hour DST days.
    const tomorrow = new Date(`${stockholmDay(now)}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const nextDay = tomorrow.toISOString().slice(0, 10);
    for (const slot of TIKTOK_SLOTS) {
      if (remaining <= 0) break;
      const dueAt = stockholmSlot(nextDay, slot).toISOString();
      if (
        queue.data.some(
          (p) => p.dueAt && Date.parse(p.dueAt) === Date.parse(dueAt),
        )
      )
        continue;
      const row = approvedDrafts.find((d) => d.document.state === "prepared");
      if (!row) break;
      const draft = row.document;
      let bytesVerified = true;
      for (const url of draft.imageUrls) {
        const review = await records.get<{ url: string; sha256: string }>(
          "asset-review",
          fingerprint(url),
        );
        if (
          !review ||
          review.url !== url ||
          !(await (
            ctx.verifyAsset ??
            ((image, hash) => verifyAssetBytes(image, hash, { env }))
          )(url, review.sha256))
        ) {
          bytesVerified = false;
          break;
        }
      }
      if (!bytesVerified) {
        row.document.state = "blocked";
        await records.put("social-draft", row.key, row.document);
        continue;
      }
      const key = `tiktok:${nextDay}:${slot}`;
      const post = {
        actionKey: key,
        text: draft.text,
        title: draft.title,
        dueAt,
        imageUrls: draft.imageUrls,
        aiGenerated: draft.aiGenerated,
      };
      const result = await runEffect(
        records,
        key,
        "publish_social",
        post,
        async () => {
          const permission = await store.authorizeAction("publish_social");
          return permission.allowed
            ? adapter.schedulePhotoPost(post)
            : {
                status: "rejected",
                reason: "Publication permission changed before submission.",
              };
        },
        async () => {
          const r = await adapter.findScheduledPost(post);
          return r.status === "succeeded" && r.data
            ? { status: "succeeded", externalId: r.data.id, data: r.data }
            : { status: "unknown", reason: "Post not yet confirmed" };
        },
      );
      if (result.status === "unknown") {
        await records.put("social-lock", "unresolved", {
          key,
          post,
          draftKey: row.key,
        });
        await issue(
          "social-uncertain",
          "A Buffer submission needs reconciliation; further scheduling is held.",
          ctx,
        );
        break;
      }
      if (result.status === "succeeded") {
        row.document.state = "scheduled";
        await records.put("social-draft", row.key, {
          ...draft,
          state: "scheduled",
          externalId: result.externalId,
        });
        remaining--;
        scheduled++;
      } else {
        await issue(
          "social-rejected",
          result.reason ?? "Buffer rejected a post",
          ctx,
        );
        break;
      }
    }
    const held = drafts.filter(
      (row) => row.document.state === "blocked",
    ).length;
    return {
      status: held > 0 && scheduled === 0 ? "blocked" : "succeeded",
      scheduled,
      held,
    };
  });
  return locked.locked
    ? locked.result!
    : { status: "blocked", reason: "Another worker owns the social queue." };
}
async function handleJob(
  job: Job,
  ctx: Context,
  dispatch?: Dispatch,
): Promise<unknown> {
  const { records, env } = ctx;
  if (job.type === "reconcile")
    return reconcileShopify(
      ctx,
      typeof job.payload.orderId === "string" ? job.payload.orderId : undefined,
    );
  if (job.type === "social") return socialQueue(ctx);
  if (job.type === "catalog-release")
    return ctx.executeCatalog
      ? ctx.executeCatalog(String(job.payload.releaseId))
      : (await catalogReleaseService()).execute(String(job.payload.releaseId));
  if (job.type === "fulfillment") {
    const aw = createAwAdapter(awConfigFromEnv(env));
    await issue(
      `fulfillment:${String(job.payload.orderId)}`,
      "Paid order needs supplier reconciliation. AW order-write schema and budget-controlled fulfillment test are not yet verified.",
      ctx,
    );
    return {
      status: "blocked",
      orderId: job.payload.orderId,
      supplier: aw.readiness(),
    };
  }
  if (job.type === "department") {
    if (!dispatch)
      return {
        status: "blocked",
        reason: "Agent dispatcher is not configured.",
      };
    if (ctx.isDemo || (!env.AI_GATEWAY_API_KEY && !env.VERCEL))
      return {
        status: "blocked",
        reason:
          "No paid AI calls in demo; deployment model access is required.",
      };
    const prompt = `Run Noorly's ${String(job.payload.cadence)} review for ${String(job.payload.day)}. Read operations status. Delegate the eight departments only as needed, prioritize existing obligations. Persist concise evidence-linked proposals and content drafts. Missing integrations remain blocked. No sales are inferred from clicks. No VAT modelling. Never claim a tool completed a blocked action.`;
    return runEffect(
      records,
      `department:${job.dedupKey}`,
      "department_handoff",
      { prompt },
      async () => ({
        status: "succeeded",
        data: { status: "accepted", receipt: await dispatch(job, prompt) },
      }),
    );
  }
  throw new Error(`Unsupported job type: ${job.type}`);
}
export async function tick(
  dispatch?: Dispatch,
  now = new Date(),
  deps: RuntimeDependencies = {},
) {
  const ctx = await context({ ...deps, now });
  const { store, records, env } = ctx;
  const locked = await records.withLock("runtime:tick", async () => {
    const previousControl = await store.getControl();
    if (previousControl.mode === "paused") return { status: "paused" };
    const day = stockholmDay(now);
    const quarter = Math.floor(now.getTime() / 900000);
    const snapshot = await store.snapshot();
    let healthy = true;
    // Protect essential capacity within the fixed ceiling; this is not a payment.
    await store
      .reserveSpend({
        idempotencyKey: `essential:${snapshot.month}`,
        category: "software",
        amountOre: 30000,
        purpose: "Protected hosting and essential order-processing capacity",
      })
      .catch(async (error) => {
        healthy = false;
        await issue(
          "essential-capacity",
          error instanceof Error
            ? error.message
            : "Essential capacity unavailable",
          ctx,
        );
      });
    await store.enqueueJob({
      dedupKey: `reconcile:${quarter}`,
      type: "reconcile",
      payload: {},
    });
    await store.enqueueJob({
      dedupKey: `daily:${day}`,
      type: "department",
      payload: { day, cadence: "daily" },
      maxAttempts: 20,
    });
    await store.enqueueJob({
      dedupKey: `social:${day}`,
      type: "social",
      payload: { day },
      maxAttempts: 20,
    });
    if (
      new Intl.DateTimeFormat("en", {
        timeZone: "Europe/Stockholm",
        weekday: "short",
      }).format(now) === "Mon"
    )
      await store.enqueueJob({
        dedupKey: `weekly:${day}`,
        type: "department",
        payload: { day, cadence: "weekly" },
        maxAttempts: 20,
      });
    const results = [];
    for (let i = 0; i < 4; i++) {
      if ((await store.getControl()).mode === "paused")
        return { status: "paused", results };
      const job = await store.leaseJob(`worker:${randomUUID()}`, 900000);
      if (!job) break;
      try {
        const result = await handleJob(job, ctx, dispatch);
        const outcome =
          result && typeof result === "object" && "status" in result
            ? String(result.status)
            : "unknown";
        if (["blocked", "rejected", "unknown"].includes(outcome)) {
          if (outcome === "unknown") healthy = false;
          await store.failJob(
            job.id,
            job.leaseToken!,
            `Work ${outcome}; review dependencies and reconciliation.`,
            3600000,
          );
          if (outcome === "unknown")
            await issue(
              `job:${job.id}`,
              `A ${job.type} action has an uncertain outcome. Its submission will not be repeated without reconciliation.`,
              ctx,
            );
          if (job.attempts >= (job.maxAttempts ?? 5))
            await issue(
              `job:${job.id}`,
              `A ${job.type} job exhausted its attempts and needs review.`,
              ctx,
            );
        } else
          await store.completeJob(
            job.id,
            job.leaseToken!,
            redactOperationalData(result, env),
          );
        results.push({
          id: job.id,
          result: redactOperationalData(result, env),
        });
      } catch (error) {
        healthy = false;
        const message = safeText(
          error instanceof Error ? error.message : "Job failed",
          env,
        ).slice(0, 2000);
        await store.failJob(
          job.id,
          job.leaseToken!,
          message,
          Math.min(3600000, 30000 * 2 ** job.attempts),
        );
        await issue(`job:${job.id}`, message, ctx);
      }
    }
    if (healthy) {
      const control = await store.recordHeartbeat();
      await records.put("heartbeat", "latest", { at: control.lastHeartbeatAt });
      if (previousControl.mode === "live" && control.mode === "observe")
        await issue(
          "observation-reset",
          "Operations returned to observation after missed heartbeats. Live actions remain held until continuity is verified again.",
          ctx,
        );
      if (
        !ctx.isDemo &&
        control.mode === "observe" &&
        liveReadiness(await store.snapshot(), now).length === 0
      ) {
        await store.setMode("live", "verified_heartbeat_scheduler");
        await notifyOwner(
          records,
          {
            key: `mode-live:${control.observationStartedAt}`,
            subject: "Noorly observation completed",
            text: "The system completed 72 hours of continuous observed operation and passed its baseline checks. Live actions still require their individual product, channel, spending and supplier checks.",
          },
          { env, now, isDemo: ctx.isDemo, send: ctx.sendNotification },
        );
      }
    }
    return { status: "processed", healthy, results };
  });
  return locked.locked ? locked.result! : { status: "busy" };
}
