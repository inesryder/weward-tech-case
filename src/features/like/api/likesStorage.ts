import { LikeCounts } from "../domain/Like";
import { readJson, writeJson } from "../../../app/storage";

// Versioned keys: bump if the stored shape changes, so old data is ignored instead of misread.
const COUNTS_KEY = "likes.v2.counts";
const LIKED_KEY = "likes.v1.liked";

/** Last known server like state, shown on cold start while the network catches up. */
export const likeCountsStorage = {
  load: (): LikeCounts | undefined => readJson<LikeCounts>(COUNTS_KEY),
  save: (counts: LikeCounts) => writeJson(COUNTS_KEY, counts),
};

/**
 * Items this device has liked, as confirmed by the server.
 * The backend only stores counts, so "liked by me" only exists locally.
 */
export const likedItemsStorage = {
  load: (): Record<string, true> => readJson<Record<string, true>>(LIKED_KEY) ?? {},
  save: (liked: Record<string, true>) => writeJson(LIKED_KEY, liked),
};
