import { LikeCount } from "../../domain/Like";

export type LikesStoreDeps = {
  /**
   * Last server-confirmed like state, or undefined when the item has no like record yet.
   * Async so it can wait for the server's records before the first write, rather than
   * creating a duplicate record for an item the server already knows.
   */
  getServerLike: (itemId: string) => Promise<LikeCount | undefined>;
  setServerLike: (like: LikeCount) => void;
  saveLikeCount: (like: {
    itemId: string;
    count: number;
    recordId: string | undefined;
  }) => Promise<LikeCount>;
  likedStorage: {
    load: () => Record<string, true>;
    save: (liked: Record<string, true>) => void;
  };
  onSyncError: (itemId: string) => void;
  debounceMs: number;
};

/**
 * Optimistic like/unlike state, synced to the backend.
 *
 * Per item we track what the server confirmed (`confirmedLiked` + the server count)
 * and what the user wants now (`pending`). The UI shows `pending ?? confirmed`, so
 * a tap is instant and a rollback is just dropping the pending entry.
 *
 * Writes are debounced and serialized per item, and only the latest desired state
 * is sent: rapid like/unlike taps collapse into at most one request in flight, and
 * toggling back to the confirmed state before the debounce fires sends nothing.
 *
 * Only confirmed state is persisted: a like that never reached the server is not
 * resurrected on the next launch.
 */
export function createLikesStore(deps: LikesStoreDeps) {
  let confirmedLiked = deps.likedStorage.load();
  const pending = new Map<string, boolean>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const inFlight = new Set<string>();
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());
  const isConfirmedLiked = (itemId: string) => confirmedLiked[itemId] === true;

  function isLiked(itemId: string): boolean {
    return pending.get(itemId) ?? isConfirmedLiked(itemId);
  }

  /** Difference between the displayed count and the server count: -1, 0 or +1. */
  function countDelta(itemId: string): number {
    return Number(isLiked(itemId)) - Number(isConfirmedLiked(itemId));
  }

  function setConfirmedLiked(itemId: string, liked: boolean) {
    const { [itemId]: _, ...rest } = confirmedLiked;
    confirmedLiked = liked ? { ...rest, [itemId]: true } : rest;
    deps.likedStorage.save(confirmedLiked);
  }

  function schedule(itemId: string) {
    clearTimeout(timers.get(itemId));
    // A request already in flight re-checks pending state when it settles.
    if (inFlight.has(itemId)) return;
    timers.set(
      itemId,
      setTimeout(() => flush(itemId), deps.debounceMs),
    );
  }

  async function flush(itemId: string) {
    timers.delete(itemId);
    const desired = pending.get(itemId);
    if (desired === undefined) return;

    if (desired === isConfirmedLiked(itemId)) {
      pending.delete(itemId);
      notify();
      return;
    }

    inFlight.add(itemId);
    try {
      const serverLike = await deps.getServerLike(itemId);
      const target = Math.max(0, (serverLike?.count ?? 0) + (desired ? 1 : -1));
      const saved = await deps.saveLikeCount({
        itemId,
        count: target,
        recordId: serverLike?.recordId,
      });
      inFlight.delete(itemId);
      deps.setServerLike(saved);
      setConfirmedLiked(itemId, desired);
      // The user may have tapped again while the request was in flight.
      if (pending.get(itemId) === desired) pending.delete(itemId);
      else schedule(itemId);
    } catch {
      inFlight.delete(itemId);
      clearTimeout(timers.get(itemId));
      timers.delete(itemId);
      pending.delete(itemId);
      deps.onSyncError(itemId);
    }
    notify();
  }

  function toggle(itemId: string) {
    pending.set(itemId, !isLiked(itemId));
    notify();
    schedule(itemId);
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return { isLiked, countDelta, toggle, subscribe };
}

export type LikesStore = ReturnType<typeof createLikesStore>;
