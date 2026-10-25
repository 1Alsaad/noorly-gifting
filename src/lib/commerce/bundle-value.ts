import type { ProductVariant } from "@/types/commerce";

/** Compare today's component prices, not a fictitious former bundle price. */
export function bundleValue(variant?: ProductVariant) {
  const components = variant?.components;
  if (!variant?.requiresComponents || !components?.length) return undefined;
  if (
    variant.price.currencyCode !== "SEK" ||
    !Number.isFinite(variant.price.amount) ||
    variant.price.amount <= 0 ||
    components.some(
      (item) =>
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.variant.price.currencyCode !== "SEK" ||
        !Number.isFinite(item.variant.price.amount) ||
        item.variant.price.amount <= 0,
    )
  )
    return undefined;
  const separateOre = components.reduce(
    (sum, item) =>
      sum + Math.round(item.variant.price.amount * 100) * item.quantity,
    0,
  );
  const savingOre = separateOre - Math.round(variant.price.amount * 100);
  if (!Number.isSafeInteger(separateOre) || savingOre <= 0) return undefined;
  return { separate: separateOre / 100, saving: savingOre / 100 };
}
