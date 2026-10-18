import "server-only";
import { getEnv } from "@/lib/env/server";
import { hasDurableStore, redisCommand } from "./redis";
import { HttpError } from "./request";

const local = new Map<
  string,
  { expires: number; state: "pending" | "complete" }
>();
export async function claimSubmission(
  key: string,
): Promise<"claimed" | "pending" | "complete"> {
  if (hasDurableStore())
    return redisCommand<"claimed" | "pending" | "complete">([
      "EVAL",
      "local current=redis.call('GET',KEYS[1]); if current then return current end; redis.call('SET',KEYS[1],'pending','EX',60); return 'claimed'",
      1,
      `stilla:submission:${key}`,
    ]);
  if (getEnv().NODE_ENV === "production")
    throw new HttpError(503, "TEMPORARILY_UNAVAILABLE");
  for (const [candidate, entry] of local)
    if (entry.expires < Date.now()) local.delete(candidate);
  const existing = local.get(key);
  if (existing) return existing.state;
  local.set(key, { expires: Date.now() + 60_000, state: "pending" });
  return "claimed";
}
export async function completeSubmission(key: string) {
  if (hasDurableStore())
    await redisCommand([
      "SET",
      `stilla:submission:${key}`,
      "complete",
      "EX",
      86400,
    ]);
  else local.set(key, { expires: Date.now() + 86400_000, state: "complete" });
}
export async function releaseSubmission(key: string) {
  if (hasDurableStore())
    await redisCommand(["DEL", `stilla:submission:${key}`]);
  else local.delete(key);
}
