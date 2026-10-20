import test from "node:test";
import assert from "node:assert/strict";
import {
  approvedBriefs,
  localDate,
  planPost,
  publishRecord,
  runDaily,
  validateDraft,
} from "./agent.mjs";
import {
  gatewayAgent,
  metaPublisher,
  redisStore,
  verifyImage,
} from "./adapters.mjs";

const brief = {
  id: "thoughtful-gifting",
  approved: true,
  topic: "En personlig hälsning",
  facts: ["Varumärket heter NOORLY."],
  imageUrl: "https://noorly.test/social/gift.jpg",
  imageDescription: "Ett paket med ett kort på ett bord.",
  linkPath: "/sv/shop",
};
const config = {
  brand: "NOORLY",
  locale: "sv-SE",
  timezone: "Europe/Stockholm",
  siteOrigin: "https://noorly.test",
  briefs: [brief],
};
const draft = {
  briefId: brief.id,
  instagram:
    "En liten hälsning till någon du tänker på. Vem finns i dina tankar idag?",
  facebook:
    "Några personliga ord kan vara början på en fin hälsning. Vad skulle du skriva?",
};
const plan = { brief, draft, hash: "fixture-hash" };
function newRecord() {
  return structuredClone({
    date: "2026-10-20",
    ...plan,
    channels: {
      instagram: { status: "pending" },
      facebook: { status: "pending" },
    },
  });
}
function memoryStore() {
  let record = null;
  let locked = false;
  let history = [];
  return {
    async acquire() {
      if (locked) return false;
      locked = true;
      return true;
    },
    async release() {
      locked = false;
    },
    async load() {
      return structuredClone(record);
    },
    async save(value) {
      record = structuredClone(value);
    },
    async history() {
      return structuredClone(history);
    },
    async remember(value) {
      history = [{ date: value.date, ...value.draft }];
    },
  };
}
function fakePublisher() {
  const calls = [];
  return {
    calls,
    async createContainer() {
      calls.push("container");
      return "container-1";
    },
    async waitForContainer() {},
    async publish(channel) {
      calls.push(channel);
      return { id: `${channel}-1` };
    },
  };
}

test("Stockholm date follows local midnight and summer/winter time", () => {
  assert.equal(
    localDate(new Date("2026-07-01T22:30:00Z"), config.timezone),
    "2026-07-02",
  );
  assert.equal(
    localDate(new Date("2026-12-01T22:30:00Z"), config.timezone),
    "2026-12-01",
  );
  assert.equal(
    localDate(new Date("2026-12-01T23:30:00Z"), config.timezone),
    "2026-12-02",
  );
});

test("unapproved content and off-site URLs cannot enter the publish plan", () => {
  assert.throws(
    () =>
      approvedBriefs({ ...config, briefs: [{ ...brief, approved: false }] }),
    /NO_APPROVED/,
  );
  assert.throws(
    () =>
      approvedBriefs({
        ...config,
        briefs: [{ ...brief, imageUrl: "https://other.test/a.jpg" }],
      }),
    /BRIEF_INVALID/,
  );
  assert.throws(
    () =>
      approvedBriefs({
        ...config,
        briefs: [{ ...brief, linkPath: "//other.test" }],
      }),
    /BRIEF_INVALID/,
  );
});

test("invalid claims, duplicate copy and model-selected URLs fail validation", () => {
  assert.throws(
    () =>
      validateDraft(
        { ...draft, instagram: "Handla idag för 99 kr hos Noorly." },
        [brief],
      ),
    /CAPTION_INVALID/,
  );
  assert.throws(
    () =>
      validateDraft(
        { ...draft, facebook: "Besök https://other.test för mer information." },
        [brief],
      ),
    /CAPTION_INVALID/,
  );
  assert.throws(() => validateDraft(draft, [brief], [draft]), /DUPLICATE/);
  assert.throws(
    () => validateDraft({ ...draft, briefId: "invented" }, [brief]),
    /BRIEF_INVALID/,
  );
});

test("critic feedback leads to a revision and approval", async () => {
  const feedback = [];
  let reviews = 0;
  const result = await planPost({
    config,
    history: [],
    generate: async (input) => {
      feedback.push(input.feedback);
      return draft;
    },
    review: async () =>
      ++reviews === 1
        ? { approved: false, issues: ["Use a warmer tone."] }
        : { approved: true, issues: [] },
  });
  assert.equal(result.brief.id, brief.id);
  assert.deepEqual(feedback[1], ["Use a warmer tone."]);
});

test("rejected content stops after three bounded attempts", async () => {
  let attempts = 0;
  await assert.rejects(
    planPost({
      config,
      history: [],
      generate: async () => {
        attempts++;
        return draft;
      },
      review: async () => ({ approved: false, issues: ["Unverified claim."] }),
    }),
    /CONTENT_REVIEW_FAILED/,
  );
  assert.equal(attempts, 3);
});

test("a rerun reuses the daily journal and never republishes completed channels", async () => {
  const store = memoryStore();
  const publisher = fakePublisher();
  let plans = 0;
  const args = {
    config,
    date: "2026-10-20",
    store,
    publisher,
    beforePublish: async () => {},
    planner: async () => {
      plans++;
      return plan;
    },
  };
  await runDaily(args);
  await runDaily(args);
  assert.equal(plans, 1);
  assert.deepEqual(publisher.calls, ["container", "instagram", "facebook"]);
  assert.equal((await store.history()).length, 1);
});

