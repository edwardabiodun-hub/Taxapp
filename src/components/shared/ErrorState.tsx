import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StateAction } from "@/components/shared/LoadingState";
import { cn } from "@/lib/utils";

export type SafeErrorCode =
  | "GENERIC"
  | "OCR_UNAVAILABLE"
  | "RECEIPT_FILE_INVALID"
  | "RECEIPT_PROCESSING_FAILED"
  | "RECEIPT_CONFIRM_FAILED"
  | "RECEIPT_REJECT_FAILED"
  | "EXPORT_DOWNLOAD_FAILED"
  | "NOT_FOUND";

const safeMessages: Record<SafeErrorCode, string> = {
  GENERIC: "We could not complete this step. Your information is still saved. Please try again.",
  OCR_UNAVAILABLE: "Receipt scanning is unavailable. Your original receipt is preserved; try manual entry to continue.",
  RECEIPT_FILE_INVALID: "That file could not be used. Choose a JPEG, PNG, or WebP receipt image and try again.",
  RECEIPT_PROCESSING_FAILED: "The receipt could not be processed. Your original receipt is preserved; try again or enter the details manually.",
  RECEIPT_CONFIRM_FAILED: "The receipt values could not be confirmed. Your edits are preserved; try again.",
  RECEIPT_REJECT_FAILED: "The receipt could not be rejected. Your receipt is preserved; try again.",
  EXPORT_DOWNLOAD_FAILED: "This file could not be downloaded. The export package is preserved; try again.",
  NOT_FOUND: "This page is not available. Return to the home page to continue.",
};

const safeTitles: Record<SafeErrorCode, readonly string[]> = {
  GENERIC: ["Something went wrong"],
  OCR_UNAVAILABLE: ["Receipt scanning unavailable"],
  RECEIPT_FILE_INVALID: ["Receipt file not supported"],
  RECEIPT_PROCESSING_FAILED: ["Receipt processing failed"],
  RECEIPT_CONFIRM_FAILED: ["Receipt confirmation failed"],
  RECEIPT_REJECT_FAILED: ["Receipt rejection failed"],
  EXPORT_DOWNLOAD_FAILED: ["Download failed"],
  NOT_FOUND: ["Page not found"],
};

interface ErrorStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly errorCode?: SafeErrorCode;
  readonly action?: StateAction;
  readonly className?: string;
}

function safeMessage(message: string | undefined, errorCode: SafeErrorCode): string {
  return message && message === safeMessages[errorCode] ? message : safeMessages[errorCode];
}

function safeTitle(title: string | undefined, errorCode: SafeErrorCode): string {
  return title && safeTitles[errorCode].includes(title)
    ? title
    : safeTitles[errorCode][0];
}

const ErrorState = ({
  title,
  message,
  errorCode = "GENERIC",
  action,
  className,
}: ErrorStateProps) => (
  <div role="alert" className={cn("rounded-lg border border-destructive/30 bg-destructive/5 p-4", className)}>
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-foreground">{safeTitle(title, errorCode)}</p>
        <p className="break-words text-xs text-muted-foreground">{safeMessage(message, errorCode)}</p>
        {action && (
          <Button type="button" variant="outline" size="sm" onClick={action.onClick} className="mt-3">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default ErrorState;
