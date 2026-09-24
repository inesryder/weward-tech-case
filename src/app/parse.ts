import { z } from "zod";

export const requiredString = z.string().trim().min(1);

export const optionalString = requiredString.nullable().catch(null);

export const id = z.union([requiredString, z.number().transform(String)]);

export const stringList = z
  .array(optionalString)
  .catch([])
  .transform((values) => values.filter((value) => value !== null));

export function parseEach<T>(source: string, schema: z.ZodType<T>, rawItems: unknown): T[] {
  if (!Array.isArray(rawItems)) {
    if (__DEV__) console.warn(`[${source}] expected an array of items, got`, rawItems);
    return [];
  }
  return rawItems.flatMap((raw) => {
    const result = schema.safeParse(raw);
    if (!result.success && __DEV__) {
      console.warn(`[${source}] dropped malformed item:\n${z.prettifyError(result.error)}`, raw);
    }
    return result.success ? [result.data] : [];
  });
}
