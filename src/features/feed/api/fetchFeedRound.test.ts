import { FeedItem, ProviderId } from "../domain/FeedItem";
import { fetchFeedRound, hasMoreRounds, initialCursors, ProviderCursors } from "./fetchFeedRound";
import { ContentProvider } from "./types";

function fakeProvider(id: ProviderId, pageCount: number, failingPages: number[] = []): ContentProvider {
  const failures = new Set(failingPages);
  return {
    id,
    fetchPage: async ({ page }) => {
      if (failures.delete(page)) throw new Error(`${id} page ${page} failed`);
      return {
        items: [{ id: `${id}-${page}` } as FeedItem],
        nextPage: page < pageCount ? page + 1 : null,
      };
    },
  };
}

describe("fetchFeedRound", () => {
  it("pages every provider until all are exhausted, retrying a failed page next round", async () => {
    const providers = [
      fakeProvider("provider-a", 2),
      fakeProvider("provider-b", 1),
      fakeProvider("provider-c", 3, [2]),
    ];
    const rounds = [];
    let cursors: ProviderCursors = initialCursors(providers);

    while (hasMoreRounds(cursors)) {
      const round = await fetchFeedRound(providers, cursors, 10);
      rounds.push(round);
      cursors = round.nextCursors;
    }

    expect(rounds).toEqual([
      {
        items: [{ id: "provider-a-1" }, { id: "provider-b-1" }, { id: "provider-c-1" }],
        failedProviders: [],
        nextCursors: { "provider-a": 2, "provider-c": 2 },
      },
      {
        items: [{ id: "provider-a-2" }],
        failedProviders: ["provider-c"],
        nextCursors: { "provider-c": 2 },
      },
      { items: [{ id: "provider-c-2" }], failedProviders: [], nextCursors: { "provider-c": 3 } },
      { items: [{ id: "provider-c-3" }], failedProviders: [], nextCursors: {} },
    ]);
  });

  it("fails the round only when every active provider fails", async () => {
    const providers = [fakeProvider("provider-a", 1, [1]), fakeProvider("provider-b", 1, [1])];

    await expect(fetchFeedRound(providers, initialCursors(providers), 10)).rejects.toThrow(
      "All providers failed: provider-a, provider-b",
    );
  });

  it("does not request providers without a cursor", async () => {
    const exhausted = fakeProvider("provider-b", 1);
    const fetchPage = jest.spyOn(exhausted, "fetchPage");

    await fetchFeedRound([fakeProvider("provider-a", 2), exhausted], { "provider-a": 1 }, 10);

    expect(fetchPage).not.toHaveBeenCalled();
  });
});
