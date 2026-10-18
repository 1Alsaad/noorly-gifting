import { brand } from "@/config/brand";
import { sumMoney } from "@/lib/utils/money";
import type { CartLineInput, Money, Product } from "@/types/commerce";

export const BOX_RULES = {
  "small-box": { minimumExtras: 2, maximumExtras: 2 },
  "large-box": { minimumExtras: 2, maximumExtras: 3 },
} as const;
export interface BoxSelection {
  baseHandle: "small-box" | "large-box";
  signatureHandle: string;
  extraHandles: string[];
  cardHandle?: string;
  giftMessage: string;
}
export function sanitizeGiftMessage(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}
export function validateBoxSelection(
  selection: BoxSelection,
  products: Product[],
  season = "winter",
): { valid: boolean; errors: string[]; total: Money } {
  const errors: string[] = [];
  const rule = BOX_RULES[selection.baseHandle];
  if (!rule) errors.push("invalid_base");
  if (
    rule &&
    (selection.extraHandles.length < rule.minimumExtras ||
      selection.extraHandles.length > rule.maximumExtras)
  )
    errors.push("extras_count");
  if (new Set(selection.extraHandles).size !== selection.extraHandles.length)
    errors.push("duplicate_extras");
  if (selection.giftMessage.length > brand.giftMessageMaxLength)
    errors.push("message_too_long");
  if (selection.cardHandle && selection.cardHandle !== "greeting-card")
    errors.push("invalid_card");
  const handles = [
    selection.baseHandle,
    selection.signatureHandle,
    ...selection.extraHandles,
    ...(selection.cardHandle ? [selection.cardHandle] : []),
  ];
  const selected: Product[] = [];
  for (const handle of handles) {
    const product = products.find((item) => item.handle === handle);
    if (
      !product ||
      !product.available ||
      !product.variants.some((variant) => variant.available) ||
      !product.boxEligible ||
      !product.seasons.includes(season)
    ) {
      errors.push("unavailable_product");
    } else selected.push(product);
  }
  if (
    !products.some(
      (item) =>
        item.handle === selection.signatureHandle &&
        item.category === "signature",
    )
  )
    errors.push("invalid_signature");
  if (
    selection.extraHandles.some(
      (handle) =>
        !products.some(
          (item) => item.handle === handle && item.category === "extra",
        ),
    )
  )
    errors.push("invalid_extra");
  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    total: sumMoney(
      selected.map(
        (item) => item.variants.find((variant) => variant.available)!.price,
      ),
    ),
  };
}
export function buildBoxCartLines(
  selection: BoxSelection,
  products: Product[],
  bundleId: string,
): CartLineInput[] {
  if (
    !/^[a-zA-Z0-9_-]{8,64}$/.test(bundleId) ||
    !validateBoxSelection(selection, products).valid
  )
    throw new Error("invalid_box");
  const handles = [
    selection.baseHandle,
    selection.signatureHandle,
    ...selection.extraHandles,
    ...(selection.cardHandle ? [selection.cardHandle] : []),
  ];
  return handles.map((handle, index) => {
    const product = products.find((item) => item.handle === handle)!;
    const attributes = [
      { key: "bundle_id", value: bundleId },
      {
        key: "bundle_role",
        value: index === 0 ? "packaging" : product.category,
      },
      { key: "box_size", value: selection.baseHandle },
    ];
    if (index === 0 && selection.giftMessage.trim())
      attributes.push({
        key: "gift_message",
        value: sanitizeGiftMessage(selection.giftMessage),
      });
    return {
      merchandiseId: product.variants.find((variant) => variant.available)!.id,
      quantity: 1,
      attributes,
    };
  });
}
