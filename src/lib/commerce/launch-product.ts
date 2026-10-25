import "server-only";

import { cache } from "react";
import {
  candleSandHandle,
  launchProductDefinitions,
  teakBowlHandle,
} from "@/content/launch-catalog";
import { launchBundleHandle } from "@/content/launch-bundle";
import { isProductTestMode } from "@/config/product-test";
import { getCommerceProvider } from "@/lib/commerce";
import { CommerceError } from "@/lib/commerce/errors";
import { isStorefrontOpen } from "@/lib/commerce/launch";
import type {
  CommerceProvider,
  Product,
  ProductImage,
  ProductVariant,
} from "@/types/commerce";

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

// These existing native bundle variants share the standalone component stock.
// A changed relationship must not silently sell a different colour or contents.
const bundleSandVariants: Record<string, readonly [string, string]> = {
  "56138148413782": ["55883112087894", "CSand-11"],
  "56138148446550": ["55883112120662", "CSand-01"],
  "56138148479318": ["55883112153430", "CSand-02"],
  "56138148512086": ["55883112186198", "CSand-03"],
  "56138148544854": ["55883112218966", "CSand-04"],
  "56138148577622": ["55883112251734", "CSand-05"],
  "56138148610390": ["55883112284502", "CSand-06"],
  "56138148643158": ["55883112317270", "CSand-07"],
  "56138148675926": ["55883112350038", "CSand-08"],
  "56138148708694": ["55883112382806", "CSand-09"],
  "56138148741462": ["55883112415574", "CSand-10"],
};

function supportedContents(product: Product, variant: ProductVariant) {
  if (product.handle !== launchBundleHandle)
    return !variant.requiresComponents && !variant.components?.length;

  const expected =
    bundleSandVariants[variant.id.replace("gid://shopify/ProductVariant/", "")];
  const components = variant.components ?? [];
  if (
    product.id !== "gid://shopify/Product/11401864249686" ||
    !expected ||
    variant.requiresComponents !== true ||
    components.length !== 2 ||
    components.some(
      ({ quantity, product: componentProduct, variant: component }) =>
        quantity !== 1 ||
        !component.available ||
        component.requiresComponents !== false ||
        Boolean(component.components?.length) ||
        componentProduct.requiresSellingPlan !== false ||
        componentProduct.hasSellingPlans !== false ||
        component.price.currencyCode !== "SEK" ||
        !Number.isFinite(component.price.amount) ||
        component.price.amount <= 0,
    )
  )
    return false;

  return (
    components.some(
      ({ product: componentProduct, variant: component }) =>
        componentProduct.id === "gid://shopify/Product/11382623273302" &&
        componentProduct.handle === candleSandHandle &&
        component.id === `gid://shopify/ProductVariant/${expected[0]}` &&
        component.sku === expected[1],
    ) &&
    components.some(
      ({ product: componentProduct, variant: component }) =>
        componentProduct.id === "gid://shopify/Product/11401864216918" &&
        componentProduct.handle === teakBowlHandle &&
        component.id === "gid://shopify/ProductVariant/56138148118870",
    )
  );
}

/** Apply the same launch contract to the detail page and server-side cart catalogue. */
function prepareLaunchProduct(found: Product, salesOpen: boolean): Product {
  const images = found.images.filter(supportedImage);
  const variants = found.variants.map((variant) => {
    const variantImages = variant.images?.filter(supportedImage);
    return {
      ...variant,
      images: variantImages?.length ? variantImages : undefined,
      available:
        variant.available &&
        supportedContents(found, variant) &&
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
    ...found,
    images,
    variants: variants.map((variant) => ({
      ...variant,
      available: purchasable && variant.available,
    })),
    available: purchasable,
    previewOnly: !purchasable,
  };
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

  const product = prepareLaunchProduct(found, salesOpen);
  return {
    source: "shopify",
    salesOpen,
    purchasable: product.available,
    product,
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

/** Limit the public catalogue to the verified separate products and native set. */
export async function getStorefrontCatalogue(
  provider: Pick<CommerceProvider, "name" | "getProducts">,
) {
  const products = await provider.getProducts();
  return provider.name === "shopify" &&
    process.env.NOORLY_PUBLIC_PREVIEW === "true"
    ? products
        .filter(isLaunchProduct)
        .map((product) =>
          prepareLaunchProduct(
            product,
            isStorefrontOpen() && !isProductTestMode(),
          ),
        )
    : products;
}
