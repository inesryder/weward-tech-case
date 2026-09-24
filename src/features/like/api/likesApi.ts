import { z } from "zod";
import { LikeCount, LikeCounts } from "../domain/Like";
import { fetchJson, sendJson } from "../../../app/http";
import { id, parseEach } from "../../../app/parse";

export const likeRecordSchema = z
  .object({
    id,
    itemId: id,
    count: z.number().int().nonnegative(),
  })
  .transform((raw): LikeCount => ({ itemId: raw.itemId, count: raw.count, recordId: raw.id }));

export async function fetchLikeCounts(signal?: AbortSignal): Promise<LikeCounts> {
  const records = await fetchJson("/likes", signal);
  const likes: LikeCounts = {};
  for (const like of parseEach("likes", likeRecordSchema, records)) {
    // Keep the first record if the backend holds duplicates for an item, so we
    // always read and write the same one.
    if (likes[like.itemId]) {
      if (__DEV__) console.warn(`[likes] duplicate record for ${like.itemId}`, like);
      continue;
    }
    likes[like.itemId] = like;
  }
  return likes;
}

/**
 * Writes the absolute like count of an item. The backend only supports setting
 * state (no atomic increment), so the caller computes the target count.
 * Updates the existing record when there is one, creates it otherwise.
 */
export async function saveLikeCount({
  itemId,
  count,
  recordId,
}: {
  itemId: string;
  count: number;
  recordId: string | undefined;
}): Promise<LikeCount> {
  const record = recordId
    ? await sendJson("PATCH", `/likes/${encodeURIComponent(recordId)}`, { count })
    : await sendJson("POST", "/likes", { itemId, count });
  return likeRecordSchema.parse(record);
}
