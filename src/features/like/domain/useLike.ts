import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { likeCountsQuery } from "./likeQueries";
import { likesStore } from "./likes";

/**
 * Like state of one item. Every component showing the same item reads the same
 * store, so liking it in one section updates it everywhere it's shown.
 */
export function useLike(itemId: string) {
  const { data: serverCount = 0 } = useQuery({
    ...likeCountsQuery,
    select: (likes) => likes[itemId]?.count ?? 0,
  });
  const isLiked = useSyncExternalStore(likesStore.subscribe, () => likesStore.isLiked(itemId));
  const delta = useSyncExternalStore(likesStore.subscribe, () => likesStore.countDelta(itemId));

  const toggle = () => likesStore.toggle(itemId);

  return { count: Math.max(0, serverCount + delta), isLiked, toggle };
}
