import { FeedItem, SectionHint } from "../../domain/FeedItem";

export type FeedSectionKey = SectionHint;

export type FeedSections = Record<FeedSectionKey, FeedItem[]>;

/** Deterministic string hash (djb2), so an item keeps its section across refreshes and pages. */
function hashId(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Each item lives in exactly one section:
 * - a provider section hint wins (only provider C sends one),
 * - items without a hint are split between Browse and Discover.
 */
export function sectionForItem(item: FeedItem): FeedSectionKey {
  if (item.sectionHint) return item.sectionHint;
  return hashId(item.id) % 2 === 0 ? "browse" : "discover";
}

/**
 * Builds the feed sections from the featured items and the loaded rounds.
 * - Items keep the order they were fetched in and rounds are appended in load
 *   order, so loading more never reorders items already on screen.
 * - Duplicate ids are dropped (first occurrence wins; providers can repeat items).
 */
export function buildFeedSections({
  featured,
  rounds,
  featuredLimit,
}: {
  featured: readonly FeedItem[];
  rounds: readonly FeedItem[][];
  featuredLimit: number;
}): FeedSections {
  const sections: FeedSections = { featured: [], browse: [], discover: [] };
  const seen = new Set<string>();

  for (const batch of [featured, ...rounds]) {
    for (const item of batch) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      sections[sectionForItem(item)].push(item);
    }
  }
  sections.featured = sections.featured.slice(0, featuredLimit);

  return sections;
}
