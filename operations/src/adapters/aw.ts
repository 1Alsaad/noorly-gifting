import { requestJson } from "./http.js";
import {
  isRecord,
  readiness,
  unavailable,
  type AdapterOptions,
  type Env,
  type ExternalResult,
} from "./types.js";

export const AW_REFERENCES = [
  "https://www.aw-dropship.eu/docs/manual-and-api-channel",
  "https://www.aw-dropship.eu/docs/creating-clients-with-the-api",
  "https://www.aw-dropship.eu/docs/shopify-order-status",
];
export type AwConfig = {
  apiToken?: string;
  environment?: "production" | "staging";
  fulfillmentMode?: "native-shopify" | "manual-api";
};
export type AwAuthentication = {
  authenticated: true;
  environment: "production" | "staging";
  clientReadAccess: true;
  orderWriteAccess: "unverified";
  fulfillmentMode: "native-shopify" | "manual-api";
};
export function awConfigFromEnv(env: Env = process.env): AwConfig {
  return {
    apiToken: env.AW_API_TOKEN,
    environment:
      env.AW_API_ENVIRONMENT === "staging"
        ? "staging"
        : env.AW_API_ENVIRONMENT === "production"
          ? "production"
          : undefined,
    fulfillmentMode:
      env.AW_FULFILLMENT_MODE === "native-shopify"
        ? "native-shopify"
        : env.AW_FULFILLMENT_MODE === "manual-api"
          ? "manual-api"
          : undefined,
  };
}
export function createAwAdapter(
  config: AwConfig,
  options: AdapterOptions = {},
) {
  const ready = () =>
    readiness(
      {
        AW_API_TOKEN: config.apiToken,
        AW_API_ENVIRONMENT: config.environment,
        AW_FULFILLMENT_MODE: config.fulfillmentMode,
      },
      [
        "Authentication proves client read access only; it does not prove order or price access.",
        "Full order and product API schemas must be retrieved from the authenticated AW channel documentation before those operations can be implemented.",
        "Native Shopify fulfillment and manual API order submission must never both process the same order.",
        "AW can charge the wallet or saved card immediately; even Shopify test orders sent to AW can become paid real shipments.",
      ],
    );
  return {
    readiness: ready,
    async qualifyAuthentication(): Promise<ExternalResult<AwAuthentication>> {
      if (!ready().ready) return unavailable(ready());
      const base =
        config.environment === "staging"
          ? "https://api.aiku-sandbox.uk"
          : "https://api.aiku.io";
      const response = await requestJson(
        `${base}/dropshipping/clients`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            Accept: "application/json",
          },
        },
        options,
      );
      if (response.status !== "succeeded")
        return { status: response.status, reason: response.reason };
      if (
        !isRecord(response.data) ||
        !Array.isArray(response.data.data) ||
        response.data.data.some(
          (client) =>
            !isRecord(client) ||
            !(
              typeof client.id === "number" &&
              Number.isSafeInteger(client.id) &&
              client.id > 0
            ),
        )
      )
        return {
          status: "unknown",
          reason:
            "AW authentication response does not match the documented client collection",
        };
      return {
        status: "succeeded",
        data: {
          authenticated: true,
          environment: config.environment!,
          clientReadAccess: true,
          orderWriteAccess: "unverified",
          fulfillmentMode: config.fulfillmentMode!,
        },
      };
    },
    async submitOrder(): Promise<ExternalResult> {
      return {
        status: "rejected",
        reason:
          config.fulfillmentMode === "native-shopify"
            ? "AW native Shopify integration owns fulfillment; manual submission would risk a duplicate supplier order"
            : "AW order submission unavailable until the authenticated channel order schema, inventory, Sweden shipping quote, and idempotency behavior are verified",
      };
    },
  };
}
