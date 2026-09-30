import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { CAROUSEL_PADDING, SnapCarousel } from "../../../../shared/SnapCarousel";
import { FeedItem } from "../../domain/FeedItem";
import { FeaturedCard } from "./FeaturedCard";

type Props = {
  items: readonly FeedItem[];
};

export function FeaturedCarousel({ items }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View>
      <SnapCarousel
        items={items}
        itemWidth={screenWidth - CAROUSEL_PADDING * 2}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <FeaturedCard item={item} />}
        onePerSwipe
        onIndexChange={setActiveIndex}
      />
      {items.length > 1 && <PageIndicator count={items.length} activeIndex={activeIndex} />}
    </View>
  );
}

function PageIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dots} accessible accessibilityLabel={`Item ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  dotActive: {
    backgroundColor: "#111",
  },
});
