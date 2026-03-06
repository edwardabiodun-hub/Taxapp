import { useEffect, useState, useCallback, useRef } from "react";
import { syncAll } from "@/lib/sync-service";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string>();
  const [online, setOnline] = useState(navigator.onLine);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();
  const retryCount = useRef(0);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("error");
      setError("You are offline");
      return;
    }
    setStatus("syncing");
    setError(undefined);
    const result = await syncAll();
    if (result.success) {
      setStatus("success");
      retryCount.current = 0;
    } else {
      setStatus("error");
      setError(result.error);
      // Exponential backoff retry: 5s, 10s, 20s, max 60s
      const delay = Math.min(5000 * Math.pow(2, retryCount.current), 60000);
      retryCount.current += 1;
      retryTimer.current = setTimeout(() => runSync(), delay);
    }
  }, []);

  // Online/offline listeners
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      retryCount.current = 0;
      runSync();
    };
    const goOffline = () => {
      setOnline(false);
      setStatus("error");
      setError("You are offline");
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [runSync]);

  // Sync on mount
  useEffect(() => {
    runSync();
  }, [runSync]);

  return { status, error, online, runSync };
}
