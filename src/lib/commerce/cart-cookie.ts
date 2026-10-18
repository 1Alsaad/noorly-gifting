import { createHmac, timingSafeEqual } from "node:crypto";
import { CommerceError } from "./errors";

export function signCartReference(reference: string, secret: string): string {
  const data = Buffer.from(
    JSON.stringify({
      provider: "shopify",
      id: reference,
      exp: Math.floor(Date.now() / 1000) + 604800,
    }),
  ).toString("base64url");
  const result = `${data}.${createHmac("sha256", secret).update(data).digest("base64url")}`;
  if (result.length > 3800) throw new CommerceError("cart_storage_limit");
  return result;
}
export function verifyCartReference(
  value: string,
  secret: string,
): string | null {
  if (value.length > 3800) return null;
  const parts = value.split(".");
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  )
    return null;
  const signature = Buffer.from(parts[1], "base64url");
  const expected = createHmac("sha256", secret).update(parts[0]).digest();
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(signature, expected)
  )
    return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8"),
    ) as { provider?: unknown; id?: unknown; exp?: unknown };
    return payload.provider === "shopify" &&
      typeof payload.id === "string" &&
      typeof payload.exp === "number" &&
      payload.exp > Date.now() / 1000
      ? payload.id
      : null;
  } catch {
    return null;
  }
}
