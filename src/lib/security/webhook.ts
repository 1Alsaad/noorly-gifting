import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyShopifyHmac(
  raw: Uint8Array,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  const supplied = Buffer.from(signature, "base64");
  return (
    supplied.byteLength === expected.byteLength &&
    timingSafeEqual(expected, supplied)
  );
}
