import { z } from "zod";
import { brand } from "@/config/brand";
import {
  sanitizeGiftMessage,
  validateBoxSelection,
  type BoxSelection,
} from "@/features/box-builder/validation";
import type {
  Cart,
  CartAttribute,
  CartLineInput,
  Product,
} from "@/types/commerce";
import { CommerceError } from "./errors";
import { supportsStandardPurchase } from "./purchase-options";

export const MAX_CART_LINES = 24;
export const MAX_CART_QUANTITY = 30;
const attributeSchema = z
  .object({
    key: z.enum([
      "bundle_id",
      "bundle_role",
      "box_size",
      "gift_message",
      "locale",
      "_stilla_analytics_consent",
      "_stilla_analytics_session",
      "_noorly_marketing_consent",
    ]),
    value: z.string().max(brand.giftMessageMaxLength),
  })
  .strict()
  .refine(
    ({ key, value }) =>
      !["_stilla_analytics_consent", "_noorly_marketing_consent"].includes(
        key,
      ) || ["granted", "denied"].includes(value),
    "invalid_consent",
  )
  .refine(
    ({ key, value }) =>
      key !== "_stilla_analytics_session" ||
      value === "" ||
      z.uuid().safeParse(value).success,
    "invalid_session",
  );
export const attributesSchema = z
  .array(attributeSchema)
  .max(5)
  .refine(
    (attributes) =>
      new Set(attributes.map(({ key }) => key)).size === attributes.length,
    "duplicate_attributes",
  );
const lineSchema = z
  .object({
    merchandiseId: z.string().min(1).max(256),
    quantity: z.number().int().min(1).max(10),
    attributes: attributesSchema.optional(),
  })
  .strict();
export const cartActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("add"),
      lines: z.array(lineSchema).min(1).max(7),
    })
    .strict(),
  z
    .object({
      action: z.literal("replace_bundle"),
      bundleId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
      lines: z.array(lineSchema).min(4).max(7),
    })
    .strict(),
  z
    .object({
      action: z.literal("update"),
      lineId: z.string().min(1).max(256),
      quantity: z.number().int().min(1).max(10),
    })
    .strict(),
  z
    .object({
      action: z.literal("remove"),
      lineIds: z.array(z.string().min(1).max(256)).min(1).max(MAX_CART_LINES),
    })
    .strict(),
  z
    .object({ action: z.literal("attributes"), attributes: attributesSchema })
    .strict(),
  z
    .object({
      action: z.literal("checkout"),
      locale: z.enum(["sv", "en"]),
      attributes: attributesSchema.optional(),
    })
    .strict(),
]);
export function cleanAttributes(
  attributes: CartAttribute[] = [],
): CartAttribute[] {
  const result = attributesSchema.safeParse(attributes);
  if (!result.success) throw new CommerceError("invalid_attributes");
  return result.data.map(({ key, value }) => ({
    key,
    value: key === "gift_message" ? sanitizeGiftMessage(value) : value,
  }));
}
export function validateIncomingLines(lines: CartLineInput[]): CartLineInput[] {
  const parsed = z
    .array(lineSchema)
    .min(1)
    .max(MAX_CART_LINES)
    .safeParse(lines);
  if (!parsed.success) throw new CommerceError("invalid_lines");
  return parsed.data.map((line) => ({
    ...line,
    attributes: cleanAttributes(line.attributes),
  }));
}
export function validateCart(cart: Cart, catalogue: Product[]): void {
  if (
    cart.lines.length > MAX_CART_LINES ||
    cart.totalQuantity > MAX_CART_QUANTITY
  )
    throw new CommerceError("cart_limit");
  const groups = new Map<string, Cart["lines"]>();
  for (const line of cart.lines) {
    if (line.sellingPlanId || !supportsStandardPurchase(line.product))
      throw new CommerceError("purchase_option_not_ready", 409);
    const attrs = Object.fromEntries(
      cleanAttributes(line.attributes).map(({ key, value }) => [key, value]),
    );
    if (
      !line.variant.available ||
      !line.product.available ||
      line.quantity < 1 ||
      line.quantity > 10
    )
      throw new CommerceError("unavailable_product");
    if (attrs.bundle_id) {
      if (!/^[a-zA-Z0-9_-]{8,64}$/.test(attrs.bundle_id))
        throw new CommerceError("invalid_bundle");
      groups.set(attrs.bundle_id, [
        ...(groups.get(attrs.bundle_id) ?? []),
        line,
      ]);
    } else if (attrs.bundle_role || attrs.box_size)
      throw new CommerceError("invalid_bundle");
  }
  for (const lines of groups.values()) {
    const packaging = lines.filter(
      (line) => line.product.category === "packaging",
    );
    const signatures = lines.filter(
      (line) => line.product.category === "signature",
    );
    const cards = lines.filter((line) => line.product.category === "card");
    if (packaging.length !== 1 || signatures.length !== 1 || cards.length > 1)
      throw new CommerceError("invalid_bundle");
    const baseHandle = packaging[0].product.handle;
    if (baseHandle !== "small-box" && baseHandle !== "large-box")
      throw new CommerceError("invalid_bundle");
    const quantity = packaging[0].quantity;
    if (lines.some((line) => line.quantity !== quantity))
      throw new CommerceError("bundle_quantity_mismatch");
    if (
      lines.some((line) => {
        const attrs = Object.fromEntries(
          line.attributes.map(({ key, value }) => [key, value]),
        );
        return (
          attrs.box_size !== baseHandle ||
          attrs.bundle_role !== line.product.category ||
          (line.product.category !== "packaging" && Boolean(attrs.gift_message))
        );
      })
    )
      throw new CommerceError("invalid_bundle");
    const selection: BoxSelection = {
      baseHandle,
      signatureHandle: signatures[0].product.handle,
      extraHandles: lines
        .filter((line) => line.product.category === "extra")
        .map((line) => line.product.handle),
      cardHandle: cards[0]?.product.handle,
      giftMessage:
        packaging[0].attributes.find(({ key }) => key === "gift_message")
          ?.value ?? "",
    };
    if (
      !validateBoxSelection(selection, catalogue).valid ||
      lines.length !== 2 + selection.extraHandles.length + cards.length
    )
      throw new CommerceError("invalid_bundle");
  }
}
