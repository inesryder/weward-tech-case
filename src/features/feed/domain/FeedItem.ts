export type ProviderId = "provider-a" | "provider-b" | "provider-c";

export type FeedItem = {
  /** Unique across providers (e.g. "a-1", "c-3"); also the item key of the likes resource. */
  id: string;
  provider: ProviderId;
  title: string;
  imageUrl: string;
  imageAlt: string | null;
  publishedAt: Date;
  url: string;
  author: string;
  featured: boolean;
};
