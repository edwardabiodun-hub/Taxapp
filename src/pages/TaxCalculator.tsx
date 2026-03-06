import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { calculateNigeriaTax, type TaxBreakdown } from "@/lib/tax-calculator";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";

const Field = ({ label, hint, value, onChange }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold">{label}</Label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
      <Input className="pl-8" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const fmtN = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const TaxCalculator = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<NigeriaDeclarationForm>(defaultNigeriaForm);
  const [result, setResult] = useState<TaxBreakdown | null>(null);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const compute = () => {
    setResult(calculateNigeriaTax(form));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto pb-28 space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-lg text-foreground">Tax Estimator</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Quickly estimate your Nigerian personal income tax before filing
        </p>
      </div>

      {/* Income inputs */}
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Employment Income</p>
        <Field label="Annual Salary" hint="Gross value" value={form.annualSalary} onChange={(v) => update("annualSalary", v)} />
        <Field label="Commissions & Bonuses" value={form.commissions} onChange={(v) => update("commissions", v)} />
        <Field label="Allowances" hint="Leave, 13th month, etc." value={form.allowances} onChange={(v) => update("allowances", v)} />
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Other Income</p>
        <Field label="Business Income (Net)" value={form.businessIncome} onChange={(v) => update("businessIncome", v)} />
        <Field label="Rent Income (Net)" value={form.rentIncome} onChange={(v) => update("rentIncome", v)} />
        <Field label="Foreign Income" value={form.foreignIncome} onChange={(v) => update("foreignIncome", v)} />
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Benefits in Kind</p>
        <Field label="Rent Paid by Employer" value={form.rentPaidByEmployer} onChange={(v) => update("rentPaidByEmployer", v)} />
        <Field label="Company Vehicle Cost" hint="Taxed at 10% per annum" value={form.companyVehicleCost} onChange={(v) => update("companyVehicleCost", v)} />
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Deductions</p>
        <Field label="Employee Pension" hint="8% of employment income" value={form.employeePension} onChange={(v) => update("employeePension", v)} />
        <Field label="Annual Rent Paid" hint="20% relief, max ₦500,000" value={form.annualRentPaid} onChange={(v) => update("annualRentPaid", v)} />
      </div>

      <Button onClick={compute} className="w-full gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
        <Calculator className="w-4 h-4" /> Calculate Tax
      </Button>

      {/* Results */}
      {result && result.grossIncome > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero rounded-2xl p-5 text-primary-foreground shadow-elevated space-y-4"
        >
          <h4 className="font-display font-bold text-sm flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Tax Estimate
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70">Gross Income</p>
              <p className="font-display font-bold text-lg">{fmtN(result.grossIncome)}</p>
            </div>
            <div className="bg-background/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70">Deductions (incl. CRA)</p>
              <p className="font-display font-bold text-lg">{fmtN(result.totalDeductions)}</p>
            </div>
          </div>

          <div className="bg-background/10 rounded-xl p-3">
            <p className="text-[10px] opacity-70">Taxable Income</p>
            <p className="font-display font-bold text-xl">{fmtN(result.taxableIncome)}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">Band Breakdown</p>
            {result.bands.map((band, i) => (
              band.income > 0 && (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="opacity-80">{band.range} @ {(band.rate * 100).toFixed(0)}%</span>
                  <span className="font-semibold">{fmtN(band.tax)}</span>
                </div>
              )
            ))}
          </div>

          <div className="border-t border-primary-foreground/20 pt-3 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="opacity-70">Computed Tax</span>
              <span className="font-semibold">{fmtN(result.computedTax)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="opacity-70">Minimum Tax (1%)</span>
              <span className="font-semibold">{fmtN(result.minimumTax)}</span>
            </div>
          </div>

          <div className="bg-background/20 rounded-xl p-4 text-center">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">Estimated Tax Payable</p>
            <p className="font-display font-bold text-2xl mt-1">{fmtN(result.finalTax)}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Effective rate: {result.effectiveRate.toFixed(1)}%</p>
          </div>

          <p className="text-[9px] opacity-60 text-center">
            * Includes Consolidated Relief Allowance (CRA). Estimate only — final assessment by FIRS may differ.
          </p>
        </motion.div>
      )}

      {result && result.grossIncome > 0 && (
        <Button
          onClick={() => navigate("/declare")}
          variant="outline"
          className="w-full gap-2"
        >
          Ready to file? Start Declaration <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
};

export default TaxCalculator;
