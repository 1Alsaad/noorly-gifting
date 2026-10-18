import { beforeEach, describe, expect, it, vi } from "vitest";
const environment = vi.hoisted(() => ({
  NODE_ENV: "test",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_COMMERCE_PROVIDER: "mock",
  FORM_DELIVERY_URL: undefined as string | undefined,
  FORM_DELIVERY_TOKEN: undefined as string | undefined,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({ getEnv: () => environment }));
vi.mock("@/lib/security/redis", () => ({
  hasDurableStore: () => false,
  redisCommand: vi.fn(),
}));
import { POST } from "../../src/app/api/forms/route";
import { readJson } from "../../src/lib/security/request";

function request(payload: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/forms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "x-forwarded-for": crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });
}
const form = () => ({
  kind: "newsletter",
  email: "reader@example.com",
  consent: true,
  website: "",
  submissionId: crypto.randomUUID(),
});

describe("private, duplicate-safe form processing", () => {
  beforeEach(() => {
    environment.NODE_ENV = "test";
    environment.FORM_DELIVERY_URL = undefined;
    environment.FORM_DELIVERY_TOKEN = undefined;
    vi.restoreAllMocks();
  });
  it("clearly reports development mock acceptance and detects repeat tokens", async () => {
    const data = form();
    expect(await (await POST(request(data))).json()).toMatchObject({
      ok: true,
      mock: true,
    });
    expect(await (await POST(request(data))).json()).toMatchObject({
      ok: true,
      mock: true,
      duplicate: true,
    });
  });
  it("rejects cross-site submissions, honeypots and absent explicit consent", async () => {
    expect(
      (await POST(request(form(), "https://attacker.example"))).status,
    ).toBe(403);
    expect((await POST(request({ ...form(), website: "spam" }))).status).toBe(
      400,
    );
    expect((await POST(request({ ...form(), consent: false }))).status).toBe(
      400,
    );
  });
  it("does not claim successful delivery when the configured receiver fails; retry can succeed", async () => {
    environment.FORM_DELIVERY_URL = "https://forms.example.test/receive";
    environment.FORM_DELIVERY_TOKEN = "private-token";
    const data = form();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    expect((await POST(request(data))).status).toBe(503);
    expect(await (await POST(request(data))).json()).toMatchObject({
      ok: true,
      mock: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      "Idempotency-Key": expect.any(String),
    });
  });
  it("enforces body size based on consumed bytes even without content-length", async () => {
    await expect(
      readJson(request({ message: "a".repeat(5000) }), 100),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("fails closed for production without a durable rate limit provider", async () => {
    environment.NODE_ENV = "production";
    expect((await POST(request(form()))).status).toBe(503);
  });
});
