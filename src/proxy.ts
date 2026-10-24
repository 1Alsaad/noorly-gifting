import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/security/csp";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "production",
    process.env.NEXT_PUBLIC_POSTHOG_HOST,
    process.env.NEXT_PUBLIC_SENTRY_DSN,
  );
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set(
    "x-locale",
    request.nextUrl.pathname.split("/")[1] === "en" ? "en" : "sv",
  );
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  if (
    process.env.NOORLY_PUBLIC_PREVIEW === "true" &&
    process.env.NOORLY_STOREFRONT_OPEN === "false"
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (
    request.nextUrl.pathname.startsWith("/admin-preview") ||
    request.cookies.has("noorly_admin_preview")
  ) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.append("Vary", "Cookie");
  }
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Request-ID", crypto.randomUUID());
  return response;
}
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|media|images).*)",
  ],
};
