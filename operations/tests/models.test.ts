import test from "node:test";
import assert from "node:assert/strict";
import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamPart,
} from "@ai-sdk/provider";
import {
  createMeteredModel,
  MODEL_RATES,
  type ModelRole,
} from "../src/models.js";
import { MemoryOpsStore } from "../src/core/memory.js";

const now = new Date("2026-10-28T10:00:00Z");
const params: LanguageModelV4CallOptions = {
  prompt: [
    {
      role: "user",
      content: [{ type: "text", text: "Summarize these verified facts." }],
    },
  ],
};
const usage = {
  inputTokens: { total: 100, noCache: 100, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 50, text: 30, reasoning: 20 },
};
const result = (id = "gen-1"): LanguageModelV4GenerateResult => ({
  content: [{ type: "text", text: "Done" }],
  finishReason: { unified: "stop", raw: "stop" },
  usage,
  warnings: [],
  providerMetadata: { gateway: { generationId: id } },
});
function fixture(
  options: {
    role?: ModelRole;
    env?: NodeJS.ProcessEnv;
    generate?: LanguageModelV4["doGenerate"];
    stream?: LanguageModelV4["doStream"];
    cost?: number;
    priceMultiplier?: number;
  } = {},
) {
  const store = new MemoryOpsStore({ clock: () => now });
  const role = options.role ?? "routine";
  const rate = MODEL_RATES[role];
  let calls = 0;
  const seen: LanguageModelV4CallOptions[] = [];
  const model: LanguageModelV4 = {
    specificationVersion: "v4",
    provider: "test",
    modelId: rate.id,
    supportedUrls: {},
    doGenerate: async (p) => {
      calls++;
      seen.push(p);
      return options.generate ? options.generate(p) : result(`gen-${calls}`);
    },
    doStream: async (p) => {
      calls++;
      seen.push(p);
      return options.stream
        ? options.stream(p)
        : {
            stream: new ReadableStream({
              start(c) {
                c.enqueue({
                  type: "finish",
                  finishReason: { unified: "stop", raw: "stop" },
                  usage,
                  providerMetadata: {
                    gateway: { generationId: `gen-${calls}` },
                  },
                });
                c.close();
              },
            }),
          };
    },
  };
  const wrapped = createMeteredModel(role, {
    model,
    store: async () => store,
    clock: () => now,
    env: options.env ?? {
      AI_GATEWAY_API_KEY: "test-only-not-a-key",
      OPS_USD_SEK: "10",
      OPS_FX_VERIFIED_AT: now.toISOString(),
    },
    catalog: async () => ({
      models: [
        {
          id: rate.id,
          pricing: {
            input: String((rate.input / 1e6) * (options.priceMultiplier ?? 1)),
            output: String(rate.output / 1e6),
          },
        },
      ],
    }),
    generation: async (id) => ({
      id,
      model: rate.id,
      totalCost: options.cost ?? 0.0012,
      promptTokens: 100,
      completionTokens: 50,
    }),
  });
  return {
    model: {
      ...wrapped,
      doGenerate: async (p: LanguageModelV4CallOptions) =>
        await wrapped.doGenerate(p),
    },
    store,
    seen,
    calls: () => calls,
  };
}
async function drain(stream: ReadableStream<LanguageModelV4StreamPart>) {
  const reader = stream.getReader();
  while (!(await reader.read()).done) {}
}

