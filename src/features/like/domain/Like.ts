/** Server-side like state of a feed item. `itemId` matches `FeedItem.id`. */
export type LikeCount = {
  itemId: string;
  count: number;
  /** Id of the backend record holding this count. Not necessarily equal to `itemId`. */
  recordId: string;
};

/** Like state keyed by item id. An item missing from the map has no record yet (0 likes). */
export type LikeCounts = Record<string, LikeCount>;
