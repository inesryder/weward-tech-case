import { memo, useCallback } from "react";
import { FlatList, Image, ListRenderItem, StyleSheet, Text, View } from "react-native";
import { FeedItem } from "../../domain/FeedItem";
import { ProviderLabel } from "./ProviderLabel";

const CARD_WIDTH = 200;
const CARD_GAP = 12;

function DiscoverCardComponent({ item }: { item: FeedItem }) {
  return (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          accessibilityLabel={item.imageAlt ?? undefined}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        <ProviderLabel provider={item.provider} />
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
        {item.author && (
          <Text style={styles.author} numberOfLines={1}>
            {item.author}
          </Text>
        )}
      </View>
    </View>
  );
}

const DiscoverCard = memo(DiscoverCardComponent);

const keyExtractor = (item: FeedItem) => item.id;

type Props = {
  items: readonly FeedItem[];
};

function DiscoverCarouselComponent({ items }: Props) {
  const renderItem: ListRenderItem<FeedItem> = useCallback(
    ({ item }) => <DiscoverCard item={item} />,
    [],
  );

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      snapToInterval={CARD_WIDTH + CARD_GAP}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: CARD_WIDTH + CARD_GAP,
        offset: (CARD_WIDTH + CARD_GAP) * index,
        index,
      })}
    />
  );
}

export const DiscoverCarousel = memo(DiscoverCarouselComponent);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f1ec",
  },
  image: {
    width: CARD_WIDTH,
    height: 130,
  },
  imagePlaceholder: {
    backgroundColor: "#ddd",
  },
  body: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  author: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
});
