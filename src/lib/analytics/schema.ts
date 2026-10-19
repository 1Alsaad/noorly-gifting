import { z } from "zod";

export const eventNames = [
  "page_viewed",
  "navigation_clicked",
  "cinematic_experience_loaded",
  "cinematic_experience_started",
  "cinematic_experience_skipped",
  "cinematic_scene_entered",
  "cinematic_scene_completed",
  "cinematic_progress_milestone",
  "hotspot_impression",
  "hotspot_clicked",
  "product_drawer_opened",
  "product_drawer_closed",
  "product_list_viewed",
  "product_viewed",
  "product_variant_selected",
  "add_to_cart",
  "remove_from_cart",
  "cart_viewed",
  "cart_updated",
  "begin_checkout",
  "purchase",
  "checkout_error",
  "box_builder_started",
  "box_size_selected",
  "product_added_to_box",
  "product_removed_from_box",
  "gift_message_added",
  "box_builder_validation_error",
  "box_builder_completed",
  "newsletter_signup",
  "product_interest_registered",
  "corporate_gifting_enquiry",
  "seasonal_collection_viewed",
  "discount_code_applied",
  "consent_banner_viewed",
  "consent_updated",
] as const;
const id = z
  .string()
  .max(200)
  .regex(/^[\w\-./: ]*$/);
const attribution = z.object({
  source: id.optional(),
  medium: id.optional(),
  campaign: id.optional(),
  referrer: z.string().url().max(250).optional(),
});
/** Explicit allowlist: unknown fields (including email and gift messages) are stripped. */
export const eventPropertiesSchema = z.object({
  anonymous_session_id: z.uuid().optional(),
  locale: z.enum(["sv", "en"]).optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  season_id: id.optional(),
  scene_id: id.optional(),
  hotspot_id: id.optional(),
  product_id: id.optional(),
  product_handle: id.optional(),
  variant_id: id.optional(),
  quantity: z.number().int().min(0).max(100_000).optional(),
  value: z.number().finite().min(0).optional(),
  cart_id: id.optional(),
  bundle_id: id.optional(),
  source: id.optional(),
  device_category: z.enum(["mobile", "tablet", "desktop"]).optional(),
  reduced_motion: z.boolean().optional(),
  progress: z.number().min(0).max(1).optional(),
  milestone: z.number().min(0).max(100).optional(),
  item_count: z.number().int().min(0).max(100_000).optional(),
  box_size: id.optional(),
  error_code: id.optional(),
  path: id.optional(),
  collection_handle: id.optional(),
  analytics: z.boolean().optional(),
  marketing: z.boolean().optional(),
  first_touch: attribution.optional(),
  last_touch: attribution.optional(),
  transaction_id: id.optional(),
});
export const analyticsEventSchema = z.object({
  name: z.enum(eventNames),
  properties: eventPropertiesSchema.default({}),
});
export type AnalyticsEvent = z.input<typeof analyticsEventSchema>;
export type AnalyticsProperties = z.infer<typeof eventPropertiesSchema>;
export type AnalyticsEventName = (typeof eventNames)[number];
