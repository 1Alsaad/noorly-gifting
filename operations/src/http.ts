import { createHmac } from "node:crypto";
import { z } from "zod";
import {
  bearer,
  owner,
  sameOrigin,
  unauthorized,
  verifyShopifyWebhook,
} from "./auth.js";
import { getStore, getRecords, demoMode } from "./database.js";
import {
  status,
  tick,
  type Dispatch,
  type RuntimeDependencies,
} from "./runtime.js";
import { catalogSchema, assetReviewSchema, type Catalog } from "./schemas.js";
import { fingerprint } from "./effects.js";
import { importVerified } from "./verification.js";
import { redactOperationalData } from "./redaction.js";

const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
async function body(request: Request, max = 1024 * 1024) {
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new Error("Request too large");
  const reader = request.body?.getReader();
  if (!reader) return "";
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const result = await reader.read();
    if (result.done) break;
    bytes += result.value.byteLength;
    if (bytes > max) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(result.value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function dashboard(data: Awaited<ReturnType<typeof status>>) {
  const observation = data.demo
    ? "Cloud observation has not started. This is a local preview."
    : data.control.lastHeartbeatAt
      ? `Observation started ${escape(data.control.observationStartedAt)}. Live actions require 72 hours of continuous observed operation and verified readiness.`
      : "Waiting for the first healthy scheduled run. Live actions remain disabled.";
  const money = (n: number) => `${(n / 100).toLocaleString("sv-SE")} SEK`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Noorly operations</title><style>body{font:16px system-ui;background:#f6f3ef;color:#243b36;max-width:1120px;margin:40px auto;padding:0 24px}h1{font:44px Georgia}section{background:white;padding:24px;border-radius:12px;margin:20px 0}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:12px;border-bottom:1px solid #eee}small{color:#666}.pill{background:#e8eee8;padding:8px 12px;border-radius:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#236e58}</style><h1>Noorly operations</h1><p><span class="pill">${escape(data.control.mode)}</span> ${data.demo ? "Local demonstration — no publishing or payments" : "Persistent operations"}</p><p>${observation}</p><section><h2>Available capacity</h2><table><tr><th>Budget</th><th>Committed</th><th>Limit</th></tr>${Object.entries(
    data.budgets,
  )
    .map(
      ([name, b]) =>
        `<tr><td>${escape(name)}</td><td>${money(b.usedOre)}</td><td>${money(b.limitOre)}</td></tr>`,
    )
    .join(
      "",
    )}</table><small>Supplier funding is revolving working capital. Existing bills are separate. No VAT is modelled.</small></section><section><h2>Departments</h2><p>${data.departments.map(escape).join(" · ")}</p><p>${Object.entries(
    data.jobCounts,
  )
    .map(([k, v]) => `${v} ${k}`)
    .join(
      " · ",
    )}</p></section><section><h2>Connections</h2><table>${data.configuration.map((c) => `<tr><td>${escape(c.name)}</td><td>${c.ready ? "Configured — verification still required" : `Missing: ${escape(c.missing.join(", "))}`}</td></tr>`).join("")}</table></section><section><h2>Needs attention</h2>${data.issues.length ? data.issues.map((i) => `<p>${escape((i.document as { message?: string }).message)}</p>`).join("") : "<p>No recorded issues.</p>"}</section><section><h2>Recent decisions and work</h2><pre>${escape(JSON.stringify({ proposals: data.proposals, audit: data.audit.slice(0, 15) }, null, 2))}</pre></section><p><a href="/api/status">Download current status</a></p></html>`;
}
export async function handleHttp(
  request: Request,
  dispatch?: Dispatch,
  deps: RuntimeDependencies = {},
): Promise<Response> {
  const path = new URL(request.url).pathname;
  const env = deps.env ?? process.env;
  const store = () => (deps.store ? Promise.resolve(deps.store) : getStore());
  const records = () =>
    deps.records ? Promise.resolve(deps.records) : getRecords();
  try {
    if (path === "/preview") {
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(request.url).hostname,
      );
      if (
        request.method !== "GET" ||
        !local ||
        env.NODE_ENV === "production" ||
        env.VERCEL ||
        !(deps.isDemo ?? demoMode())
      )
        return json({ error: "Route not found" }, 404);
      return new Response(dashboard(await status({ ...deps, isDemo: true })), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "content-security-policy":
            "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
          "x-content-type-options": "nosniff",
        },
      });
    }
    if (path === "/health" && request.method === "GET")
      return json({ service: "noorly-operations", status: "up" });
    if (path === "/webhooks/shopify" && request.method === "POST") {
      const raw = await body(request);
      if (
        !verifyShopifyWebhook(
          raw,
          request.headers.get("x-shopify-hmac-sha256"),
          env.SHOPIFY_WEBHOOK_SECRET,
        )
      )
        return json({ error: "Invalid signature" }, 401);
      if (
        request.headers.get("x-shopify-shop-domain") !==
        env.SHOPIFY_STORE_DOMAIN
      )
        return json({ error: "Wrong shop" }, 401);
      const id =
        request.headers.get("x-shopify-event-id") ??
        request.headers.get("x-shopify-webhook-id");
      const topic = request.headers.get("x-shopify-topic");
      if (
        !id ||
        !/^[a-zA-Z0-9_-]{1,200}$/.test(id) ||
        !topic ||
        ![
          "orders/paid",
          "orders/updated",
          "refunds/create",
          "fulfillments/create",
          "fulfillments/update",
        ].includes(topic)
      )
        return json({ error: "Unsupported event" }, 400);
      // Store event identity only. Fetch authoritative records through authenticated Shopify API.
      const payload = z.record(z.string(), z.unknown()).parse(JSON.parse(raw));
      const rawId = topic.startsWith("orders/")
        ? (payload.admin_graphql_api_id ?? payload.id)
        : payload.order_id;
      if (typeof rawId === "number" && !Number.isSafeInteger(rawId))
        return json({ error: "Invalid order identity" }, 400);
      const orderId = String(rawId ?? "").replace(
        /^gid:\/\/shopify\/Order\//,
        "",
      );
      if (!/^[1-9][0-9]*$/.test(orderId))
        return json({ error: "Invalid order identity" }, 400);
      await (
        await store()
      ).enqueueJob({
        dedupKey: `shopify:${env.SHOPIFY_STORE_DOMAIN}:${id}`,
        type: "reconcile",
        payload: {
          topic,
          orderId: `gid://shopify/Order/${orderId}`,
          bodyHash: fingerprint(raw),
        },
      });
      return json({ accepted: true }, 202);
    }
    if (path === "/api/catalog" && request.method === "GET") {
      if (!bearer(request, "NOORLY_CATALOG_TOKEN", env)) return unauthorized();
      const catalog = await (await records()).get<Catalog>("catalog", "active");
      const secret = env.NOORLY_CATALOG_SIGNING_SECRET;
      if (!catalog || !secret || secret.length < 32)
        return json({ error: "No verified catalog release" }, 503);
      const raw = JSON.stringify(catalogSchema.parse(catalog));
      const timestamp = String(Math.floor(Date.now() / 1000));
      return new Response(raw, {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "x-noorly-timestamp": timestamp,
          "x-noorly-signature": createHmac("sha256", secret)
            .update(`${timestamp}.${raw}`)
            .digest("hex"),
        },
      });
    }
    if (path === "/api/tick" && request.method === "POST") {
      if (!bearer(request, "CRON_SECRET", env)) return unauthorized();
      return json(await tick(dispatch, deps.now ?? new Date(), deps));
    }
    const service = bearer(request, "OPS_SERVICE_TOKEN", env);
    const human = owner(request, env);
    if (!service && !human) return unauthorized();
    if (request.method !== "GET" && !service && !sameOrigin(request))
      return json({ error: "Same-origin request required" }, 403);
    if (path === "/" && request.method === "GET")
      return new Response(dashboard(await status(deps)), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "content-security-policy":
            "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
          "x-content-type-options": "nosniff",
        },
      });
    if (path === "/api/status" && request.method === "GET")
      return json(await status(deps));
    if (path === "/api/import" && request.method === "POST" && service)
      return json(
        redactOperationalData(
          await importVerified(JSON.parse(await body(request))),
          env,
        ),
      );
    if (path === "/api/control" && request.method === "POST") {
      const input = z
        .object({ mode: z.enum(["observe", "paused"]) })
        .strict()
        .parse(JSON.parse(await body(request, 1000)));
      return json(await (await store()).setMode(input.mode, "owner"));
    }
    // These endpoints are not available as agent tools. A trusted integration verifier imports evidence.
    if (path === "/api/verification" && request.method === "POST" && service) {
      const input = z
        .object({
          check: z.enum([
            "connectors",
            "budget_reconciliation",
            "webhook_deduplication",
            "recovery",
            "social",
            "supplier",
            "checkout",
            "tracking_consent",
          ]),
          outcome: z.enum(["pass", "fail"]),
          evidenceRef: z.string().min(1).max(2048),
        })
        .strict()
        .parse(JSON.parse(await body(request, 5000)));
      if (deps.isDemo ?? demoMode())
        return json({ error: "Demo cannot certify production readiness" }, 409);
      await (
        await store()
      ).recordReadiness(input.check, input.outcome, input.evidenceRef);
      return json({ recorded: true });
    }
    if (path === "/api/asset-review" && request.method === "POST" && service) {
      const input = assetReviewSchema.parse(
        JSON.parse(await body(request, 10000)),
      );
      if (deps.isDemo ?? demoMode())
        return json({ error: "Demo cannot certify production assets" }, 409);
      await (
        await records()
      ).put("asset-review", fingerprint(input.url), input);
      return json({ recorded: true });
    }
    return json({ error: "Route not found" }, 404);
  } catch (error) {
    if (error instanceof SyntaxError)
      return json({ error: "Invalid JSON" }, 400);
    if (error instanceof z.ZodError)
      return json(
        {
          error: "Invalid request",
          fields: error.issues.map((i) => i.path.join(".")),
        },
        400,
      );
    const message = error instanceof Error ? error.message : "Unexpected error";
    // Do not echo provider messages, connection strings or request data to the browser.
    console.error(
      "Operations request failed",
      path,
      error instanceof Error ? error.name : "Error",
    );
    if (message === "Request too large") return json({ error: message }, 413);
    return json(
      {
        error:
          "Operation unavailable. Check the authenticated activity log and deployment configuration.",
      },
      503,
    );
  }
}
