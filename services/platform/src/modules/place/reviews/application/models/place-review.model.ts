export interface PlaceReviewModel {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  comment: string | null;
  imageUrls: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
