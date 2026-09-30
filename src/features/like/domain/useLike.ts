import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { serverLikesQuery } from "./likeQueries";
import { likesStore } from "./likes";

export function useLike(itemId: string) {
  const { data: serverCount = 0 } = useQuery({
    ...serverLikesQuery,
    select: (likes) => likes[itemId]?.count ?? 0,
  });
  const isLiked = useSyncExternalStore(likesStore.subscribe, () => likesStore.isLiked(itemId));
  const delta = useSyncExternalStore(likesStore.subscribe, () => likesStore.countDelta(itemId));

  const toggle = () => likesStore.toggle(itemId);

  return { count: Math.max(0, serverCount + delta), isLiked, toggle };
}
