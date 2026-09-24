import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/local-db";
import { stateName } from "@/types/declaration";
import { useActivities, useProfile } from "@/hooks/use-local-data";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  Calendar,
  MapPin,
  DollarSign,
  Image,
  X,
  Paperclip,
  FilePlus,
  CircleDot,
} from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { saveDocumentFile, deleteDocumentFile } from "@/lib/document-storage";
import { recordActivity } from "@/lib/activity-log";
import { buildFilingSummary } from "@/lib/filing-summary";
import { renderFilingSummaryPdf } from "@/lib/filing-summary-pdf";

const statusConfig = {
  draft: { icon: Clock, label: "Draft", className: "bg-muted text-muted-foreground" },
  submitted: { icon: Clock, label: "Submitted", className: "bg-info/10 text-info" },
  processing: { icon: Clock, label: "Processing", className: "bg-warning/10 text-warning" },
  audit_request: { icon: AlertTriangle, label: "Audit Request", className: "bg-destructive/10 text-destructive" },
  approved: { icon: CheckCircle2, label: "Approved", className: "bg-success/10 text-success" },
};

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

const categories = [
  { id: "financial_statement", label: "Financial Statement" },
  { id: "receipt", label: "Receipt" },
  { id: "payslip", label: "Payslip / P9" },
  { id: "rent_agreement", label: "Rent Agreement" },
  { id: "pension_cert", label: "Pension Certificate" },
  { id: "other", label: "Other" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("other");
  const [newDocs, setNewDocs] = useState<UploadedFile[]>([]);
  const [savingDocs, setSavingDocs] = useState(false);

  const declaration = useLiveQuery(() => (id ? db.declarations.get(id) : undefined), [id]);
  const activities = useActivities(id || "");
  const profile = useProfile();
  if (declaration === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (declaration === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground text-sm">Submission not found.</p>
        <button onClick={() => navigate("/submissions")} className="text-primary text-sm font-semibold hover:underline">
          Back to submissions
        </button>
      </div>
    );
  }

  const config = statusConfig[declaration.status];
  const StatusIcon = config.icon;
  const isAudit = declaration.status === "audit_request";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setSavingDocs(true);
    try {
      const added: UploadedFile[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File too large", description: `${file.name} exceeds 10MB limit.`, variant: "destructive" });
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast({ title: "Unsupported format", description: `${file.name} is not supported.`, variant: "destructive" });
          continue;
        }
        // Persist the bytes now — previously only {name, size, type} was ever
        // kept (the File object itself was discarded synchronously), so the
        // actual document content was never saved anywhere, ever.
        const id = await saveDocumentFile(declaration.id, file);
        added.push({ id, name: file.name, size: file.size, type: file.type });
      }
      if (added.length) setNewDocs((prev) => [...prev, ...added]);
    } catch {
      toast({ title: "Couldn't save document", description: "Please try attaching it again.", variant: "destructive" });
    } finally {
      setSavingDocs(false);
    }
  };

  const removeNewDoc = async (docId: string) => {
    setNewDocs((prev) => prev.filter((d) => d.id !== docId));
    await deleteDocumentFile(docId);
  };

  const handleSubmitDocuments = async () => {
    if (newDocs.length === 0) {
      toast({ title: "No documents", description: "Please attach at least one document.", variant: "destructive" });
      return;
    }

    // Save new docs to the declaration's document list and mark for sync
    const updatedDocs = [
      ...declaration.documents,
      ...newDocs.map((d) => ({ id: d.id, name: d.name, size: d.size, type: d.type })),
    ];

    await db.declarations.update(declaration.id, {
      documents: updatedDocs,
      pendingSync: 1,
      updatedAt: new Date().toISOString(),
    });

    // Record activity
    await recordActivity({
      declarationId: declaration.id,
      type: "document_upload",
      title: `${newDocs.length} document${newDocs.length > 1 ? "s" : ""} uploaded`,
      description: newDocs.map((d) => d.name).join(", "),
    });

    setNewDocs([]);
    toast({ title: "Documents submitted", description: "Your documents have been attached and will sync shortly." });
  };

  const handleExportSummary = () => {
    if (!profile) {
      toast({ title: "Can't export yet", description: "Your profile hasn't finished loading.", variant: "destructive" });
      return;
    }

    const summary = buildFilingSummary(declaration, profile);
    const blob = renderFilingSummaryPdf(summary);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taxease-filing-summary-${declaration.taxYear}-${declaration.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/submissions")}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-lg text-foreground truncate">
            {declaration.type}
          </h1>
          <p className="text-xs text-muted-foreground">Tax Year {declaration.taxYear}</p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", config.className)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      {/* Audit Alert */}
      {isAudit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-2"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-sm text-foreground">Audit Request</p>
              <p className="text-xs text-muted-foreground mt-1">
                The tax authorities have requested additional documentation to complete the assessment
                of your {declaration.type} for {declaration.taxYear}. Please upload the required
                documents below to proceed.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Details */}
      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <h3 className="font-display font-bold text-sm text-card-foreground">Submission Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow icon={Calendar} label="Filed" value={new Date(declaration.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
          <DetailRow icon={Calendar} label="Updated" value={new Date(declaration.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
          <DetailRow icon={MapPin} label="Country" value={declaration.country.toUpperCase()} />
          <DetailRow icon={MapPin} label="State" value={stateName(declaration.state)} />
          <DetailRow icon={DollarSign} label="Amount" value={declaration.amount || "—"} />
        </div>
      </div>

      {/* Manual filing export — no direct FIRS/SIRS integration exists yet,
          so this is the actual filing path today, not a fallback. */}
      <button
        onClick={handleExportSummary}
        className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl shadow-card hover:shadow-elevated transition-shadow text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Download Filing Summary</p>
          <p className="text-[11px] text-muted-foreground">
            PDF to file directly with FIRS/SIRS or bring to your accountant
          </p>
        </div>
      </button>

      {/* Existing Documents */}
      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <h3 className="font-display font-bold text-sm text-card-foreground">
          Attached Documents ({declaration.documents.length})
        </h3>
        {declaration.documents.length === 0 ? (
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">No documents attached to this submission.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {declaration.documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {doc.type.startsWith("image/") ? (
                    <Image className="w-4 h-4 text-primary" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <h3 className="font-display font-bold text-sm text-card-foreground">Activity Timeline</h3>
        {activities.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-2">No activity recorded yet.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />

            <div className="space-y-0">
              {[...activities].reverse().map((activity, i) => {
                const iconMap = {
                  created: { icon: FilePlus, color: "text-primary bg-primary/10" },
                  status_change: activity.meta?.to === "audit_request"
                    ? { icon: AlertTriangle, color: "text-destructive bg-destructive/10" }
                    : activity.meta?.to === "approved"
                    ? { icon: CheckCircle2, color: "text-success bg-success/10" }
                    : { icon: CircleDot, color: "text-info bg-info/10" },
                  document_upload: { icon: Upload, color: "text-primary bg-primary/10" },
                  note: { icon: FileText, color: "text-muted-foreground bg-muted" },
                };
                const cfg = iconMap[activity.type] || iconMap.note;
                const Icon = cfg.icon;
                const dateStr = new Date(activity.timestamp).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const timeStr = new Date(activity.timestamp).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative flex gap-3 py-3"
                  >
                    <div className={cn("w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 z-10", cfg.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-card-foreground">{activity.title}</p>
                      {activity.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{activity.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">{dateStr} · {timeStr}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upload Section (always visible, highlighted for audit) */}
      <div className={cn(
        "rounded-2xl p-4 space-y-4",
        isAudit
          ? "border-2 border-dashed border-destructive/30 bg-destructive/5"
          : "bg-card shadow-card"
      )}>
        <div>
          <h3 className="font-display font-bold text-sm text-foreground">
            {isAudit ? "Upload Requested Documents" : "Add Documents"}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isAudit
              ? "Attach the documents requested by tax authorities to resolve the audit."
              : "Attach additional supporting documents to this submission."}
          </p>
        </div>

        {/* Category selector */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-foreground">Category</p>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all",
                  selectedCategory === cat.id
                    ? "gradient-primary text-primary-foreground shadow-card"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={savingDocs}
          className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group disabled:opacity-60 disabled:pointer-events-none"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs font-semibold text-foreground">{savingDocs ? "Saving…" : "Tap to upload"}</p>
          <p className="text-[10px] text-muted-foreground">PDF, Images, Word, Excel — Max 10MB</p>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* New files list */}
        {newDocs.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-foreground">New Documents ({newDocs.length})</p>
            {newDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-card">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {doc.type.startsWith("image/") ? (
                    <Image className="w-4 h-4 text-primary" />
                  ) : (
                    <FileText className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-card-foreground truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(doc.size)}</p>
                </div>
                <button onClick={() => removeNewDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0">
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}

            <button
              onClick={handleSubmitDocuments}
              className="w-full gradient-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl shadow-card hover:opacity-90 transition-opacity"
            >
              Submit {newDocs.length} Document{newDocs.length > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-card-foreground">{value}</p>
    </div>
  </div>
);

export default SubmissionDetail;
