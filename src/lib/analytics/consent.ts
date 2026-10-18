import { z } from "zod";

export const CONSENT_KEY = "stilla-consent-v1";
export const CONSENT_EVENT = "stilla:consent";
const MAX_AGE = 180 * 86400_000;
export const consentSchema = z.object({
  version: z.literal(1),
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
  updatedAt: z.number().positive(),
});
export type Consent = z.infer<typeof consentSchema>;

export function parseConsent(
  raw: string | null,
  now = Date.now(),
): Consent | null {
  try {
    const parsed = consentSchema.safeParse(JSON.parse(raw ?? "null"));
    if (
      !parsed.success ||
      parsed.data.updatedAt > now ||
      now - parsed.data.updatedAt > MAX_AGE
    )
      return null;
    return parsed.data;
  } catch {
    return null;
  }
}
export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}
export function consentSnapshot(): string {
  try {
    return window.localStorage.getItem(CONSENT_KEY) ?? "";
  } catch {
    return "";
  }
}
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
export function saveConsent(
  choices: Pick<Consent, "analytics" | "marketing">,
): Consent {
  const state: Consent = {
    version: 1,
    necessary: true,
    ...choices,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    /* Browsing still works with blocked storage. */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}
