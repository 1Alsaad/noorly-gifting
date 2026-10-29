import {
  createResendAdapter,
  resendConfigFromEnv,
  type EmailMessage,
} from "./adapters/resend.js";
import type { ExternalResult } from "./adapters/types.js";
import type { RecordStore } from "./records.js";
import { fingerprint, runEffect } from "./effects.js";
import { stockholmDay } from "./config.js";
import { safeText } from "./redaction.js";

export const OWNER_DAILY_EMAIL_CAP = 5;
type Notice = { key: string; subject: string; text: string };
export type NotificationOptions = {
  env?: NodeJS.ProcessEnv;
  now?: Date;
  isDemo?: boolean;
  send?: (message: EmailMessage) => Promise<ExternalResult<{ id: string }>>;
};

/** One owner only; count attempted sends, including uncertain outcomes, against the cap. */
export async function notifyOwner(
  records: RecordStore,
  notice: Notice,
  options: NotificationOptions = {},
) {
  const env = options.env ?? process.env;
  const adapter = createResendAdapter(resendConfigFromEnv(env));
  const recipient = env.OPS_OWNER_EMAIL ?? "";
  if (
    options.isDemo ||
    env.RESEND_FREE_PLAN_CONFIRMED !== "true" ||
    !adapter.readiness().ready ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient)
  )
    return { status: "disabled" };
  const now = options.now ?? new Date();
  const key = fingerprint(notice.key);
  const lock = await records.withLock("owner-notifications", async () => {
    const previous = await records.get<{ status: string }>(
      "owner-notification",
      key,
    );
    if (previous) return { status: previous.status, duplicate: true };
    const day = stockholmDay(now);
    const used = await records.get<{ attempts: number }>(
      "owner-email-quota",
      day,
    );
    if ((used?.attempts ?? 0) >= OWNER_DAILY_EMAIL_CAP)
      return { status: "daily_cap" };
    // Reserve before the network call; a crash may lose an alert, never duplicate it.
    await records.put("owner-email-quota", day, {
      attempts: (used?.attempts ?? 0) + 1,
    });
    await records.put("owner-notification", key, {
      status: "unknown",
      at: now.toISOString(),
    });
    const message: EmailMessage = {
      actionKey: `owner:${key}`,
      to: [recipient],
      subject: safeText(notice.subject, env)
        .replace(/[\r\n]/g, " ")
        .slice(0, 150),
      text: `${safeText(notice.text, env).slice(0, 4000)}\n\nReview the Noorly operations dashboard for the current status.`,
    };
    const result = await runEffect(
      records,
      message.actionKey,
      "notify_owner",
      message,
      () => (options.send ?? adapter.send)(message),
    );
    await records.put("owner-notification", key, {
      status: result.status,
      externalId: result.externalId,
      at: now.toISOString(),
    });
    return { status: result.status };
  });
  return lock.locked ? lock.result! : { status: "busy" };
}
