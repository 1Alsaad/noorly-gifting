import "server-only";

import { cache } from "react";
import {
  launchBundleHandle,
  plannedLaunchBundle,
} from "@/content/launch-bundle";
import { isProductTestMode } from "@/config/product-test";
import { getCommerceProvider } from "@/lib/commerce";
import { CommerceError } from "@/lib/commerce/errors";
import { isStorefrontOpen } from "@/lib/commerce/launch";
import type { CommerceProvider, Product, ProductImage } from "@/types/commerce";

const LAUNCH_PRODUCT_ID = "gid://shopify/Product/11401864249686";

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

/** Resolve the real kit without turning a mock, draft or incomplete product into stock. */
export async function resolveLaunchProduct(
  provider: Pick<
    CommerceProvider,
    "name" | "getProductByHandle"
  > = getCommerceProvider(),
): Promise<LaunchProductState> {
  const salesOpen = isStorefrontOpen() && !isProductTestMode();
  const preparation: LaunchProductState = {
    product: plannedLaunchBundle,
    source: "preparation",
    salesOpen,
    purchasable: false,
  };
  // The closed preview contains verified photographs and confirmed contents,
  // but no sellable variants. It must remain readable during catalog setup.
  if (!salesOpen || provider.name !== "shopify") return preparation;

  // Once sales open, provider failures still propagate and never become stock.
  const found = await provider.getProductByHandle(launchBundleHandle);
  if (!found) return preparation;
  if (found.id !== LAUNCH_PRODUCT_ID || found.handle !== launchBundleHandle)
    throw new CommerceError("invalid_launch_product", 502);

  const images = found.images.filter(supportedImage);
  const variants = found.variants.map((variant) => {
    const variantImages = variant.images?.filter(supportedImage);
    return {
      ...variant,
      images: variantImages?.length ? variantImages : undefined,
      available:
        variant.available &&
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
export const getLaunchProduct = cache(() => resolveLaunchProduct());