test("lost publish response holds that channel and still completes the other", async () => {
  const record = newRecord();
  const publisher = fakePublisher();
  publisher.publish = async (channel) => {
    publisher.calls.push(channel);
    if (channel === "instagram")
      throw new Error("Connection lost after acceptance");
    return { id: "fb-1" };
  };
  const snapshots = [];
  const args = {
    record,
    publisher,
    beforePublish: async () => {},
    save: async (value) => snapshots.push(structuredClone(value)),
  };
  await assert.rejects(
    publishRecord(args),
    /instagram:RECONCILIATION_REQUIRED/,
  );
  assert.equal(record.channels.instagram.status, "unknown");
  assert.equal(record.channels.facebook.status, "published");
  assert.ok(
    snapshots.some((value) => value.channels.instagram.status === "publishing"),
  );
  await assert.rejects(publishRecord(args), /RECONCILIATION_REQUIRED/);
  assert.deepEqual(publisher.calls, ["container", "instagram", "facebook"]);
});

test("a crash between intent and result cannot cause a duplicate public mutation", async () => {
  const record = newRecord();
  record.channels.instagram = { status: "publishing", containerId: "existing" };
  record.channels.facebook = { status: "published", id: "fb-existing" };
  const publisher = fakePublisher();
  await assert.rejects(
    publishRecord({
      record,
      publisher,
      save: async () => {},
      beforePublish: async () => {},
    }),
    /RECONCILIATION_REQUIRED/,
  );
  assert.deepEqual(publisher.calls, []);
});

test("failed intent persistence prevents the outbound publish call", async () => {
  const publisher = fakePublisher();
  const record = newRecord();
  record.channels.instagram.containerId = "existing";
  await assert.rejects(
    publishRecord({
      record,
      publisher,
      beforePublish: async () => {},
      save: async () => {
        throw new Error("Redis unavailable");
      },
    }),
    /PREPARATION_FAILED/,
  );
  assert.deepEqual(publisher.calls, []);
});

test("preparation failure resumes only the missing channel with the saved plan", async () => {
  const store = memoryStore();
  const publisher = fakePublisher();
  let ready = false;
  publisher.waitForContainer = async () => {
    if (!ready) throw new Error("Not ready");
  };
  const args = {
    config,
    date: "2026-10-20",
    store,
    publisher,
    planner: async () => plan,
    beforePublish: async () => {},
  };
  await assert.rejects(runDaily(args), /PREPARATION_FAILED/);
  ready = true;
  await runDaily(args);
  assert.deepEqual(publisher.calls, ["container", "facebook", "instagram"]);
});

test("content approval removal blocks a saved retry and releases the lease", async () => {
  const store = memoryStore();
  await store.save(newRecord());
  await assert.rejects(
    runDaily({
      config: { ...config, briefs: [{ ...brief, approved: false }] },
      date: "2026-10-20",
      store,
      publisher: fakePublisher(),
      planner: async () => plan,
      beforePublish: async () => {},
    }),
    /NO_APPROVED/,
  );
  assert.equal(await store.acquire(), true);
});

test("a concurrent run cannot plan or publish", async () => {
  const store = memoryStore();
  await store.acquire();
  await assert.rejects(
    runDaily({
      config,
      date: "2026-10-20",
      store,
      publisher: fakePublisher(),
      planner: async () => {
        throw new Error("Must not be called");
      },
      beforePublish: async () => {},
    }),
    /ALREADY_LOCKED/,
  );
});

test("JPEG validation rejects disguised formats and invalid aspect ratios", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("webp", { headers: { "content-type": "image/webp" } }),
  );
  await assert.rejects(verifyImage(brief.imageUrl), /JPEG/);
  const jpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xc0, 0, 11, 8, 4, 56, 4, 56, 3, 1, 1, 1,
  ]);
  globalThis.fetch = async () =>
    new Response(jpeg, { headers: { "content-type": "image/jpeg" } });
  await verifyImage(brief.imageUrl);
  jpeg.writeUInt16BE(100, 7);
  await assert.rejects(verifyImage(brief.imageUrl), /DIMENSIONS_INVALID/);
});

test("Meta account mismatch is caught before publishing", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ id: "1", instagram_business_account: { id: "wrong" } }),
  );
  const publisher = metaPublisher(
    {
      META_GRAPH_VERSION: "v26.0",
      META_PAGE_ID: "1",
      META_INSTAGRAM_ACCOUNT_ID: "2",
      META_PAGE_ACCESS_TOKEN: "test",
    },
    config,
  );
  await assert.rejects(publisher.preflight(), /MISMATCH/);
});

test("AI adapter requires complete structured output and never embeds keys in URLs", async (t) => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(String(url).includes("secret-key"), false);
    sent = JSON.parse(options.body);
    return Response.json({
      choices: [
        { finish_reason: "stop", message: { content: JSON.stringify(draft) } },
      ],
    });
  });
  const agent = gatewayAgent({
    AI_GATEWAY_API_KEY: "secret-key",
    AI_GATEWAY_MODEL: "test/model",
  });
  assert.deepEqual(await agent.generate({ briefs: [brief] }), draft);
  assert.equal(sent.response_format.json_schema.strict, true);
  assert.equal(
    sent.response_format.json_schema.schema.additionalProperties,
    false,
  );
});

test("durable store uses a lease check for every record write", async (t) => {
  const commands = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const command = JSON.parse(options.body);
    commands.push(command);
    return Response.json({ result: command[0] === "SET" ? "OK" : 0 });
  });
  const store = redisStore(
    {
      RATE_LIMIT_PROVIDER_URL: "https://redis.test",
      RATE_LIMIT_PROVIDER_TOKEN: "test",
    },
    "noorly:social:1:2",
  );
  await store.acquire();
  await assert.rejects(store.save(newRecord()), /LEASE_LOST/);
  assert.match(commands[1][1], /GET.*SET/);
  assert.equal(commands[0].at(-1), 1200);
});
