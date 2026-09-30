import { ServerLike } from "./Like";
import { createLikesStore, LikesStoreDeps } from "./likesStore";

const DEBOUNCE_MS = 400;

function setup({
  counts = {} as Record<string, number>,
  liked = {} as Record<string, true>,
  saveLikeCount,
}: {
  counts?: Record<string, number>;
  liked?: Record<string, true>;
  saveLikeCount?: LikesStoreDeps["saveLikeCount"];
} = {}) {
  const server: Record<string, ServerLike> = Object.fromEntries(
    Object.entries(counts).map(([itemId, count]) => [itemId, { itemId, count, recordId: `rec-${itemId}` }]),
  );
  let storedLiked = { ...liked };
  const deps: LikesStoreDeps = {
    getServerLike: async (itemId) => server[itemId],
    setServerLike: (like) => {
      server[like.itemId] = like;
    },
    saveLikeCount: jest.fn(
      saveLikeCount ??
        (async ({ itemId, count, recordId }) => ({ itemId, count, recordId: recordId ?? `new-${itemId}` })),
    ),
    likedStorage: {
      load: () => storedLiked,
      save: (value) => {
        storedLiked = value;
      },
    },
    onSyncError: jest.fn(),
    debounceMs: DEBOUNCE_MS,
  };
  const store = createLikesStore(deps);
  const view = (itemId: string) => ({
    isLiked: store.isLiked(itemId),
    count: (server[itemId]?.count ?? 0) + store.countDelta(itemId),
  });
  return { store, deps, view, stored: () => storedLiked };
}

const settle = () => jest.advanceTimersByTimeAsync(DEBOUNCE_MS);

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("likesStore", () => {
  it("updates instantly, then writes the new count and persists the confirmed like", async () => {
    const { store, deps, view, stored } = setup({ counts: { a: 12 } });

    store.toggle("a");
    expect(view("a")).toEqual({ isLiked: true, count: 13 });
    expect(deps.saveLikeCount).not.toHaveBeenCalled();

    await settle();

    expect(deps.saveLikeCount).toHaveBeenCalledTimes(1);
    expect(deps.saveLikeCount).toHaveBeenCalledWith({ itemId: "a", count: 13, recordId: "rec-a" });
    expect(view("a")).toEqual({ isLiked: true, count: 13 });
    expect(stored()).toEqual({ a: true });
  });

  it("creates a record for a never-liked item, then updates the record the server created", async () => {
    const { store, deps } = setup();

    store.toggle("n");
    await settle();
    store.toggle("n");
    await settle();

    expect(deps.saveLikeCount).toHaveBeenNthCalledWith(1, { itemId: "n", count: 1, recordId: undefined });
    expect(deps.saveLikeCount).toHaveBeenNthCalledWith(2, { itemId: "n", count: 0, recordId: "new-n" });
  });

  it("collapses rapid taps into one write of the final state", async () => {
    const { store, deps, view } = setup({ counts: { a: 5 } });

    store.toggle("a");
    store.toggle("a");
    store.toggle("a");
    await settle();

    expect(deps.saveLikeCount).toHaveBeenCalledTimes(1);
    expect(deps.saveLikeCount).toHaveBeenCalledWith(expect.objectContaining({ count: 6 }));
    expect(view("a")).toEqual({ isLiked: true, count: 6 });
  });

  it("sends nothing when the user taps back before the debounce", async () => {
    const { store, deps, view } = setup({ counts: { a: 5 } });

    store.toggle("a");
    store.toggle("a");
    await settle();

    expect(deps.saveLikeCount).not.toHaveBeenCalled();
    expect(view("a")).toEqual({ isLiked: false, count: 5 });
  });

  it("reverts and reports when the write fails", async () => {
    const { store, deps, view, stored } = setup({
      counts: { a: 5 },
      saveLikeCount: async () => {
        throw new Error("network");
      },
    });

    store.toggle("a");
    await settle();

    expect(view("a")).toEqual({ isLiked: false, count: 5 });
    expect(deps.onSyncError).toHaveBeenCalledTimes(1);
    expect(stored()).toEqual({});
  });

  it("sends a follow-up write when the user taps again during a request", async () => {
    let resolveFirst: (like: ServerLike) => void = () => {};
    const { store, deps, view } = setup({
      counts: { a: 5 },
      saveLikeCount: ({ itemId, count, recordId }) =>
        (deps.saveLikeCount as jest.Mock).mock.calls.length === 1
          ? new Promise((resolve) => {
              resolveFirst = resolve;
            })
          : Promise.resolve({ itemId, count, recordId: recordId ?? itemId }),
    });

    store.toggle("a");
    await settle();
    store.toggle("a");
    expect(view("a")).toEqual({ isLiked: false, count: 5 });

    resolveFirst({ itemId: "a", count: 6, recordId: "rec-a" });
    await settle();

    expect((deps.saveLikeCount as jest.Mock).mock.calls.map(([like]) => like.count)).toEqual([6, 5]);
    expect(view("a")).toEqual({ isLiked: false, count: 5 });
  });

  it("starts from the persisted liked state and can unlike", async () => {
    const { store, deps, view, stored } = setup({ counts: { a: 6 }, liked: { a: true } });

    expect(view("a")).toEqual({ isLiked: true, count: 6 });
    store.toggle("a");
    await settle();

    expect(deps.saveLikeCount).toHaveBeenCalledWith(expect.objectContaining({ count: 5 }));
    expect(stored()).toEqual({});
  });

  it("notifies subscribers on tap and when the write settles", async () => {
    const { store } = setup({ counts: { a: 1 } });
    const listener = jest.fn();
    store.subscribe(listener);

    store.toggle("a");
    expect(listener).toHaveBeenCalledTimes(1);
    await settle();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
