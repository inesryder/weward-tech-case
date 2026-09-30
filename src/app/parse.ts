import { z } from "zod";
import { logger } from "./logger";

export const requiredString = z.string().trim().min(1);

export const optionalString = requiredString.nullable().catch(null);

export const id = z.union([requiredString, z.number().transform(String)]);

export function parseEach<T>(source: string, schema: z.ZodType<T>, rawItems: unknown): T[] {
  if (!Array.isArray(rawItems)) {
    logger.error("malformed_payload", { source });
    return [];
  }
  return rawItems.flatMap((raw) => {
    const result = schema.safeParse(raw);
    if (result.success) return [result.data];
    logger.error("malformed_item", {
      source,
      id: typeof raw === "object" && raw !== null && "id" in raw ? raw.id : undefined,
      reason: z.prettifyError(result.error),
    });
    return [];
  });
}
