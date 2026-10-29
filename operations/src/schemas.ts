import { z } from "zod";
import { DEPARTMENTS } from "./config.js";

const https = z.url().refine((s) => new URL(s).protocol === "https:");
const text = z.string().trim().min(1).max(10000);
export const proposalSchema = z
  .object({
    department: z.enum(DEPARTMENTS),
    kind: z.enum([
      "research",
      "source",
      "finance",
      "creative",
      "catalog",
      "social",
      "advertising",
      "service",
    ]),
    title: text.max(200),
    rationale: text,
    productId: z.string().max(200).optional(),
    sourceRefs: z.array(https).max(30),
    facts: z.record(
      z.string().max(80),
      z.union([
        z.string().max(2000),
        z.number().finite(),
        z.boolean(),
        z.null(),
      ]),
    ),
    nextStep: text.max(2000),
  })
  .strict();
export type Proposal = z.infer<typeof proposalSchema>;
const translated = z.object({ sv: text, en: text }).strict();
const gid = (name: string) =>
  z.string().regex(new RegExp(`^gid://shopify/${name}/[0-9]+$`));
export const catalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.number().int().positive(),
    publishedAt: z.iso.datetime(),
    products: z
      .array(
        z
          .object({
            id: gid("Product"),
            handle: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
            title: translated,
            description: translated,
            included: translated,
            care: translated.optional(),
            highlights: z.array(translated).max(12).optional(),
            delivery: translated,
            availability: z.enum(["in_stock", "preorder"]),
            category: z.enum([
              "signature",
              "extra",
              "box",
              "card",
              "packaging",
            ]),
            variants: z
              .array(
                z
                  .object({
                    id: gid("ProductVariant"),
                    sku: z.string().min(1).max(200),
                    components: z
                      .array(
                        z
                          .object({
                            productId: gid("Product"),
                            productHandle: z.string(),
                            variantId: gid("ProductVariant"),
                            sku: z.string(),
                            quantity: z.number().int().positive(),
                          })
                          .strict(),
                      )
                      .optional(),
                  })
                  .strict(),
              )
              .min(1)
              .max(100),
          })
          .strict(),
      )
      .max(200),
  })
  .strict();
export type Catalog = z.infer<typeof catalogSchema>;
export const socialDraftSchema = z
  .object({
    productId: gid("Product"),
    text: text.max(2200),
    title: z.string().max(90).optional(),
    language: z.literal("sv"),
    imageUrls: z.array(https).min(1).max(10),
    aiGenerated: z.boolean(),
    claimsEvidenceRefs: z.array(https).min(1),
  })
  .strict();
export type SocialDraft = z.infer<typeof socialDraftSchema>;
export const assetReviewSchema = z
  .object({
    url: https,
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    reviewedAt: z.iso.datetime(),
    noFaces: z.literal(true),
    swedishText: z.literal(true),
    authorizedPhotography: z.literal(true),
    factualClaims: z.literal(true),
    reviewer: text.max(100),
    evidenceRef: text.max(2000),
  })
  .strict();
export type AssetReview = z.infer<typeof assetReviewSchema>;
