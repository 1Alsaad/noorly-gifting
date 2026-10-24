import { describe, expect, it } from "vitest";
import { buildMetaPurchasePayload } from "@/lib/analytics/meta-purchase";

const valid = {
  id: "a".repeat(64),
  createdAt: "2026-10-24T12:00:00.000Z",
  currency: "SEK",
  value: 799,
  siteUrl: "https://noorlynordic.com/sv?private=1",
  fbp: "fb.1.1234567890.987654321",
};

describe("consented paid-order Meta payload", () => {
  it("formats one server Purchase without checkout personal data", () => {
    const payload = buildMetaPurchasePayload(valid);
    expect(payload?.data[0]).toMatchObject({
      event_name: "Purchase",
      event_id: valid.id,
      event_source_url: "https://noorlynordic.com",
      user_data: { fbp: valid.fbp },
      custom_data: { currency: "SEK", value: 799 },
    });
    expect(JSON.stringify(payload)).not.toContain("private=1");
  });
  it("does not produce a Purchase without a valid opted-in identifier", () => {
    expect(buildMetaPurchasePayload({ ...valid, fbp: undefined })).toBeNull();
    expect(buildMetaPurchasePayload({ ...valid, fbp: "invalid" })).toBeNull();
    expect(buildMetaPurchasePayload({ ...valid, value: -1 })).toBeNull();
  });
});
