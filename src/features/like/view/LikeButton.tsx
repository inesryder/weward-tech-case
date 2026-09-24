import {
  Fit,
  RiveFile,
  RiveView,
  useRive,
  useRiveBoolean,
  useViewModelInstance,
} from "@rive-app/react-native";
import { memo, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLike } from "../domain/useLike";
import { useLikeAnimationFile } from "./LikeAnimationProvider";

// Names from rive-doc/RIVE.md.
const ARTBOARD = "like_favorite";
const STATE_MACHINE = "sm";
const IS_ACTIVE = "isActive";

const ICON_SIZE = 32;

type Props = {
  itemId: string;
  /** "light" for use on dark backgrounds (e.g. image overlays). */
  tone?: "dark" | "light";
};

function LikeButtonComponent({ itemId, tone = "dark" }: Props) {
  const { count, isLiked, toggle } = useLike(itemId);
  const riveFile = useLikeAnimationFile();

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? "Unlike" : "Like"}
      accessibilityValue={{ text: `${count} likes` }}
      accessibilityState={{ selected: isLiked }}
    >
      {/* Taps are handled by the Pressable, never by Rive: the animation only mirrors our state. */}
      <View pointerEvents="none" style={styles.icon}>
        {riveFile ? (
          <LikeAnimation file={riveFile} isActive={isLiked} />
        ) : (
          <Text style={[styles.fallbackIcon, tone === "light" && styles.light]}>
            {isLiked ? "♥" : "♡"}
          </Text>
        )}
      </View>
      <Text style={[styles.count, tone === "light" && styles.light]}>{count}</Text>
    </Pressable>
  );
}

export const LikeButton = memo(LikeButtonComponent);

function LikeAnimation({ file, isActive }: { file: RiveFile; isActive: boolean }) {
  // Start the view model in the current state, so already-liked items render
  // filled without replaying the like animation when they scroll into view.
  const initialIsActive = useRef(isActive);
  const { instance } = useViewModelInstance(file, {
    async: true,
    artboardName: ARTBOARD,
    onInit: (vmi) => {
      const property = vmi.booleanProperty(IS_ACTIVE);
      property?.set(initialIsActive.current);
      property?.dispose();
    },
  });
  const { setValue } = useRiveBoolean(IS_ACTIVE, instance);
  const { riveViewRef, setHybridRef } = useRive();

  // The optimistic like state drives the animation, including rolling it back on failure.
  useEffect(() => {
    if (!instance) return;
    setValue(isActive);
    // Setting a view model property doesn't wake a state machine that has settled
    // (the native view pauses once idle), so nudge it to play the transition.
    riveViewRef?.playIfNeeded();
  }, [instance, isActive, setValue, riveViewRef]);

  if (!instance) return null;

  return (
    <RiveView
      file={file}
      artboardName={ARTBOARD}
      stateMachineName={STATE_MACHINE}
      dataBind={instance}
      hybridRef={setHybridRef}
      autoPlay
      fit={Fit.Contain}
      style={styles.icon}
      onError={(error) => {
        if (__DEV__) console.warn("Like animation error:", error.message);
      }}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackIcon: {
    fontSize: 20,
    color: "#e0245e",
  },
  count: {
    minWidth: 16,
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    fontVariant: ["tabular-nums"],
  },
  light: {
    color: "#fff",
  },
});
