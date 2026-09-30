import { Input } from "@/components/ui/input";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import { GlossaryText } from "@/components/glossary/GlossaryText";
import { calculateRentRelief, RENT_RELIEF_RECOGNITION_CAP } from "@/lib/rent-relief";

interface DeductionsStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
}

const DeductionsStep = ({ form, update }: DeductionsStepProps) => {
  const salaryNum = parseFloat(form.annualSalary?.replace(/,/g, "") || "0");
  const pensionCalc = salaryNum > 0 ? (salaryNum * 0.08).toLocaleString() : "";
  const rentNum = parseFloat(form.annualRentPaid?.replace(/,/g, "") || "0");
  const rentCalculation = calculateRentRelief(rentNum);
  const rentRelief = rentNum > 0 ? rentCalculation.relief.toLocaleString() : "";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm"><GlossaryText>Allowable Deductions</GlossaryText></h3>
        <p className="text-[11px] text-muted-foreground"><GlossaryText>Reduce your taxable income with eligible deductions</GlossaryText></p>
      </div>

      <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Employee Pension</GlossaryText></p>
        <div className="space-y-1.5">
          <div className="text-xs font-semibold"><GlossaryText>Pension Contribution</GlossaryText></div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
            <Input
              className="pl-8"
              placeholder="0.00"
              aria-label="Pension Contribution"
              value={form.employeePension}
              onChange={(e) => update("employeePension", e.target.value)}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            <GlossaryText>8% of employment income is allowable</GlossaryText>
          </p>
          {pensionCalc && (
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-[10px] text-primary font-semibold">
                <GlossaryText>Calculated</GlossaryText>: ₦{pensionCalc} (8% of ₦{salaryNum.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Rent Relief</GlossaryText></p>
        <div className="space-y-1.5">
          <div className="text-xs font-semibold"><GlossaryText>Annual Rent Paid</GlossaryText></div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
            <Input
              className="pl-8"
              placeholder="0.00"
              aria-label="Annual Rent Paid"
              value={form.annualRentPaid}
              onChange={(e) => update("annualRentPaid", e.target.value)}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            <GlossaryText>20% of recognized rent, with the rent base capped at ₦500,000. Attach documentation.</GlossaryText>
          </p>
          {rentRelief && (
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-[10px] text-primary font-semibold">
                <GlossaryText>Relief</GlossaryText>: ₦{rentRelief} (20% of ₦{rentCalculation.recognizedRent.toLocaleString()} rent base, capped at ₦{RENT_RELIEF_RECOGNITION_CAP.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeductionsStep;
