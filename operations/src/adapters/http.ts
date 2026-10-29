import { isRecord, type AdapterOptions, type ExternalResult } from "./types.js";

/** No automatic retries: even a lost response can follow a completed external write. */
export async function requestJson(
  url: string,
  init: RequestInit,
  options: AdapterOptions = {},
): Promise<ExternalResult<unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 20_000,
  );
  try {
    const response = await (options.fetch ?? fetch)(url, {
      ...init,
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      // Do not expose provider bodies: they can contain credentials, customer data or submitted content.
      return {
        status:
          response.status >= 500 || response.status === 408
            ? "unknown"
            : "rejected",
        reason: `Provider HTTP ${response.status}`,
      };
    }
    try {
      return { status: "succeeded", data: await response.json() };
    } catch {
      return {
        status: "unknown",
        reason:
          "Provider response was not valid JSON; outcome requires reconciliation",
      };
    }
  } catch {
    return {
      status: "unknown",
      reason:
        "Network request failed or timed out; outcome requires reconciliation",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestGraphql(
  url: string,
  headers: Record<string, string>,
  query: string,
  variables: Record<string, unknown>,
  options: AdapterOptions,
  write = false,
): Promise<ExternalResult<Record<string, unknown>>> {
  const response = await requestJson(
    url,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    },
    options,
  );
  if (response.status !== "succeeded")
    return { status: response.status, reason: response.reason };
  if (!isRecord(response.data))
    return { status: "unknown", reason: "Invalid GraphQL response" };
  if (Array.isArray(response.data.errors) && response.data.errors.length) {
    return {
      status: write ? "unknown" : "rejected",
      reason: "Provider returned GraphQL errors; no complete success confirmed",
    };
  }
  if (!isRecord(response.data.data))
    return { status: "unknown", reason: "GraphQL response is missing data" };
  return { status: "succeeded", data: response.data.data };
}
