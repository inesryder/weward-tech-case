import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  CONTENT_PROVIDERS,
  fetchFeedRound,
  fetchProviderCFeatured,
  hasMoreRounds,
  initialCursors,
} from "../api";

const ITEMS_PER_PROVIDER_PAGE = 10;
export const FEATURED_LIMIT = 5;

export const feedRoundsQuery = infiniteQueryOptions({
  queryKey: ["feed", "rounds"],
  initialPageParam: initialCursors(CONTENT_PROVIDERS),
  queryFn: ({ pageParam, signal }) =>
    fetchFeedRound(CONTENT_PROVIDERS, pageParam, ITEMS_PER_PROVIDER_PAGE, signal),
  getNextPageParam: (lastRound) =>
    hasMoreRounds(lastRound.nextCursors) ? lastRound.nextCursors : undefined,
});

export const featuredQuery = queryOptions({
  queryKey: ["feed", "featured"],
  queryFn: ({ signal }) => fetchProviderCFeatured({ limit: FEATURED_LIMIT, signal }),
});
