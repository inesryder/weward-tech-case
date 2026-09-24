import { FeedItem } from "../../domain/FeedItem";

export type AuthorGroup = {
  author: string;
  items: FeedItem[];
};

export type FeedSections = {
  featured: FeedItem[];
  browse: FeedItem[];
  discover: AuthorGroup[];
};

const MIN_ITEMS_PER_AUTHOR_GROUP = 2;

/**
 * Groups items by author, keeping only authors with enough items for a carousel.
 * Groups are ordered by when they *qualify* (their Nth item is seen), not when
 * the author first appears, so an author crossing the threshold after more pages
 * load is appended rather than inserted ahead of groups already on screen.
 */
export function groupByAuthor(items: readonly FeedItem[]): AuthorGroup[] {
  const itemsByAuthor = new Map<string, FeedItem[]>();
  const qualified: AuthorGroup[] = [];

  for (const item of items) {
    if (!item.author) continue;
    let authorItems = itemsByAuthor.get(item.author);
    if (!authorItems) {
      authorItems = [];
      itemsByAuthor.set(item.author, authorItems);
    }
    authorItems.push(item);
    if (authorItems.length === MIN_ITEMS_PER_AUTHOR_GROUP) {
      qualified.push({ author: item.author, items: authorItems });
    }
  }

  return qualified;
}

/**
 * Builds the feed sections from the featured items and the loaded rounds.
 * - Items keep the order they were fetched in and rounds are appended in load
 *   order, so loading more never reorders items already on screen.
 * - Duplicate ids are dropped (first occurrence wins; providers can repeat items).
 * - Featured: items the provider flags as featured, up to `featuredLimit`.
 * - Browse: every item not shown in Featured.
 * - Discover: Browse items grouped by author (an item can be in both).
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
      const isFeatured =
        item.sectionHint === "featured" && sections.featured.length < featuredLimit;
      (isFeatured ? sections.featured : sections.browse).push(item);
    }
  }
  sections.discover = groupByAuthor(sections.browse);

  return sections;
}
