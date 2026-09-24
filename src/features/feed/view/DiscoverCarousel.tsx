import { FlatList, Image, ListRenderItem, StyleSheet, Text, View } from "react-native";
import { FeedItem } from "../domain/FeedItem";
import { LikeButton } from "../../like/view/LikeButton";
import { ProviderLabel } from "./ProviderLabel";

const CARD_WIDTH = 200;
const CARD_GAP = 12;

function DiscoverCard({ item }: { item: FeedItem }) {
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
        <View style={styles.actions}>
          <LikeButton itemId={item.id} />
        </View>
      </View>
    </View>
  );
}

const keyExtractor = (item: FeedItem) => item.id;

type Props = {
  items: readonly FeedItem[];
};

export function DiscoverCarousel({ items }: Props) {
  const renderItem: ListRenderItem<FeedItem> = ({ item }) => <DiscoverCard item={item} />;

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
  actions: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
});
