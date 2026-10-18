import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env/server";
import { hasDurableStore, redisCommand } from "./redis";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(getEnv().NEXT_PUBLIC_SITE_URL).origin;
  const requestOrigin = new URL(request.url).origin;
  const allowed =
    getEnv().NODE_ENV === "production" ? [expected] : [expected, requestOrigin];
  if (
    !origin ||
    !allowed.includes(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "INVALID_ORIGIN");
}

export async function readBody(
  request: Request,
  maxBytes = 16_384,
): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
    throw new HttpError(413, "REQUEST_TOO_LARGE");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, "REQUEST_TOO_LARGE");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return body;
}

export async function readJson(
  request: Request,
  maxBytes = 16_384,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON_REQUIRED");
  try {
    return JSON.parse(
      new TextDecoder().decode(await readBody(request, maxBytes)),
    );
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "INVALID_JSON");
  }
}

const counters = new Map<string, { count: number; expires: number }>();
export async function rateLimit(
  request: Request,
  scope: string,
  limit = 30,
  windowSeconds = 60,
) {
  // Hosting proxy MUST overwrite x-forwarded-for. Hash avoids retaining raw IPs.
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `stilla:rate:${scope}:${createHash("sha256").update(address).digest("hex").slice(0, 32)}`;
  if (hasDurableStore()) {
    try {
      const count = await redisCommand<number>([
        "EVAL",
        "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",
        1,
        key,
        windowSeconds,
      ]);
      if (count > limit) throw new HttpError(429, "RATE_LIMITED");
      return;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, "TEMPORARILY_UNAVAILABLE");
    }
  }
  if (getEnv().NODE_ENV === "production")
    throw new HttpError(503, "TEMPORARILY_UNAVAILABLE");
  const now = Date.now();
  for (const [candidate, value] of counters)
    if (value.expires < now) counters.delete(candidate);
  if (counters.size > 10_000)
    throw new HttpError(503, "TEMPORARILY_UNAVAILABLE");
  const counter = counters.get(key) ?? {
    count: 0,
    expires: now + windowSeconds * 1000,
  };
  counter.count += 1;
  counters.set(key, counter);
  if (counter.count > limit) throw new HttpError(429, "RATE_LIMITED");
}

export function safeError(error: unknown): Response {
  const requestId = randomUUID();
  const known = error instanceof HttpError;
  if (!known)
    console.error(
      JSON.stringify({ level: "error", code: "REQUEST_FAILED", requestId }),
    );
  return Response.json(
    { error: known ? error.code : "TEMPORARILY_UNAVAILABLE", requestId },
    {
      status: known ? error.status : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
        ...(known && error.status === 429 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}
