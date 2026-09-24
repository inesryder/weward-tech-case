import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProviderId } from "./FeedItem";
import { CONTENT_PROVIDERS } from "../api";
import { FeedRound } from "../api/fetchFeedRound";
import { providerC } from "../api/providerC";
import { feedRoundsQuery, providerCFeaturedQuery } from "./feedQueries";
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

  const sections = buildFeedSections({
    featured: featured.data ?? [],
    rounds: rounds.data?.pages.map((round) => round.items) ?? [],
    featuredLimit: FEATURED_LIMIT,
  });

  // Only the latest round matters: a provider that failed earlier and has since recovered isn't reported.
  const latestRound = rounds.data?.pages.at(-1);
  const failed = new Set<ProviderId>(latestRound?.failedProviders ?? []);
  if (!rounds.data && rounds.isError) CONTENT_PROVIDERS.forEach((p) => failed.add(p.id));
  if (featured.isError) failed.add(providerC.id);
  const failedProviders = [...failed];

  const {
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    fetchNextPage,
    refetch: refetchRounds,
  } = rounds;
  const { refetch: refetchFeatured } = featured;

  const loadMore = () => {
    // Don't stack a page load on top of a refresh or another page load.
    if (hasNextPage && !isFetching) fetchNextPage();
  };

  // A failed next page is retried as a page load; a failed first load or refresh is re-fetched.
  const retry = () => {
    if (isFetching) return;
    if (isFetchNextPageError) fetchNextPage();
    else refetchRounds();
  };

  const refresh = async () => {
    // Pull-to-refresh restarts pagination from the first round instead of re-fetching every loaded page.
    queryClient.setQueryData(roundsQuery.queryKey, keepFirstRound);
    await Promise.all([refetchRounds(), refetchFeatured()]);
  };

  return {
    sections,
    // Wait until both requests have settled (success or error), so Featured doesn't pop in
    // above content the user is already looking at. Individual provider failures inside a
    // round don't block the feed.
    isLoading: rounds.isPending || featured.isPending,
    isRefreshing: rounds.isRefetching || featured.isRefetching,
    isLoadingMore: rounds.isFetchingNextPage,
    // Covers a failed first load, refresh, or next page: in each case the user needs a retry.
    loadFailed: rounds.isError,
    hasMore: hasNextPage,
    failedProviders,
    loadMore,
    retry,
    refresh,
  };
}
