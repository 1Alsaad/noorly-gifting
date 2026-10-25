import type { NextConfig } from "next";

const previewHost =
  process.env.NODE_ENV === "development"
    ? process.env.NOORLY_DEV_PREVIEW_HOST?.trim()
    : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  ...(previewHost
    ? {
        allowedDevOrigins: [previewHost],
        // HTTP-only preview tunnels cannot carry React's debug WebSocket.
        // Deliver development hydration data over HTTP for these previews.
        experimental: { reactDebugChannel: false },
      }
    : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
  async redirects() {
    // Old public links must reach the same origin as the cart API before the
    // storefront renders. Preview deployments keep their own configured origin.
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.DEPLOYMENT_ENV !== "production" ||
      (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")
    )
      return [];
    let canonical: URL;
    try {
      canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    } catch {
      return [];
    }
    if (
      canonical.protocol !== "https:" ||
      canonical.username ||
      canonical.password ||
      canonical.hostname === "noorly-gifting.vercel.app"
    )
      return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "noorly-gifting\\.vercel\\.app" }],
        destination: `${canonical.origin}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "X-Frame-Options", value: "DENY" },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default nextConfig;
