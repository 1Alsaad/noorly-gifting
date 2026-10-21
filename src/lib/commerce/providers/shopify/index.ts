import { CommerceError } from "@/lib/commerce/errors";
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
    return mapShopifyCart(result.cart);
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
    const validLines = validateIncomingLines(lines);
    if (!(await this.validateAvailability(validLines)).available)
      throw new CommerceError("unavailable_product", 409);
    return this.mutation(queries.CART_ADD, "cartLinesAdd", {
      cartId,
      lines: validLines,
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
    if (cart.lines.some((line) => line.sellingPlanId))
      throw new CommerceError("purchase_option_not_ready", 409);
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
        url.hostname === "checkout.shopify.com"
      )
    )
      throw new CommerceError("invalid_checkout_url", 502);
    url.searchParams.set("locale", locale);
    return url.toString();
  }
  async validateAvailability(lines: CartLineInput[]) {
    const ids = [...new Set(lines.map((line) => line.merchandiseId))];
    const result = await this.request<{
      nodes: ({
        id: string;
        availableForSale: boolean;
        quantityAvailable: number | null;
        product: {
          requiresSellingPlan: boolean;
          sellingPlanGroups: { nodes: { id: string }[] };
        };
      } | null)[];
    }>(
      "query Availability($ids:[ID!]!) { nodes(ids:$ids) { ... on ProductVariant { id availableForSale quantityAvailable product { requiresSellingPlan sellingPlanGroups(first:1) { nodes { id } } } } } }",
      { ids },
    );
    for (const variant of result.nodes) {
      if (!variant) continue;
      if (
        !variant.product ||
        typeof variant.product.requiresSellingPlan !== "boolean" ||
        !Array.isArray(variant.product.sellingPlanGroups?.nodes)
      )
        throw new CommerceError("invalid_provider_response", 502);
      if (
        variant.product.requiresSellingPlan ||
        variant.product.sellingPlanGroups.nodes.length > 0
      )
        throw new CommerceError("purchase_option_not_ready", 409);
    }
    const unavailableVariantIds = ids.filter((id) => {
      const variant = result.nodes.find((item) => item?.id === id);
      const quantity = lines
        .filter((line) => line.merchandiseId === id)
        .reduce((sum, line) => sum + line.quantity, 0);
      return (
        !variant?.availableForSale ||
        (variant.quantityAvailable !== null &&
          variant.quantityAvailable < quantity)
      );
    });
    return {
      available: unavailableVariantIds.length === 0,
      unavailableVariantIds,
    };
  }
}
