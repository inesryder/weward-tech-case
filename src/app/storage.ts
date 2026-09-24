import { createMMKV } from "react-native-mmkv";

const storage = createMMKV({ id: "feed-app" });

export function readJson<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted entry: forget it rather than crash on every launch.
    storage.remove(key);
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}
