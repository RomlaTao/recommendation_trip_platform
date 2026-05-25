import type { AdminReviewListItemModel } from '../models/admin-review-list-item.model.js';

export type AdminReviewListStatus = 'all' | 'active' | 'deleted';

export interface ListReviewsForAdminQuery {
  page: number;
  limit: number;
  q?: string;
  rating?: number;
  status?: AdminReviewListStatus;
}

export interface ListReviewsForAdminResult {
  items: AdminReviewListItemModel[];
  total: number;
  page: number;
  limit: number;
}
