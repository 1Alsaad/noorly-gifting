export type Locale = "sv" | "en";
export type LocalizedText = Record<Locale, string>;
/** Amounts are major currency units. Use integer öre for arithmetic. */
export interface Money {
  amount: number;
  currencyCode: "SEK";
}
export interface ProductImage {
  url: string;
  alt: string;
}
export interface ProductVariant {
  id: string;
  title: string;
  price: Money;
  available: boolean;
  label?: LocalizedText;
  color?: { name: LocalizedText; hex: string };
  scent?: LocalizedText;
  images?: ProductImage[];
  sku?: string;
  selectedOptions?: { name: string; value: string }[];
  requiresComponents?: boolean;
  /** Fixed-bundle definition: component quantities required for one parent. */
  components?: ProductVariantComponent[];
}
export type BundleComponentProduct = Pick<
  Product,
  "id" | "handle" | "title" | "requiresSellingPlan" | "hasSellingPlans"
>;
export interface ProductVariantComponent {
  quantity: number;
  product: BundleComponentProduct;
  variant: ProductVariant;
}
export type ProductCategory =
  "box" | "signature" | "extra" | "card" | "packaging";
export interface Product {
  /** Authenticated operations metadata. Prices and stock still come from Shopify. */
  managedCatalog?: {
    version: number;
    availability: "in_stock" | "preorder";
    delivery: LocalizedText;
  };
  id: string;
  handle: string;
  title: LocalizedText;
  description: LocalizedText;
  price: Money;
  compareAtPrice?: Money;
  images: ProductImage[];
  variants: ProductVariant[];
  available: boolean;
  category: ProductCategory;
  seasons: string[];
  boxEligible: boolean;
  previewOnly?: boolean;
  /** Selling-plan checkout is unavailable until payment terms are integrated. */
  requiresSellingPlan?: boolean;
  hasSellingPlans?: boolean;
  included?: LocalizedText;
  care?: LocalizedText;
  highlights?: LocalizedText[];
  fulfilment?: {
    materials: LocalizedText;
    dimensions?: string;
    weightGrams?: number;
  };
}
export interface Collection {
  id: string;
  handle: string;
  title: LocalizedText;
  description: LocalizedText;
  products: Product[];
}
export interface CartAttribute {
  key: string;
  value: string;
}
export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: CartAttribute[];
}
export interface CartLine {
  id: string;
  merchandiseId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  attributes: CartAttribute[];
  /** Retained from Shopify so an existing plan is never silently discarded. */
  sellingPlanId?: string;
  cost?: CartLineCost;
  /** Shopify's grouped component lines; quantity already includes parent quantity. */
  components?: CartLineComponent[];
}
export interface CartLineCost {
  amountPerQuantity: Money;
  subtotalAmount: Money;
  totalAmount: Money;
}
export interface CartLineComponent {
  id: string;
  merchandiseId: string;
  product: BundleComponentProduct;
  variant: ProductVariant;
  quantity: number;
  attributes: CartAttribute[];
  sellingPlanId?: string;
  cost: CartLineCost;
}
export interface CartWarning {
  code: string;
  message: string;
  target?: string;
}
export interface Cart {
  id: string;
  lines: CartLine[];
  total: Money;
  totalQuantity: number;
  attributes: CartAttribute[];
  checkoutUrl?: string;
  /** Successful Shopify mutations can adjust stock quantities and report why. */
  warnings?: CartWarning[];
}
export interface AvailabilityResult {
  available: boolean;
  unavailableVariantIds: string[];
}
export interface CommerceProvider {
  readonly name: "mock" | "shopify";
  getProducts(): Promise<Product[]>;
  getProductByHandle(handle: string): Promise<Product | null>;
  getCollectionByHandle(handle: string): Promise<Collection | null>;
  createCart(): Promise<Cart>;
  getCart(cartId: string): Promise<Cart | null>;
  addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart>;
  updateCartLines(
    cartId: string,
    lines: { id: string; quantity: number }[],
  ): Promise<Cart>;
  removeCartLines(cartId: string, lineIds: string[]): Promise<Cart>;
  updateCartAttributes(
    cartId: string,
    attributes: CartAttribute[],
  ): Promise<Cart>;
  getCheckoutUrl(cartId: string, locale?: Locale): Promise<string>;
  validateAvailability(lines: CartLineInput[]): Promise<AvailabilityResult>;
}
