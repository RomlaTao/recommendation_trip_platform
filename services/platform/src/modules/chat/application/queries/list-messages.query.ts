export interface ListMessagesQuery {
  page: number;
  limit: number;
}

export interface ListMessagesResult<TItem> {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
}
