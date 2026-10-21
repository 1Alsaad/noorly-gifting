import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_PREVIEW_TTL,
  createAdminPreviewSession,
  verifyAdminPreviewPassword,
  verifyAdminPreviewSession,
} from "@/lib/security/admin-preview";

const fixture = "test-only-generated-password-1234567890";
describe("view-only admin session", () => {
  beforeEach(() => vi.stubEnv("ADMIN_PREVIEW_PASSWORD", fixture));
  afterEach(() => vi.unstubAllEnvs());

  it("accepts only the configured password and requires a strong configured secret", () => {
    expect(verifyAdminPreviewPassword(fixture)).toBe(true);
    expect(verifyAdminPreviewPassword("wrong")).toBe(false);
    vi.stubEnv("ADMIN_PREVIEW_PASSWORD", "short");
    expect(verifyAdminPreviewPassword("short")).toBe(false);
    expect(() => createAdminPreviewSession()).toThrow();
  });
  it("rejects tampering, expiry, future sessions and secret rotation", () => {
    const now = Date.now();
    const session = createAdminPreviewSession(now);
    expect(verifyAdminPreviewSession(session, now)).toBe(true);
    expect(session).not.toContain(fixture);
    expect(verifyAdminPreviewSession(`${session}a`, now)).toBe(false);
    expect(verifyAdminPreviewSession(`x${session}`, now)).toBe(false);
    expect(verifyAdminPreviewSession(undefined, now)).toBe(false);
    expect(
      verifyAdminPreviewSession(session, now + ADMIN_PREVIEW_TTL * 1000),
    ).toBe(false);
    expect(verifyAdminPreviewSession(session, now - 1000)).toBe(false);
    vi.stubEnv("ADMIN_PREVIEW_PASSWORD", `${fixture}-rotated`);
    expect(verifyAdminPreviewSession(session, now)).toBe(false);
  });
});
