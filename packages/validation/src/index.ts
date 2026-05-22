import { z } from "zod";

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
