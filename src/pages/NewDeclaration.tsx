import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  declarationSteps,
  defaultNigeriaForm,
  type NigeriaDeclarationForm,
} from "@/types/declaration";
import {
  getJurisdictionCapability,
  listNigeriaJurisdictions,
} from "@/data/jurisdiction-registry";
import { calculatePreparation } from "@/lib/calculation-service";
import {
  createPreparationRecord,
  type PreparationRecord,
} from "@/domain/preparations";
import type { PreparationStatus } from "@/domain/tax-readiness";
import { savePreparation } from "@/lib/preparation-repository";
import { getDocumentMetadata } from "@/lib/preparation-documents";
import { getCalculationReceiptInputs } from "@/domain/receipts";
import { listReceiptRecords } from "@/lib/receipt-repository";
import DeadlineCard from "@/components/deadlines/DeadlineCard";
import { resolveDeadline } from "@/lib/deadline-service";
import { validateStep } from "@/lib/validation";
import StepIndicator from "@/components/declaration/StepIndicator";
import JurisdictionStep from "@/components/declaration/JurisdictionStep";
import PreparationStatusBanner from "@/components/declaration/PreparationStatusBanner";
import EarnedIncomeStep from "@/components/declaration/EarnedIncomeStep";
import InvestmentIncomeStep from "@/components/declaration/InvestmentIncomeStep";
import BenefitsStep from "@/components/declaration/BenefitsStep";
import DeductionsStep from "@/components/declaration/DeductionsStep";
import DocumentsStep, { type UploadedDoc } from "@/components/declaration/DocumentsStep";
import ReviewStep from "@/components/declaration/ReviewStep";

const preparationSteps = declarationSteps.map((step, index) =>
  index === 0 ? "Jurisdiction" : step,
);

