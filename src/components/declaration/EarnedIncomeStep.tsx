import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Briefcase, Building2, Landmark, Globe } from "lucide-react";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import { GlossaryText } from "@/components/glossary/GlossaryText";

const tabs = [
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "business", label: "Business", icon: Building2 },
  { id: "annuity", label: "Annuity", icon: Landmark },
  { id: "foreign", label: "Foreign", icon: Globe },
] as const;

interface EarnedIncomeStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
  errors?: string[];
}

const Field = ({ label, hint, value, onChange, prefix = "₦" }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; prefix?: string;
}) => (
  <div className="space-y-1.5">
    <div className="text-xs font-semibold"><GlossaryText>{label}</GlossaryText></div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
      <Input
        className="pl-8"
        placeholder="0.00"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
    {hint && <p className="text-[10px] text-muted-foreground"><GlossaryText>{hint}</GlossaryText></p>}
  </div>
);

const TextField = ({ label, hint, value, onChange }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <div className="text-xs font-semibold"><GlossaryText>{label}</GlossaryText></div>
    <Input aria-label={label} placeholder={hint || ""} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const EarnedIncomeStep = ({ form, update, errors = [] }: EarnedIncomeStepProps) => {
  const [activeTab, setActiveTab] = useState<string>("employment");
  const hasIncomeError = errors.some((e) => e.toLowerCase().includes("income source"));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm">Earned Income</h3>
        <p className="text-[11px] text-muted-foreground">Preparation under the Nigeria Tax Act 2025 (2026 tax year)</p>
        {hasIncomeError && (
          <p className="text-[11px] text-destructive font-medium mt-1">⚠ At least one income source is required</p>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "gradient-primary text-primary-foreground shadow-card"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Employment */}
      {activeTab === "employment" && (
        <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Employment Income</GlossaryText></p>
          <Field label="Annual Salary" hint="Base annual pay; exclude any commission, bonus or allowance entered separately" value={form.annualSalary} onChange={(v) => update("annualSalary", v)} />
          <Field label="Commissions" hint="Sales commissions not already included in base pay" value={form.commissions} onChange={(v) => update("commissions", v)} />
          <Field label="Bonuses" hint="Performance bonuses not already included in base pay or commissions" value={form.bonuses} onChange={(v) => update("bonuses", v)} />
          <Field label="Allowances" hint="Leave allowance, 13th month, etc." value={form.allowances} onChange={(v) => update("allowances", v)} />
          <label htmlFor="minimum-wage-employment" className="block text-xs font-semibold">Single full-year employment at or below national minimum wage?</label>
          <select id="minimum-wage-employment" aria-label="Minimum-wage employment status" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.minimumWageEmployment ?? ""} onChange={(event) => update("minimumWageEmployment", event.target.value)}>
            <option value="">Not confirmed</option><option value="yes">Yes, I confirm</option><option value="no">No</option>
          </select>
          <label htmlFor="employment-period" className="block text-xs font-semibold">Employment period</label>
          <select id="employment-period" aria-label="Employment period" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.employmentPeriod ?? ""} onChange={(event) => update("employmentPeriod", event.target.value)}>
            <option value="">Not confirmed</option><option value="full_year">One full year</option><option value="part_year">Part year</option><option value="multiple_employers">Multiple employers</option>
          </select>
          <p className="text-[10px] text-muted-foreground">Only select yes for one employment held for the full year; other income remains taxable. Keep employment records.</p>
        </div>
      )}

      {/* Business */}
      {activeTab === "business" && (
        <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Trade, Business, Profession or Vocation</GlossaryText></p>
          <Field label="Net Business Income" hint="Net after deduction of all allowable expenses" value={form.businessIncome} onChange={(v) => update("businessIncome", v)} />
          <Field label="Allowable Business Expenses" hint="Attach copies of accounts for the year ended" value={form.businessExpenses} onChange={(v) => update("businessExpenses", v)} />
        </div>
      )}

      {/* Annuity */}
      {activeTab === "annuity" && (
        <div className="space-y-4 bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Annuity Income</GlossaryText></p>

          <div className="space-y-3 border-b border-border pb-3">
            <Field label="Pension Received" hint="Requires classification before a tax estimate can be shown" value={form.pensionReceived} onChange={(v) => update("pensionReceived", v)} />
            <TextField label="Payer Name" hint="Name of pension payer" value={form.pensionPayerName} onChange={(v) => update("pensionPayerName", v)} />
            <TextField label="Payer Address" hint="Address of pension payer" value={form.pensionPayerAddress} onChange={(v) => update("pensionPayerAddress", v)} />
          </div>

          <div className="space-y-3 border-b border-border pb-3">
            <Field label="Annuity from Insurance" hint="Requires classification before a tax estimate can be shown" value={form.annuityInsurance} onChange={(v) => update("annuityInsurance", v)} />
            <TextField label="Insurance Payer Name" value={form.annuityPayerName} onChange={(v) => update("annuityPayerName", v)} />
            <TextField label="Insurance Payer Address" value={form.annuityPayerAddress} onChange={(v) => update("annuityPayerAddress", v)} />
          </div>

          <div className="space-y-3">
            <Field label="Gratuities" hint="Requires classification before a tax estimate can be shown" value={form.gratuities} onChange={(v) => update("gratuities", v)} />
            <TextField label="Gratuity Payer Name" value={form.gratuityPayerName} onChange={(v) => update("gratuityPayerName", v)} />
            <TextField label="Gratuity Payer Address" value={form.gratuityPayerAddress} onChange={(v) => update("gratuityPayerAddress", v)} />
          </div>
        </div>
      )}

      {/* Foreign */}
      {activeTab === "foreign" && (
        <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Foreign Income</GlossaryText></p>
          <Field label="Income from Outside Nigeria" hint="Requires source, remittance and treaty review before estimating" value={form.foreignIncome} onChange={(v) => update("foreignIncome", v)} />
        </div>
      )}
    </div>
  );
};

export default EarnedIncomeStep;
