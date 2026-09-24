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
      // Only clear pendingSync for a declaration if it's unchanged since the
      // snapshot we actually pushed — comparing by id alone isn't enough:
      // if the user edits the SAME declaration again while this push is in
      // flight (plausible; sync can run in the background), that edit's
      // updatedAt won't match the snapshot's, so we leave pendingSync=1
      // rather than wrongly clearing it for content the server never saw.
      const syncedAt = new Date().toISOString();
      for (const snapshot of pending) {
        const current = await db.declarations.get(snapshot.id);
        if (current && current.updatedAt === snapshot.updatedAt) {
          await db.declarations.update(snapshot.id, { pendingSync: 0, syncedAt });
        }
      }
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

    if (localProfile) {
      // Merge server-provided fields onto the existing local profile by its
      // real id — never by serverProfile.id. The mock (and likely a future
      // real endpoint scoped to the authenticated session) doesn't
      // necessarily echo back the same id our local record uses; blindly
      // put()-ing serverProfile as-is created a second, permanent phantom
      // profile record with the mock's hardcoded id instead of updating the
      // real one, and later syncs would then push whichever profile
      // happened to sort first — not necessarily the real one.
      await db.profiles.put({
        ...localProfile,
        ...serverProfile,
        id: localProfile.id,
        lastSynced: new Date().toISOString(),
      });
    }

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
