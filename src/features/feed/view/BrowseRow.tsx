import { Image, StyleSheet, Text, View } from "react-native";
import { FeedItem } from "../domain/FeedItem";
import { LikeButton } from "../../like/view/LikeButton";
import { ProviderLabel } from "./ProviderLabel";

type Props = {
  item: FeedItem;
};

export function BrowseRow({ item }: Props) {
  return (
    <View style={styles.row}>
      <Image
        source={{ uri: item.imageUrl }}
        accessibilityLabel={item.imageAlt ?? undefined}
        style={styles.image}
      />
      <View style={styles.text}>
        <ProviderLabel provider={item.provider} />
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {item.author} · {item.publishedAt.toLocaleDateString()}
        </Text>
      </View>
      <LikeButton itemId={item.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: 16,
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
