import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { supabase } from "@/lib/supabase-client";
import { syncAll } from "@/lib/sync-service";
import { subscribeToRealtime } from "@/lib/realtime-sync";
import { getRetryDelay } from "@/lib/sync-retry";
import { toast } from "@/hooks/use-toast";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncContextValue {
  status: SyncStatus;
  error?: string;
  online: boolean;
  runSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string>();
  const [online, setOnline] = useState(() => navigator.onLine);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  const runSyncRef = useRef<(resetRetries?: boolean) => Promise<void>>();

  const clearRetryTimer = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const notifyAuditRequests = useCallback((requests: { type: string; taxYear: string }[]) => {
    for (const request of requests) {
      toast({
        title: "⚠️ Audit Request",
        description: `Your ${request.type} (${request.taxYear}) requires additional documents from tax authorities.`,
        variant: "destructive",
      });
    }
  }, []);

  const runSync = useCallback(
    async (resetRetries = true): Promise<void> => {
      if (!navigator.onLine) {
        if (mounted.current) {
          setStatus("error");
          setError("You are offline");
        }
        return;
      }

      if (resetRetries) {
        retryCount.current = 0;
        clearRetryTimer();
      }

      if (inFlight.current) return inFlight.current;

      const operation = (async () => {
        if (mounted.current) {
          setStatus("syncing");
          setError(undefined);
        }

        const result = await syncAll();
        if (!mounted.current) return;

        if (result.success) {
          retryCount.current = 0;
          clearRetryTimer();
          setStatus("success");
          if (result.auditRequests?.length) notifyAuditRequests(result.auditRequests);
          return;
        }

        setStatus("error");
        setError(result.error);
        const delay = getRetryDelay(retryCount.current);
        if (delay !== null) {
          retryCount.current += 1;
          clearRetryTimer();
          retryTimer.current = setTimeout(() => {
            retryTimer.current = null;
            void runSyncRef.current?.(false);
          }, delay);
        }
      })().catch((caught: unknown) => {
        if (!mounted.current) return;
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "Sync failed");
      });

      const tracked = operation.finally(() => {
        if (inFlight.current === tracked) inFlight.current = null;
      });
      inFlight.current = tracked;
      return tracked;
    },
    [clearRetryTimer, notifyAuditRequests]
  );

  runSyncRef.current = runSync;

  useEffect(() => {
    mounted.current = true;
    let stopRealtime: (() => void) | undefined;
    let currentUserId: string | undefined;

    const connectRealtime = (userId: string) => {
      stopRealtime?.();
      currentUserId = userId;
      stopRealtime = subscribeToRealtime(userId, { onAuditRequest: notifyAuditRequests });
    };

    const initialize = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted.current || !user) return;

        connectRealtime(user.id);
        await runSync();
      } catch (caught: unknown) {
        if (!mounted.current) return;
        setStatus("error");
        setError(caught instanceof Error ? caught.message : "Sync initialization failed");
      }
    };

    void initialize();

    const goOnline = () => {
      setOnline(true);
      retryCount.current = 0;
      if (currentUserId) connectRealtime(currentUserId);
      void runSync();
    };
    const goOffline = () => {
      setOnline(false);
      setStatus("error");
      setError("You are offline");
      clearRetryTimer();
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      mounted.current = false;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      clearRetryTimer();
      stopRealtime?.();
    };
  }, [clearRetryTimer, notifyAuditRequests, runSync]);

  const value = useMemo(
    () => ({ status, error, online, runSync: () => runSync() }),
    [error, online, runSync, status]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// The provider and hook intentionally share this module so the sync contract
// cannot drift between the authenticated shell and its consumers.
// eslint-disable-next-line react-refresh/only-export-components
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  return context ?? { status: "idle", online: true, runSync: async () => undefined };
}
