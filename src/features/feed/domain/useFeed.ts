import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProviderId } from "./FeedItem";
import { providerC } from "../api";
import { FEATURED_LIMIT, featuredQuery, feedRoundsQuery } from "./feedQueries";
import { buildFeedSections } from "./feedSections";

export function useFeed() {
  const queryClient = useQueryClient();
  const rounds = useInfiniteQuery(feedRoundsQuery);
  const featured = useQuery(featuredQuery);

  const sections = buildFeedSections({
    featuredItems: featured.data ?? [],
    rounds: rounds.data?.pages.map((round) => round.items) ?? [],
    featuredLimit: FEATURED_LIMIT,
  });

  const failedProviders = new Set<ProviderId>(rounds.data?.pages.at(-1)?.failedProviders);
  if (featured.isError) failedProviders.add(providerC.id);

  const canLoadMore = rounds.hasNextPage && !rounds.isFetching;

  const loadMore = () => {
    if (canLoadMore) rounds.fetchNextPage();
    return canLoadMore;
  };

  const retry = () => {
    if (rounds.isFetching) return;
    if (rounds.isFetchNextPageError) rounds.fetchNextPage();
    else rounds.refetch();
  };

  const refresh = async () => {
    queryClient.setQueryData(
      feedRoundsQuery.queryKey,
      (data) => data && { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) },
    );
    await Promise.all([rounds.refetch(), featured.refetch()]);
  };

  return {
    sections,
    // Wait until both requests have settled (success or error), so Featured doesn't pop in
    // above content the user is already looking at.
    isLoading: rounds.isPending || featured.isPending,
    isRefreshing: rounds.isRefetching || featured.isRefetching,
    isLoadingMore: rounds.isFetchingNextPage,
    loadFailed: rounds.isError,
    hasMore: rounds.hasNextPage,
    failedProviders: [...failedProviders],
    loadMore,
    retry,
    refresh,
  };
}
