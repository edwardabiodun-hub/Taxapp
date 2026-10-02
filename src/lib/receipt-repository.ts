import { db, type ReceiptRecord } from "@/lib/local-db";

export async function saveReceiptRecord(receipt: ReceiptRecord): Promise<void> {
  await db.receiptRecords.put(receipt);
}

export async function getReceiptRecord(id: string): Promise<ReceiptRecord | undefined> {
  return db.receiptRecords.get(id);
}

export async function listReceiptRecords(preparationId: string): Promise<ReceiptRecord[]> {
  return db.receiptRecords.where("preparationId").equals(preparationId).toArray();
}
