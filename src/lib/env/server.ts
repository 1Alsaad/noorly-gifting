import "server-only";
import { parseEnv } from "./schema";

/** Lazy by design: importing a route must not require deployment secrets at build time. */
export function getEnv() {
  return parseEnv(process.env);
}
