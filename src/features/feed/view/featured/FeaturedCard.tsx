import { Image, StyleSheet, Text, View } from "react-native";
import { FeedItem } from "../../domain/FeedItem";
import { LikeButton } from "../../../like/view/LikeButton";
import { ProviderLabel } from "../ProviderLabel";

type Props = {
  item: FeedItem;
};

export function FeaturedCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl }}
        accessibilityLabel={item.imageAlt ?? undefined}
        style={styles.image}
      />
      <View style={styles.overlay}>
        <ProviderLabel provider={item.provider} />
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.meta} numberOfLines={1}>
            {item.author}
          </Text>
          <LikeButton itemId={item.id} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: "#ddd",
  },
});
