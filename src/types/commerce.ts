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
}
export type ProductCategory =
  "box" | "signature" | "extra" | "card" | "packaging";
export interface Product {
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
}
export interface Cart {
  id: string;
  lines: CartLine[];
  total: Money;
  totalQuantity: number;
  attributes: CartAttribute[];
  checkoutUrl?: string;
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
