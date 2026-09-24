import { LikeCount, LikeCounts } from "../domain/Like";
import { fetchJson, sendJson } from "../../../app/http";
import { asId, normalizeAll } from "../../../app/parse";

/**
 * Raw `likes` resource record. Seeded records use the item id as `id`, but
 * json-server generates a random `id` for records created with POST, so the
 * record id must be tracked separately from `itemId`.
 */
export type LikeRecord = {
  id: string;
  itemId: string;
  count: number;
};

export function normalizeLikeRecord(raw: LikeRecord): LikeCount | null {
  const recordId = asId(raw.id);
  const itemId = asId(raw.itemId);
  const count = raw.count;
  if (!recordId || !itemId) return null;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 0) return null;
  return { itemId, count, recordId };
}

export async function fetchLikeCounts(signal?: AbortSignal): Promise<LikeCounts> {
  const records = await fetchJson<LikeRecord[]>("/likes", signal);
  const likes: LikeCounts = {};
  for (const like of normalizeAll("likes", records, normalizeLikeRecord)) {
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
    ? await sendJson<LikeRecord>("PATCH", `/likes/${encodeURIComponent(recordId)}`, { count })
    : await sendJson<LikeRecord>("POST", "/likes", { itemId, count });

  const saved = normalizeLikeRecord(record);
  if (!saved) throw new Error(`Malformed like record returned for ${itemId}`);
  return saved;
}
