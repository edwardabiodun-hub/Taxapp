import { useEffect, useState } from "react";
import { Clock3, CloudOff, ExternalLink, ShieldAlert } from "lucide-react";
import type { ResolvedDeadline } from "@/domain/deadlines";
import { useDeadlineCountdown } from "@/hooks/use-deadline-countdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";

interface DeadlineCardProps {
  deadline: ResolvedDeadline | null;
  now?: () => Date;
  offline?: boolean;
  title?: string;
}

function getSafeTimeZone(timezone: string | undefined): string {
  if (!timezone) return "UTC";

  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return "UTC";
  }
}

function formatDate(value: string | undefined, timezone?: string): string | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: getSafeTimeZone(timezone),
  }).format(timestamp);
}

const DeadlineCard = ({ deadline, now, offline, title = "Tax deadline" }: DeadlineCardProps) => {
  const [isOffline, setIsOffline] = useState(
    offline ?? (typeof navigator !== "undefined" && !navigator.onLine),
  );
  const countdown = useDeadlineCountdown(deadline, now);

  useEffect(() => {
    if (offline !== undefined) {
      setIsOffline(offline);
      return;
    }

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [offline]);

  const sourceClass = deadline?.sourceKind ?? "unverified";
  const remaining = countdown.isPassed
    ? "Deadline passed"
    : deadline?.dueAt
      ? countdown.days > 0
        ? `${countdown.days} day${countdown.days === 1 ? "" : "s"} remaining`
        : `${countdown.hours} hour${countdown.hours === 1 ? "" : "s"} remaining`
      : "Deadline not verified";
  const displayTimeZone = getSafeTimeZone(deadline?.timezone);
  const verifiedDate = formatDate(deadline?.verifiedAt, displayTimeZone);

  return (
    <Card className="border-border/70 shadow-card" data-source-kind={sourceClass}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 items-center gap-2 break-words text-base">
              <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">
              {deadline?.taxYear ? `Tax year ${deadline.taxYear}` : "Source-aware tracker"}
            </CardDescription>
          </div>
          <span className="max-w-[45%] shrink-0 break-words rounded-full bg-muted px-2 py-1 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {sourceClass.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="break-words text-2xl font-display font-bold text-foreground" role="status">
            {remaining}
          </p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {countdown.isPassed
              ? "Deadline passed"
              : countdown.days <= 1
                ? "Deadline is within one day"
                : "Deadline countdown available"}
          </p>
          {deadline?.dueAt && (
            <p className="mt-1 break-words text-xs text-muted-foreground">
              {deadline.isStale ? "Previously reported date" : "Based on the saved source date"}: {formatDate(deadline.dueAt, displayTimeZone) ?? "Date unavailable"}
              {` (${displayTimeZone})`}
            </p>
          )}
        </div>

        {deadline?.label && (
          <p className="break-words text-sm font-medium text-foreground">{deadline.label}</p>
        )}

        {!deadline?.dueAt && (
          <EmptyState
            title="Deadline not verified"
            message="No official filing deadline is available for this selection."
          />
        )}

        {deadline?.isStale && (
          <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Stale source data — confirm with your tax authority before relying on this date.
          </p>
        )}

        {isOffline && (
          <p className="flex items-start gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
            <CloudOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Offline — showing saved deadline data.
          </p>
        )}

        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-3">
          <span className="break-words">Confidence: {deadline?.confidence ?? "low"}</span>
          {verifiedDate ? <span className="break-words">Verified: {verifiedDate}</span> : <span className="break-words">Verification: unavailable</span>}
          {deadline?.source ? (
            /^https?:\/\//i.test(deadline.source) ? (
              <a
                href={deadline.source}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-1 break-all text-primary underline-offset-2 hover:underline"
                aria-label="Deadline source"
              >
                Source <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : (
              <span className="break-words">Source: {deadline.source}</span>
            )
          ) : (
            <span className="break-words">Source: unavailable</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeadlineCard;
