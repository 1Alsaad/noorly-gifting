import { createHash } from "node:crypto";
import type { RecordStore } from "./records.js";
import type { ExternalResult } from "./adapters/types.js";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
// PostgreSQL jsonb reorders object keys; retries after restart must still match.
export const fingerprint = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
/** At-most-once submission. Unknown or interrupted submissions require read-side reconciliation. */
export async function runEffect<T>(
  records: RecordStore,
  key: string,
  action: string,
  payload: unknown,
  execute: () => Promise<ExternalResult<T>>,
  reconcile?: () => Promise<ExternalResult<T>>,
): Promise<ExternalResult<T>> {
  const claim = await records.claimEffect(key, action, fingerprint(payload));
  if (!claim.claimed) {
    if (claim.state === "succeeded" || claim.state === "rejected")
      return claim.result as ExternalResult<T>;
    if (reconcile) {
      const result = await reconcile().catch(() => ({
        status: "unknown" as const,
      }));
      // Absence in eventually-consistent lists is not proof that a submission failed.
      if (result.status === "succeeded") {
        await records.finishEffect(key, "succeeded", result);
        return result;
      }
    }
    return {
      status: "unknown",
      reason:
        "Prior submission requires reconciliation; no repeated write was made.",
    };
  }
  let result: ExternalResult<T>;
  try {
    result = await execute();
  } catch {
    result = {
      status: "unknown",
      reason: "Submission interrupted; reconcile before retrying.",
    };
  }
  await records.finishEffect(key, result.status, result);
  return result;
}
