import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CartPage from "@/app/[locale]/cart/page";

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
vi.mock("@/features/cart/cart-view", () => ({
  CartView: () => <div>Live cart controls</div>,
}));
vi.mock("@/components/analytics/track-view", () => ({
  TrackView: () => null,
}));

describe("cart route release", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_PROVIDER", "shopify");
    vi.stubEnv("NOORLY_PUBLIC_PREVIEW", "true");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("renders the open sales cart even if the former public-preview flag remains set", async () => {
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "true");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
    render(await CartPage({ params: Promise.resolve({ locale: "en" }) }));
    expect(
      screen.getByRole("heading", { name: "Your bag" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Live cart controls")).toBeInTheDocument();
  });

  it("still redirects the genuine read-only public preview to the shop", async () => {
    vi.stubEnv("NOORLY_STOREFRONT_OPEN", "false");
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "true");
    await expect(
      CartPage({ params: Promise.resolve({ locale: "sv" }) }),
    ).rejects.toThrow("redirect:/sv/shop");
  });
});
