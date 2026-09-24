import { saveLikeCount } from "../../data/likes/likesApi";
import { likedItemsStorage } from "../../data/likes/likesStorage";
import { likeCountsQuery, setLikeCount } from "../../queries/likesQueries";
import { queryClient } from "../../queries/queryClient";
import { showToast } from "../toast/toastStore";
import { createLikesStore } from "./likesStore";

const LIKE_WRITE_DEBOUNCE_MS = 400;

/** App-wide likes store, wired to the real backend, query cache and local storage. */
export const likesStore = createLikesStore({
  getServerLike: async (itemId) => (await queryClient.ensureQueryData(likeCountsQuery))[itemId],
  setServerLike: (like) => setLikeCount(queryClient, like),
  saveLikeCount,
  likedStorage: likedItemsStorage,
  onSyncError: () => showToast("Couldn't save your like. Please try again."),
  debounceMs: LIKE_WRITE_DEBOUNCE_MS,
});
