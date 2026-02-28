import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const steps = ["Tax Info", "Income", "Deductions", "Review"];

const NewDeclaration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    taxYear: "",
    taxType: "",
    country: "",
    grossIncome: "",
    employmentIncome: "",
    businessIncome: "",
    otherIncome: "",
    pensionDeduction: "",
    insuranceDeduction: "",
    charitableDeduction: "",
    otherDeduction: "",
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  };
  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = () => {
    toast({
      title: "Declaration Submitted!",
      description: "Your tax declaration has been submitted for processing.",
    });
    navigate("/submissions");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8">
        {steps.map((step, i) => (
          <div key={step} className="flex-1 flex items-center gap-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  i < currentStep && "gradient-primary text-primary-foreground",
                  i === currentStep && "gradient-accent text-accent-foreground shadow-card",
                  i > currentStep && "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn("text-[10px] mt-1 font-medium", i === currentStep ? "text-foreground" : "text-muted-foreground")}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 rounded-full -mt-4", i < currentStep ? "gradient-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {/* Form Steps */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
        className="space-y-5"
      >
        {currentStep === 0 && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tax Year</Label>
              <Select value={form.taxYear} onValueChange={(v) => update("taxYear", v)}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tax Type</Label>
              <Select value={form.taxType} onValueChange={(v) => update("taxType", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income Tax</SelectItem>
                  <SelectItem value="vat">VAT Return</SelectItem>
                  <SelectItem value="corporate">Corporate Tax</SelectItem>
                  <SelectItem value="payroll">Payroll Tax (PAYE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Country</Label>
              <Select value={form.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ke">Kenya</SelectItem>
                  <SelectItem value="ng">Nigeria</SelectItem>
                  <SelectItem value="gh">Ghana</SelectItem>
                  <SelectItem value="za">South Africa</SelectItem>
                  <SelectItem value="tz">Tanzania</SelectItem>
                  <SelectItem value="ug">Uganda</SelectItem>
                  <SelectItem value="rw">Rwanda</SelectItem>
                  <SelectItem value="et">Ethiopia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Gross Annual Income</Label>
              <Input placeholder="e.g. 1,200,000" value={form.grossIncome} onChange={(e) => update("grossIncome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Employment Income</Label>
              <Input placeholder="e.g. 900,000" value={form.employmentIncome} onChange={(e) => update("employmentIncome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Business Income</Label>
              <Input placeholder="e.g. 200,000" value={form.businessIncome} onChange={(e) => update("businessIncome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Other Income</Label>
              <Input placeholder="e.g. 100,000" value={form.otherIncome} onChange={(e) => update("otherIncome", e.target.value)} />
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Pension Contributions</Label>
              <Input placeholder="e.g. 240,000" value={form.pensionDeduction} onChange={(e) => update("pensionDeduction", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Insurance Premiums</Label>
              <Input placeholder="e.g. 60,000" value={form.insuranceDeduction} onChange={(e) => update("insuranceDeduction", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Charitable Donations</Label>
              <Input placeholder="e.g. 50,000" value={form.charitableDeduction} onChange={(e) => update("charitableDeduction", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Other Deductions</Label>
              <Input placeholder="e.g. 30,000" value={form.otherDeduction} onChange={(e) => update("otherDeduction", e.target.value)} />
            </div>
          </>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <h3 className="font-display font-bold text-foreground">Declaration Summary</h3>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Tax Year" value={form.taxYear || "—"} />
                <SummaryRow label="Tax Type" value={form.taxType || "—"} />
                <SummaryRow label="Country" value={form.country?.toUpperCase() || "—"} />
                <div className="border-t border-border my-2" />
                <SummaryRow label="Gross Income" value={form.grossIncome || "—"} />
                <SummaryRow label="Employment" value={form.employmentIncome || "—"} />
                <SummaryRow label="Business" value={form.businessIncome || "—"} />
                <SummaryRow label="Other" value={form.otherIncome || "—"} />
                <div className="border-t border-border my-2" />
                <SummaryRow label="Pension" value={form.pensionDeduction || "—"} />
                <SummaryRow label="Insurance" value={form.insuranceDeduction || "—"} />
                <SummaryRow label="Charitable" value={form.charitableDeduction || "—"} />
                <SummaryRow label="Other Deductions" value={form.otherDeduction || "—"} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              By submitting, you confirm all information is accurate and complete.
            </p>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {currentStep > 0 && (
          <Button variant="outline" onClick={prev} className="flex-1 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
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

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

export default NewDeclaration;
