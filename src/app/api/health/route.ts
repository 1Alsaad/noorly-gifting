import { randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export function GET() {
  const requestId = randomUUID();
  try {
    getEnv();
    return Response.json(
      { status: "ok", service: "stilla", requestId },
      { headers: { "Cache-Control": "no-store", "X-Request-ID": requestId } },
    );
  } catch {
    return Response.json(
      { status: "configuration_required", requestId },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
