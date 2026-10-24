export const PRODUCT_FRAGMENT = `fragment ProductFields on Product {
  id handle title description availableForSale productType tags
  requiresSellingPlan
  sellingPlanGroups(first: 1) { nodes { name } }
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  images(first: 8) { nodes { url altText } }
  variants(first: 100) { nodes { id title sku availableForSale price { amount currencyCode } image { url altText } selectedOptions { name value } } }
}`;
export const CART_FRAGMENT = `${PRODUCT_FRAGMENT}
fragment CartFields on Cart {
  id checkoutUrl totalQuantity attributes { key value }
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) { nodes { id quantity attributes { key value }
    sellingPlanAllocation { sellingPlan { id } }
    merchandise { ... on ProductVariant { id title sku availableForSale price { amount currencyCode } image { url altText } selectedOptions { name value } product { ...ProductFields } } }
  } }
}`;
export const PRODUCTS_QUERY = `${PRODUCT_FRAGMENT} query Products($after: String, $language: LanguageCode!) @inContext(country: SE, language: $language) { products(first: 100, after: $after) { nodes { ...ProductFields } pageInfo { hasNextPage endCursor } } }`;
export const PRODUCT_QUERY = `${PRODUCT_FRAGMENT} query Product($handle: String!, $language: LanguageCode!) @inContext(country: SE, language: $language) { product(handle: $handle) { ...ProductFields } }`;
export const COLLECTION_QUERY = `${PRODUCT_FRAGMENT} query Collection($handle: String!, $after: String, $language: LanguageCode!) @inContext(country: SE, language: $language) { collection(handle: $handle) { id handle title description products(first: 100, after: $after) { nodes { ...ProductFields } pageInfo { hasNextPage endCursor } } } }`;
export const CART_QUERY = `${CART_FRAGMENT} query Cart($id: ID!) { cart(id: $id) { ...CartFields } }`;
export const CART_CREATE = `${CART_FRAGMENT} mutation CartCreate { cartCreate(input: { buyerIdentity: { countryCode: SE } }) { cart { ...CartFields } userErrors { code message } } }`;
export const CART_ADD = `${CART_FRAGMENT} mutation CartAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { code message } } }`;
export const CART_UPDATE = `${CART_FRAGMENT} mutation CartUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { code message } } }`;
export const CART_REMOVE = `${CART_FRAGMENT} mutation CartRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } userErrors { code message } } }`;
export const CART_ATTRIBUTES = `${CART_FRAGMENT} mutation CartAttributes($cartId: ID!, $attributes: [AttributeInput!]!) { cartAttributesUpdate(cartId: $cartId, attributes: $attributes) { cart { ...CartFields } userErrors { code message } } }`;
export const AVAILABILITY_QUERY = `query Availability($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on ProductVariant {
      id availableForSale quantityAvailable
      product { requiresSellingPlan sellingPlanGroups(first: 1) { nodes { name } } }
    }
  }
}`;
