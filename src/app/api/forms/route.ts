import { createHash } from "node:crypto";
import { getEnv } from "@/lib/env/server";
import { formSchema } from "@/lib/security/forms";
import {
  claimSubmission,
  completeSubmission,
  releaseSubmission,
} from "@/lib/security/idempotency";
import {
  assertSameOrigin,
  HttpError,
  rateLimit,
  readJson,
  safeError,
} from "@/lib/security/request";

export const runtime = "nodejs";
export async function POST(request: Request) {
  let submissionKey: string | undefined;
  let ownsClaim = false;
  try {
    assertSameOrigin(request);
    await rateLimit(request, "forms", 5, 60);
    const parsed = formSchema.safeParse(await readJson(request, 8192));
    if (!parsed.success) throw new HttpError(400, "INVALID_FORM");
    const env = getEnv();
    const data = parsed.data;
    const mock = env.NODE_ENV !== "production" && !env.FORM_DELIVERY_URL;
    if (!mock && (!env.FORM_DELIVERY_URL || !env.FORM_DELIVERY_TOKEN))
      throw new HttpError(503, "DELIVERY_UNAVAILABLE");
    submissionKey = createHash("sha256")
      .update(`${data.kind}:${data.submissionId}`)
      .digest("hex");
    const claim = await claimSubmission(submissionKey);
    if (claim === "complete")
      return Response.json(
        { ok: true, duplicate: true, mock },
        { headers: { "Cache-Control": "no-store" } },
      );
    if (claim === "pending") throw new HttpError(409, "SUBMISSION_PENDING");
    ownsClaim = true;
    if (!mock) {
      const response = await fetch(env.FORM_DELIVERY_URL!, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.FORM_DELIVERY_TOKEN}`,
          "Content-Type": "application/json",
          "Idempotency-Key": submissionKey,
        },
        body: JSON.stringify({ ...data, website: undefined }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new HttpError(503, "DELIVERY_UNAVAILABLE");
    }
    await completeSubmission(submissionKey);
    return Response.json(
      { ok: true, mock },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (submissionKey && ownsClaim)
      await releaseSubmission(submissionKey).catch(() => undefined);
    return safeError(error);
  }
}
