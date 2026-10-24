import type { CartLine, ProductVariant } from "@/types/commerce";

/** The selected parent and every component must remain ordinary one-time purchases. */
export function hasUnsupportedPurchaseOption(line: CartLine): boolean {
  return (
    [line, ...(line.components ?? [])].some(
      (item) =>
        item.sellingPlanId ||
        item.product.requiresSellingPlan ||
        item.product.hasSellingPlans,
    ) ||
    Boolean(
      line.variant.components?.some(
        ({ product }) => product.requiresSellingPlan || product.hasSellingPlans,
      ),
    )
  );
}

export function hasValidBundleDefinition(variant: ProductVariant): boolean {
  const components = variant.components ?? [];
  if (!variant.requiresComponents) return components.length === 0;
  return (
    components.length > 0 &&
    components.every(
      ({ quantity, variant: component }) =>
        Number.isSafeInteger(quantity) &&
        quantity > 0 &&
        !component.requiresComponents,
    )
  );
}

/** Compare Shopify's actual grouped lines with the fixed definition, once per kit. */
export function hasCompleteBundle(line: CartLine): boolean {
  if (!hasValidBundleDefinition(line.variant)) return false;
  if (!line.variant.requiresComponents) return !line.components?.length;
  if (!line.components?.length) return false;
  const expected = new Map<string, number>();
  for (const component of line.variant.components ?? []) {
    expected.set(
      component.variant.id,
      (expected.get(component.variant.id) ?? 0) +
        component.quantity * line.quantity,
    );
  }
  const actual = new Map<string, number>();
  for (const component of line.components) {
    if (
      component.variant.requiresComponents ||
      !Number.isSafeInteger(component.quantity) ||
      component.quantity < 1
    )
      return false;
    actual.set(
      component.merchandiseId,
      (actual.get(component.merchandiseId) ?? 0) + component.quantity,
    );
  }
  return (
    actual.size === expected.size &&
    [...expected].every(([id, quantity]) => actual.get(id) === quantity)
  );
}

export function isCartLineAvailable(
  line: CartLine,
  { projected = false }: { projected?: boolean } = {},
): boolean {
  return (
    line.product.available &&
    line.variant.available &&
    Number.isSafeInteger(line.quantity) &&
    line.quantity > 0 &&
    hasValidBundleDefinition(line.variant) &&
    (projected || hasCompleteBundle(line)) &&
    (line.variant.components ?? []).every(({ variant }) => variant.available) &&
    (line.components ?? []).every((component) => component.variant.available)
  );
}
