import { ReactElement } from "react";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from "react-native";

export const CAROUSEL_PADDING = 16;
const GAP = 12;

type Props<T> = {
  items: readonly T[];
  itemWidth: number;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  onePerSwipe?: boolean;
  onIndexChange?: (index: number) => void;
};

export function SnapCarousel<T>({
  items,
  itemWidth,
  keyExtractor,
  renderItem,
  onePerSwipe = false,
  onIndexChange,
}: Props<T>) {
  const interval = itemWidth + GAP;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / interval);
    onIndexChange?.(Math.min(Math.max(index, 0), items.length - 1));
  };

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => <View style={{ width: itemWidth }}>{renderItem(item)}</View>}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      snapToInterval={interval}
      decelerationRate="fast"
      disableIntervalMomentum={onePerSwipe}
      onScroll={onIndexChange && onScroll}
      scrollEventThrottle={onIndexChange && 16}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: CAROUSEL_PADDING,
    gap: GAP,
  },
});
