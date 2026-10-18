import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Cart } from "@/types/commerce";
import { CommerceError } from "@/lib/commerce/errors";

const payloadSchema = z
  .object({
    v: z.literal(1),
    id: z.string().uuid(),
    exp: z.number().int(),
    lines: z
      .array(
        z.object({
          id: z.string().uuid(),
          variant: z.string().max(256),
          q: z.number().int().min(1).max(10),
          a: z
            .array(
              z.object({ key: z.string().max(40), value: z.string().max(280) }),
            )
            .max(5),
        }),
      )
      .max(24),
    attributes: z
      .array(z.object({ key: z.string().max(40), value: z.string().max(280) }))
      .max(5),
  })
  .strict();
export type MockCartState = z.infer<typeof payloadSchema>;
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export function encodeMockCart(
  cart: Cart,
  secret: string,
  now = Date.now(),
): string {
  const payload: MockCartState = {
    v: 1,
    id: cart.id,
    exp: Math.floor(now / 1000) + CART_COOKIE_MAX_AGE,
    lines: cart.lines.map((line) => ({
      id: line.id,
      variant: line.merchandiseId,
      q: line.quantity,
      a: line.attributes,
    })),
    attributes: cart.attributes,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const result = `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
  if (Buffer.byteLength(result) > 3800)
    throw new CommerceError("cart_storage_limit");
  return result;
}
export function decodeMockCart(
  token: string,
  secret: string,
  now = Date.now(),
): MockCartState | null {
  if (token.length > 3800) return null;
  const parts = token.split(".");
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  )
    return null;
  const actual = Buffer.from(parts[1], "base64url");
  const expected = createHmac("sha256", secret).update(parts[0]).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    const parsed = payloadSchema.safeParse(
      JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")),
    );
    return parsed.success && parsed.data.exp > now / 1000 ? parsed.data : null;
  } catch {
    return null;
  }
}
