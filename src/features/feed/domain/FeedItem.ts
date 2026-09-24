/**
 * Internal, provider-agnostic representation of a piece of content.
 * Every provider's raw payload is normalized into this shape in the data layer;
 * nothing above the data layer should know what a provider's raw schema looks like.
 */

export type ProviderId = "provider-a" | "provider-b" | "provider-c";

export type SectionHint = "featured" | "browse" | "discover";

export type FeedItem = {
  /** Globally unique across providers (e.g. "a-1", "b-100", "c-3"). Also the key used by the likes resource. */
  id: string;
  provider: ProviderId;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  /** Required: items with a missing or invalid date are dropped during normalization. */
  publishedAt: Date;
  url: string;
  author: string | null;
  tags: string[];
  /** Provider's suggestion for where the item should be displayed, if any. */
  sectionHint: SectionHint | null;
};
