import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_PREVIEW_COOKIE = "noorly_admin_preview";
export const ADMIN_PREVIEW_TTL = 8 * 60 * 60;

function password() {
  const value = process.env.ADMIN_PREVIEW_PASSWORD;
  return value && value.length >= 32 && value.length <= 256 ? value : null;
}
export function isAdminPreviewConfigured() {
  return password() !== null;
}
function digest(value: string) {
  return createHash("sha256").update(value).digest();
}
function signature(payload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`noorly:view-only:v1:${payload}`)
    .digest("hex");
}
export function verifyAdminPreviewPassword(input: string) {
  const secret = password();
  return Boolean(
    secret &&
    input.length <= 256 &&
    timingSafeEqual(digest(input), digest(secret)),
  );
}
export function createAdminPreviewSession(now = Date.now()) {
  const secret = password();
  if (!secret) throw new Error("ADMIN_PREVIEW_NOT_CONFIGURED");
  const issuedAt = Math.floor(now / 1000);
  const payload = Buffer.from(
    JSON.stringify({ issuedAt, nonce: randomBytes(16).toString("hex") }),
  ).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}
export function verifyAdminPreviewSession(
  token: string | undefined,
  now = Date.now(),
) {
  const secret = password();
  if (!secret || !token || token.length > 512 || !Number.isFinite(now))
    return false;
  const parts = token.split(".");
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
    !/^[a-f0-9]{64}$/.test(parts[1])
  )
    return false;
  if (
    !timingSafeEqual(
      Buffer.from(parts[1], "hex"),
      Buffer.from(signature(parts[0], secret), "hex"),
    )
  )
    return false;
  try {
    const data = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8"),
    );
    const seconds = Math.floor(now / 1000);
    return (
      Number.isSafeInteger(data.issuedAt) &&
      data.issuedAt <= seconds &&
      seconds - data.issuedAt < ADMIN_PREVIEW_TTL &&
      /^[a-f0-9]{32}$/.test(data.nonce)
    );
  } catch {
    return false;
  }
}
export async function hasAdminPreviewSession() {
  return verifyAdminPreviewSession(
    (await cookies()).get(ADMIN_PREVIEW_COOKIE)?.value,
  );
}

// Bounded per-instance throttling supplements a generated high-entropy password.
// This is not a distributed rate limiter and does not require a paid datastore.
const attempts = new Map<string, { count: number; expires: number }>();
export function allowAdminPreviewAttempt(request: Request, now = Date.now()) {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const key = digest(address).toString("hex");
  for (const [id, entry] of attempts)
    if (entry.expires <= now) attempts.delete(id);
  if (!attempts.has(key) && attempts.size >= 1000) return false;
  const entry = attempts.get(key) ?? { count: 0, expires: now + 600_000 };
  entry.count += 1;
  attempts.set(key, entry);
  return entry.count <= 10;
}
