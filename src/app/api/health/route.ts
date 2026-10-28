import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env/server";
import { getCommerceProvider } from "@/lib/commerce";
import { CommerceError } from "@/lib/commerce/errors";
import { launchProductDefinitions } from "@/content/launch-catalog";
import {
  getManagedCatalog,
  applyManagedProduct,
} from "@/lib/commerce/managed-catalog";

const publicCatalogErrors = new Set([
  "provider_unavailable",
  "provider_request_failed",
  "provider_query_limit",
  "provider_access_denied",
  "invalid_provider_response",
  "bundle_components_unavailable",
  "unsupported_currency",
  "invalid_launch_product",
]);

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    getEnv();
    if (new URL(request.url).searchParams.get("catalog") === "1") {
      try {
        const provider = getCommerceProvider();
        const managed = await getManagedCatalog();
        const products = await Promise.all(
          (managed?.products ?? launchProductDefinitions).map(
            async ({ id, handle }) => {
              const product = await provider.getProductByHandle(handle);
              if (product && (product.id !== id || product.handle !== handle))
                throw new CommerceError("invalid_launch_product", 502);
              if (managed && product) {
                if (provider.name !== "shopify")
                  throw new CommerceError(
                    "managed_catalog_requires_shopify",
                    503,
                  );
                const definition = managed.products.find(
                  (item) => item.id === id,
                )!;
                applyManagedProduct(
                  product,
                  definition,
                  managed.version,
                  false,
                );
              }
              return product;
            },
          ),
        );
        const complete = products.every(Boolean);
        return Response.json(
          { status: complete ? "ok" : "catalog_unpublished", requestId },
          {
            status: complete ? 200 : 503,
            headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
          },
        );
      } catch (error) {
        // Return only fixed operational categories, never provider messages,
        // tokens, product details, customer data or arbitrary query results.
        const status =
          error instanceof CommerceError && publicCatalogErrors.has(error.code)
            ? error.code
            : "catalog_unavailable";
        return Response.json(
          { status, requestId },
          {
            status: 503,
            headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
          },
        );
      }
    }
    return Response.json(
      { status: "ok", service: "stilla", requestId },
      { headers: { "Cache-Control": "no-store", "X-Request-ID": requestId } },
    );
  } catch {
    return Response.json(
      { status: "configuration_required", requestId },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
