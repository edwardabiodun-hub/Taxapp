import { WifiOff, RefreshCw } from "lucide-react";
import { useSync } from "@/hooks/use-sync";
import { cn } from "@/lib/utils";

const OfflineBanner = () => {
  const { online, status, runSync } = useSync();

  if (online && status !== "error") return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium",
        !online
          ? "bg-destructive/10 text-destructive"
          : "bg-warning/10 text-warning"
      )}
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>{!online ? "You are offline — changes will sync when reconnected" : "Sync failed — retrying…"}</span>
      {online && (
        <button
          onClick={runSync}
          disabled={status === "syncing"}
          className="ml-1 p-1 rounded hover:bg-warning/10 transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", status === "syncing" && "animate-spin")} />
        </button>
      )}
    </div>
  );
};

export default OfflineBanner;
