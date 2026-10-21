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
