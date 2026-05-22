export type Provider = "google" | "apple" | "linkedin";

export interface UserRecord {
  id: string;
  provider: Provider;
  providerUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isSuspended: boolean;
}

export type NodeType = "category" | "brand" | "product_type" | "model";

export interface TaxonomyNode {
  id: string;
  nodeType: NodeType;
  name: string;
  normalizedName: string;
  parentId: string | null;
  createdByUserId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  modelNodeId: string;
  canonicalName: string;
  normalizedCanonicalName: string;
  modelCode?: string;
  metadata: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  status: "published" | "flagged" | "hidden";
  riskScore: number;
  createdAt: string;
}

export interface FraudFlag {
  id: string;
  userId?: string;
  reviewId?: string;
  signalType: string;
  signalScore: number;
  createdAt: string;
}
