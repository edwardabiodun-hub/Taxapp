import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  type ReceiptRecord,
} from "@/domain/receipts";
import type { OcrProvider } from "@/lib/ocr/ocr-provider";
import {
  confirmReceipt,
  createManualReceipt,
  processReceipt,
  rejectReceipt,
  validateReceiptFile,
} from "@/lib/ocr/ocr-service";
import OcrReview from "@/components/receipts/OcrReview";

interface ReceiptScannerProps {
  readonly preparationId: string;
  readonly provider?: OcrProvider;
  readonly getRecord?: (id: string) => Promise<ReceiptRecord | undefined>;
  readonly onConfirmed?: (record: ReceiptRecord) => void;
}

const ReceiptScanner = ({
  preparationId,
  provider,
  getRecord,
  onConfirmed,
}: ReceiptScannerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [consent, setConsent] = useState(false);
  const [record, setRecord] = useState<ReceiptRecord>();
  const [manualEntry, setManualEntry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    const validation = validateReceiptFile(selected);
    if (!validation.valid) {
      setError(validation.reason);
      setFile(undefined);
      return;
    }
    setError(undefined);
    setFile(selected);
    setRecord(undefined);
    setConsent(false);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const process = async () => {
    if (!file || !consent) return;
    setIsProcessing(true);
    setError(undefined);
    try {
      const result = await processReceipt(
        {
          preparationId,
          file,
          assetRef: `receipt-asset:${createId()}`,
        },
        { provider, consent: true },
      );
      setRecord(result.record);
      setManualEntry(result.state === "manual_entry");
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : "Receipt could not be processed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const enterManually = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(undefined);
    try {
      const result = await createManualReceipt(
        { preparationId, file, assetRef: `receipt-asset:${createId()}` },
        {},
      );
      setRecord(result.record);
      setManualEntry(true);
    } catch (manualError) {
      setError(manualError instanceof Error ? manualError.message : "Manual receipt entry could not be started.");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirm = async (corrections: Parameters<typeof confirmReceipt>[1]) => {
    if (!record) return;
    try {
      const confirmed = await confirmReceipt(record.id, corrections, { getRecord });
      setRecord(confirmed);
      onConfirmed?.(confirmed);
    } catch (confirmationError) {
      setError(confirmationError instanceof Error ? confirmationError.message : "Receipt values could not be confirmed.");
    }
  };

  const reject = async () => {
    if (!record) return;
    try {
      const rejected = await rejectReceipt(record.id, { getRecord });
      setRecord(rejected);
    } catch (rejectionError) {
      setError(rejectionError instanceof Error ? rejectionError.message : "Receipt could not be rejected.");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-primary" />
        <div>
          <h4 className="text-sm font-semibold text-foreground">Scan a receipt</h4>
          <p className="text-[10px] text-muted-foreground">Structured fields only; review is always required.</p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Receipt image" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
        Choose receipt image
      </Button>

      {file && !record && (
        <div className="space-y-3 rounded-lg bg-muted/50 p-3">
          {previewUrl && <img src={previewUrl} alt={`Original receipt: ${file.name}`} className="max-h-40 w-full rounded-md object-contain" />}
          <div className="flex items-start gap-2">
            <Checkbox id="ocr-consent" aria-label="Consent to OCR processing" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />
            <Label htmlFor="ocr-consent" className="text-[11px] leading-relaxed text-muted-foreground">
              I consent to sending this image to the configured OCR provider for receipt-field extraction. The image remains linked to this review; OCR is optional and manual entry is always available.
            </Label>
          </div>
           <Button type="button" disabled={!consent || isProcessing} onClick={() => void process()} className="w-full gap-2">
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
             Process with OCR
           </Button>
           <Button type="button" variant="ghost" disabled={isProcessing} onClick={() => void enterManually()} className="w-full">
             Enter details manually (no OCR)
           </Button>
          <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>No receipt bytes or OCR secrets are stored in indexed local records.</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {record && (
        <OcrReview record={record} previewUrl={previewUrl} manualEntry={manualEntry} onConfirm={confirm} onReject={reject} />
      )}
    </div>
  );
};

function createId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default ReceiptScanner;
