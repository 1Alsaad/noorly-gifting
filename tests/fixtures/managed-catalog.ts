import type { ManagedCatalog } from "@/lib/commerce/managed-catalog";
import type { Product } from "@/types/commerce";

export function managedCatalogFixture(): ManagedCatalog {
  return {
    schemaVersion: 1,
    version: 2,
    publishedAt: "2026-10-28T12:00:00Z",
    products: [
      {
        id: "gid://shopify/Product/9001",
        handle: "wool-scarf",
        title: { sv: "Ullhalsduk", en: "Wool scarf" },
        description: { sv: "En mjuk halsduk.", en: "A soft scarf." },
        included: { sv: "En halsduk.", en: "One scarf." },
        delivery: {
          sv: "Leverans inom 5–7 arbetsdagar.",
          en: "Delivery in 5–7 working days.",
        },
        availability: "in_stock",
        category: "signature",
        variants: [
          { id: "gid://shopify/ProductVariant/90011", sku: "SCARF-GREY" },
        ],
      },
    ],
  };
}

export function managedShopifyFixture(): Product {
  const definition = managedCatalogFixture().products[0];
  return {
    id: definition.id,
    handle: definition.handle,
    title: { sv: "Leverantörens halsduk", en: "Supplier scarf" },
    description: { sv: "Leverantörstext", en: "Supplier copy" },
    price: { amount: 329, currencyCode: "SEK" },
    images: [{ url: "https://cdn.shopify.com/scarf.jpg", alt: "Grey scarf" }],
    variants: [
      {
        id: definition.variants[0].id,
        sku: definition.variants[0].sku,
        title: "Grey",
        price: { amount: 329, currencyCode: "SEK" },
        available: true,
        requiresComponents: false,
      },
    ],
    available: true,
    category: "extra",
    seasons: [],
    boxEligible: false,
    requiresSellingPlan: false,
    hasSellingPlans: false,
  };
}
