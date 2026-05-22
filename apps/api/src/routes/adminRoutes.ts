import { Router } from "express";
import { sendError } from "../lib/errors.js";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { store } from "../services/store.js";

const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get("/flags", (_req, res) => {
  return res.status(200).json({ flags: store.listFlags() });
});

adminRouter.post("/reviews/:reviewId/hide", (req, res) => {
  const updated = store.hideReview(req.params.reviewId);
  if (!updated) {
    return sendError(res, 404, "NOT_FOUND", "Review not found");
  }
  store.addFlag({
    reviewId: updated.id,
    userId: updated.userId,
    signalType: "manual_hide",
    signalScore: 100
  });
  return res.status(200).json({ review: updated });
});

adminRouter.post("/reviews/:reviewId/restore", (req, res) => {
  const updated = store.restoreReview(req.params.reviewId);
  if (!updated) {
    return sendError(res, 404, "NOT_FOUND", "Review not found");
  }
  return res.status(200).json({ review: updated });
});

adminRouter.post("/users/:userId/suspend", (req: AuthenticatedRequest, res) => {
  const user = store.suspendUser(req.params.userId);
  if (!user) {
    return sendError(res, 404, "NOT_FOUND", "User not found");
  }
  store.addFlag({
    userId: user.id,
    signalType: "manual_suspend",
    signalScore: 100
  });
  return res.status(200).json({ user });
});

export { adminRouter };
