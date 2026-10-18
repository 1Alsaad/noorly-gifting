import type { Cart, Product } from "@/types/commerce";

/** Cart operations return provider-default text; rejoin the translated catalogue for UI. */
export function enrichCartProducts(cart: Cart, catalogue: Product[]): Cart {
  return {
    ...cart,
    lines: cart.lines.map((line) => {
      const product = catalogue.find((item) => item.id === line.product.id);
      const variant = product?.variants.find(
        (item) => item.id === line.merchandiseId,
      );
      return product && variant
        ? { ...line, product, variant }
        : { ...line, variant: { ...line.variant, available: false } };
    }),
  };
}
