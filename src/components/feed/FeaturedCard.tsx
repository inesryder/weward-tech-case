import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FeedItem } from "../../domain/FeedItem";
import { ProviderLabel } from "./ProviderLabel";

type Props = {
  item: FeedItem;
};

function FeaturedCardComponent({ item }: Props) {
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
      <View style={styles.overlay}>
        <ProviderLabel provider={item.provider} color="#fff" />
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.author && <Text style={styles.meta}>{item.author}</Text>}
      </View>
    </View>
  );
}

export const FeaturedCard = memo(FeaturedCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  imagePlaceholder: {
    backgroundColor: "#444",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: "#ddd",
  },
});
