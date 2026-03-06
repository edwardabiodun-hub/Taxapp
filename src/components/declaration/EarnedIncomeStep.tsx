import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Briefcase, Building2, Landmark, Globe } from "lucide-react";
import type { NigeriaDeclarationForm } from "@/types/declaration";

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
    <Label className="text-xs font-semibold">{label}</Label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
      <Input
        className="pl-8"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const TextField = ({ label, hint, value, onChange }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold">{label}</Label>
    <Input placeholder={hint || ""} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const EarnedIncomeStep = ({ form, update, errors = [] }: EarnedIncomeStepProps) => {
  const [activeTab, setActiveTab] = useState<string>("employment");
  const hasIncomeError = errors.some((e) => e.toLowerCase().includes("income source"));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm">Earned Income</h3>
        <p className="text-[11px] text-muted-foreground">Per the Personal Income Tax Act 2025</p>
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Employment Income</p>
          <Field label="Annual Salary" hint="Gross value — fully taxable" value={form.annualSalary} onChange={(v) => update("annualSalary", v)} />
          <Field label="Commissions & Bonuses" hint="Sales commissions, performance bonuses" value={form.commissions} onChange={(v) => update("commissions", v)} />
          <Field label="Allowances" hint="Leave allowance, 13th month, etc." value={form.allowances} onChange={(v) => update("allowances", v)} />
        </div>
      )}

      {/* Business */}
      {activeTab === "business" && (
        <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Trade, Business, Profession or Vocation</p>
          <Field label="Net Business Income" hint="Net after deduction of all allowable expenses" value={form.businessIncome} onChange={(v) => update("businessIncome", v)} />
          <Field label="Allowable Business Expenses" hint="Attach copies of accounts for the year ended" value={form.businessExpenses} onChange={(v) => update("businessExpenses", v)} />
        </div>
      )}

      {/* Annuity */}
      {activeTab === "annuity" && (
        <div className="space-y-4 bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Annuity Income</p>

          <div className="space-y-3 border-b border-border pb-3">
            <Field label="Pension Received" hint="Exempted — income from a matured scheme" value={form.pensionReceived} onChange={(v) => update("pensionReceived", v)} />
            <TextField label="Payer Name" hint="Name of pension payer" value={form.pensionPayerName} onChange={(v) => update("pensionPayerName", v)} />
            <TextField label="Payer Address" hint="Address of pension payer" value={form.pensionPayerAddress} onChange={(v) => update("pensionPayerAddress", v)} />
          </div>

          <div className="space-y-3 border-b border-border pb-3">
            <Field label="Annuity from Insurance" hint="Taxable unless for a qualified life policy" value={form.annuityInsurance} onChange={(v) => update("annuityInsurance", v)} />
            <TextField label="Insurance Payer Name" value={form.annuityPayerName} onChange={(v) => update("annuityPayerName", v)} />
            <TextField label="Insurance Payer Address" value={form.annuityPayerAddress} onChange={(v) => update("annuityPayerAddress", v)} />
          </div>

          <div className="space-y-3">
            <Field label="Gratuities" hint="Exempted up to ₦50M (terminal or end of service)" value={form.gratuities} onChange={(v) => update("gratuities", v)} />
            <TextField label="Gratuity Payer Name" value={form.gratuityPayerName} onChange={(v) => update("gratuityPayerName", v)} />
            <TextField label="Gratuity Payer Address" value={form.gratuityPayerAddress} onChange={(v) => update("gratuityPayerAddress", v)} />
          </div>
        </div>
      )}

      {/* Foreign */}
      {activeTab === "foreign" && (
        <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Foreign Income</p>
          <Field label="Income from Outside Nigeria" hint="Taxable in full unless treaty relief applies" value={form.foreignIncome} onChange={(v) => update("foreignIncome", v)} />
        </div>
      )}
    </div>
  );
};

export default EarnedIncomeStep;
