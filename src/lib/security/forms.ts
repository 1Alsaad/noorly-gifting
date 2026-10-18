import { z } from "zod";

const common = {
  email: z.email().max(254),
  consent: z.literal(true),
  website: z.string().max(0).default(""),
  submissionId: z.uuid(),
};
export const formSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("newsletter"), ...common }).strict(),
  z
    .object({
      kind: z.literal("corporate"),
      ...common,
      name: z.string().trim().min(2).max(100),
      company: z.string().trim().min(2).max(160),
      volume: z.number().int().min(5).max(100_000),
      country: z.string().regex(/^[A-Z]{2}$/),
      deliveryDate: z.iso.date(),
      message: z.string().trim().max(2000).optional(),
    })
    .strict(),
]);
