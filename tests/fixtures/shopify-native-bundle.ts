const money = (amount: number) => ({
  amount: amount.toFixed(2),
  currencyCode: "SEK" as const,
});
const cost = (amount: number, quantity: number) => ({
  amountPerQuantity: money(amount),
  subtotalAmount: money(amount * quantity),
  totalAmount: money(amount * quantity),
});

export function nativeBundleFixture(quantity = 1) {
  const purchase = {
    requiresSellingPlan: false,
    sellingPlanGroups: { nodes: [] as { name: string }[] },
  };
  const bowl = {
    id: "gid://shopify/ProductVariant/100",
    title: "Default Title",
    sku: "TeakB-37",
    availableForSale: true,
    requiresComponents: false,
    quantityAvailable: 20 as number | null,
    price: money(550),
    image: { url: "https://cdn.shopify.com/bowl.jpg", altText: "Teak bowl" },
    selectedOptions: [{ name: "Title", value: "Default Title" }],
    product: {
      ...purchase,
      id: "gid://shopify/Product/100",
      handle: "teak-bowl",
      title: "Decorative teak bowl",
    },
  };
  const sand = {
    ...bowl,
    id: "gid://shopify/ProductVariant/201",
    title: "Dusty Rose · Maison de Roses",
    sku: "CSand-07",
    price: money(249),
    image: {
      url: "https://cdn.shopify.com/sand-07.jpg",
      altText: "Rose candle sand",
    },
    selectedOptions: [
      { name: "Colour and scent", value: "Dusty Rose · Maison de Roses" },
    ],
    product: {
      ...purchase,
      id: "gid://shopify/Product/200",
      handle: "candle-sand",
      title: "Candle sand 300 g with four wicks",
    },
  };
  const variant = {
    ...sand,
    id: "gid://shopify/ProductVariant/300",
    sku: "NOORLY-LJUSSTUND-CSand-07",
    price: money(799),
    requiresComponents: true,
    components: {
      nodes: [
        { quantity: 1, productVariant: bowl },
        { quantity: 1, productVariant: sand },
      ],
      pageInfo: { hasNextPage: false },
    },
    product: purchase,
  };
  const product = {
    ...purchase,
    id: "gid://shopify/Product/300",
    handle: "noorly-ljusstund-teakskal-och-ljussand",
    title: "Noorly Ljusstund",
    description: "One decorative bowl and one selected candle-sand pack.",
    availableForSale: true,
    productType: "box",
    tags: [],
    priceRange: { minVariantPrice: money(799) },
    images: { nodes: [bowl.image, sand.image] },
    variants: { nodes: [variant] },
  };
  const cart = {
    id: "gid://shopify/Cart/native-bundle?key=private",
    checkoutUrl: "https://checkout.noorlynordic.com/checkouts/native-bundle",
    totalQuantity: quantity,
    attributes: [],
    cost: { subtotalAmount: money(799 * quantity) },
    lines: {
      nodes: [
        {
          __typename: "ComponentizableCartLine",
          id: "gid://shopify/CartLine/kit",
          quantity,
          attributes: [],
          sellingPlanAllocation: null,
          cost: cost(799, quantity),
          merchandise: { ...variant, product },
          lineComponents: [
            {
              id: "gid://shopify/CartLine/bowl",
              quantity,
              attributes: [],
              sellingPlanAllocation: null,
              cost: cost(550, quantity),
              merchandise: bowl,
            },
            {
              id: "gid://shopify/CartLine/sand",
              quantity,
              attributes: [],
              sellingPlanAllocation: null,
              cost: cost(249, quantity),
              merchandise: sand,
            },
          ],
        },
      ],
    },
  };
  return { product, variant, bowl, sand, cart };
}
