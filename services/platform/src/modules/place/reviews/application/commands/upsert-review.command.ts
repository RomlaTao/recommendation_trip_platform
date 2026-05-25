export interface UpsertReviewCommand {
  rating: number;
  comment?: string;
  imageUrls?: string[];
}
