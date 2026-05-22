import { Router } from "express";
import { createProductSchema, productSearchSchema } from "@revie/validation";
import { sendError } from "../lib/errors.js";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate.js";
import { store } from "../services/store.js";

const productsRouter = Router();

productsRouter.get("/search", (req, res) => {
  const parsed = productSearchSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid product search query", parsed.error.flatten());
  }

  const query = parsed.data;
  const products = store.searchProducts({
    q: query.q,
    minRating: query.minRating
  });

  return res.status(200).json({ products });
});

productsRouter.post("/", authenticate, (req: AuthenticatedRequest, res) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid product payload", parsed.error.flatten());
  }

  const product = store.createProduct({
    modelNodeId: parsed.data.modelNodeId,
    canonicalName: parsed.data.canonicalName,
    modelCode: parsed.data.modelCode,
    metadata: parsed.data.metadata,
    createdByUserId: req.auth!.userId
  });

  return res.status(201).json({ product });
});

productsRouter.get("/:productId/reviews", (req, res) => {
  const reviews = store.listProductReviews(req.params.productId);
  return res.status(200).json({ reviews });
});

productsRouter.get("/:productId/rating-summary", (req, res) => {
  const summary = store.getRatingSummary(req.params.productId);
  return res.status(200).json(summary);
});

export { productsRouter };
