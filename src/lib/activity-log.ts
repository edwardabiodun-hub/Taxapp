import { db, type ActivityType } from "./local-db";

interface RecordActivityParams {
  declarationId: string;
  type: ActivityType;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
}

/**
 * Single write path for the activities audit trail, so every recorded
 * activity is consistently marked pendingSync — see sync-service.ts's
 * syncAll(), which is what actually gets these to the server.
 */
export async function recordActivity(params: RecordActivityParams): Promise<void> {
  await db.activities.add({
    id: crypto.randomUUID(),
    declarationId: params.declarationId,
    type: params.type,
    title: params.title,
    description: params.description,
    meta: params.meta,
    timestamp: new Date().toISOString(),
    pendingSync: 1,
  });
}
