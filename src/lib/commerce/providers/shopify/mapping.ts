import { z } from "zod";
import type {
  Cart,
  Money,
  Product,
  ProductCategory,
  ProductVariant,
} from "@/types/commerce";
import { CommerceError } from "@/lib/commerce/errors";

const moneySchema = z.object({
  amount: z.string(),
  currencyCode: z.literal("SEK"),
});
const imageSchema = z.object({
  url: z.string().url(),
  altText: z.string().nullable(),
});
const variantSchema = z.object({
  id: z.string(),
  title: z.string(),
  availableForSale: z.boolean(),
  price: moneySchema,
  sku: z.string().nullable().optional(),
  image: imageSchema.nullable().optional(),
  selectedOptions: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .optional(),
});
const productSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  availableForSale: z.boolean(),
  productType: z.string(),
  tags: z.array(z.string()),
  requiresSellingPlan: z.boolean(),
  sellingPlanGroups: z.object({ nodes: z.array(z.object({ id: z.string() })) }),
  priceRange: z.object({ minVariantPrice: moneySchema }),
  compareAtPriceRange: z.object({ minVariantPrice: moneySchema }).optional(),
  images: z.object({
    nodes: z.array(imageSchema),
  }),
  variants: z.object({ nodes: z.array(variantSchema) }),
});
export type ShopifyProduct = z.infer<typeof productSchema>;
export function mapShopifyMoney(raw: z.infer<typeof moneySchema>): Money {
  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount < 0 || raw.currencyCode !== "SEK")
    throw new CommerceError("unsupported_currency", 502);
  return { amount, currencyCode: "SEK" };
}
function mapVariant(raw: z.infer<typeof variantSchema>): ProductVariant {
  return {
    id: raw.id,
    title: raw.title,
    available: raw.availableForSale,
    price: mapShopifyMoney(raw.price),
    ...(raw.sku ? { sku: raw.sku } : {}),
    ...(raw.image
      ? { image: { url: raw.image.url, alt: raw.image.altText || raw.title } }
      : {}),
    ...(raw.selectedOptions ? { selectedOptions: raw.selectedOptions } : {}),
  };
}
export function mapShopifyProduct(
  input: unknown,
  englishInput?: unknown,
): Product {
  const result = productSchema.safeParse(input);
  if (!result.success)
    throw new CommerceError("invalid_provider_response", 502);
  const raw = result.data;
  const english = englishInput ? productSchema.parse(englishInput) : raw;
  const categories: ProductCategory[] = [
    "box",
    "signature",
    "extra",
    "card",
    "packaging",
  ];
  const categoryTag =
    raw.tags.find((tag) => tag.startsWith("category:"))?.slice(9) ??
    raw.productType.toLowerCase();
  const category: ProductCategory = categories.includes(
    categoryTag as ProductCategory,
  )
    ? (categoryTag as ProductCategory)
    : "extra";
  const compareAtPrice = raw.compareAtPriceRange
    ? mapShopifyMoney(raw.compareAtPriceRange.minVariantPrice)
    : undefined;
  return {
    id: raw.id,
    handle: raw.handle,
    title: { sv: raw.title, en: english.title },
    description: { sv: raw.description, en: english.description },
    available: raw.availableForSale,
    purchaseOptions: {
      requiresSellingPlan: raw.requiresSellingPlan,
      hasSellingPlans: raw.sellingPlanGroups.nodes.length > 0,
    },
    category,
    boxEligible: raw.tags.includes("box-eligible"),
    seasons: raw.tags
      .filter((tag) => tag.startsWith("season:"))
      .map((tag) => tag.slice(7)),
    price: mapShopifyMoney(raw.priceRange.minVariantPrice),
    ...(compareAtPrice && compareAtPrice.amount > 0 ? { compareAtPrice } : {}),
    images: raw.images.nodes.map((image) => ({
      url: image.url,
      alt: image.altText || raw.title,
    })),
    variants: raw.variants.nodes.map(mapVariant),
  };
}
const attributeSchema = z.object({ key: z.string(), value: z.string() });
const cartSchema = z.object({
  id: z.string(),
  checkoutUrl: z.string().url(),
  totalQuantity: z.number().int(),
  attributes: z.array(attributeSchema),
  cost: z.object({ subtotalAmount: moneySchema }),
  lines: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        quantity: z.number().int(),
        attributes: z.array(attributeSchema),
        sellingPlanAllocation: z
          .object({ sellingPlan: z.object({ id: z.string() }) })
          .nullable(),
        merchandise: variantSchema.extend({ product: productSchema }),
      }),
    ),
  }),
});
export function mapShopifyCart(input: unknown): Cart {
  const parsed = cartSchema.safeParse(input);
  if (!parsed.success)
    throw new CommerceError("invalid_provider_response", 502);
  const raw = parsed.data;
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    total: mapShopifyMoney(raw.cost.subtotalAmount),
    attributes: raw.attributes,
    lines: raw.lines.nodes.map((line) => ({
      id: line.id,
      merchandiseId: line.merchandise.id,
      quantity: line.quantity,
      attributes: line.attributes,
      ...(line.sellingPlanAllocation
        ? { sellingPlanId: line.sellingPlanAllocation.sellingPlan.id }
        : {}),
      product: mapShopifyProduct(line.merchandise.product),
      variant: mapVariant(line.merchandise),
    })),
  };
}
