export function contentSecurityPolicy(
  nonce: string,
  production: boolean,
  posthogHost?: string,
  sentryDsn?: string,
) {
  const optionalOrigin = (value?: string) => {
    try {
      return value ? new URL(value).origin : "";
    } catch {
      return "";
    }
  };
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.shopify.com https://www.facebook.com",
    "font-src 'self'",
    "media-src 'self' blob: https://d2ol7oe51mr4n9.cloudfront.net",
    `connect-src 'self' https://monorail-edge.shopifysvc.com https://www.facebook.com https://connect.facebook.net https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com ${optionalOrigin(posthogHost)} ${optionalOrigin(sentryDsn)}${production ? "" : " ws: wss:"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
