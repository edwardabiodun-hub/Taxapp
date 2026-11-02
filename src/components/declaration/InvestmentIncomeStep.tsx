import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import { GlossaryText } from "@/components/glossary/GlossaryText";

interface InvestmentIncomeStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
}

const Field = ({ label, hint, value, onChange, badge }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; badge?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <div className="text-xs font-semibold"><GlossaryText>{label}</GlossaryText></div>
      {badge && (
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success">
          {badge}
        </span>
      )}
    </div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
      <Input aria-label={label} className="pl-8" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
    {hint && <p className="text-[10px] text-muted-foreground"><GlossaryText>{hint}</GlossaryText></p>}
  </div>
);

const InvestmentIncomeStep = ({ form, update }: InvestmentIncomeStepProps) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-display font-bold text-foreground text-sm">Investment Income</h3>
      <p className="text-[11px] text-muted-foreground">Dividends, interest, rent & other investment profits</p>
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Dividends</GlossaryText></p>
      <Field label="Nigerian Company Dividends" hint="Disclose the amount and retain withholding-tax evidence; it is not taxed again where final withholding tax applies" value={form.nigerianDividends} onChange={(v) => update("nigerianDividends", v)} />
      <Field label="Other Dividends" hint="Disclose and retain the supporting tax evidence for review" value={form.otherDividends} onChange={(v) => update("otherDividends", v)} />
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Interest & Rent</GlossaryText></p>
      <Field label="Interest Income" hint="Disclose the amount and source; final withholding-tax treatment requires evidence" value={form.interestIncome} onChange={(v) => update("interestIncome", v)} />
      <div className="space-y-1.5">
        <div className="text-xs font-semibold"><GlossaryText>Interest Sources</GlossaryText></div>
        <Textarea aria-label="Interest Sources" placeholder="List each source and gross income received" className="min-h-[60px] text-sm" value={form.interestSources} onChange={(e) => update("interestSources", e.target.value)} />
      </div>
      <Field label="Rent Income" hint="Enter the amount applicable to the assessment period" value={form.rentIncome} onChange={(v) => update("rentIncome", v)} />
      <Field label="Rent Expenses" hint="Record supporting repair and maintenance costs for review" value={form.rentExpenses} onChange={(v) => update("rentExpenses", v)} />
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Other Profits</GlossaryText></p>
      <Field label="Other Investment Income" hint="Disclose the amount; confirm final withholding-tax treatment and retain evidence" value={form.otherInvestmentIncome} onChange={(v) => update("otherInvestmentIncome", v)} />
      <div className="space-y-1.5">
        <div className="text-xs font-semibold"><GlossaryText>Details</GlossaryText></div>
        <Textarea aria-label="Details" placeholder="List details of each source and income" className="min-h-[60px] text-sm" value={form.otherInvestmentDetails} onChange={(e) => update("otherInvestmentDetails", e.target.value)} />
      </div>
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Digital assets and chargeable gains</GlossaryText></p>
      <Field label="Digital-asset gains" hint="Gains before attributable charges" value={form.digitalAssetGains} onChange={(v) => update("digitalAssetGains", v)} />
      <Field label="Digital-asset attributable charges" value={form.digitalAssetCharges} onChange={(v) => update("digitalAssetCharges", v)} />
      <Field label="Chargeable gains" hint="Disclose for review; not included in the automated estimate yet" value={form.chargeableGains} onChange={(v) => update("chargeableGains", v)} />
    </div>
  </div>
);

export default InvestmentIncomeStep;
