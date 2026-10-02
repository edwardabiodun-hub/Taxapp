import { db } from "./local-db";
import { fetchProfileFromServer, pushProfileToServer, fetchDeclarationsFromServer, pushDeclarationsToServer, fetchActivitiesFromServer, pushActivitiesToServer, fetchMessagesFromServer, pushMessageReadStatus } from "./api";

export interface SyncResult {
  success: boolean;
  error?: string;
  auditRequests?: { id: string; type: string; taxYear: string }[];
}

export async function syncAll(): Promise<SyncResult> {
  try {
    const pending = await db.declarations.where("pendingSync").equals(1).toArray();
    if (pending.length > 0) {
      await pushDeclarationsToServer(pending);
      const syncedAt = new Date().toISOString();
      for (const snapshot of pending) {
        const current = await db.declarations.get(snapshot.id);
        if (current && current.updatedAt === snapshot.updatedAt) await db.declarations.update(snapshot.id, { pendingSync: 0, syncedAt });
      }
    }

    const localProfile = await db.profiles.toCollection().first();
    if (localProfile) await pushProfileToServer(localProfile);

    const pendingActivities = await db.activities.where("pendingSync").equals(1).toArray();
    if (pendingActivities.length > 0) {
      await pushActivitiesToServer(pendingActivities);
      for (const activity of pendingActivities) await db.activities.update(activity.id, { pendingSync: 0 });
    }

    const pendingMessages = await db.messages.where("pendingSync").equals(1).toArray();
    for (const message of pendingMessages) {
      if (message.readAt) await pushMessageReadStatus(message.id, message.readAt);
      await db.messages.update(message.id, { pendingSync: 0 });
    }

    const [serverProfile, serverDeclarations, serverActivities, serverMessages] = await Promise.all([fetchProfileFromServer(), fetchDeclarationsFromServer(), fetchActivitiesFromServer(), fetchMessagesFromServer()]);
    if (localProfile && serverProfile) await db.profiles.put({ ...localProfile, ...serverProfile, id: localProfile.id, lastSynced: new Date().toISOString() });

    const newAuditRequests: SyncResult["auditRequests"] = [];
    for (const decl of serverDeclarations) {
      const local = await db.declarations.get(decl.id);
      if (!local || !local.pendingSync) {
        if (decl.status === "audit_request" && (!local || local.status !== "audit_request")) newAuditRequests.push({ id: decl.id, type: decl.type, taxYear: decl.taxYear });
        await db.declarations.put(decl);
      }
    }
    for (const activity of serverActivities) await db.activities.put(activity);
    for (const message of serverMessages) {
      const local = await db.messages.get(message.id);
      if (!local || !local.pendingSync) await db.messages.put(message);
    }
    return { success: true, auditRequests: newAuditRequests };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
