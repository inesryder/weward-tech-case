import { z } from "zod";
import { ServerLike, ServerLikes } from "../domain/Like";
import { fetchJson, sendJson } from "../../../app/http";
import { id, parseEach } from "../../../app/parse";

export const likeRecordSchema = z
  .object({
    id,
    itemId: id,
    count: z.number().int().nonnegative(),
  })
  .transform((raw): ServerLike => ({ itemId: raw.itemId, count: raw.count, recordId: raw.id }));

export async function fetchLikeCounts(signal?: AbortSignal): Promise<ServerLikes> {
  const records = await fetchJson("/likes", signal);
  const likes: ServerLikes = {};
  for (const like of parseEach("likes", likeRecordSchema, records)) {
    // The backend can hold duplicates for an item: always use the first one.
    likes[like.itemId] ??= like;
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
}): Promise<ServerLike> {
  const record = recordId
    ? await sendJson("PATCH", `/likes/${encodeURIComponent(recordId)}`, { count })
    : await sendJson("POST", "/likes", { itemId, count });
  return likeRecordSchema.parse(record);
}
