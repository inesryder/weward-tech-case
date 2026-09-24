import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { ProviderId } from "../../domain/FeedItem";
import { CONTENT_PROVIDERS } from "../../data/providers";
import { FeedRound } from "../../data/providers/fetchFeedRound";
import { providerC } from "../../data/providers/providerC";
import { feedRoundsQuery, providerCFeaturedQuery } from "../../queries/providerQueries";
import { buildFeedSections } from "./buildFeed";

const ITEMS_PER_PROVIDER_PAGE = 10;
const FEATURED_LIMIT = 5;

const roundsQuery = feedRoundsQuery(CONTENT_PROVIDERS, ITEMS_PER_PROVIDER_PAGE);
const featuredQuery = providerCFeaturedQuery(FEATURED_LIMIT);

function keepFirstRound<TPageParam>(
  data: InfiniteData<FeedRound, TPageParam> | undefined,
): InfiniteData<FeedRound, TPageParam> | undefined {
  if (!data) return data;
  return { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) };
}

export function useFeed() {
  const queryClient = useQueryClient();
  const rounds = useInfiniteQuery(roundsQuery);
  const featured = useQuery(featuredQuery);

  const sections = useMemo(
    () =>
      buildFeedSections({
        featured: featured.data ?? [],
        rounds: rounds.data?.pages.map((round) => round.items) ?? [],
        featuredLimit: FEATURED_LIMIT,
      }),
    [featured.data, rounds.data],
  );

  const failedProviders = useMemo(() => {
    // Only the latest round matters: a provider that failed earlier and has since recovered isn't reported.
    const latestRound = rounds.data?.pages.at(-1);
    const failed = new Set<ProviderId>(latestRound?.failedProviders ?? []);
    if (!rounds.data && rounds.isError) CONTENT_PROVIDERS.forEach((p) => failed.add(p.id));
    if (featured.isError) failed.add(providerC.id);
    return [...failed];
  }, [rounds.data, rounds.isError, featured.isError]);

  const { hasNextPage, isFetching, fetchNextPage, refetch: refetchRounds } = rounds;
  const { refetch: refetchFeatured } = featured;

  const loadMore = useCallback(() => {
    // Don't stack a page load on top of a refresh or another page load.
    if (hasNextPage && !isFetching) fetchNextPage();
  }, [hasNextPage, isFetching, fetchNextPage]);

  const refresh = useCallback(async () => {
    // Pull-to-refresh restarts pagination from the first round instead of re-fetching every loaded page.
    queryClient.setQueryData(roundsQuery.queryKey, keepFirstRound);
    await Promise.all([refetchRounds(), refetchFeatured()]);
  }, [queryClient, refetchRounds, refetchFeatured]);

  return {
    sections,
    // Show whatever has arrived: one slow or failing provider shouldn't blank the feed.
    isLoading: rounds.isPending && featured.isPending,
    isRefreshing: rounds.isRefetching || featured.isRefetching,
    isLoadingMore: rounds.isFetchingNextPage,
    loadMoreFailed: rounds.isFetchNextPageError,
    hasMore: hasNextPage,
    failedProviders,
    loadMore,
    refresh,
  };
}
