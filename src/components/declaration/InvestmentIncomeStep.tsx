import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NigeriaDeclarationForm } from "@/types/declaration";

interface InvestmentIncomeStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
}

const Field = ({ label, hint, value, onChange, badge }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; badge?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <Label className="text-xs font-semibold">{label}</Label>
      {badge && (
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success">
          {badge}
        </span>
      )}
    </div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
      <Input className="pl-8" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const InvestmentIncomeStep = ({ form, update }: InvestmentIncomeStepProps) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-display font-bold text-foreground text-sm">Investment Income</h3>
      <p className="text-[11px] text-muted-foreground">Dividends, interest, rent & other investment profits</p>
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Dividends</p>
      <Field label="Nigerian Company Dividends" hint="Final tax via withholding tax deductions" badge="Exempt" value={form.nigerianDividends} onChange={(v) => update("nigerianDividends", v)} />
      <Field label="Other Dividends" hint="Final tax via withholding tax deductions" badge="Exempt" value={form.otherDividends} onChange={(v) => update("otherDividends", v)} />
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Interest & Rent</p>
      <Field label="Interest Income" hint="Final tax via withholding tax deductions" badge="Exempt" value={form.interestIncome} onChange={(v) => update("interestIncome", v)} />
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Interest Sources</Label>
        <Textarea placeholder="List each source and gross income received" className="min-h-[60px] text-sm" value={form.interestSources} onChange={(e) => update("interestSources", e.target.value)} />
      </div>
      <Field label="Rent Income (Net)" hint="Gross rent minus repair expenses — Taxable" value={form.rentIncome} onChange={(v) => update("rentIncome", v)} />
      <Field label="Rent Expenses" hint="Repair and maintenance expenses" value={form.rentExpenses} onChange={(v) => update("rentExpenses", v)} />
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Other Profits</p>
      <Field label="Other Investment Income" hint="Profits from sources not included above — Taxable" value={form.otherInvestmentIncome} onChange={(v) => update("otherInvestmentIncome", v)} />
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Details</Label>
        <Textarea placeholder="List details of each source and income" className="min-h-[60px] text-sm" value={form.otherInvestmentDetails} onChange={(e) => update("otherInvestmentDetails", e.target.value)} />
      </div>
    </div>
  </div>
);

export default InvestmentIncomeStep;
