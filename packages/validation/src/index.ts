import { z } from "zod";

export const providerSchema = z.enum(["google", "apple", "linkedin"]);

export const authSessionSchema = z
  .object({
    provider: providerSchema,
    idToken: z.string().min(10).optional(),
    code: z.string().min(5).optional(),
    redirectUri: z.string().url().optional()
  })
  .refine((input) => Boolean(input.idToken || input.code), {
    message: "Either idToken or code is required",
    path: ["idToken"]
  });

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(120).optional(),
  body: z.string().min(20).max(5000)
});

export const createTaxonomyNodeSchema = z.object({
  nodeType: z.enum(["category", "brand", "product_type", "model"]),
  name: z.string().min(1).max(120),
  parentId: z.string().uuid().nullable()
});

export const createProductSchema = z.object({
  modelNodeId: z.string().uuid(),
  canonicalName: z.string().min(2).max(200),
  modelCode: z.string().min(1).max(60).optional(),
  metadata: z.record(z.any()).default({})
});

export const productSearchSchema = z.object({
  q: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  productTypeId: z.string().uuid().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(["relevance", "rating", "recent"]).optional()
});
