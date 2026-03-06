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
export async function syncAll(): Promise<{ success: boolean; error?: string }> {
  try {
    // ── Push pending local changes ──
    const pending = await db.declarations
      .where("pendingSync")
      .equals(1) // Dexie stores booleans as 0/1
      .toArray();

    if (pending.length > 0) {
      await pushDeclarationsToServer(pending);
      await db.declarations
        .where("pendingSync")
        .equals(1)
        .modify({ pendingSync: false, syncedAt: new Date().toISOString() });
    }

    // Push profile if it exists locally
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

    // Upsert profile
    await db.profiles.put({
      ...serverProfile,
      lastSynced: new Date().toISOString(),
    });

    // Upsert server declarations (don't overwrite local drafts)
    for (const decl of serverDeclarations) {
      const local = await db.declarations.get(decl.id);
      if (!local || !local.pendingSync) {
        await db.declarations.put(decl);
      }
    }

    // Store reference data
    const now = new Date().toISOString();
    for (const [key, value] of Object.entries(refData)) {
      await db.referenceData.put({ key, value, lastSynced: now });
    }

    // Upsert activities
    for (const activity of serverActivities) {
      await db.activities.put(activity);
    }

    console.log("[sync] Completed successfully");
    return { success: true };
  } catch (err: any) {
    console.error("[sync] Failed:", err);
    return { success: false, error: err.message };
  }
}
