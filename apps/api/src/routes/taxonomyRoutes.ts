import { Router } from "express";
import { createTaxonomyNodeSchema } from "@revie/validation";
import { sendError } from "../lib/errors.js";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate.js";
import { store } from "../services/store.js";

const taxonomyRouter = Router();

taxonomyRouter.get("/children", (req, res) => {
  const parentId = (req.query.parentId as string | undefined) ?? null;
  const nodes = store.listTaxonomyChildren(parentId);
  return res.status(200).json({ nodes });
});

taxonomyRouter.post("/nodes", authenticate, (req: AuthenticatedRequest, res) => {
  const parsed = createTaxonomyNodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid taxonomy payload", parsed.error.flatten());
  }

  const node = parsed.data;

  if (node.nodeType === "category" && node.parentId) {
    return sendError(res, 400, "VALIDATION_ERROR", "Category must be root node");
  }

  if (node.nodeType !== "category" && !node.parentId) {
    return sendError(res, 400, "VALIDATION_ERROR", "Non-category nodes require parentId");
  }

  const expectedParentType: Record<string, string | null> = {
    category: null,
    brand: "category",
    product_type: "brand",
    model: "product_type"
  };

  if (node.parentId) {
    const parent = store.getTaxonomyNodeById(node.parentId);
    if (!parent) {
      return sendError(res, 404, "NOT_FOUND", "Parent node not found");
    }
    if (parent.nodeType !== expectedParentType[node.nodeType]) {
      return sendError(res, 400, "VALIDATION_ERROR", "Invalid parent-child hierarchy");
    }
  }

  const created = store.createTaxonomyNode({
    nodeType: node.nodeType,
    name: node.name,
    parentId: node.parentId,
    createdByUserId: req.auth!.userId
  });

  return res.status(201).json({ node: created });
});

export { taxonomyRouter };
