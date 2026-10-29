import { randomUUID } from "node:crypto";
import { gateway, wrapLanguageModel } from "ai";
import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4Usage,
  LanguageModelV4StreamPart,
} from "@ai-sdk/provider";
import { fxRate } from "./config.js";
import { getStore } from "./database.js";
import type { OpsStore, Reservation } from "./core/types.js";

// USD per million tokens, checked 2026-10-28 against the provider and Gateway catalog.
// https://developers.openai.com/api/docs/pricing
// https://ai-gateway.vercel.sh/v1/models
export const MODEL_RATES = Object.freeze({
  routine: {
    id: "openai/gpt-6-luna",
    input: 0.1,
    output: 0.5,
    cacheRead: 0.01,
    cacheWrite: 0.125,
    maxOutputTokens: 4096,
  },
  research: {
    id: "openai/gpt-6.1-sol",
    input: 2,
    output: 10,
    cacheRead: 0.1,
    cacheWrite: 2.5,
    maxOutputTokens: 8192,
  },
});
export type ModelRole = keyof typeof MODEL_RATES;
type CatalogEntry = {
  id: string;
  pricing?: {
    input: string;
    output: string;
    cachedInputTokens?: string;
    cacheCreationInputTokens?: string;
  } | null;
};
type Generation = {
  id: string;
  model: string;
  totalCost: number;
  promptTokens: number;
  completionTokens: number;
};
export interface MeteredModelOptions {
  model: LanguageModelV4;
  store: () => Promise<OpsStore>;
  env?: NodeJS.ProcessEnv;
  clock?: () => Date;
  catalog: () => Promise<{ models: CatalogEntry[] }>;
  generation: (id: string) => Promise<Generation>;
}
export class ModelMeteringError extends Error {
  readonly isRetryable = false;
  constructor(readonly code: string) {
    super(`AI request stopped: ${code}.`);
    this.name = "ModelMeteringError";
  }
}
const MAX_CONTEXT_BYTES = 48_000;
const MAX_MESSAGES = 64;
const MAX_TOOLS = 32;
const MAX_CATALOG_AGE_MS = 60 * 60 * 1000;
const USD_REQUEST_HEADROOM = 0.003;
const ore = (usd: number, fx: number) => Math.ceil(usd * fx * 100);
const finiteCount = (n: unknown): n is number =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0;

/** Provider options can contain stored prompt IDs, hidden context, tools, or paid tiers. */
function cleanPrompt(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cleanPrompt);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (
      [
        "file",
        "image",
        "image-url",
        "audio",
        "video",
        "custom",
        "reasoning-file",
      ].includes(String(object.type))
    )
      throw new ModelMeteringError("unsupported_media");
    if (value instanceof URL || value instanceof Uint8Array)
      throw new ModelMeteringError("unsupported_media");
    return Object.fromEntries(
      Object.entries(object)
        .filter(([key]) => key !== "providerOptions")
        .map(([key, child]) => [key, cleanPrompt(child)]),
    );
  }
  return value;
}
function boundedParams(
  role: ModelRole,
  params: LanguageModelV4CallOptions,
): LanguageModelV4CallOptions {
  const rate = MODEL_RATES[role];
  if (
    params.prompt.length > MAX_MESSAGES ||
    (params.tools?.length ?? 0) > MAX_TOOLS
  )
    throw new ModelMeteringError("context_limit");
  if (params.tools?.some((tool) => tool.type !== "function"))
    throw new ModelMeteringError("unmetered_provider_tool");
  const requestedOutput = params.maxOutputTokens ?? rate.maxOutputTokens;
  if (!finiteCount(requestedOutput) || requestedOutput < 1)
    throw new ModelMeteringError("invalid_output_limit");
  const prompt = cleanPrompt(
    params.prompt,
  ) as LanguageModelV4CallOptions["prompt"];
  const tools = cleanPrompt(
    params.tools,
  ) as LanguageModelV4CallOptions["tools"];
  const responseFormat = cleanPrompt(
    params.responseFormat,
  ) as LanguageModelV4CallOptions["responseFormat"];
  const bytes = Buffer.byteLength(
    JSON.stringify({ prompt, tools, responseFormat }),
    "utf8",
  );
  if (bytes > MAX_CONTEXT_BYTES) throw new ModelMeteringError("context_limit");
  return {
    ...params,
    prompt,
    tools,
    responseFormat,
    maxOutputTokens: Math.min(requestedOutput, rate.maxOutputTokens),
    reasoning: "low",
    // No provider tools, fallback models, cached remote prompts, or caller-selected billing tiers.
    providerOptions: {
      gateway: {
        only: ["openai"],
        models: [],
        disallowPromptTraining: true,
        tags: ["noorly-operations", role],
      },
      openai: { store: false, serviceTier: "default", reasoningEffort: "low" },
    },
  };
}
function inputBound(params: LanguageModelV4CallOptions): number {
  // UTF-8 bytes conservatively bound text tokens. Additional space covers message/tool framing.
  return (
    Buffer.byteLength(
      JSON.stringify({
        prompt: params.prompt,
        tools: params.tools,
        responseFormat: params.responseFormat,
      }),
      "utf8",
    ) +
    8192 +
    512 * (params.prompt.length + (params.tools?.length ?? 0))
  );
}
function generationId(metadata: unknown): string | undefined {
  const id = (metadata as { gateway?: { generationId?: unknown } } | undefined)
    ?.gateway?.generationId;
  return typeof id === "string" && id.length > 0 && id.length <= 250
    ? id
    : undefined;
}
type Charge = {
  store: OpsStore;
  reservation: Reservation;
  fx: number;
  inputLimit: number;
  outputLimit: number;
  generationId?: string;
  finished: boolean;
};

