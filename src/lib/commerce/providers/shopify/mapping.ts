import { z } from "zod";
import type {
  Cart,
  CartLineCost,
  BundleComponentProduct,
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
const variantDetailsSchema = z.object({
  id: z.string(),
  title: z.string(),
  availableForSale: z.boolean(),
  requiresComponents: z.boolean(),
  price: moneySchema,
  sku: z.string().nullable().optional(),
  image: imageSchema.nullable().optional(),
  selectedOptions: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .optional(),
});
const componentProductSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  requiresSellingPlan: z.boolean(),
  sellingPlanGroups: z.object({
    nodes: z.array(z.object({ name: z.string() })),
  }),
});
const componentVariantSchema = variantDetailsSchema.extend({
  product: componentProductSchema,
});
const variantSchema = variantDetailsSchema.extend({
  components: z.object({
    nodes: z.array(
      z.object({
        quantity: z.number().int().positive(),
        productVariant: componentVariantSchema,
      }),
    ),
    pageInfo: z.object({ hasNextPage: z.literal(false) }),
  }),
});
const productSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  availableForSale: z.boolean(),
  requiresSellingPlan: z.boolean(),
  sellingPlanGroups: z.object({
    nodes: z.array(z.object({ name: z.string() })),
  }),
  productType: z.string(),
  tags: z.array(z.string()),
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
function mapShopifyVariant(
  variant: z.infer<typeof variantDetailsSchema>,
  productTitle: string,
): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    available: variant.availableForSale,
    requiresComponents: variant.requiresComponents,
    price: mapShopifyMoney(variant.price),
    ...(variant.sku ? { sku: variant.sku } : {}),
    ...(variant.image
      ? {
          images: [
            {
              url: variant.image.url,
              alt: variant.image.altText || productTitle,
            },
          ],
        }
      : {}),
    selectedOptions: variant.selectedOptions ?? [],
  };
}
function mapComponentProduct(
  product: z.infer<typeof componentProductSchema>,
  english?: z.infer<typeof componentProductSchema>,
): BundleComponentProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: { sv: product.title, en: english?.title ?? product.title },
    requiresSellingPlan: product.requiresSellingPlan,
    hasSellingPlans: product.sellingPlanGroups.nodes.length > 0,
  };
}
function mapBundleVariant(
  variant: z.infer<typeof variantSchema>,
  title: string,
  english?: z.infer<typeof variantSchema>,
): ProductVariant {
  if (
    variant.requiresComponents !== variant.components.nodes.length > 0 ||
    variant.components.nodes.some(
      ({ productVariant }) => productVariant.requiresComponents,
    )
  )
    throw new CommerceError("invalid_provider_response", 502);
  return {
    ...mapShopifyVariant(variant, title),
    components: variant.components.nodes.map(
      ({ quantity, productVariant }) => ({
        quantity,
        product: mapComponentProduct(
          productVariant.product,
          english?.components.nodes.find(
            (component) => component.productVariant.id === productVariant.id,
          )?.productVariant.product,
        ),
        variant: mapShopifyVariant(
          productVariant,
          productVariant.product.title,
        ),
      }),
    ),
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
    requiresSellingPlan: raw.requiresSellingPlan,
    hasSellingPlans: raw.sellingPlanGroups.nodes.length > 0,
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
    variants: raw.variants.nodes.map((variant) =>
      mapBundleVariant(
        variant,
        raw.title,
        english.variants.nodes.find((item) => item.id === variant.id),
      ),
    ),
  };
}
const attributeSchema = z.object({ key: z.string(), value: z.string() });
const lineCostSchema = z.object({
  amountPerQuantity: moneySchema,
  subtotalAmount: moneySchema,
  totalAmount: moneySchema,
});
const sellingPlanSchema = z
  .object({ sellingPlan: z.object({ id: z.string() }) })
  .nullable();
const componentLineSchema = z.object({
  id: z.string(),
  quantity: z.number().int().nonnegative(),
  attributes: z.array(attributeSchema),
  sellingPlanAllocation: sellingPlanSchema,
  cost: lineCostSchema,
  merchandise: componentVariantSchema,
});
const warningSchema = z.array(
  z.object({
    code: z.string(),
    message: z.string(),
    target: z.string().nullish(),
  }),
);
function mapLineCost(cost: z.infer<typeof lineCostSchema>): CartLineCost {
  return {
    amountPerQuantity: mapShopifyMoney(cost.amountPerQuantity),
    subtotalAmount: mapShopifyMoney(cost.subtotalAmount),
    totalAmount: mapShopifyMoney(cost.totalAmount),
  };
}
const cartSchema = z.object({
  id: z.string(),
  checkoutUrl: z.string().url(),
  totalQuantity: z.number().int(),
  attributes: z.array(attributeSchema),
  cost: z.object({ subtotalAmount: moneySchema }),
  lines: z.object({
    nodes: z.array(
      z.object({
        __typename: z.enum(["CartLine", "ComponentizableCartLine"]),
        id: z.string(),
        quantity: z.number().int().nonnegative(),
        attributes: z.array(attributeSchema),
        sellingPlanAllocation: sellingPlanSchema,
        cost: lineCostSchema,
        lineComponents: z.array(componentLineSchema).optional(),
        merchandise: variantSchema.extend({ product: productSchema }),
      }),
    ),
  }),
});
export function mapShopifyCart(input: unknown, warnings: unknown = []): Cart {
  const parsed = cartSchema.safeParse(input);
  const parsedWarnings = warningSchema.safeParse(warnings);
  if (!parsed.success || !parsedWarnings.success)
    throw new CommerceError("invalid_provider_response", 502);
  const raw = parsed.data;
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    total: mapShopifyMoney(raw.cost.subtotalAmount),
    attributes: raw.attributes,
    warnings: parsedWarnings.data.map(({ code, message, target }) => ({
      code,
      message,
      ...(target ? { target } : {}),
    })),
    lines: raw.lines.nodes.map((line) => {
      if (
        line.merchandise.requiresComponents &&
        (line.__typename !== "ComponentizableCartLine" ||
          !line.lineComponents?.length)
      )
        throw new CommerceError("invalid_provider_response", 502);
      return {
        id: line.id,
        merchandiseId: line.merchandise.id,
        quantity: line.quantity,
        attributes: line.attributes,
        cost: mapLineCost(line.cost),
        ...(line.sellingPlanAllocation
          ? { sellingPlanId: line.sellingPlanAllocation.sellingPlan.id }
          : {}),
        product: mapShopifyProduct(line.merchandise.product),
        variant: mapBundleVariant(
          line.merchandise,
          line.merchandise.product.title,
        ),
        ...(line.lineComponents
          ? {
              components: line.lineComponents.map((component) => ({
                id: component.id,
                merchandiseId: component.merchandise.id,
                quantity: component.quantity,
                attributes: component.attributes,
                cost: mapLineCost(component.cost),
                product: mapComponentProduct(component.merchandise.product),
                variant: mapShopifyVariant(
                  component.merchandise,
                  component.merchandise.product.title,
                ),
                ...(component.sellingPlanAllocation
                  ? {
                      sellingPlanId:
                        component.sellingPlanAllocation.sellingPlan.id,
                    }
                  : {}),
              })),
            }
          : {}),
      };
    }),
  };
}
