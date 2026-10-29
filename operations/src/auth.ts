import { timingSafeEqual, createHmac } from "node:crypto";

export function constantEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function bearer(
  request: Request,
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const secret = env[name];
  return Boolean(
    secret &&
    secret.length >= 32 &&
    constantEqual(
      request.headers.get("authorization") ?? "",
      `Bearer ${secret}`,
    ),
  );
}
export function owner(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const password = env.OPS_OPERATOR_PASSWORD;
  if (!password || password.length < 32) return false;
  const expected = Buffer.from(
    `${env.OPS_OPERATOR_USER ?? "noorly"}:${password}`,
  ).toString("base64");
  return constantEqual(
    request.headers.get("authorization") ?? "",
    `Basic ${expected}`,
  );
}
export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}
export function unauthorized(): Response {
  return Response.json(
    { error: "Authentication required" },
    {
      status: 401,
      headers: {
        "www-authenticate": 'Basic realm="Noorly Operations"',
        "cache-control": "no-store",
      },
    },
  );
}
export function verifyShopifyWebhook(
  body: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  return Boolean(
    secret &&
    signature &&
    constantEqual(
      signature,
      createHmac("sha256", secret).update(body).digest("base64"),
    ),
  );
}
