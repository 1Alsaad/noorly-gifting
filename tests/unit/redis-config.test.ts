import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseEnv } from "@/lib/env/schema";
import { hasDurableStore, redisCommand } from "@/lib/security/redis";
import { rateLimit } from "@/lib/security/request";

const config = vi.hoisted(() => ({ values: {} as Record<string, unknown> }));
vi.mock("@/lib/env/server", () => ({
  getEnv: () => parseEnv(config.values),
}));

const native = {
  KV_REST_API_URL: "https://native-store.example.test",
  KV_REST_API_TOKEN: "native-test-token",
};
const explicit = {
  RATE_LIMIT_PROVIDER_URL: "https://explicit-store.example.test",
  RATE_LIMIT_PROVIDER_TOKEN: "explicit-test-token",
};
const fetcher = vi.fn();

beforeEach(() => {
  config.values = {
    NODE_ENV: "production",
    ALLOW_MOCK_COMMERCE: true,
    CART_COOKIE_SECRET: "local-test-cookie-secret-32-characters",
  };
  fetcher.mockReset().mockResolvedValue(Response.json({ result: "PONG" }));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => vi.unstubAllGlobals());

describe("durable-store configuration pairing", () => {
  it("uses the native Vercel REST pair in the actual Redis request", async () => {
    Object.assign(config.values, native);
    expect(hasDurableStore()).toBe(true);
    await expect(redisCommand(["PING"])).resolves.toBe("PONG");
    expect(fetcher).toHaveBeenCalledWith(
      native.KV_REST_API_URL,
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: `Bearer ${native.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: '["PING"]',
      }),
    );
  });

  it("keeps a complete explicit pair ahead of the native pair", async () => {
    Object.assign(config.values, native, explicit);
    await redisCommand(["PING"]);
    expect(fetcher).toHaveBeenCalledWith(
      explicit.RATE_LIMIT_PROVIDER_URL,
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${explicit.RATE_LIMIT_PROVIDER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("accepts blank template values as absent explicit configuration", () => {
    Object.assign(config.values, native, {
      RATE_LIMIT_PROVIDER_URL: "",
      RATE_LIMIT_PROVIDER_TOKEN: "",
    });
    expect(parseEnv(config.values).RATE_LIMIT_PROVIDER_URL).toBe(
      native.KV_REST_API_URL,
    );
    expect(parseEnv(config.values).RATE_LIMIT_PROVIDER_TOKEN).toBe(
      native.KV_REST_API_TOKEN,
    );
  });

  it.each([
    {
      RATE_LIMIT_PROVIDER_URL: explicit.RATE_LIMIT_PROVIDER_URL,
      KV_REST_API_TOKEN: native.KV_REST_API_TOKEN,
    },
    {
      RATE_LIMIT_PROVIDER_TOKEN: explicit.RATE_LIMIT_PROVIDER_TOKEN,
      KV_REST_API_URL: native.KV_REST_API_URL,
    },
    { ...native, RATE_LIMIT_PROVIDER_URL: explicit.RATE_LIMIT_PROVIDER_URL },
    {
      ...native,
      RATE_LIMIT_PROVIDER_TOKEN: explicit.RATE_LIMIT_PROVIDER_TOKEN,
    },
    { KV_REST_API_URL: native.KV_REST_API_URL },
    { KV_REST_API_TOKEN: native.KV_REST_API_TOKEN },
  ])(
    "rejects incomplete or crossed pairs before any request: %j",
    async (values) => {
      Object.assign(config.values, values);
      await expect(redisCommand(["PING"])).rejects.toThrow(
        "Invalid configuration",
      );
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("validates HTTPS on the selected native endpoint without revealing values", async () => {
    Object.assign(config.values, native, {
      KV_REST_API_URL: "http://private-endpoint.example.test",
    });
    await expect(redisCommand(["PING"])).rejects.toThrow(
      "RATE_LIMIT_PROVIDER_URL",
    );
    try {
      parseEnv(config.values);
    } catch (error) {
      expect(String(error)).not.toContain("private-endpoint");
      expect(String(error)).not.toContain(native.KV_REST_API_TOKEN);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("does not use Redis connection strings or a read-only token", async () => {
    Object.assign(config.values, {
      KV_URL: "redis://unused.example.test",
      REDIS_URL: "redis://unused.example.test",
      KV_REST_API_READ_ONLY_TOKEN: "read-only-test-token",
    });
    expect(hasDurableStore()).toBe(false);
    await expect(
      rateLimit(new Request("https://noorly.example.test"), "test"),
    ).rejects.toMatchObject({ status: 503, code: "TEMPORARILY_UNAVAILABLE" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fails closed instead of using memory when the native provider fails", async () => {
    Object.assign(config.values, native);
    fetcher.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(
      rateLimit(new Request("https://noorly.example.test"), "test"),
    ).rejects.toMatchObject({ status: 503, code: "TEMPORARILY_UNAVAILABLE" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
