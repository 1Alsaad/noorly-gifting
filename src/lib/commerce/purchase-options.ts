import type { Product } from "@/types/commerce";

/** Never silently turn a presale/subscription into an ordinary purchase. */
export function supportsStandardPurchase(product: Product): boolean {
  return !(
    product.purchaseOptions?.requiresSellingPlan ||
    product.purchaseOptions?.hasSellingPlans
  );
}

export const purchasePendingCopy = {
  sv: "Köp är inte öppet ännu.",
  en: "Orders are not open yet.",
};
