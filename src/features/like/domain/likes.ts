import { saveLikeCount } from "../api/likesApi";
import { likedItemsStorage } from "../api/likesStorage";
import { serverLikesQuery, setServerLike } from "./likeQueries";
import { queryClient } from "../../../app/queryClient";
import { showToast } from "../../../app/toast/toastStore";
import { createLikesStore } from "./likesStore";

const LIKE_WRITE_DEBOUNCE_MS = 400;

export const likesStore = createLikesStore({
  getServerLike: async (itemId) => (await queryClient.query({ ...serverLikesQuery, staleTime: "static" }))[itemId],
  setServerLike: (like) => setServerLike(queryClient, like),
  saveLikeCount,
  likedStorage: likedItemsStorage,
  onSyncError: () => showToast("Couldn't save your like. Please try again."),
  debounceMs: LIKE_WRITE_DEBOUNCE_MS,
});
