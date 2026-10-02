import { db, type DeadlineRecord } from "@/lib/local-db";

export async function saveDeadline(deadline: DeadlineRecord): Promise<void> {
  await db.deadlines.put(deadline);
}

export async function getDeadline(id: string): Promise<DeadlineRecord | undefined> {
  return db.deadlines.get(id);
}

export async function listDeadlines(
  jurisdictionCode?: string,
  taxYear?: string,
): Promise<DeadlineRecord[]> {
  const records = await db.deadlines.toArray();
  return records.filter(
    (record) =>
      (jurisdictionCode === undefined || record.jurisdictionCode === jurisdictionCode) &&
      (taxYear === undefined || record.taxYear === taxYear),
  );
}
