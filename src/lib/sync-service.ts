import { db } from "./local-db";
import {
  fetchProfileFromServer,
  pushProfileToServer,
  fetchDeclarationsFromServer,
  pushDeclarationsToServer,
  fetchActivitiesFromServer,
  pushActivitiesToServer,
  fetchMessagesFromServer,
  pushMessageReadStatus,
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

    // Activities are append-only (never edited after creation), so unlike
    // declarations' pendingSync clearing above, there's no need to guard
    // against a concurrent edit invalidating the pushed snapshot.
    const pendingActivities = await db.activities.where("pendingSync").equals(1).toArray();
    if (pendingActivities.length > 0) {
      await pushActivitiesToServer(pendingActivities);
      for (const activity of pendingActivities) {
        await db.activities.update(activity.id, { pendingSync: 0 });
      }
    }

    // Messages are read-only from the server's perspective except for
    // read_at, which only ever moves unread -> read and never back (see
    // LocalMessage's own doc comment) — so there's no edit-during-push race
    // to guard against here, the same reasoning activities' pendingSync
    // clearing above already relies on.
    const pendingMessages = await db.messages.where("pendingSync").equals(1).toArray();
    for (const message of pendingMessages) {
      if (message.readAt) {
        await pushMessageReadStatus(message.id, message.readAt);
      }
      await db.messages.update(message.id, { pendingSync: 0 });
    }

    // ── Pull from server ──
    const [serverProfile, serverDeclarations, serverActivities, serverMessages] = await Promise.all([
      fetchProfileFromServer(),
      fetchDeclarationsFromServer(),
      fetchActivitiesFromServer(),
      fetchMessagesFromServer(),
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

    for (const message of serverMessages) {
      await db.messages.put(message);
    }

    console.log("[sync] Completed successfully");
    return { success: true, auditRequests: newAuditRequests };
  } catch (err: any) {
    console.error("[sync] Failed:", err);
    return { success: false, error: err.message };
  }
}
