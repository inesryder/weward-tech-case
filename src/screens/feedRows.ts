import { FeedItem } from "../domain/FeedItem";
import { FeedSectionKey, FeedSections } from "../features/feed/buildFeed";

/**
 * The feed is rendered as one virtualized list of heterogeneous rows, so the
 * whole screen scrolls as a single surface. Each row type maps to one component.
 */
export type FeedRow =
  | { type: "header"; key: string; section: FeedSectionKey; title: string }
  | { type: "featured"; key: string; item: FeedItem }
  | { type: "browse"; key: string; item: FeedItem }
  | { type: "discover"; key: string; items: FeedItem[] };

const SECTION_TITLES: Record<FeedSectionKey, string> = {
  featured: "Featured",
  browse: "Browse",
  discover: "Discover",
};

const BROWSE_ITEMS_BEFORE_DISCOVER = 10;

function header(section: FeedSectionKey): FeedRow {
  return { type: "header", key: `header-${section}`, section, title: SECTION_TITLES[section] };
}

function browseRow(item: FeedItem): FeedRow {
  return { type: "browse", key: `browse-${item.id}`, item };
}

export function buildFeedRows(sections: FeedSections): FeedRow[] {
  const rows: FeedRow[] = [];

  if (sections.featured.length > 0) {
    rows.push(header("featured"));
    for (const item of sections.featured) {
      rows.push({ type: "featured", key: `featured-${item.id}`, item });
    }
  }

  // Discover is slotted inside Browse rather than after it, so Browse can keep
  // growing at the bottom of the list as more pages are appended.
  const browseBeforeDiscover = sections.browse.slice(0, BROWSE_ITEMS_BEFORE_DISCOVER);
  const browseAfterDiscover = sections.browse.slice(BROWSE_ITEMS_BEFORE_DISCOVER);

  if (browseBeforeDiscover.length > 0) {
    rows.push(header("browse"));
    rows.push(...browseBeforeDiscover.map(browseRow));
  }

  if (sections.discover.length > 0) {
    rows.push(header("discover"));
    rows.push({ type: "discover", key: "discover-carousel", items: sections.discover });
  }

  rows.push(...browseAfterDiscover.map(browseRow));

  return rows;
}
