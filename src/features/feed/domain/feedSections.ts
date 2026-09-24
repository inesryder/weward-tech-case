import { FeedItem } from "./FeedItem";

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
 * Groups are ordered by when they *qualify* (their Nth item is seen), not when the
 * author first appears, so an author crossing the threshold after more pages load
 * is appended rather than inserted ahead of groups already on screen.
 */
function groupByAuthor(items: readonly FeedItem[]): AuthorGroup[] {
  const itemsByAuthor = new Map<string, FeedItem[]>();
  const groups: AuthorGroup[] = [];

  for (const item of items) {
    if (!item.author) continue;
    const authorItems = itemsByAuthor.get(item.author) ?? [];
    itemsByAuthor.set(item.author, authorItems);
    authorItems.push(item);
    if (authorItems.length === MIN_ITEMS_PER_AUTHOR_GROUP) {
      groups.push({ author: item.author, items: authorItems });
    }
  }

  return groups;
}

export function buildFeedSections({
  featuredItems,
  rounds,
  featuredLimit,
}: {
  featuredItems: readonly FeedItem[];
  rounds: readonly FeedItem[][];
  featuredLimit: number;
}): FeedSections {
  const featured: FeedItem[] = [];
  const browse: FeedItem[] = [];
  const seen = new Set<string>();

  for (const item of [featuredItems, ...rounds].flat()) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    if (item.featured && featured.length < featuredLimit) featured.push(item);
    else browse.push(item);
  }

  return { featured, browse, discover: groupByAuthor(browse) };
}
