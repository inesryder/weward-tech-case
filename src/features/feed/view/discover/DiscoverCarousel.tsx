import { Image, StyleSheet, Text, View } from "react-native";
import { SnapCarousel } from "../../../../shared/SnapCarousel";
import { FeedItem } from "../../domain/FeedItem";
import { LikeButton } from "../../../like/view/LikeButton";
import { ProviderLabel } from "../ProviderLabel";

const CARD_WIDTH = 200;

function DiscoverCard({ item }: { item: FeedItem }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl }}
        accessibilityLabel={item.imageAlt ?? undefined}
        style={styles.image}
      />
      <View style={styles.body}>
        <View>
          <ProviderLabel provider={item.provider} />
          <Text style={styles.title} numberOfLines={3}>
            {item.title}
          </Text>
        </View>
        <View style={styles.actions}>
          <LikeButton itemId={item.id} />
        </View>
      </View>
    </View>
  );
}

type Props = {
  items: readonly FeedItem[];
};

export function DiscoverCarousel({ items }: Props) {
  return (
    <SnapCarousel
      items={items}
      itemWidth={CARD_WIDTH}
      keyExtractor={(item) => item.id}
      renderItem={(item) => <DiscoverCard item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f1ec",
  },
  image: {
    width: "100%",
    height: 130,
    backgroundColor: "#ddd",
  },
  body: {
    padding: 10,
    flexGrow: 1,
    justifyContent: "space-between",
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
