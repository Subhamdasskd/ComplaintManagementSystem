import type { Prisma } from "@prisma/client";

/**
 * Allocates the next per-year complaint reference (CMS-2026-0001) atomically.
 * The counter lives in the Setting table so no sequence migration is needed.
 */
export async function nextReference(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const key = `complaint_seq_${year}`;
  const rows = await tx.$queryRaw<{ value: string }[]>`
    INSERT INTO "Setting" ("key", "value", "updatedAt")
    VALUES (${key}, '1', now())
    ON CONFLICT ("key") DO UPDATE
      SET "value" = (CAST("Setting"."value" AS INTEGER) + 1)::text,
          "updatedAt" = now()
    RETURNING "value"
  `;
  const seq = Number(rows[0]?.value ?? 1);
  return `CMS-${year}-${String(seq).padStart(4, "0")}`;
}
