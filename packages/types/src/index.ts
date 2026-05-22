export type NodeType = "category" | "brand" | "product_type" | "model";

export interface TaxonomyNode {
  id: string;
  nodeType: NodeType;
  name: string;
  parentId: string | null;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  createdAt: string;
}

export interface ProductRatingSummary {
  productId: string;
  reviewCount: number;
  avgRating: number;
  bayesianRating: number;
}
