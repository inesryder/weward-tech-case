import { FeedItem } from "./FeedItem";
import { buildFeedSections } from "./feedSections";

function item(id: string, overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id,
    provider: "provider-a",
    title: id,
    imageUrl: `https://example.com/${id}.jpg`,
    imageAlt: null,
    publishedAt: new Date(2026, 0, 1),
    url: `https://example.com/${id}`,
    author: "Author",
    featured: false,
    ...overrides,
  };
}

const ids = (items: FeedItem[]) => items.map((feedItem) => feedItem.id);

describe("buildFeedSections", () => {
  it("fills Featured up to the limit and sends everything else to Browse, in fetch order", () => {
    const sections = buildFeedSections({
      featuredItems: [item("f1", { featured: true }), item("f2", { featured: true })],
      rounds: [[item("a"), item("f3", { featured: true }), item("b")]],
      featuredLimit: 2,
    });

    expect(ids(sections.featured)).toEqual(["f1", "f2"]);
    expect(ids(sections.browse)).toEqual(["a", "f3", "b"]);
  });

  it("drops duplicate ids, keeping the first occurrence", () => {
    const sections = buildFeedSections({
      featuredItems: [item("f1", { featured: true })],
      rounds: [[item("a"), item("f1", { featured: true })], [item("a"), item("b")]],
      featuredLimit: 5,
    });

    expect(ids(sections.featured)).toEqual(["f1"]);
    expect(ids(sections.browse)).toEqual(["a", "b"]);
  });

  it("groups Browse items by author, only from 2 items, ordered by when they qualify", () => {
    const sections = buildFeedSections({
      featuredItems: [],
      rounds: [
        [
          item("1", { author: "Early" }),
          item("2", { author: "Solo" }),
          item("3", { author: "Late" }),
          item("4", { author: "Late" }),
        ],
        [item("5", { author: "Early" }), item("6", { author: "Late" })],
      ],
      featuredLimit: 5,
    });

    expect(sections.discover.map((group) => [group.author, ids(group.items)])).toEqual([
      ["Late", ["3", "4", "6"]],
      ["Early", ["1", "5"]],
    ]);
  });
});
