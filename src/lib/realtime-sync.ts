import { supabase } from "./supabase-client";
import {
  rowToActivity,
  rowToDeclaration,
  rowToMessage,
  rowToProfile,
  type ActivityRow,
  type DeclarationRow,
  type MessageRow,
  type ProfileRow,
} from "./api";
import { db } from "./local-db";

export type RealtimeTable = "profiles" | "declarations" | "activities" | "messages";
export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE";

export interface RealtimeChange {
  table: RealtimeTable;
  eventType: RealtimeEventType;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export interface RealtimeAuditRequest {
  id: string;
  type: string;
  taxYear: string;
}

export interface RealtimeSubscriptionOptions {
  onAuditRequest?: (requests: RealtimeAuditRequest[]) => void;
}

function ownerId(table: RealtimeTable, row: Record<string, unknown>): string | undefined {
  if (table === "profiles") return typeof row.id === "string" ? row.id : undefined;
  if (table === "declarations" || table === "activities") {
    return typeof row.user_id === "string" ? row.user_id : undefined;
  }
  return typeof row.recipient_user_id === "string" ? row.recipient_user_id : undefined;
}

function rowId(row: Record<string, unknown>): string | undefined {
  return typeof row.id === "string" ? row.id : undefined;
}

export async function applyRealtimeChange(
  change: RealtimeChange,
  userId: string,
  options: RealtimeSubscriptionOptions = {}
): Promise<void> {
  const row = change.eventType === "DELETE" ? change.old : change.new;
  if (ownerId(change.table, row) !== userId) return;

  if (change.eventType === "DELETE") {
    const id = rowId(row);
    if (!id) return;
    if (change.table === "profiles") {
      await db.profiles.delete(id);
    } else if (change.table === "declarations") {
      await db.declarations.delete(id);
      await db.activities.where("declarationId").equals(id).delete();
    } else if (change.table === "activities") {
      await db.activities.delete(id);
    } else {
      await db.messages.delete(id);
    }
    return;
  }

  if (change.eventType === "TRUNCATE") return;

  if (change.table === "profiles") {
    const current = await db.profiles.get(userId);
    const profile = rowToProfile(change.new as unknown as ProfileRow, current?.email ?? "");
    await db.profiles.put({ ...current, ...profile, id: userId, lastSynced: new Date().toISOString() });
    return;
  }

  if (change.table === "declarations") {
    const declaration = rowToDeclaration(change.new as unknown as DeclarationRow);
    const current = await db.declarations.get(declaration.id);
    if (current?.pendingSync) return;
    if (declaration.status === "audit_request" && current?.status !== "audit_request") {
      options.onAuditRequest?.([
        { id: declaration.id, type: declaration.type, taxYear: declaration.taxYear },
      ]);
    }
    await db.declarations.put(declaration);
    return;
  }

  if (change.table === "activities") {
    const activity = rowToActivity(change.new as unknown as ActivityRow);
    const current = await db.activities.get(activity.id);
    if (!current?.pendingSync) await db.activities.put(activity);
    return;
  }

  const message = rowToMessage(change.new as unknown as MessageRow);
  const current = await db.messages.get(message.id);
  if (!current?.pendingSync) await db.messages.put(message);
}

export function subscribeToRealtime(
  userId: string,
  options: RealtimeSubscriptionOptions = {}
): () => void {
  const channel = supabase.channel(`sync:${userId}`);
  const register = (table: RealtimeTable, filter: string) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter },
      (payload: { eventType: RealtimeEventType; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        void applyRealtimeChange(
          { table, eventType: payload.eventType, new: payload.new ?? {}, old: payload.old ?? {} },
          userId,
          options
        );
      }
    );
  };

  register("profiles", `id=eq.${userId}`);
  register("declarations", `user_id=eq.${userId}`);
  register("activities", `user_id=eq.${userId}`);
  register("messages", `recipient_user_id=eq.${userId}`);
  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
