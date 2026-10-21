import { NextResponse } from "next/server";
import {
  ADMIN_PREVIEW_COOKIE,
  ADMIN_PREVIEW_TTL,
  allowAdminPreviewAttempt,
  createAdminPreviewSession,
  isAdminPreviewConfigured,
  verifyAdminPreviewPassword,
} from "@/lib/security/admin-preview";
import { HttpError, readBody, safeError } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    if (
      request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      throw new HttpError(403, "INVALID_ORIGIN");
    if (
      !request.headers
        .get("content-type")
        ?.startsWith("application/x-www-form-urlencoded")
    )
      throw new HttpError(415, "FORM_REQUIRED");
    const fields = new URLSearchParams(
      new TextDecoder().decode(await readBody(request, 1024)),
    );
    const logout = fields.get("action") === "logout";
    if (!logout && !isAdminPreviewConfigured())
      throw new HttpError(503, "ADMIN_PREVIEW_NOT_CONFIGURED");
    if (!logout && !allowAdminPreviewAttempt(request))
      throw new HttpError(429, "RATE_LIMITED");
    if (!logout && !verifyAdminPreviewPassword(fields.get("password") ?? ""))
      return NextResponse.redirect(
        new URL("/admin-preview?error=invalid", origin),
        {
          status: 303,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    const response = NextResponse.redirect(
      new URL(logout ? "/admin-preview" : "/sv", origin),
      { status: 303 },
    );
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.cookies.set(
      ADMIN_PREVIEW_COOKIE,
      logout ? "" : createAdminPreviewSession(),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: logout ? 0 : ADMIN_PREVIEW_TTL,
      },
    );
    return response;
  } catch (error) {
    return safeError(error);
  }
}
