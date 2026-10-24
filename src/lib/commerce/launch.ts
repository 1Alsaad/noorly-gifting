/** Public builds stay closed until the supplier and checkout release gates pass. */
export function isStorefrontOpen(): boolean {
  if (process.env.NOORLY_STOREFRONT_OPEN === "false") return false;
  if (process.env.NODE_ENV !== "production") return true;
  return (
    process.env.NOORLY_STOREFRONT_OPEN === "true" &&
    process.env.NEXT_PUBLIC_COMMERCE_PROVIDER === "shopify"
  );
}

/**
 * Public viewing is a separate, read-only switch. It never unlocks
 * Shopify carts, paid checkout or search indexing.
 */
export function isPublicTestPreview(): boolean {
  return (
    process.env.NOORLY_PUBLIC_PREVIEW === "true" &&
    process.env.NOORLY_STOREFRONT_OPEN === "false" &&
    process.env.NEXT_PUBLIC_PRODUCT_TEST_MODE === "true" &&
    !isStorefrontOpen()
  );
}
