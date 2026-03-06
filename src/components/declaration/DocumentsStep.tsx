import { useRef, useState } from "react";
import { Upload, FileText, Image, X, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface UploadedDoc {
  id: string;
  file: File;
  category: string;
  preview?: string;
}

const categories = [
  { id: "financial_statement", label: "Financial Statement" },
  { id: "receipt", label: "Receipt" },
  { id: "payslip", label: "Payslip / P9" },
  { id: "rent_agreement", label: "Rent Agreement" },
  { id: "pension_cert", label: "Pension Certificate" },
  { id: "other", label: "Other" },
];

interface DocumentsStepProps {
  documents: UploadedDoc[];
  onDocumentsChange: (docs: UploadedDoc[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

const DocumentsStep = ({ documents, onDocumentsChange }: DocumentsStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState("receipt");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit.`, variant: "destructive" });
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: "Unsupported format", description: `${file.name} is not a supported file type.`, variant: "destructive" });
        continue;
      }

      const newDoc: UploadedDoc = {
        id: crypto.randomUUID(),
        file,
        category: selectedCategory,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      };
      onDocumentsChange([...documents, newDoc]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDoc = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc?.preview) URL.revokeObjectURL(doc.preview);
    onDocumentsChange(documents.filter((d) => d.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    return FileText;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm">Supporting Documents</h3>
        <p className="text-[11px] text-muted-foreground">
          Attach receipts, financial statements, and other supporting documents
        </p>
      </div>

      {/* Category selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">Document Category</p>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
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
        className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Tap to upload</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            PDF, Images, Word, Excel — Max 10MB per file
          </p>
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Uploaded files list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Uploaded ({documents.length})
          </p>
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.file);
            const catLabel = categories.find((c) => c.id === doc.category)?.label || doc.category;

            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-card"
              >
                {doc.preview ? (
                  <img
                    src={doc.preview}
                    alt={doc.file.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-card-foreground truncate">
                    {doc.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {formatSize(doc.file.size)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {catLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeDoc(doc.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {documents.length === 0 && (
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">
            No documents attached yet. Documents are optional but recommended.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsStep;
