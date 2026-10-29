import { createHash } from "node:crypto";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** Verify the bytes just before publishing, not merely a hash-looking URL. */
export async function verifyAssetBytes(
  rawUrl: string,
  expectedHash: string,
  options: { env?: NodeJS.ProcessEnv; fetch?: typeof fetch } = {},
) {
  try {
    if (!/^[a-f0-9]{64}$/.test(expectedHash)) return false;
    const url = new URL(rawUrl);
    const env = options.env ?? process.env;
    const hosts = new Set([
      "cdn.shopify.com",
      ...(env.OPS_ASSET_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
    ]);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !hosts.has(url.hostname)
    )
      return false;
    const response = await (options.fetch ?? fetch)(url, {
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (
      !response.ok ||
      !["image/jpeg", "image/png", "image/webp"].includes(
        (response.headers.get("content-type") ?? "")
          .split(";")[0]
          .toLowerCase(),
      )
    )
      return false;
    if (Number(response.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES)
      return false;
    const reader = response.body?.getReader();
    if (!reader) return false;
    const hash = createHash("sha256");
    let count = 0;
    for (;;) {
      const item = await reader.read();
      if (item.done) break;
      count += item.value.byteLength;
      if (count > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return false;
      }
      hash.update(item.value);
    }
    return count > 0 && hash.digest("hex") === expectedHash;
  } catch {
    return false;
  }
}
