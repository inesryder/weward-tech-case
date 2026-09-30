import { FeedItem } from "../domain/FeedItem";
import { buildFeedSections } from "../domain/feedSections";
import { countPresented, presentedSections } from "./feedPresentedEvent";
import { buildFeedRows } from "./feedRows";

function item(id: string, author = "Author", featured = false): FeedItem {
  return {
    id,
    provider: "provider-a",
    title: id,
    imageUrl: `https://example.com/${id}.jpg`,
    imageAlt: null,
    publishedAt: new Date(2026, 0, 1),
    url: `https://example.com/${id}`,
    author,
    featured,
  };
}

function rowsFor(rounds: FeedItem[][], featuredItems: FeedItem[] = []) {
  return buildFeedRows(buildFeedSections({ featuredItems, rounds, featuredLimit: 5 }));
}

// Ten items per round, alternating between two authors, so each round has a full Browse block.
function round(start: number): FeedItem[] {
  return Array.from({ length: 10 }, (_, index) => {
    const n = start + index;
    return item(`i${n}`, n % 2 === 0 ? "Even" : "Odd");
  });
}

describe("presentedSections", () => {
  it("lays out every section with 1-based positions", () => {
    const rows = rowsFor([round(1)], [item("f1", "Author", true), item("f2", "Author", true)]);

    const { sections } = presentedSections(rows, new Set());

    expect(sections.featured.map((entry) => [entry.position, entry.itemId])).toEqual([
      [1, "f1"],
      [2, "f2"],
    ]);
    expect(sections.browse.map((entry) => entry.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(sections.discover).toEqual([
      {
        position: 1,
        author: "Odd",
        afterBrowsePosition: 10,
        items: [1, 3, 5, 7, 9].map((n, index) => ({
          position: index + 1,
          itemId: `i${n}`,
          provider: "provider-a",
        })),
      },
    ]);
    expect(countPresented(sections)).toEqual({
      featured: 2,
      browse: 10,
      discoverGroups: 1,
      discoverItems: 5,
    });
  });

  it("after a load more, only reports newly presented entries with continuing positions", () => {
    const reported = new Set(presentedSections(rowsFor([round(1)]), new Set()).keys);

    const { sections } = presentedSections(rowsFor([round(1), round(11)]), reported);

    expect(sections.featured).toEqual([]);
    expect(sections.browse.map((entry) => entry.position)).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
    expect(sections.discover.map((group) => [group.position, group.author, group.items.length])).toEqual([
      [1, "Odd", 5],
      [2, "Even", 10],
    ]);
    expect(sections.discover[0].items[0].position).toBe(6);
  });

  it("reports nothing when nothing new was presented", () => {
    const rows = rowsFor([round(1)]);
    const reported = new Set(presentedSections(rows, new Set()).keys);

    const { sections, keys } = presentedSections(rows, reported);

    expect(keys).toEqual([]);
    expect(countPresented(sections)).toEqual({ featured: 0, browse: 0, discoverGroups: 0, discoverItems: 0 });
  });
});
