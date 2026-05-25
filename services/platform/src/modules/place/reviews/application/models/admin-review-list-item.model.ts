export interface AdminReviewListItemModel {
  id: string;
  placeId: string;
  placeName: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