test("AI reserves before the provider call and settles a verified receipt including reasoning usage", async () => {
  let stateAtCall: string | undefined;
  const f = fixture({
    generate: async () => {
      stateAtCall = Object.values((await f.store.snapshot()).reservations)[0]
        ?.status;
      return result();
    },
  });
  await f.model.doGenerate(params);
  assert.equal(stateAtCall, "reserved");
  const reservation = Object.values((await f.store.snapshot()).reservations)[0];
  assert.equal(reservation.status, "settled");
  assert.equal(reservation.actualOre, 2);
  assert.ok(reservation.amountOre > reservation.actualOre!);
});
test("missing credentials or stale/missing FX cannot reach provider or reserve money", async () => {
  for (const env of [
    {},
    { AI_GATEWAY_API_KEY: "fake" },
    {
      AI_GATEWAY_API_KEY: "fake",
      OPS_USD_SEK: "10",
      OPS_FX_VERIFIED_AT: "2026-08-01",
    },
  ]) {
    const f = fixture({ env });
    await assert.rejects(f.model.doGenerate(params));
    assert.equal(f.calls(), 0);
    assert.equal(
      Object.keys((await f.store.snapshot()).reservations).length,
      0,
    );
  }
});
test("output caps and billing route cannot be overridden by a caller", async () => {
  const f = fixture();
  await f.model.doGenerate({
    ...params,
    maxOutputTokens: 100_000,
    providerOptions: {
      gateway: { models: ["expensive/model"] },
      openai: { serviceTier: "priority", previousResponseId: "remote-history" },
    },
  });
  assert.equal(f.seen[0].maxOutputTokens, 4096);
  assert.deepEqual(f.seen[0].providerOptions?.gateway?.only, ["openai"]);
  assert.equal(f.seen[0].providerOptions?.openai?.serviceTier, "default");
  assert.equal(
    f.seen[0].providerOptions?.openai?.previousResponseId,
    undefined,
  );
});
test("demo mode never makes paid model calls even if credentials are present", async () => {
  const f = fixture({
    env: {
      OPS_DEMO: "true",
      AI_GATEWAY_API_KEY: "fake",
      OPS_USD_SEK: "10",
      OPS_FX_VERIFIED_AT: now.toISOString(),
    },
  });
  await assert.rejects(
    f.model.doGenerate(params),
    /demo_external_calls_disabled/,
  );
  assert.equal(f.calls(), 0);
});
test("oversized context and unpriced media/provider tools fail before paid calls", async () => {
  const f = fixture();
  await assert.rejects(
    f.model.doGenerate({
      prompt: [
        { role: "user", content: [{ type: "text", text: "x".repeat(50_000) }] },
      ],
    }),
    /context_limit/,
  );
  await assert.rejects(
    f.model.doGenerate({
      prompt: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: {
                type: "url",
                url: new URL("https://example.com/photo.png"),
              },
              mediaType: "image/png",
            },
          ],
        },
      ],
    }),
    /unsupported_media/,
  );
  await assert.rejects(
    f.model.doGenerate({
      ...params,
      tools: [
        {
          type: "provider",
          id: "openai.web_search",
          name: "web_search",
          args: {},
        },
      ],
    }),
    /unmetered_provider_tool/,
  );
  assert.equal(f.calls(), 0);
});
test("higher live prices stop calls instead of silently raising an approved ceiling", async () => {
  const f = fixture({ priceMultiplier: 2 });
  await assert.rejects(f.model.doGenerate(params), /price_ceiling_changed/);
  assert.equal(f.calls(), 0);
});
test("concurrent AI calls cannot overrun the remaining software budget", async () => {
  const f = fixture({ role: "research" });
  await f.store.reserveSpend({
    idempotencyKey: "essential-existing",
    category: "software",
    amountOre: 99_700,
    purpose: "Existing obligations",
  });
  const outcomes = await Promise.allSettled(
    Array.from({ length: 15 }, () => f.model.doGenerate(params)),
  );
  assert.ok(outcomes.some((outcome) => outcome.status === "rejected"));
  assert.ok(f.calls() < 15);
  assert.ok((await f.store.snapshot()).budgets.software.usedOre <= 100_000);
});
test("uncertain provider outcomes retain reserved cash and are non-retryable", async () => {
  const f = fixture({
    generate: async () => {
      throw new Error("Connection lost after request submission");
    },
  });
  await assert.rejects(
    f.model.doGenerate(params),
    (error) =>
      error instanceof Error &&
      "isRetryable" in error &&
      error.isRetryable === false,
  );
  const reservations = Object.values((await f.store.snapshot()).reservations);
  assert.equal(reservations[0].status, "reserved");
  assert.ok(
    (await f.store.readAudit()).some(
      (event) => event.event === "model.charge_uncertain",
    ),
  );
});
test("an unverified billing receipt holds the reservation", async () => {
  const f = fixture({
    generate: async () => ({ ...result(), providerMetadata: undefined }),
  });
  await assert.rejects(f.model.doGenerate(params), /billing_receipt_missing/);
  assert.equal(
    Object.values((await f.store.snapshot()).reservations)[0].status,
    "reserved",
  );
});
test("a confirmed cost beyond reservation pauses operations and retains the reservation", async () => {
  const f = fixture({ cost: 100 });
  await assert.rejects(f.model.doGenerate(params), /cost_bound_exceeded/);
  assert.equal((await f.store.getControl()).mode, "paused");
  assert.equal(
    Object.values((await f.store.snapshot()).reservations)[0].status,
    "reserved",
  );
});
test("stream settles only on a complete finish receipt", async () => {
  const f = fixture();
  const response = await f.model.doStream(params);
  await drain(response.stream);
  assert.equal(
    Object.values((await f.store.snapshot()).reservations)[0].status,
    "settled",
  );
});
test("truncated, failed, and cancelled streams hold reservations", async () => {
  for (const part of [
    undefined,
    { type: "error", error: "network" } as LanguageModelV4StreamPart,
  ]) {
    const f = fixture({
      stream: async () => ({
        stream: new ReadableStream({
          start(c) {
            if (part) c.enqueue(part);
            c.close();
          },
        }),
      }),
    });
    await assert.rejects(drain((await f.model.doStream(params)).stream));
    assert.equal(
      Object.values((await f.store.snapshot()).reservations)[0].status,
      "reserved",
    );
  }
  const f = fixture({ stream: async () => ({ stream: new ReadableStream() }) });
  await (await f.model.doStream(params)).stream.cancel();
  assert.equal(
    Object.values((await f.store.snapshot()).reservations)[0].status,
    "reserved",
  );
});
