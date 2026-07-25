export type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest';

export interface CreateReviewPayload {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}
