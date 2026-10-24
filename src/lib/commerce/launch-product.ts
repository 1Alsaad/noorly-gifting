import "server-only";

import { cache } from "react";
import {
  candleSandHandle,
  launchProductDefinitions,
} from "@/content/launch-catalog";
import { isProductTestMode } from "@/config/product-test";
import { getCommerceProvider } from "@/lib/commerce";
import { CommerceError } from "@/lib/commerce/errors";
import { isStorefrontOpen } from "@/lib/commerce/launch";
import type { CommerceProvider, Product, ProductImage } from "@/types/commerce";

export interface LaunchProductState {
  product: Product;
  source: "shopify" | "preparation";
  salesOpen: boolean;
  purchasable: boolean;
}

function supportedImage(image: ProductImage) {
  try {
    const url = new URL(image.url);
    return (
      url.protocol === "https:" &&
      url.hostname === "cdn.shopify.com" &&
      !url.port &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function isLaunchProduct(product: Pick<Product, "id" | "handle">) {
  return launchProductDefinitions.some(
    (definition) =>
      product.id === definition.id && product.handle === definition.handle,
  );
}

/** Resolve one real product without turning a mock, draft or incomplete product into stock. */
export async function resolveLaunchProduct(
  provider: Pick<
    CommerceProvider,
    "name" | "getProductByHandle"
  > = getCommerceProvider(),
  handle: string = candleSandHandle,
): Promise<LaunchProductState> {
  const definition = launchProductDefinitions.find(
    (candidate) => candidate.handle === handle,
  );
  if (!definition) throw new CommerceError("invalid_launch_product", 404);
  const salesOpen = isStorefrontOpen() && !isProductTestMode();
  const preparation: LaunchProductState = {
    product: definition.preview,
    source: "preparation",
    salesOpen,
    purchasable: false,
  };
  // The closed preview contains verified photographs and confirmed contents,
  // but no sellable variants. It must remain readable during catalog setup.
  if (!salesOpen || provider.name !== "shopify") return preparation;

  // Once sales open, provider failures still propagate and never become stock.
  const found = await provider.getProductByHandle(handle);
  if (!found) return preparation;
  if (found.id !== definition.id || found.handle !== definition.handle)
    throw new CommerceError("invalid_launch_product", 502);

  const images = found.images.filter(supportedImage);
  const variants = found.variants.map((variant) => {
    const variantImages = variant.images?.filter(supportedImage);
    return {
      ...variant,
      images: variantImages?.length ? variantImages : undefined,
      available:
        variant.available &&
        !variant.requiresComponents &&
        !variant.components?.length &&
        /^gid:\/\/shopify\/ProductVariant\/[1-9]\d*$/.test(variant.id) &&
        variant.price.currencyCode === "SEK" &&
        Number.isFinite(variant.price.amount) &&
        variant.price.amount > 0,
    };
  });
  const purchasable =
    salesOpen &&
    found.available &&
    !found.previewOnly &&
    !found.requiresSellingPlan &&
    !found.hasSellingPlans &&
    found.price.currencyCode === "SEK" &&
    Number.isFinite(found.price.amount) &&
    found.price.amount > 0 &&
    images.length > 0 &&
    variants.some((variant) => variant.available);

  return {
    source: "shopify",
    salesOpen,
    purchasable,
    product: {
      ...found,
      images,
      variants: variants.map((variant) => ({
        ...variant,
        available: purchasable && variant.available,
      })),
      available: purchasable,
      previewOnly: !purchasable,
    },
  };
}

// Memoize only within the current render request, never across stock changes.
export const getLaunchProduct = cache((handle: string = candleSandHandle) =>
  resolveLaunchProduct(getCommerceProvider(), handle),
);

export const getLaunchProducts = cache(() =>
  Promise.all(
    launchProductDefinitions.map(({ handle }) => getLaunchProduct(handle)),
  ),
);

/** Keep the public launch catalogue limited to the two independently sold products. */
export async function getStorefrontCatalogue(
  provider: Pick<CommerceProvider, "name" | "getProducts">,
) {
  const products = await provider.getProducts();
  return provider.name === "shopify" &&
    process.env.NOORLY_PUBLIC_PREVIEW === "true"
    ? products.filter(isLaunchProduct)
    : products;
}
