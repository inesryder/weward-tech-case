/**
 * Small runtime guards shared by the provider normalizers.
 * Provider payloads are typed, but we don't control the backend, so every field
 * is re-checked at runtime rather than trusted.
 */

export function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Accepts string or numeric ids (json-server may return either). */
export function asId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return asNonEmptyString(value);
}

export function asDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asNonEmptyString).filter((v): v is string => v !== null);
}

/** Maps raw items, dropping (and reporting in dev) the ones that can't be normalized. */
export function normalizeAll<Raw, Item>(
  providerId: string,
  rawItems: unknown,
  normalize: (raw: Raw) => Item | null,
): Item[] {
  if (!Array.isArray(rawItems)) {
    if (__DEV__) console.warn(`[${providerId}] expected an array of items, got`, rawItems);
    return [];
  }
  const items: Item[] = [];
  for (const raw of rawItems as Raw[]) {
    const item = raw != null && typeof raw === "object" ? normalize(raw) : null;
    if (item) items.push(item);
    else if (__DEV__) console.warn(`[${providerId}] dropped malformed item`, raw);
  }
  return items;
}
