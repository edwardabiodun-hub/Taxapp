import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NigeriaDeclarationForm } from "@/types/declaration";

interface DeductionsStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
}

const DeductionsStep = ({ form, update }: DeductionsStepProps) => {
  const salaryNum = parseFloat(form.annualSalary?.replace(/,/g, "") || "0");
  const pensionCalc = salaryNum > 0 ? (salaryNum * 0.08).toLocaleString() : "";
  const rentNum = parseFloat(form.annualRentPaid?.replace(/,/g, "") || "0");
  const rentRelief = rentNum > 0 ? Math.min(rentNum * 0.2, 500000).toLocaleString() : "";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm">Allowable Deductions</h3>
        <p className="text-[11px] text-muted-foreground">Reduce your taxable income with eligible deductions</p>
      </div>

      <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Employee Pension</p>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Pension Contribution</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
            <Input
              className="pl-8"
              placeholder="0.00"
              value={form.employeePension}
              onChange={(e) => update("employeePension", e.target.value)}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            8% of employment income is allowable
          </p>
          {pensionCalc && (
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-[10px] text-primary font-semibold">
                Calculated: ₦{pensionCalc} (8% of ₦{salaryNum.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Rent Relief</p>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Annual Rent Paid</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
            <Input
              className="pl-8"
              placeholder="0.00"
              value={form.annualRentPaid}
              onChange={(e) => update("annualRentPaid", e.target.value)}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            20% of rent paid — max ₦500,000. Attach documentation.
          </p>
          {rentRelief && (
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-[10px] text-primary font-semibold">
                Relief: ₦{rentRelief} (20% of ₦{rentNum.toLocaleString()}, capped at ₦500,000)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeductionsStep;
