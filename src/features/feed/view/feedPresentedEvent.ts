import { ProviderId } from "../domain/FeedItem";
import { FeedRow } from "./feedRows";

export type FeedPresentedTrigger = "initial" | "load_more" | "refresh" | "retry";

type PresentedItem = {
  position: number;
  itemId: string;
  provider: ProviderId;
};

type PresentedDiscoverGroup = {
  position: number;
  author: string;
  afterBrowsePosition: number;
  items: PresentedItem[];
};

type PresentedSections = {
  featured: PresentedItem[];
  browse: PresentedItem[];
  discover: PresentedDiscoverGroup[];
};

export type FeedPresentedEvent = {
  name: "feed_presented";
  trigger: FeedPresentedTrigger;
  timestamp: string;
  sessionId: string;
  screenViewId: string;
  sequence: number;
  app: { version: string; platform: string; osVersion: string };
  msSinceScreenMount: number;
  failedProviders: ProviderId[];
  sections: PresentedSections;
  counts: { featured: number; browse: number; discoverGroups: number; discoverItems: number };
};

/**
 * Lays the rendered rows out as sections with 1-based positions, keeping only entries
 * not reported yet, so a load more only carries what it newly presented.
 */
export function presentedSections(
  rows: readonly FeedRow[],
  reported: ReadonlySet<string>,
): { sections: PresentedSections; keys: string[] } {
  const sections: PresentedSections = { featured: [], browse: [], discover: [] };
  const keys: string[] = [];
  let browsePosition = 0;
  let groupPosition = 0;

  const isNew = (key: string) => {
    if (reported.has(key)) return false;
    keys.push(key);
    return true;
  };

  for (const row of rows) {
    if (row.type === "featured") {
      row.items.forEach((item, index) => {
        if (isNew(`featured:${item.id}`)) {
          sections.featured.push({ position: index + 1, itemId: item.id, provider: item.provider });
        }
      });
    } else if (row.type === "browse") {
      browsePosition += 1;
      if (isNew(`browse:${row.item.id}`)) {
        sections.browse.push({ position: browsePosition, itemId: row.item.id, provider: row.item.provider });
      }
    } else if (row.type === "discover") {
      groupPosition += 1;
      const items = row.items
        .map((item, index) => ({ position: index + 1, itemId: item.id, provider: item.provider }))
        .filter((item) => isNew(`discover:${row.author}:${item.itemId}`));
      if (items.length > 0) {
        sections.discover.push({
          position: groupPosition,
          author: row.author,
          afterBrowsePosition: browsePosition,
          items,
        });
      }
    }
  }

  return { sections, keys };
}

export function countPresented(sections: PresentedSections): FeedPresentedEvent["counts"] {
  return {
    featured: sections.featured.length,
    browse: sections.browse.length,
    discoverGroups: sections.discover.length,
    discoverItems: sections.discover.reduce((total, group) => total + group.items.length, 0),
  };
}
