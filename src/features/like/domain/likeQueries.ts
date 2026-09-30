import { QueryClient, queryOptions } from "@tanstack/react-query";
import { ServerLike } from "./Like";
import { fetchLikeCounts } from "../api/likesApi";
import { likeCountsStorage } from "../api/likesStorage";

const LIKES_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Server like state. Seeded from the local cache so counts don't blink to zero on
 * cold start; the cache is marked as infinitely old so it's always refetched on mount.
 * Every successful fetch refreshes the local cache.
 */
export const serverLikesQuery = queryOptions({
  queryKey: ["likes"],
  queryFn: async ({ signal }) => {
    const counts = await fetchLikeCounts(signal);
    likeCountsStorage.save(counts);
    return counts;
  },
  initialData: () => likeCountsStorage.load(),
  initialDataUpdatedAt: 0,
  // Refetched on launch (stale seed), not every time a like button mounts while scrolling.
  staleTime: LIKES_STALE_TIME_MS,
});

/** Records like state confirmed by the server, in the query cache and the local cache. */
export function setServerLike(client: QueryClient, like: ServerLike): void {
  const likes = client.setQueryData(serverLikesQuery.queryKey, (previous) => ({
    ...previous,
    [like.itemId]: like,
  }));
  if (likes) likeCountsStorage.save(likes);
}
