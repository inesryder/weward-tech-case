import { useEffect, useSyncExternalStore } from "react";
import { AccessibilityInfo, Animated, StyleSheet, Text, useAnimatedValue } from "react-native";
import { dismissToast, toastStore } from "./toastStore";

const VISIBLE_MS = 2500;
const FADE_MS = 200;

export function ToastHost() {
  const toast = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
  const opacity = useAnimatedValue(0);
  const translateY = opacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  useEffect(() => {
    if (!toast) return;
    AccessibilityInfo.announceForAccessibility(toast.message);
    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }),
      Animated.delay(VISIBLE_MS),
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) dismissToast(toast.id);
    });
    return () => animation.stop();
  }, [toast, opacity]);

  if (!toast) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#222",
  },
  text: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});
