import { FeedItem } from "../domain/FeedItem";
import { AuthorGroup, FeedSections } from "../domain/feedSections";

/**
 * The feed is rendered as one virtualized list of heterogeneous rows, so the
 * whole screen scrolls as a single surface. Each row type maps to one component.
 */
export type FeedRow =
  | { type: "header"; key: string; title: string }
  | { type: "featured"; key: string; items: FeedItem[] }
  | { type: "browse"; key: string; item: FeedItem }
  | { type: "discover"; key: string; items: FeedItem[] };

const BROWSE_ITEMS_BETWEEN_DISCOVER = 10;

function browseRow(item: FeedItem): FeedRow {
  return { type: "browse", key: `browse-${item.id}`, item };
}

function discoverRows(group: AuthorGroup): FeedRow[] {
  return [
    { type: "header", key: `header-discover-${group.author}`, title: `Discover more : ${group.author}` },
    { type: "discover", key: `discover-${group.author}`, items: group.items },
  ];
}

export function buildFeedRows(sections: FeedSections): FeedRow[] {
  const rows: FeedRow[] = [];

  if (sections.featured.length > 0) {
    rows.push({ type: "header", key: "header-featured", title: "Featured" });
    rows.push({ type: "featured", key: "featured-carousel", items: sections.featured });
  }

  if (sections.browse.length > 0) {
    rows.push({ type: "header", key: "header-browse", title: "Browse" });
  }

  // A Discover carousel is slotted after every full block of Browse items, while
  // author groups remain. Browse keeps growing at the bottom as pages are appended.
  let nextGroup = 0;
  sections.browse.forEach((item, index) => {
    rows.push(browseRow(item));
    const endOfBlock = (index + 1) % BROWSE_ITEMS_BETWEEN_DISCOVER === 0;
    if (endOfBlock && nextGroup < sections.discover.length) {
      rows.push(...discoverRows(sections.discover[nextGroup++]));
    }
  });

  return rows;
}
