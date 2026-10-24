import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env/server";
import { getCommerceProvider } from "@/lib/commerce";
import { CommerceError } from "@/lib/commerce/errors";
import { launchBundleHandle } from "@/content/launch-bundle";

const publicCatalogErrors = new Set([
  "provider_unavailable",
  "provider_request_failed",
  "provider_query_limit",
  "provider_access_denied",
  "invalid_provider_response",
  "bundle_components_unavailable",
  "unsupported_currency",
]);

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    getEnv();
    if (new URL(request.url).searchParams.get("catalog") === "1") {
      try {
        const product =
          await getCommerceProvider().getProductByHandle(launchBundleHandle);
        return Response.json(
          { status: product ? "ok" : "catalog_unpublished", requestId },
          {
            status: product ? 200 : 503,
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
