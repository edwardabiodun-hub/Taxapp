import { useEffect, useState } from "react";
import { syncAll } from "@/lib/sync-service";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string>();

  const runSync = async () => {
    setStatus("syncing");
    setError(undefined);
    const result = await syncAll();
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setError(result.error);
    }
  };

  // Sync on mount (app load / refresh)
  useEffect(() => {
    runSync();
  }, []);

  return { status, error, runSync };
}