/** Trusted backend construction only. Models receive ordinary business tools, never this store. */
export function createMeteredModel(
  role: ModelRole,
  options: MeteredModelOptions,
): LanguageModelV4 {
  const rate = MODEL_RATES[role];
  const env = options.env ?? process.env;
  const clock = options.clock ?? (() => new Date());
  let catalogCheckedAt = -Infinity;
  let catalogPending: Promise<void> | undefined;
  async function checkPrices(now: Date): Promise<void> {
    if (
      now.getTime() >= catalogCheckedAt &&
      now.getTime() - catalogCheckedAt < MAX_CATALOG_AGE_MS
    )
      return;
    catalogPending ??= (async () => {
      const entry = (await options.catalog()).models.find(
        (model) => model.id === rate.id,
      );
      const prices = entry?.pricing;
      if (!prices) throw new ModelMeteringError("missing_current_prices");
      for (const [value, ceiling] of [
        [prices.input, rate.input],
        [prices.output, rate.output],
        [prices.cachedInputTokens, rate.cacheRead],
        [prices.cacheCreationInputTokens, rate.cacheWrite],
      ] as const) {
        if (value === undefined) continue;
        const current = Number(value) * 1_000_000;
        if (
          !Number.isFinite(current) ||
          current < 0 ||
          current > ceiling * 1.000001
        )
          throw new ModelMeteringError("price_ceiling_changed");
      }
      catalogCheckedAt = now.getTime();
    })().finally(() => {
      catalogPending = undefined;
    });
    await catalogPending;
  }
  async function begin(params: LanguageModelV4CallOptions): Promise<Charge> {
    if (env.OPS_DEMO === "true")
      throw new ModelMeteringError("demo_external_calls_disabled");
    if (!env.AI_GATEWAY_API_KEY && !env.VERCEL_OIDC_TOKEN)
      throw new ModelMeteringError("gateway_credentials_missing");
    const now = clock();
    const fx = fxRate(env, now);
    await checkPrices(now);
    const inputLimit = inputBound(params);
    const outputLimit = params.maxOutputTokens!;
    // Cover cache writes, rounding, and request charges without assuming free credits.
    const worstUsd =
      ((inputLimit * Math.max(rate.input * 2.5, rate.cacheWrite) +
        outputLimit * rate.output) /
        1_000_000 +
        USD_REQUEST_HEADROOM) *
      1.25;
    const store = await options.store();
    const requestId = randomUUID();
    const reservation = await store.reserveSpend({
      idempotencyKey: `model:${requestId}`,
      category: "software",
      amountOre: Math.max(1, ore(worstUsd, fx)),
      purpose: `AI ${role} ${rate.id}`,
      funding: env.OPS_AI_FUNDING === "prepaid" ? "prepaid" : "cash",
      ...(env.OPS_AI_FUNDING === "prepaid"
        ? { prepaidAccount: "vercel-ai-gateway" }
        : {}),
    });
    await store.appendAudit(
      "model.reserved",
      {
        reservationId: reservation.id,
        requestId,
        model: rate.id,
        role,
        fx,
        inputLimit,
        outputLimit,
      },
      "model-meter",
    );
    return { store, reservation, fx, inputLimit, outputLimit, finished: false };
  }
  async function capture(charge: Charge, metadata: unknown): Promise<void> {
    const id = generationId(metadata);
    if (!id || id === charge.generationId) return;
    if (charge.generationId)
      throw new ModelMeteringError("generation_identity_changed");
    charge.generationId = id;
    await charge.store.appendAudit(
      "model.generation",
      { reservationId: charge.reservation.id, generationId: id },
      "model-meter",
    );
  }
  async function hold(charge: Charge, reason: string): Promise<void> {
    if (charge.finished) return;
    await charge.store.appendAudit(
      "model.charge_uncertain",
      {
        reservationId: charge.reservation.id,
        generationId: charge.generationId ?? null,
        reason,
      },
      "model-meter",
    );
  }
  async function finish(
    charge: Charge,
    usage: LanguageModelV4Usage,
  ): Promise<void> {
    if (
      !finiteCount(usage.inputTokens.total) ||
      !finiteCount(usage.outputTokens.total)
    )
      throw new ModelMeteringError("usage_unverified");
    if (
      usage.inputTokens.total > charge.inputLimit ||
      usage.outputTokens.total > charge.outputLimit
    ) {
      await charge.store.setMode("paused", "model-meter");
      throw new ModelMeteringError("token_bound_exceeded");
    }
    // A provider billing receipt is required; token estimates alone cannot prove the charge.
    if (!charge.generationId)
      throw new ModelMeteringError("billing_receipt_missing");
    const bill = await options.generation(charge.generationId);
    if (
      bill.id !== charge.generationId ||
      bill.model !== rate.id ||
      !Number.isFinite(bill.totalCost) ||
      bill.totalCost < 0 ||
      !finiteCount(bill.promptTokens) ||
      !finiteCount(bill.completionTokens) ||
      bill.promptTokens !== usage.inputTokens.total ||
      bill.completionTokens !== usage.outputTokens.total
    )
      throw new ModelMeteringError("billing_receipt_unverified");
    const actualOre = ore(bill.totalCost, charge.fx);
    if (actualOre > charge.reservation.amountOre) {
      await charge.store.setMode("paused", "model-meter");
      throw new ModelMeteringError("cost_bound_exceeded");
    }
    await charge.store.settleSpend(charge.reservation.id, {
      actualOre,
      receiptId: `gateway:${bill.id}`,
    });
    charge.finished = true;
    await charge.store.appendAudit(
      "model.settled",
      {
        reservationId: charge.reservation.id,
        generationId: bill.id,
        model: rate.id,
        inputTokens: bill.promptTokens,
        outputTokens: bill.completionTokens,
        usd: bill.totalCost,
        actualOre,
        fx: charge.fx,
      },
      "model-meter",
    );
  }
  return wrapLanguageModel({
    model: options.model,
    middleware: {
      specificationVersion: "v4",
      transformParams: async ({ params }) => boundedParams(role, params),
      wrapGenerate: async ({ doGenerate, params }) => {
        const charge = await begin(params);
        try {
          const result = await doGenerate();
          await capture(charge, result.providerMetadata);
          await finish(charge, result.usage);
          return result;
        } catch (error) {
          await hold(
            charge,
            error instanceof ModelMeteringError
              ? error.code
              : "provider_or_billing_failure",
          );
          throw error instanceof ModelMeteringError
            ? error
            : new ModelMeteringError("provider_or_billing_failure");
        }
      },
      wrapStream: async ({ doStream, params }) => {
        const charge = await begin(params);
        try {
          const result = await doStream();
          const reader = result.stream.getReader();
          return {
            ...result,
            stream: new ReadableStream<LanguageModelV4StreamPart>({
              async pull(controller) {
                try {
                  const next = await reader.read();
                  if (next.done) {
                    if (!charge.finished)
                      throw new ModelMeteringError(
                        "stream_ended_without_receipt",
                      );
                    controller.close();
                    return;
                  }
                  const part = next.value;
                  if ("providerMetadata" in part)
                    await capture(charge, part.providerMetadata);
                  if (part.type === "error")
                    throw new ModelMeteringError("provider_stream_failure");
                  if (part.type === "finish") await finish(charge, part.usage);
                  controller.enqueue(part);
                } catch (error) {
                  await hold(
                    charge,
                    error instanceof ModelMeteringError
                      ? error.code
                      : "provider_or_billing_failure",
                  );
                  await reader.cancel().catch(() => undefined);
                  controller.error(
                    error instanceof ModelMeteringError
                      ? error
                      : new ModelMeteringError("provider_or_billing_failure"),
                  );
                }
              },
              async cancel(reason) {
                await reader.cancel(reason);
                await hold(charge, "stream_cancelled");
              },
            }),
          };
        } catch (error) {
          await hold(charge, "provider_stream_start_failure");
          throw error instanceof ModelMeteringError
            ? error
            : new ModelMeteringError("provider_stream_start_failure");
        }
      },
    },
  });
}

const models = new Map<ModelRole, LanguageModelV4>();
export function meteredModel(role: ModelRole): LanguageModelV4 {
  let model = models.get(role);
  if (!model) {
    model = createMeteredModel(role, {
      model: gateway(MODEL_RATES[role].id),
      store: getStore,
      catalog: () => gateway.getAvailableModels(),
      generation: (id) => gateway.getGenerationInfo({ id }),
    });
    models.set(role, model);
  }
  return model;
}
