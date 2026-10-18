import { randomUUID } from "node:crypto";
import { mockProducts } from "@/content/products";
import { sumMoney } from "@/lib/utils/money";
import { CommerceError } from "@/lib/commerce/errors";
import {
  cleanAttributes,
  validateCart,
  validateIncomingLines,
} from "@/lib/commerce/validation";
import type {
  Cart,
  CartAttribute,
  CartLineInput,
  CommerceProvider,
  Locale,
} from "@/types/commerce";
import { decodeMockCart, type MockCartState } from "./cookie";

export class MockCommerceProvider implements CommerceProvider {
  readonly name = "mock" as const;
  private cart: Cart | null = null;
  constructor(private readonly secret: string) {}
  async getProducts() {
    return structuredClone(mockProducts);
  }
  async getProductByHandle(handle: string) {
    return structuredClone(
      mockProducts.find((item) => item.handle === handle) ?? null,
    );
  }
  async getCollectionByHandle(handle: string) {
    return handle === "winter"
      ? {
          id: "mock-winter",
          handle,
          title: { sv: "Vinterkollektionen", en: "Winter Collection" },
          description: {
            sv: "Omtänksamma gåvor för vintern.",
            en: "Thoughtful gifts for winter.",
          },
          products: await this.getProducts(),
        }
      : null;
  }
  async createCart(): Promise<Cart> {
    this.cart = {
      id: randomUUID(),
      lines: [],
      total: { amount: 0, currencyCode: "SEK" },
      totalQuantity: 0,
      attributes: [],
    };
    return structuredClone(this.cart);
  }
  private fromState(state: MockCartState): Cart {
    const lines = state.lines.map((line) => {
      const product = mockProducts.find((item) =>
        item.variants.some((variant) => variant.id === line.variant),
      );
      const variant = product?.variants.find(
        (item) => item.id === line.variant,
      );
      if (!product || !variant) throw new CommerceError("cart_expired", 409);
      return {
        id: line.id,
        merchandiseId: line.variant,
        product,
        variant,
        quantity: line.q,
        attributes: cleanAttributes(line.a),
      };
    });
    return this.recalculate(
      {
        id: state.id,
        lines,
        total: { amount: 0, currencyCode: "SEK" },
        totalQuantity: 0,
        attributes: cleanAttributes(state.attributes),
      },
      false,
    );
  }
  async getCart(cartId: string): Promise<Cart | null> {
    if (this.cart?.id === cartId) return structuredClone(this.cart);
    const state = decodeMockCart(cartId, this.secret);
    if (!state) return null;
    this.cart = this.fromState(state);
    return structuredClone(this.cart);
  }
  private async requireCart(id: string) {
    const cart = await this.getCart(id);
    if (!cart) throw new CommerceError("cart_expired", 409);
    return cart;
  }
  private recalculate(cart: Cart, enforceRules = true): Cart {
    cart.totalQuantity = cart.lines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    );
    cart.total = sumMoney(
      cart.lines.map((line) => ({
        ...line.variant.price,
        amount: line.variant.price.amount * line.quantity,
      })),
    );
    if (enforceRules) validateCart(cart, mockProducts);
    return cart;
  }
  private commit(cart: Cart) {
    this.cart = this.recalculate(cart);
    return structuredClone(this.cart);
  }
  async addCartLines(cartId: string, input: CartLineInput[]): Promise<Cart> {
    const cart = await this.requireCart(cartId);
    for (const line of validateIncomingLines(input)) {
      const product = mockProducts.find((item) =>
        item.variants.some((variant) => variant.id === line.merchandiseId),
      );
      const variant = product?.variants.find(
        (item) => item.id === line.merchandiseId,
      );
      if (!product || !variant?.available || !product.available)
        throw new CommerceError("unavailable_product");
      const attributes = cleanAttributes(line.attributes);
      const existing = cart.lines.find(
        (item) =>
          item.merchandiseId === line.merchandiseId &&
          JSON.stringify(item.attributes) === JSON.stringify(attributes),
      );
      if (existing) existing.quantity += line.quantity;
      else
        cart.lines.push({
          id: randomUUID(),
          merchandiseId: line.merchandiseId,
          product,
          variant,
          quantity: line.quantity,
          attributes,
        });
    }
    return this.commit(cart);
  }
  async updateCartLines(
    cartId: string,
    updates: { id: string; quantity: number }[],
  ) {
    const cart = await this.requireCart(cartId);
    for (const update of updates) {
      if (
        !Number.isInteger(update.quantity) ||
        update.quantity < 1 ||
        update.quantity > 10
      )
        throw new CommerceError("invalid_quantity");
      const line = cart.lines.find((item) => item.id === update.id);
      if (!line) throw new CommerceError("line_not_found");
      const bundle = line.attributes.find(
        ({ key }) => key === "bundle_id",
      )?.value;
      const group = bundle
        ? cart.lines.filter((item) =>
            item.attributes.some(
              ({ key, value }) => key === "bundle_id" && value === bundle,
            ),
          )
        : [line];
      for (const item of group) item.quantity = update.quantity;
    }
    return this.commit(cart);
  }
  async removeCartLines(cartId: string, lineIds: string[]) {
    const cart = await this.requireCart(cartId);
    const bundles = cart.lines
      .filter((line) => lineIds.includes(line.id))
      .flatMap((line) =>
        line.attributes
          .filter(({ key }) => key === "bundle_id")
          .map(({ value }) => value),
      );
    cart.lines = cart.lines.filter(
      (line) =>
        !lineIds.includes(line.id) &&
        !line.attributes.some(
          ({ key, value }) => key === "bundle_id" && bundles.includes(value),
        ),
    );
    return this.commit(cart);
  }
  async updateCartAttributes(cartId: string, attributes: CartAttribute[]) {
    const cart = await this.requireCart(cartId);
    cart.attributes = cleanAttributes(attributes);
    return this.commit(cart);
  }
  async getCheckoutUrl(cartId: string, locale: Locale = "sv") {
    const cart = await this.requireCart(cartId);
    if (!cart.lines.length) throw new CommerceError("empty_cart");
    this.recalculate(cart);
    return `/${locale}/mock-checkout`;
  }
  async validateAvailability(lines: CartLineInput[]) {
    const unavailableVariantIds = lines
      .filter(
        (line) =>
          !mockProducts.some(
            (product) =>
              product.available &&
              product.variants.some(
                (variant) =>
                  variant.id === line.merchandiseId && variant.available,
              ),
          ),
      )
      .map((line) => line.merchandiseId);
    return {
      available: unavailableVariantIds.length === 0,
      unavailableVariantIds,
    };
  }
}
