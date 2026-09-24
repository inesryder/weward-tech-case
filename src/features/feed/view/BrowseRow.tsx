import { Image, StyleSheet, Text, View } from "react-native";
import { FeedItem } from "../domain/FeedItem";
import { LikeButton } from "../../like/view/LikeButton";
import { ProviderLabel } from "./ProviderLabel";

type Props = {
  item: FeedItem;
};

export function BrowseRow({ item }: Props) {
  const meta = [item.author, item.publishedAt.toLocaleDateString()].filter(Boolean).join(" · ");

  return (
    <View style={styles.row}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          accessibilityLabel={item.imageAlt ?? undefined}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.text}>
        <ProviderLabel provider={item.provider} />
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {meta.length > 0 && <Text style={styles.meta}>{meta}</Text>}
      </View>
      <LikeButton itemId={item.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  text: {
    flex: 1,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  imagePlaceholder: {
    backgroundColor: "#e5e5e5",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: "#666",
  },
});
