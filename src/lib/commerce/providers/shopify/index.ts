import { CommerceError } from "@/lib/commerce/errors";
import {
  hasUnsupportedPurchaseOption,
  isCartLineAvailable,
} from "@/lib/commerce/cart-availability";
import {
  cleanAttributes,
  validateIncomingLines,
} from "@/lib/commerce/validation";
import type {
  Cart,
  CartAttribute,
  CartLineInput,
  CommerceProvider,
  Locale,
} from "@/types/commerce";
import {
  mapShopifyCart,
  mapShopifyProduct,
  type ShopifyProduct,
} from "./mapping";
import * as queries from "./queries";

interface Connection {
  nodes: ShopifyProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}
interface MutationResult {
  cart: unknown;
  userErrors: { code?: string; message: string }[];
  warnings?: unknown;
}
interface StockVariant {
  id: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  requiresComponents: boolean;
  product?: {
    requiresSellingPlan: boolean;
    sellingPlanGroups: { nodes: { name: string }[] };
  };
  components?: {
    nodes: { quantity: number; productVariant: StockVariant }[];
    pageInfo: { hasNextPage: boolean };
  };
}
interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  products: Connection;
}
export class ShopifyCommerceProvider implements CommerceProvider {
  readonly name = "shopify" as const;
  constructor(
    private readonly config: {
      domain: string;
      token: string;
      apiVersion: string;
    },
    private readonly fetcher: typeof fetch = fetch,
  ) {}
  private async request<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(
        `https://${this.config.domain}/api/${this.config.apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": this.config.token,
          },
          body: JSON.stringify({ query, variables }),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        },
      );
    } catch {
      throw new CommerceError("provider_unavailable", 503);
    }
    if (!response.ok) throw new CommerceError("provider_unavailable", 503);
    const result = (await response.json()) as { data?: T; errors?: unknown[] };
    if (result.errors?.length || !result.data)
      throw new CommerceError("provider_request_failed", 502);
    return result.data;
  }
  private async mutation(
    operation: string,
    key: string,
    variables: Record<string, unknown> = {},
  ): Promise<Cart> {
    const data = await this.request<Record<string, MutationResult>>(
      operation,
      variables,
    );
    const result = data[key];
    if (!result || result.userErrors.length || !result.cart)
      throw new CommerceError("cart_update_failed", 409);
    return mapShopifyCart(result.cart, result.warnings ?? []);
  }
  private async catalogue(language: "SV" | "EN") {
    const products: ShopifyProduct[] = [];
    let after: string | null = null;
    for (let page = 0; page < 50; page++) {
      const data: { products: Connection } = await this.request(
        queries.PRODUCTS_QUERY,
        { language, after },
      );
      products.push(...data.products.nodes);
      if (!data.products.pageInfo.hasNextPage) return products;
      after = data.products.pageInfo.endCursor;
      if (!after) break;
    }
    throw new CommerceError("catalogue_limit", 502);
  }
  async getProducts() {
    const [sv, en] = await Promise.all([
      this.catalogue("SV"),
      this.catalogue("EN"),
    ]);
    return sv.map((product) =>
      mapShopifyProduct(
        product,
        en.find((english) => english.id === product.id),
      ),
    );
  }
  async getProductByHandle(handle: string) {
    const [sv, en] = await Promise.all(
      ["SV", "EN"].map((language) =>
        this.request<{ product: ShopifyProduct | null }>(
          queries.PRODUCT_QUERY,
          { handle, language },
        ),
      ),
    );
    return sv.product
      ? mapShopifyProduct(sv.product, en.product ?? undefined)
      : null;
  }
  async getCollectionByHandle(handle: string) {
    const load = async (language: "SV" | "EN") => {
      let after: string | null = null;
      let result: ShopifyCollection | null = null;
      const nodes: ShopifyProduct[] = [];
      for (let page = 0; page < 50; page++) {
        const data: { collection: ShopifyCollection | null } =
          await this.request(queries.COLLECTION_QUERY, {
            handle,
            language,
            after,
          });
        result = data.collection;
        if (!result) return null;
        nodes.push(...result.products.nodes);
        if (!result.products.pageInfo.hasNextPage)
          return { ...result, products: nodes };
        after = result.products.pageInfo.endCursor;
      }
      throw new CommerceError("catalogue_limit", 502);
    };
    const [sv, en] = await Promise.all([load("SV"), load("EN")]);
    if (!sv) return null;
    return {
      id: sv.id,
      handle: sv.handle,
      title: { sv: sv.title, en: en?.title ?? sv.title },
      description: {
        sv: sv.description,
        en: en?.description ?? sv.description,
      },
      products: sv.products.map((product) =>
        mapShopifyProduct(
          product,
          en?.products.find((item) => item.id === product.id),
        ),
      ),
    };
  }
  async createCart() {
    return this.mutation(queries.CART_CREATE, "cartCreate");
  }
  async getCart(cartId: string) {
    const result = await this.request<{ cart: unknown | null }>(
      queries.CART_QUERY,
      { id: cartId },
    );
    return result.cart ? mapShopifyCart(result.cart) : null;
  }
  async addCartLines(cartId: string, lines: CartLineInput[]) {
    return this.mutation(queries.CART_ADD, "cartLinesAdd", {
      cartId,
      lines: validateIncomingLines(lines),
    });
  }
  async updateCartLines(
    cartId: string,
    lines: { id: string; quantity: number }[],
  ) {
    return this.mutation(queries.CART_UPDATE, "cartLinesUpdate", {
      cartId,
      lines,
    });
  }
  async removeCartLines(cartId: string, lineIds: string[]) {
    return this.mutation(queries.CART_REMOVE, "cartLinesRemove", {
      cartId,
      lineIds,
    });
  }
  async updateCartAttributes(cartId: string, attributes: CartAttribute[]) {
    return this.mutation(queries.CART_ATTRIBUTES, "cartAttributesUpdate", {
      cartId,
      attributes: cleanAttributes(attributes),
    });
  }
  async getCheckoutUrl(cartId: string, locale: Locale = "sv") {
    const cart = await this.getCart(cartId);
    if (!cart?.lines.length) throw new CommerceError("empty_cart");
    if (cart.lines.some(hasUnsupportedPurchaseOption))
      throw new CommerceError("unsupported_purchase_option", 409);
    if (cart.lines.some((line) => !isCartLineAvailable(line)))
      throw new CommerceError("unavailable_product", 409);
    const availability = await this.validateAvailability(cart.lines);
    if (!availability.available)
      throw new CommerceError("unavailable_product", 409);
    const url = new URL(cart.checkoutUrl!);
    if (
      url.protocol !== "https:" ||
      !(
        url.hostname === this.config.domain ||
        url.hostname.endsWith(".myshopify.com") ||
        url.hostname.endsWith(".shopify.com") ||
        url.hostname === "checkout.shopify.com" ||
        (url.origin === "https://checkout.noorlynordic.com" &&
          !url.username &&
          !url.password)
      )
    )
      throw new CommerceError("invalid_checkout_url", 502);
    url.searchParams.set("locale", locale);
    return url.toString();
  }
  async validateAvailability(lines: CartLineInput[]) {
    const ids = [...new Set(lines.map((line) => line.merchandiseId))];
    if (!ids.length) return { available: true, unavailableVariantIds: [] };
    const result = await this.request<{ nodes: (StockVariant | null)[] }>(
      queries.AVAILABILITY_QUERY,
      { ids },
    );
    const unavailable = new Set<string>();
    const demand = new Map<
      string,
      {
        quantity: number;
        snapshots: StockVariant[];
        parents: Set<string>;
        component: boolean;
      }
    >();
    const addDemand = (
      variant: StockVariant,
      quantity: number,
      parent: string,
      component = false,
    ) => {
      const previous = demand.get(variant.id);
      demand.set(variant.id, {
        quantity: (previous?.quantity ?? 0) + quantity,
        snapshots: [...(previous?.snapshots ?? []), variant],
        parents: new Set([...(previous?.parents ?? []), parent]),
        component: component || Boolean(previous?.component),
      });
    };
    for (const line of lines) {
      const variant = result.nodes.find(
        (item) => item?.id === line.merchandiseId,
      );
      if (
        !variant ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        ("sellingPlanId" in line && Boolean(line.sellingPlanId)) ||
        typeof variant.requiresComponents !== "boolean" ||
        !variant.components ||
        variant.components.pageInfo?.hasNextPage !== false ||
        variant.requiresComponents !== variant.components.nodes.length > 0
      ) {
        unavailable.add(line.merchandiseId);
        continue;
      }
      addDemand(variant, line.quantity, line.merchandiseId);
      for (const component of variant.components.nodes) {
        if (
          !Number.isSafeInteger(component.quantity) ||
          component.quantity < 1 ||
          component.productVariant.requiresComponents !== false
        ) {
          unavailable.add(line.merchandiseId);
          continue;
        }
        addDemand(
          component.productVariant,
          line.quantity * component.quantity,
          line.merchandiseId,
          true,
        );
      }
    }
    for (const { quantity, snapshots, parents, component } of demand.values()) {
      if (
        snapshots.some(
          (variant) =>
            !variant.availableForSale ||
            variant.product?.requiresSellingPlan !== false ||
            variant.product.sellingPlanGroups?.nodes.length !== 0 ||
            (variant.quantityAvailable === null
              ? component
              : !Number.isSafeInteger(variant.quantityAvailable) ||
                variant.quantityAvailable < quantity),
        )
      )
        for (const parent of parents) unavailable.add(parent);
    }
    const unavailableVariantIds = ids.filter((id) => unavailable.has(id));
    return {
      available: unavailableVariantIds.length === 0,
      unavailableVariantIds,
    };
  }
}
