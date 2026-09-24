import { db } from "./local-db";
import {
  fetchProfileFromServer,
  pushProfileToServer,
  fetchDeclarationsFromServer,
  pushDeclarationsToServer,
  fetchReferenceDataFromServer,
  fetchActivitiesFromServer,
} from "./mock-api";

/**
 * Full bidirectional sync:
 * 1. Push locally-changed declarations to server
 * 2. Pull latest profile, declarations, and reference data from server
 */
export interface SyncResult {
  success: boolean;
  error?: string;
  auditRequests?: { id: string; type: string; taxYear: string }[];
}

export async function syncAll(): Promise<SyncResult> {
  try {
    // ── Push pending local changes ──
    const pending = await db.declarations
      .where("pendingSync")
      .equals(1)
      .toArray();

    if (pending.length > 0) {
      await pushDeclarationsToServer(pending);
      await db.declarations
        .where("pendingSync")
        .equals(1)
        .modify({ pendingSync: 0, syncedAt: new Date().toISOString() });
    }

    const localProfile = await db.profiles.toCollection().first();
    if (localProfile) {
      await pushProfileToServer(localProfile);
    }

    // ── Pull from server ──
    const [serverProfile, serverDeclarations, refData, serverActivities] = await Promise.all([
      fetchProfileFromServer(),
      fetchDeclarationsFromServer(),
      fetchReferenceDataFromServer(),
      fetchActivitiesFromServer(),
    ]);

    await db.profiles.put({
      ...serverProfile,
      lastSynced: new Date().toISOString(),
    });

    // Detect new audit_request status changes
    const newAuditRequests: SyncResult["auditRequests"] = [];

    for (const decl of serverDeclarations) {
      const local = await db.declarations.get(decl.id);
      if (!local || !local.pendingSync) {
        // Check if status changed to audit_request
        if (decl.status === "audit_request" && (!local || local.status !== "audit_request")) {
          newAuditRequests.push({ id: decl.id, type: decl.type, taxYear: decl.taxYear });
        }
        await db.declarations.put(decl);
      }
    }

    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(refData)) {
      await db.referenceData.put({ key, value, lastSynced: now });
    }

    for (const activity of serverActivities) {
      await db.activities.put(activity);
    }

    console.log("[sync] Completed successfully");
    return { success: true, auditRequests: newAuditRequests };
  } catch (err: any) {
    console.error("[sync] Failed:", err);
    return { success: false, error: err.message };
  }
}
