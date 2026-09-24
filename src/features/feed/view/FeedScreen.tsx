import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrowseRow } from "./BrowseRow";
import { DiscoverCarousel } from "./DiscoverCarousel";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { useFeed } from "../domain/useFeed";
import { buildFeedRows, FeedRow } from "./feedRows";
import { PROVIDER_LABELS } from "./ProviderLabel";

const keyExtractor = (row: FeedRow) => row.key;

export function FeedScreen() {
  const {
    sections,
    isLoading,
    isRefreshing,
    isLoadingMore,
    loadFailed,
    hasMore,
    failedProviders,
    loadMore,
    retry,
    refresh,
  } = useFeed();
  const { top } = useSafeAreaInsets();
  const rows = buildFeedRows(sections);

  const renderItem: ListRenderItem<FeedRow> = ({ item: row }) => {
    switch (row.type) {
      case "header":
        return <Text style={styles.sectionTitle}>{row.title}</Text>;
      case "featured":
        return <FeaturedCarousel items={row.items} />;
      case "browse":
        return <BrowseRow item={row.item} />;
      case "discover":
        return <DiscoverCarousel items={row.items} />;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
      <FlatList
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshing={isRefreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          failedProviders.length > 0 ? (
            <Text style={styles.error}>
              Couldn't load: {failedProviders.map((id) => PROVIDER_LABELS[id]).join(", ")}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loadFailed ? null : <Text style={styles.empty}>Nothing to show right now.</Text>
        }
        ListFooterComponent={
          <FeedFooter
            isLoadingMore={isLoadingMore}
            loadFailed={loadFailed}
            showEndOfFeed={!hasMore && rows.length > 0}
            onRetry={retry}
          />
        }
      />
    </View>
  );
}

type FeedFooterProps = {
  isLoadingMore: boolean;
  loadFailed: boolean;
  showEndOfFeed: boolean;
  onRetry: () => void;
};

function FeedFooter({ isLoadingMore, loadFailed, showEndOfFeed, onRetry }: FeedFooterProps) {
  if (isLoadingMore) return <ActivityIndicator style={styles.footer} />;
  if (loadFailed) {
    return (
      <Pressable onPress={onRetry} style={styles.footer}>
        <Text style={styles.footerText}>Couldn't load the feed. Tap to retry.</Text>
      </Pressable>
    );
  }
  if (showEndOfFeed) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>You're all caught up.</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingBottom: 32,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  error: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: "#c00",
  },
  footer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#666",
  },
  empty: {
    paddingVertical: 24,
    textAlign: "center",
    color: "#666",
  },
});