const NewDeclaration = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<NigeriaDeclarationForm>(defaultNigeriaForm);
  const [jurisdictionCode, setJurisdictionCode] = useState("");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [preparationId] = useState<string>(() => `prep-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [hasSavedPreparation, setHasSavedPreparation] = useState(false);
  const [savedStatus, setSavedStatus] = useState<PreparationStatus>();
  const [lastSavedAt, setLastSavedAt] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const capabilities = listNigeriaJurisdictions();
  const capability = useMemo(
    () => (jurisdictionCode ? getJurisdictionCapability(jurisdictionCode) : undefined),
    [jurisdictionCode],
  );
  const calculation = useMemo(
    () =>
      calculatePreparation(
        { ...form, jurisdictionCode },
        capability ?? getJurisdictionCapability("NG-UNKNOWN"),
      ),
    [capability, form, jurisdictionCode],
  );
  const deadline = useMemo(
    () =>
      capability && form.taxYear
        ? resolveDeadline(capability, form.taxYear)
        : null,
    [capability, form.taxYear],
  );

  const update = (key: string, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const requiredDataComplete = () =>
    validateStep(0, form, jurisdictionCode).valid && validateStep(1, form, jurisdictionCode).valid;

  const next = () => {
    const result = validateStep(currentStep, form, jurisdictionCode);
    setErrors(result.errors);

    if (!result.valid) {
      toast({
        title: "Complete missing preparation data",
        description: result.errors.join(" "),
        variant: "destructive",
      });
      return;
    }

    if (currentStep < preparationSteps.length - 1) setCurrentStep((step) => step + 1);
  };

  const prev = () => {
    setErrors([]);
    if (currentStep > 0) setCurrentStep((step) => step - 1);
  };

  const handleSave = async (targetStatus: "draft" | "ready_for_review") => {
    setIsSaving(true);
    const now = new Date().toISOString();
    const id = preparationId;
    const receiptInputs = getCalculationReceiptInputs(
      (await listReceiptRecords(id)).filter((record) => record.reviewStatus !== "rejected"),
    );
    const shouldBeReady = targetStatus === "ready_for_review" && requiredDataComplete();
    const baseInput = {
      id,
      jurisdictionCode,
      taxYear: form.taxYear,
      ruleProfileVersion: calculation.ruleProfileVersion,
      formData: { ...form, documents: getDocumentMetadata(documents) },
      confirmedReceiptIds: receiptInputs.map((input) => input.receiptId),
      confirmedReceiptInputs: Object.fromEntries(
        receiptInputs.map((input) => [
          `receipt_${input.receiptId}`,
          input,
        ]),
      ),
      createdAt: now,
      updatedAt: now,
    };
    let draftSaved = false;

    try {
      let savedRecord: PreparationRecord;
      const preparationCapability = capability ?? getJurisdictionCapability("NG-UNKNOWN");

      if (!hasSavedPreparation) {
        const draft = createPreparationRecord(
          { ...baseInput, status: "draft" },
          preparationCapability,
        );
        await savePreparation(draft);
        draftSaved = true;
        savedRecord = draft;
        setHasSavedPreparation(true);
        setSavedStatus(draft.status);
        setLastSavedAt(draft.updatedAt);
      } else {
        savedRecord = createPreparationRecord(
          { ...baseInput, status: shouldBeReady ? "ready_for_review" : "draft" },
          preparationCapability,
        );
        await savePreparation(savedRecord);
      }

      if (shouldBeReady && savedRecord.status === "draft") {
        const readyForReview: PreparationRecord = {
          ...savedRecord,
          status: "ready_for_review",
          updatedAt: new Date().toISOString(),
        };
        await savePreparation(readyForReview);
        savedRecord = readyForReview;
      }

      setSavedStatus(savedRecord.status);
      setLastSavedAt(savedRecord.updatedAt);
      toast({
        title: savedRecord.status === "ready_for_review" ? "Preparation ready for review" : "Draft saved",
        description: "Saved locally. No tax return was filed or submitted.",
      });
    } catch {
      toast({
        title: draftSaved
          ? "Draft saved, but could not mark ready for review"
          : "Could not save preparation",
        description: draftSaved
          ? "Your preparation is saved as a draft. Try marking it ready again."
          : "Your current data remains on this page. Try saving again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="tax-year" className="text-sm font-semibold text-foreground">
                Tax year <span aria-hidden="true">*</span>
              </label>
              <select
                id="tax-year"
                aria-label="Tax year"
                value={form.taxYear}
                onChange={(event) => update("taxYear", event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select tax year</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              {errors.some((error) => error.toLowerCase().includes("tax year")) && (
                <p className="text-[10px] font-medium text-destructive">Please select a tax year.</p>
              )}
            </div>
            <JurisdictionStep
              selectedCode={jurisdictionCode}
              onSelect={setJurisdictionCode}
              capabilities={capabilities}
            />
          </div>
        );
      case 1:
        return <EarnedIncomeStep form={form} update={update} errors={errors} />;
      case 2:
        return <InvestmentIncomeStep form={form} update={update} />;
      case 3:
        return <BenefitsStep form={form} update={update} />;
      case 4:
        return <DeductionsStep form={form} update={update} />;
      case 5:
        return (
          <DocumentsStep
            documents={documents}
            onDocumentsChange={setDocuments}
            preparationId={preparationId}
          />
        );
      case 6:
        return (
          <ReviewStep
            form={form}
            documents={documents}
            capability={capability}
            calculation={calculation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28">
      <StepIndicator steps={preparationSteps} currentStep={currentStep} />
      <PreparationStatusBanner
        capability={capability}
        calculation={calculation}
        taxYear={form.taxYear}
        status={savedStatus}
        lastSavedAt={lastSavedAt}
      />

      <div className="mt-4">
        <DeadlineCard deadline={deadline} />
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        {renderStep()}
      </motion.div>

      <div className="mt-8 flex flex-wrap gap-3">
        {currentStep > 0 && (
          <Button variant="outline" onClick={prev} className="flex-1 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => void handleSave("draft")}
          disabled={isSaving}
          className="flex-1 gap-2"
        >
          <Save className="h-4 w-4" /> Save as draft
        </Button>
        {currentStep < preparationSteps.length - 1 ? (
          <Button onClick={next} className="flex-1 gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => void handleSave("ready_for_review")}
            disabled={isSaving || !requiredDataComplete()}
            className="flex-1 gap-2 gradient-accent text-accent-foreground border-0 hover:opacity-90"
          >
            <Check className="h-4 w-4" /> Mark ready for review
          </Button>
        )}
      </div>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Local-first preparation. Saving or marking ready for review does not file a tax return.
      </p>
    </div>
  );
};

export default NewDeclaration;
