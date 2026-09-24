import { db } from "./local-db";
import {
  fetchProfileFromServer,
  pushProfileToServer,
  fetchDeclarationsFromServer,
  pushDeclarationsToServer,
  fetchActivitiesFromServer,
} from "./api";

/**
 * Full bidirectional sync:
 * 1. Push locally-changed declarations to server
 * 2. Pull latest profile, declarations, and activities from server
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
    const [serverProfile, serverDeclarations, serverActivities] = await Promise.all([
      fetchProfileFromServer(),
      fetchDeclarationsFromServer(),
      fetchActivitiesFromServer(),
    ]);

    if (localProfile && serverProfile) {
      // Merge server-provided fields by the existing local profile's own
      // id, not serverProfile.id, even though the two are expected to
      // match now (both are the authenticated user's real auth.users id).
      // Keeping this explicit is cheap insurance against exactly the class
      // of bug this used to have with the mock backend, whose fixture data
      // returned an unrelated hardcoded id and silently created a second,
      // permanent phantom profile record instead of updating the real one.
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
