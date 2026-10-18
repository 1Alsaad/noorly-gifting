import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env/server";
import { drainPurchaseOutbox } from "@/lib/analytics/outbox";
import { HttpError, safeError } from "@/lib/security/request";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const secret = getEnv().OUTBOX_CRON_SECRET;
    if (!secret || secret.length < 32)
      throw new HttpError(503, "WORKER_NOT_CONFIGURED");
    const expected = Buffer.from(`Bearer ${secret}`);
    const supplied = Buffer.from(request.headers.get("authorization") ?? "");
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    )
      throw new HttpError(401, "UNAUTHORIZED");
    return Response.json(await drainPurchaseOutbox(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return safeError(error);
  }
}
