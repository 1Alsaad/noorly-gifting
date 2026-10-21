import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCommerceProvider } from "@/lib/commerce";
import { isStorefrontOpen } from "@/lib/commerce/launch";
import {
  signCartReference,
  verifyCartReference,
} from "@/lib/commerce/cart-cookie";
import { CommerceError } from "@/lib/commerce/errors";
import { enrichCartProducts } from "@/lib/commerce/cart-presentation";
import { encodeMockCart } from "@/lib/commerce/providers/mock/cookie";
import {
  cartActionSchema,
  cleanAttributes,
  validateCart,
} from "@/lib/commerce/validation";
import { getEnv } from "@/lib/env/server";
import {
  assertSameOrigin,
  HttpError,
  rateLimit,
  readJson,
  safeError,
} from "@/lib/security/request";
import type {
  Cart,
  CartLineInput,
  CommerceProvider,
  Product,
} from "@/types/commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const COOKIE = "stilla_cart";
function secret() {
  return (
    getEnv().CART_COOKIE_SECRET || "local-development-cookie-key-do-not-deploy"
  );
}
function publicCart(cart: Cart | null): Cart | null {
  if (!cart) return null;
  const { checkoutUrl: _checkoutUrl, ...summary } = cart;
  void _checkoutUrl;
  return {
    ...summary,
    id: createHash("sha256").update(cart.id).digest("hex").slice(0, 32),
  };
}
async function load(provider: CommerceProvider) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const reference =
    provider.name === "mock" ? token : verifyCartReference(token, secret());
  return reference ? provider.getCart(reference) : null;
}
function respond(cart: Cart, extra: Record<string, unknown> = {}) {
  const token =
    getEnv().NEXT_PUBLIC_COMMERCE_PROVIDER === "mock"
      ? encodeMockCart(cart, secret())
      : signCartReference(cart.id, secret());
  const response = NextResponse.json(
    { cart: publicCart(cart), ...extra },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
  return response;
}
function failed(error: unknown) {
  return safeError(
    error instanceof CommerceError
      ? new HttpError(error.status, error.code.toUpperCase())
      : error,
  );
}
function bundleLines(cart: Cart, lineId: string) {
  const line = cart.lines.find((item) => item.id === lineId);
  if (!line) throw new CommerceError("line_not_found");
  const bundle = line.attributes.find(({ key }) => key === "bundle_id")?.value;
  return bundle
    ? cart.lines.filter((item) =>
        item.attributes.some(
          ({ key, value }) => key === "bundle_id" && value === bundle,
        ),
      )
    : [line];
}
function projectedAdd(
  cart: Cart,
  inputs: CartLineInput[],
  catalogue: Product[],
): Cart {
  const projected = structuredClone(cart);
  for (const input of inputs) {
    const product = catalogue.find((item) =>
      item.variants.some((variant) => variant.id === input.merchandiseId),
    );
    const variant = product?.variants.find(
      (item) => item.id === input.merchandiseId,
    );
    if (!product || !variant) throw new CommerceError("unavailable_product");
    const attributes = cleanAttributes(input.attributes);
    const existing = projected.lines.find(
      (line) =>
        line.merchandiseId === input.merchandiseId &&
        JSON.stringify(line.attributes) === JSON.stringify(attributes),
    );
    if (existing) existing.quantity += input.quantity;
    else
      projected.lines.push({
        id: `pending-${projected.lines.length}`,
        merchandiseId: input.merchandiseId,
        product,
        variant,
        quantity: input.quantity,
        attributes,
      });
  }
  projected.totalQuantity = projected.lines.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );
  validateCart(projected, catalogue);
  return projected;
}
export async function GET() {
  if (!isStorefrontOpen())
    return NextResponse.json(
      { cart: null, storeClosed: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  try {
    const provider = getCommerceProvider();
    const cart = await load(provider);
    return NextResponse.json(
      {
        cart: publicCart(
          cart?.lines.length
            ? enrichCartProducts(cart, await provider.getProducts())
            : cart,
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failed(error);
  }
}
export async function POST(request: Request) {
  if (!isStorefrontOpen())
    return NextResponse.json(
      { error: "STOREFRONT_CLOSED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  try {
    assertSameOrigin(request);
    await rateLimit(request, "cart", 45, 60);
    const raw = await readJson(request);
    // Accept the explicit action name, with `type` supported for typed client reducers.
    const normalized =
      typeof raw === "object" &&
      raw !== null &&
      "type" in raw &&
      !("action" in raw)
        ? Object.fromEntries(
            Object.entries(raw).map(([key, value]) => [
              key === "type" ? "action" : key,
              value,
            ]),
          )
        : raw;
    const parsed = cartActionSchema.safeParse(normalized);
    if (!parsed.success) throw new HttpError(400, "INVALID_CART_ACTION");
    const action = parsed.data;
    const provider = getCommerceProvider();
    let cart = await load(provider);
    if (!cart) {
      if (action.action !== "add") throw new CommerceError("empty_cart");
      cart = await provider.createCart();
    }
    const catalogue = await provider.getProducts();
    // Refresh availability and bilingual presentation from the catalogue before mutations.
    cart = enrichCartProducts(cart, catalogue);
    if (action.action === "replace_bundle") {
      const exists = cart.lines.some((line) =>
        line.attributes.some(
          ({ key, value }) => key === "bundle_id" && value === action.bundleId,
        ),
      );
      if (
        !exists ||
        action.lines.some(
          (line) =>
            !line.attributes?.some(
              ({ key, value }) =>
                key === "bundle_id" && value === action.bundleId,
            ),
        )
      )
        throw new CommerceError("invalid_bundle");
      const kept = cart.lines.filter(
        (line) =>
          !line.attributes.some(
            ({ key, value }) =>
              key === "bundle_id" && value === action.bundleId,
          ),
      );
      const projected = projectedAdd(
        {
          ...cart,
          lines: kept,
          totalQuantity: kept.reduce((sum, line) => sum + line.quantity, 0),
        },
        action.lines,
        catalogue,
      );
      if (!(await provider.validateAvailability(projected.lines)).available)
        throw new CommerceError("unavailable_product", 409);
      const attributes = cart.attributes;
      const next = await provider.createCart();
      cart = await provider.addCartLines(
        next.id,
        projected.lines.map((line) => ({
          merchandiseId: line.merchandiseId,
          quantity: line.quantity,
          attributes: line.attributes,
        })),
      );
      if (attributes.length)
        cart = await provider.updateCartAttributes(cart.id, attributes);
    } else if (action.action === "add") {
      const projected = projectedAdd(cart, action.lines, catalogue);
      if (!(await provider.validateAvailability(projected.lines)).available)
        throw new CommerceError("unavailable_product", 409);
      cart = await provider.addCartLines(cart.id, action.lines);
    } else if (action.action === "update") {
      const group = bundleLines(cart, action.lineId);
      const updates = group.map((line) => ({
        id: line.id,
        quantity: action.quantity,
      }));
      const projected = structuredClone(cart);
      for (const line of projected.lines)
        if (updates.some((update) => update.id === line.id))
          line.quantity = action.quantity;
      projected.totalQuantity = projected.lines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      );
      validateCart(projected, catalogue);
      if (!(await provider.validateAvailability(projected.lines)).available)
        throw new CommerceError("unavailable_product", 409);
      cart = await provider.updateCartLines(cart.id, updates);
    } else if (action.action === "remove") {
      const currentCart = cart;
      const ids = [
        ...new Set(
          action.lineIds.flatMap((id) =>
            bundleLines(currentCart, id).map((line) => line.id),
          ),
        ),
      ];
      cart = await provider.removeCartLines(cart.id, ids);
    } else if (action.action === "attributes") {
      if (
        action.attributes.some(
          ({ key }) =>
            key === "bundle_id" || key === "bundle_role" || key === "box_size",
        )
      )
        throw new CommerceError("invalid_attributes");
      cart = await provider.updateCartAttributes(cart.id, action.attributes);
    } else {
      validateCart(cart, catalogue);
      if (!cart.lines.length) throw new CommerceError("empty_cart");
      const checkoutAttributes = cleanAttributes(
        action.attributes ?? [],
      ).filter(({ key }) => key.startsWith("_stilla_analytics_"));
      // Missing consent explicitly clears any prior consent from this cart.
      if (
        !checkoutAttributes.some(
          ({ key }) => key === "_stilla_analytics_consent",
        )
      )
        checkoutAttributes.push({
          key: "_stilla_analytics_consent",
          value: "denied",
        });
      if (
        !checkoutAttributes.some(
          ({ key }) => key === "_stilla_analytics_session",
        )
      )
        checkoutAttributes.push({
          key: "_stilla_analytics_session",
          value: "",
        });
      const merged = [
        ...cart.attributes.filter(
          ({ key }) =>
            !key.startsWith("_stilla_analytics_") && key !== "locale",
        ),
        ...checkoutAttributes,
        { key: "locale", value: action.locale },
      ];
      cart = await provider.updateCartAttributes(cart.id, merged);
      const url = await provider.getCheckoutUrl(cart.id, action.locale);
      return respond(enrichCartProducts(cart, catalogue), { url });
    }
    cart = enrichCartProducts(cart, catalogue);
    validateCart(cart, catalogue);
    return respond(cart);
  } catch (error) {
    return failed(error);
  }
}
