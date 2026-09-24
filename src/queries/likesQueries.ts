import { QueryClient, queryOptions } from "@tanstack/react-query";
import { LikeCount, LikeCounts } from "../domain/Like";
import { fetchLikeCounts } from "../data/likes/likesApi";
import { likeCountsStorage } from "../data/likes/likesStorage";

export const likesQueryKeys = {
  counts: ["likes", "counts"] as const,
};

/**
 * Server like state. Seeded from the local cache so counts don't blink to zero on
 * cold start; the cache is marked as infinitely old so it's always refetched on mount.
 * Every successful fetch refreshes the local cache.
 */
export const likeCountsQuery = queryOptions({
  queryKey: likesQueryKeys.counts,
  queryFn: async ({ signal }) => {
    const counts = await fetchLikeCounts(signal);
    likeCountsStorage.save(counts);
    return counts;
  },
  initialData: () => likeCountsStorage.load(),
  initialDataUpdatedAt: 0,
});

/** Records like state confirmed by the server, in the query cache and the local cache. */
export function setLikeCount(client: QueryClient, like: LikeCount): void {
  const likes = client.setQueryData<LikeCounts>(likesQueryKeys.counts, (previous) => ({
    ...previous,
    [like.itemId]: like,
  }));
  if (likes) likeCountsStorage.save(likes);
}
