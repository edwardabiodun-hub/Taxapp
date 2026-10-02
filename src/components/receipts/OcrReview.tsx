import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RECEIPT_CATEGORIES,
  RECEIPT_CURRENCIES,
  type ReceiptCorrections,
  type ReceiptFieldName,
  type ReceiptRecord,
} from "@/domain/receipts";
import ErrorState, { type SafeErrorCode } from "@/components/shared/ErrorState";

interface OcrReviewProps {
  readonly record: ReceiptRecord;
  readonly previewUrl?: string;
  readonly onConfirm: (corrections: ReceiptCorrections) => void | Promise<void>;
  readonly onReject: () => void | Promise<void>;
  readonly manualEntry?: boolean;
  readonly onRetry?: () => void | Promise<void>;
}

const editableFields: readonly ReceiptFieldName[] = [
  "vendor",
  "date",
  "amount",
  "taxAmount",
  "currency",
  "category",
];

const OcrReview = ({
  record,
  previewUrl,
  onConfirm,
  onReject,
  manualEntry = false,
  onRetry,
}: OcrReviewProps) => {
  const [values, setValues] = useState<Record<ReceiptFieldName, string>>(() =>
    Object.fromEntries(
      editableFields.map((field) => [field, record.fields[field].value ?? ""]),
    ) as Record<ReceiptFieldName, string>,
  );
  const [errorCode, setErrorCode] = useState<SafeErrorCode>();
  const [pendingAction, setPendingAction] = useState<"confirm" | "reject">();

  const update = (field: ReceiptFieldName, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const confidenceLabel = (field: ReceiptFieldName) => {
    const confidence = record.fields[field].confidence;
    if (confidence === null || confidence < 0.8) {
      return <span className="text-[10px] font-semibold text-warning">Low confidence</span>;
    }
    return <span className="text-[10px] text-success">{Math.round(confidence * 100)}% confidence</span>;
  };

  const confirm = async () => {
    setErrorCode(undefined);
    setPendingAction("confirm");
    try { await onConfirm(values); } catch { setErrorCode("RECEIPT_CONFIRM_FAILED"); } finally { setPendingAction(undefined); }
  };

  const reject = async () => {
    setErrorCode(undefined);
    setPendingAction("reject");
    try { await onReject(); } catch { setErrorCode("RECEIPT_REJECT_FAILED"); } finally { setPendingAction(undefined); }
  };

  return (
    <div className="space-y-4 rounded-xl bg-card p-4 shadow-card" aria-label="OCR review">
      <div>
        <h4 className="font-display text-sm font-bold text-foreground">
          {manualEntry ? "Enter receipt details manually" : "Review extracted receipt"}
        </h4>
        <p className="text-[11px] text-muted-foreground">
          {manualEntry
            ? "Enter the receipt details. Values are used only after you confirm them."
            : "OCR suggestions are drafts. Confirm each value before it can be used in a calculation."}
        </p>
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt={`Original receipt: ${record.fileName}`}
          className="max-h-56 w-full rounded-lg object-contain bg-muted"
        />
      )}

      {record.errorMessage && !manualEntry && (
        <ErrorState
          errorCode="RECEIPT_PROCESSING_FAILED"
          action={onRetry ? { label: "Try again", onClick: () => void onRetry() } : undefined}
        />
      )}

      {errorCode && (
        <ErrorState
          errorCode={errorCode}
          action={{
            label: errorCode === "RECEIPT_CONFIRM_FAILED" ? "Retry confirmation" : "Retry rejection",
            onClick: errorCode === "RECEIPT_CONFIRM_FAILED" ? () => void confirm() : () => void reject(),
          }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Vendor" name="vendor" value={values.vendor} confidence={confidenceLabel("vendor")} onChange={update} />
        <Field label="Date" name="date" type="date" value={values.date} confidence={confidenceLabel("date")} onChange={update} />
        <Field label="Amount" name="amount" inputMode="decimal" value={values.amount} confidence={confidenceLabel("amount")} onChange={update} />
        <Field label="Tax amount" name="taxAmount" inputMode="decimal" value={values.taxAmount} confidence={confidenceLabel("taxAmount")} onChange={update} />
        <SelectField label="Currency" name="currency" value={values.currency} options={RECEIPT_CURRENCIES} confidence={confidenceLabel("currency")} onChange={update} />
        <SelectField label="Category" name="category" value={values.category} options={RECEIPT_CATEGORIES} confidence={confidenceLabel("category")} onChange={update} />
      </div>

      {record.provenance && (
        <p className="break-words text-[10px] text-muted-foreground">Processing details are available in the saved record.</p>
      )}
      {record.provenance?.contract?.providerCategory && (
        <p className="break-words text-[10px] text-muted-foreground">Processing purpose: structured receipt field extraction.</p>
      )}
      {record.provenance?.contract?.retentionPeriod && (
        <p className="break-words text-[10px] text-muted-foreground">Provider retention terms are recorded with this receipt.</p>
      )}
      {record.provenance?.contract?.noTraining === true && (
        <p className="text-[10px] text-muted-foreground">
          The configured provider contract states that receipt content is not used to train its model.
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={pendingAction !== undefined} onClick={() => void reject()} className="flex-1 gap-1">
          <XCircle className="h-4 w-4" /> Reject
        </Button>
        <Button type="button" disabled={pendingAction !== undefined} onClick={() => void confirm()} className="flex-1 gap-1">
          <CheckCircle2 className="h-4 w-4" /> Confirm receipt
        </Button>
      </div>
    </div>
  );
};

function Field({
  label,
  name,
  value,
  type = "text",
  inputMode,
  confidence,
  onChange,
}: {
  label: string;
  name: ReceiptFieldName;
  value: string;
  type?: string;
  inputMode?: "decimal";
  confidence: React.ReactNode;
  onChange: (name: ReceiptFieldName, value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={`receipt-${name}`} className="text-xs font-semibold">{label}</Label>
      <Input id={`receipt-${name}`} aria-label={label} type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(name, event.target.value)} />
      {confidence}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  confidence,
  onChange,
}: {
  label: string;
  name: ReceiptFieldName;
  value: string;
  options: readonly string[];
  confidence: React.ReactNode;
  onChange: (name: ReceiptFieldName, value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={`receipt-${name}`} className="text-xs font-semibold">{label}</Label>
      <select id={`receipt-${name}`} aria-label={label} value={value} onChange={(event) => onChange(name, event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {confidence}
    </div>
  );
}

export default OcrReview;
