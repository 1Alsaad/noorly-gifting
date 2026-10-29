import { requestJson } from "./http.js";
import {
  actionKeyValid,
  isRecord,
  nonempty,
  readiness,
  unavailable,
  type AdapterOptions,
  type Env,
  type ExternalResult,
} from "./types.js";

export const RESEND_REFERENCES = [
  "https://resend.com/docs/api-reference/emails/send-email",
  "https://resend.com/docs/dashboard/emails/idempotency-keys",
];
export type ResendConfig = { apiKey?: string; from?: string };
export type EmailMessage = {
  actionKey: string;
  to: string[];
  subject: string;
  text: string;
};
const emailValid = (value: string) =>
  /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

export function resendConfigFromEnv(env: Env = process.env): ResendConfig {
  return { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM_EMAIL };
}
export function createResendAdapter(
  config: ResendConfig,
  options: AdapterOptions = {},
) {
  const ready = () =>
    readiness(
      {
        RESEND_API_KEY: config.apiKey,
        RESEND_FROM_EMAIL: config.from && !/[\r\n]/.test(config.from),
      },
      [
        "Provider idempotency lasts 24 hours; caller must retain durable action records for longer.",
      ],
    );
  return {
    readiness: ready,
    async send(message: EmailMessage): Promise<ExternalResult<{ id: string }>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !actionKeyValid(message.actionKey) ||
        !message.to.length ||
        message.to.length > 10 ||
        !message.to.every(emailValid) ||
        !nonempty(message.subject) ||
        /[\r\n]/.test(message.subject) ||
        !nonempty(message.text)
      )
        return { status: "rejected", reason: "Invalid email input" };
      const result = await requestJson(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": message.actionKey,
          },
          body: JSON.stringify({
            from: config.from,
            to: message.to,
            subject: message.subject,
            text: message.text,
          }),
        },
        options,
      );
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      if (!isRecord(result.data) || !nonempty(result.data.id))
        return {
          status: "unknown",
          reason: "Email submission returned no valid message ID",
        };
      return {
        status: "succeeded",
        externalId: result.data.id,
        data: { id: result.data.id },
      };
    },
    async readEmail(
      id: string,
    ): Promise<ExternalResult<{ id: string; lastEvent?: string }>> {
      if (!ready().ready) return unavailable(ready());
      if (!/^[a-zA-Z0-9-]+$/.test(id))
        return { status: "rejected", reason: "Invalid email ID" };
      const result = await requestJson(
        `https://api.resend.com/emails/${id}`,
        { headers: { Authorization: `Bearer ${config.apiKey}` } },
        options,
      );
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      if (!isRecord(result.data) || result.data.id !== id)
        return { status: "unknown", reason: "Invalid retrieved email" };
      return {
        status: "succeeded",
        externalId: id,
        data: {
          id,
          ...(typeof result.data.last_event === "string"
            ? { lastEvent: result.data.last_event }
            : {}),
        },
      };
    },
  };
}
