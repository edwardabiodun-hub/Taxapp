import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Calendar, FileText, MapPin, Paperclip } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import { useActivities, useDeclaration, usePreparation } from "@/hooks/use-local-data";
import { db } from "@/lib/local-db";
import { cn } from "@/lib/utils";
import SubmissionStatus from "@/components/submissions/SubmissionStatus";
import { migrateLegacyDeclaration } from "@/lib/preparation-repository";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storedPreparation = usePreparation(id);
  const legacyDeclaration = useDeclaration(id);
  const preparation = storedPreparation ?? (
    legacyDeclaration ? migrateLegacyDeclaration(legacyDeclaration) : undefined
  );
  const legacyActivities = useActivities(id ?? "");
  const events = useLiveQuery(
    () => (id ? db.submissionEvents.where("preparationId").equals(id).sortBy("timestamp") : Promise.resolve([])),
    [id],
  ) ?? [];

  if (preparation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!preparation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground text-sm">Preparation not found.</p>
        <button onClick={() => navigate("/submissions")} className="text-primary text-sm font-semibold hover:underline">
          Back to preparations
        </button>
      </div>
    );
  }

  const capability = getJurisdictionCapability(preparation.jurisdictionCode);
  const documents = Array.isArray(preparation.formData.documents)
    ? preparation.formData.documents
    : [];
  const history = [
    ...legacyActivities.map((activity) => ({
      id: `legacy-${activity.id}`,
      timestamp: activity.timestamp,
      title: activity.title,
      description: activity.description,
      actor: "legacy record",
    })),
    ...events.map((event) => ({
      id: `event-${event.id}`,
      timestamp: event.timestamp,
      title: eventLabel(event.type, preparation.status),
      description: event.userEvidence?.reference
        ? `Evidence reference: ${event.userEvidence.reference}`
        : undefined,
      actor: event.actor,
    })),
  ].sort((left, right) => left.timestamp.localeCompare(right.timestamp));

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/submissions")}
          aria-label="Back to preparations"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-lg text-foreground truncate">
            {capability.shortName} PIT preparation
          </h1>
          <p className="text-xs text-muted-foreground">Tax year {preparation.taxYear}</p>
        </div>
      </div>

      <SubmissionStatus status={preparation.status} capability={capability} />

      {legacyDeclaration && !storedPreparation && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
          Legacy declaration retained offline. Its historical status is shown for continuity and is not treated as proof of authority filing.
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <h2 className="font-display font-bold text-sm text-card-foreground">Preparation details</h2>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow icon={Calendar} label="Created" value={formatDate(preparation.createdAt)} />
          <DetailRow icon={Calendar} label="Updated" value={formatDate(preparation.updatedAt)} />
          <DetailRow icon={MapPin} label="Jurisdiction" value={capability.name} />
          <DetailRow icon={FileText} label="Calculation" value={preparation.calculationLabel} />
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
          <p><span className="font-semibold text-foreground">Readiness:</span> {preparation.filingReadiness}</p>
          <p><span className="font-semibold text-foreground">Rule profile:</span> {preparation.calculationProvenance.ruleProfileId || "Generic baseline"}</p>
          <p><span className="font-semibold text-foreground">Export state:</span> {preparation.status === "exported" || preparation.status === "user_submitted" || preparation.status === "authority_confirmed" ? "Package exported" : "Not exported"}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <h2 className="font-display font-bold text-sm text-card-foreground">
          Supporting documents ({documents.length})
        </h2>
        {documents.length === 0 ? (
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">No documents confirmed for this preparation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{document.name}</p>
                  <p className="text-[10px] text-muted-foreground">{document.category} · {document.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <h2 className="font-display font-bold text-sm text-card-foreground">Status history</h2>
        {history.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-2">No status or legacy activity events recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">{entry.title}</p>
                  {entry.description && <p className="text-[10px] text-muted-foreground">{entry.description}</p>}
                  <p className="text-[10px] text-muted-foreground">Recorded by {entry.actor}</p>
                </div>
                <time className="text-[10px] text-muted-foreground shrink-0">{formatDate(entry.timestamp)}</time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const eventLabel = (type: string, currentStatus?: string) => {
  const labels: Record<string, string> = {
    created: "Preparation created",
    status_changed: "Status changed",
    exported: currentStatus === "authority_confirmed"
      ? "Package exported — filing status unchanged"
      : "Package exported — not submitted",
    user_submitted: "User submitted",
    authority_confirmed: "Authority confirmed",
    submission_failed: "Submission failed",
    submission_rejected: "Submission rejected",
  };
  return labels[type] ?? "Submission event";
};

const DetailRow = ({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) => (
  <div className={cn("flex items-center gap-2 min-w-0")}>
    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-card-foreground truncate">{value}</p>
    </div>
  </div>
);

export default SubmissionDetail;
