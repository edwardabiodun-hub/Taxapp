import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { syncAll } from "@/lib/sync-service";
import { toast } from "@/hooks/use-toast";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string>();
  const [online, setOnline] = useState(navigator.onLine);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();
  const retryCount = useRef(0);
  const navigateRef = useRef<ReturnType<typeof useNavigate>>();

  try {
    navigateRef.current = useNavigate();
  } catch {
    // useNavigate may fail outside Router context
  }

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

      // Show notification for new audit requests
      if (result.auditRequests && result.auditRequests.length > 0) {
        for (const req of result.auditRequests) {
          toast({
            title: "⚠️ Audit Request",
            description: `Your ${req.type} (${req.taxYear}) requires additional documents from tax authorities.`,
            variant: "destructive",
            action: navigateRef.current
              ? undefined
              : undefined,
          });
        }
      }
    } else {
      setStatus("error");
      setError(result.error);
      const delay = Math.min(5000 * Math.pow(2, retryCount.current), 60000);
      retryCount.current += 1;
      retryTimer.current = setTimeout(() => runSync(), delay);
    }
  }, []);

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

  useEffect(() => {
    runSync();
  }, [runSync]);

  return { status, error, online, runSync };
}
