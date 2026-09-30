import {
  Fit,
  RiveFile,
  RiveView,
  useRive,
  useRiveBoolean,
  useViewModelInstance,
} from "@rive-app/react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { logger } from "../../../app/logger";
import { useLike } from "../domain/useLike";
import { useLikeAnimationFile } from "./LikeAnimationProvider";

// Names from rive-doc/RIVE.md.
const ARTBOARD = "like_favorite";
const STATE_MACHINE = "sm";
const IS_ACTIVE = "isActive";

const ICON_SIZE = 32;

export function LikeButton({ itemId }: { itemId: string }) {
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
          <Text style={styles.fallbackIcon}>{isLiked ? "♥" : "♡"}</Text>
        )}
      </View>
      <Text style={styles.count}>{count}</Text>
    </Pressable>
  );
}

function LikeAnimation({
  file,
  isActive,
}: {
  file: RiveFile;
  isActive: boolean;
}) {
  const { instance } = useViewModelInstance(file, { async: true, artboardName: ARTBOARD });
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
      onError={(error) => logger.warn("like_animation_error", { message: error.message })}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3F5",
    padding: 2,
    paddingRight: 6,
    borderRadius: 32,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackIcon: {
    fontSize: 20,
    color: "#FF732B",
  },
  count: {
    minWidth: 16,
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    fontVariant: ["tabular-nums"],
  },
});
