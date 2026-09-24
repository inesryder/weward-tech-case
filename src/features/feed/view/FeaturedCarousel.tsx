import { memo, useCallback, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { FeedItem } from "../domain/FeedItem";
import { FeaturedCard } from "./FeaturedCard";

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;

const keyExtractor = (item: FeedItem) => item.id;

type Props = {
  items: readonly FeedItem[];
};

function FeaturedCarouselComponent({ items }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const interval = cardWidth + CARD_GAP;
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / interval);
      setActiveIndex(Math.min(Math.max(index, 0), items.length - 1));
    },
    [interval, items.length],
  );

  const renderItem: ListRenderItem<FeedItem> = useCallback(
    ({ item }) => (
      <View style={{ width: cardWidth }}>
        <FeaturedCard item={item} />
      </View>
    ),
    [cardWidth],
  );

  return (
    <View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: interval, offset: interval * index, index })}
      />
      {items.length > 1 && <PageIndicator count={items.length} activeIndex={activeIndex} />}
    </View>
  );
}

export const FeaturedCarousel = memo(FeaturedCarouselComponent);

function PageIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dots} accessibilityLabel={`Item ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: CARD_GAP,
  },
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
