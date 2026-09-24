import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ContentProvider } from "../api";
import {
  fetchFeedRound,
  hasMoreRounds,
  initialCursors,
} from "../api/fetchFeedRound";
import { fetchProviderCFeatured, providerC } from "../api/providerC";

export const providerQueryKeys = {
  all: ["provider"] as const,
  feedRounds: (perPage: number) => [...providerQueryKeys.all, "feed-rounds", { perPage }] as const,
  featured: (providerId: string, limit: number) =>
    [...providerQueryKeys.all, providerId, "featured", { limit }] as const,
};

export function feedRoundsQuery(providers: readonly ContentProvider[], perPage: number) {
  return infiniteQueryOptions({
    queryKey: providerQueryKeys.feedRounds(perPage),
    initialPageParam: initialCursors(providers),
    queryFn: ({ pageParam, signal }) => fetchFeedRound(providers, pageParam, perPage, signal),
    getNextPageParam: (lastRound) =>
      hasMoreRounds(lastRound.nextCursors) ? lastRound.nextCursors : undefined,
  });
}

export function providerCFeaturedQuery(limit: number) {
  return queryOptions({
    queryKey: providerQueryKeys.featured(providerC.id, limit),
    queryFn: ({ signal }) => fetchProviderCFeatured({ limit, signal }),
  });
}
