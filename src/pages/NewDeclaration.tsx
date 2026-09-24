import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { declarationSteps, defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";
import { validateStep } from "@/lib/validation";
import { db } from "@/lib/local-db";
import StepIndicator from "@/components/declaration/StepIndicator";
import CountryStep from "@/components/declaration/CountryStep";
import EarnedIncomeStep from "@/components/declaration/EarnedIncomeStep";
import InvestmentIncomeStep from "@/components/declaration/InvestmentIncomeStep";
import BenefitsStep from "@/components/declaration/BenefitsStep";
import DeductionsStep from "@/components/declaration/DeductionsStep";
import DocumentsStep, { type UploadedDoc } from "@/components/declaration/DocumentsStep";
import ReviewStep from "@/components/declaration/ReviewStep";

const NewDeclaration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<NigeriaDeclarationForm>(defaultNigeriaForm);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    const result = validateStep(currentStep, form);
    setErrors(result.errors);

    if (!result.valid) {
      toast({
        title: "Please complete required fields",
        description: result.errors.join(". "),
        variant: "destructive",
      });
      return;
    }

    if (currentStep < declarationSteps.length - 1) setCurrentStep((s) => s + 1);
  };

  const prev = () => {
    setErrors([]);
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const id = `decl-${Date.now()}`;
    await db.declarations.add({
      id,
      taxYear: form.taxYear || "2025",
      country: form.country || "ng",
      type: "Income Tax",
      status: "submitted",
      formData: { ...form },
      documents: documents.map((d) => ({ name: d.name, size: d.size, type: d.type })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingSync: 1,
    });
    toast({
      title: "Declaration Submitted!",
      description: `Your tax declaration with ${documents.length} document(s) has been saved and queued for sync.`,
    });
    navigate("/submissions");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <CountryStep form={form} update={update} errors={errors} />;
      case 1: return <EarnedIncomeStep form={form} update={update} errors={errors} />;
      case 2: return <InvestmentIncomeStep form={form} update={update} />;
      case 3: return <BenefitsStep form={form} update={update} />;
      case 4: return <DeductionsStep form={form} update={update} />;
      case 5: return <DocumentsStep documents={documents} onDocumentsChange={setDocuments} />;
      case 6: return <ReviewStep form={form} documents={documents} />;
      default: return null;
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-28">
      <StepIndicator steps={declarationSteps} currentStep={currentStep} />

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
      >
        {renderStep()}
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {currentStep > 0 && (
          <Button variant="outline" onClick={prev} className="flex-1 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        {currentStep < declarationSteps.length - 1 ? (
          <Button onClick={next} className="flex-1 gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="flex-1 gap-2 gradient-accent text-accent-foreground border-0 hover:opacity-90">
            <Check className="w-4 h-4" /> Submit Declaration
          </Button>
        )}
      </div>
    </div>
  );
};

export default NewDeclaration;
