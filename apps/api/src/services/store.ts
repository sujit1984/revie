import { normalizeName } from "@revie/utils";
import { v4 as uuidv4 } from "uuid";
import type { FraudFlag, Product, Review, TaxonomyNode, UserRecord } from "../types/domain.js";

const users = new Map<string, UserRecord>();
const usersByProviderId = new Map<string, string>();
const taxonomyNodes = new Map<string, TaxonomyNode>();
const products = new Map<string, Product>();
const reviews = new Map<string, Review>();
const flags = new Map<string, FraudFlag>();

function providerKey(provider: string, providerUserId: string): string {
  return `${provider}:${providerUserId}`;
}

export const store = {
  upsertUser(input: Omit<UserRecord, "id" | "isSuspended">): UserRecord {
    const key = providerKey(input.provider, input.providerUserId);
    const existingId = usersByProviderId.get(key);
    if (existingId) {
      const existing = users.get(existingId);
      if (!existing) {
        throw new Error("User index corruption");
      }
      const merged: UserRecord = { ...existing, ...input };
      users.set(existingId, merged);
      return merged;
    }

    const user: UserRecord = {
      ...input,
      id: uuidv4(),
      isSuspended: false
    };
    users.set(user.id, user);
    usersByProviderId.set(key, user.id);
    return user;
  },

  getUserById(userId: string): UserRecord | undefined {
    return users.get(userId);
  },

  suspendUser(userId: string): UserRecord | undefined {
    const user = users.get(userId);
    if (!user) {
      return undefined;
    }
    const suspended = { ...user, isSuspended: true };
    users.set(userId, suspended);
    return suspended;
  },

  listTaxonomyChildren(parentId: string | null): TaxonomyNode[] {
    return [...taxonomyNodes.values()].filter((node) => node.parentId === parentId);
  },

  getTaxonomyNodeById(nodeId: string): TaxonomyNode | undefined {
    return taxonomyNodes.get(nodeId);
  },

  createTaxonomyNode(input: Omit<TaxonomyNode, "id" | "normalizedName" | "createdAt">): TaxonomyNode {
    const normalizedName = normalizeName(input.name);
    const duplicate = [...taxonomyNodes.values()].find(
      (node) =>
        node.parentId === input.parentId &&
        node.nodeType === input.nodeType &&
        node.normalizedName === normalizedName
    );

    if (duplicate) {
      return duplicate;
    }

    const node: TaxonomyNode = {
      ...input,
      id: uuidv4(),
      normalizedName,
      createdAt: new Date().toISOString()
    };
    taxonomyNodes.set(node.id, node);
    return node;
  },

  createProduct(input: Omit<Product, "id" | "normalizedCanonicalName" | "createdAt">): Product {
    const normalizedCanonicalName = normalizeName(input.canonicalName);
    const duplicate = [...products.values()].find(
      (product) =>
        product.modelNodeId === input.modelNodeId &&
        product.normalizedCanonicalName === normalizedCanonicalName &&
        (product.modelCode ?? "") === (input.modelCode ?? "")
    );

    if (duplicate) {
      return duplicate;
    }

    const product: Product = {
      ...input,
      id: uuidv4(),
      normalizedCanonicalName,
      createdAt: new Date().toISOString()
    };
    products.set(product.id, product);
    return product;
  },

  searchProducts(filters: {
    q?: string;
    modelNodeId?: string;
    minRating?: number;
  }): Product[] {
    const q = filters.q ? normalizeName(filters.q) : undefined;
    const ratingByProduct = this.getRatingSummaryByProduct();

    return [...products.values()].filter((product) => {
      const textMatch = q
        ? product.normalizedCanonicalName.includes(q) || (product.modelCode ?? "").toLowerCase().includes(q)
        : true;
      const nodeMatch = filters.modelNodeId ? product.modelNodeId === filters.modelNodeId : true;
      const minRatingMatch = filters.minRating
        ? (ratingByProduct.get(product.id)?.bayesianRating ?? 0) >= filters.minRating
        : true;
      return textMatch && nodeMatch && minRatingMatch;
    });
  },

  addReview(input: Omit<Review, "id" | "status" | "riskScore" | "createdAt">): Review {
    const existing = [...reviews.values()].find(
      (review) => review.productId === input.productId && review.userId === input.userId
    );

    if (existing) {
      throw new Error("DUPLICATE_REVIEW");
    }

    const review: Review = {
      ...input,
      id: uuidv4(),
      status: "published",
      riskScore: 0,
      createdAt: new Date().toISOString()
    };
    reviews.set(review.id, review);
    return review;
  },

  listProductReviews(productId: string): Review[] {
    return [...reviews.values()]
      .filter((review) => review.productId === productId && review.status === "published")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  hideReview(reviewId: string): Review | undefined {
    const review = reviews.get(reviewId);
    if (!review) {
      return undefined;
    }
    const updated: Review = { ...review, status: "hidden" };
    reviews.set(reviewId, updated);
    return updated;
  },

  restoreReview(reviewId: string): Review | undefined {
    const review = reviews.get(reviewId);
    if (!review) {
      return undefined;
    }
    const updated: Review = { ...review, status: "published" };
    reviews.set(reviewId, updated);
    return updated;
  },

  getRatingSummaryByProduct(): Map<string, {
    reviewCount: number;
    avgRating: number;
    bayesianRating: number;
    stars: Record<string, number>;
  }> {
    const map = new Map<string, { reviewCount: number; avgRating: number; bayesianRating: number; stars: Record<string, number> }>();
    const published = [...reviews.values()].filter((review) => review.status === "published");
    const globalAverage = published.length
      ? published.reduce((acc, review) => acc + review.rating, 0) / published.length
      : 0;
    const m = 10;

    for (const product of products.values()) {
      const productReviews = published.filter((review) => review.productId === product.id);
      const reviewCount = productReviews.length;
      const avgRating = reviewCount
        ? productReviews.reduce((acc, review) => acc + review.rating, 0) / reviewCount
        : 0;
      const bayesianRating = reviewCount
        ? (reviewCount / (reviewCount + m)) * avgRating + (m / (reviewCount + m)) * globalAverage
        : 0;
      const stars = {
        "1": productReviews.filter((review) => review.rating === 1).length,
        "2": productReviews.filter((review) => review.rating === 2).length,
        "3": productReviews.filter((review) => review.rating === 3).length,
        "4": productReviews.filter((review) => review.rating === 4).length,
        "5": productReviews.filter((review) => review.rating === 5).length
      };
      map.set(product.id, {
        reviewCount,
        avgRating: Number(avgRating.toFixed(3)),
        bayesianRating: Number(bayesianRating.toFixed(3)),
        stars
      });
    }

    return map;
  },

  getRatingSummary(productId: string): {
    reviewCount: number;
    avgRating: number;
    bayesianRating: number;
    stars: Record<string, number>;
  } {
    return (
      this.getRatingSummaryByProduct().get(productId) ?? {
        reviewCount: 0,
        avgRating: 0,
        bayesianRating: 0,
        stars: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
      }
    );
  },

  addFlag(flag: Omit<FraudFlag, "id" | "createdAt">): FraudFlag {
    const record: FraudFlag = {
      ...flag,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    flags.set(record.id, record);
    return record;
  },

  listFlags(): FraudFlag[] {
    return [...flags.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
};
