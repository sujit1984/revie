import { Router } from "express";
import { createReviewSchema } from "@revie/validation";
import { sendError } from "../lib/errors.js";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate.js";
import { store } from "../services/store.js";

const reviewsRouter = Router();

reviewsRouter.post("/", authenticate, (req: AuthenticatedRequest, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid review payload", parsed.error.flatten());
  }

  try {
    const review = store.addReview({
      productId: parsed.data.productId,
      userId: req.auth!.userId,
      rating: parsed.data.rating as 1 | 2 | 3 | 4 | 5,
      title: parsed.data.title,
      body: parsed.data.body
    });

    return res.status(201).json({ review });
  } catch (error) {
    if ((error as Error).message === "DUPLICATE_REVIEW") {
      return sendError(res, 409, "DUPLICATE_REVIEW", "User has already reviewed this product");
    }
    return sendError(res, 500, "INTERNAL_ERROR", "Unable to create review");
  }
});

export { reviewsRouter };
