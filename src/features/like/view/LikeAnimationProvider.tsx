import { RiveFile, useRiveFile } from "@rive-app/react-native";
import { createContext, ReactNode, useContext } from "react";

const LIKE_ANIMATION_SOURCE = require("../../../../assets/animations/like_favorite.riv");

const LikeAnimationContext = createContext<RiveFile | null>(null);

/** Loads the like animation once for the whole app instead of once per button. */
export function LikeAnimationProvider({ children }: { children: ReactNode }) {
  const { riveFile } = useRiveFile(LIKE_ANIMATION_SOURCE);
  return (
    <LikeAnimationContext value={riveFile ?? null}>{children}</LikeAnimationContext>
  );
}

export function useLikeAnimationFile(): RiveFile | null {
  return useContext(LikeAnimationContext);
}
