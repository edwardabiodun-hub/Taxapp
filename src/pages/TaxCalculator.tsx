import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { calculateNigeriaTax, TaxEstimateUnavailableError, type TaxBreakdown } from "@/lib/tax-calculator";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";
import { GlossaryText } from "@/components/glossary/GlossaryText";
import { isFilingLaunchPhase, publicFilingPath } from "@/lib/launch-phase";
import { setPageMetadata } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

const Field = ({ label, hint, value, onChange }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
}) => {
  const fieldId = `tax-calculator-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const hintId = `${fieldId}-hint`;

  return (
  <div className="space-y-1.5">
    <label htmlFor={fieldId} className="text-xs font-semibold"><GlossaryText>{label}</GlossaryText></label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
      <Input id={fieldId} aria-label={label} aria-describedby={hint ? hintId : undefined} inputMode="decimal" className="pl-8" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
    {hint && <p id={hintId} className="text-[10px] text-muted-foreground"><GlossaryText>{hint}</GlossaryText></p>}
  </div>
  );
};

const fmtN = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const TaxCalculator = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<NigeriaDeclarationForm>({ ...defaultNigeriaForm, taxYear: "2026" });
  const [result, setResult] = useState<TaxBreakdown | null>(null);
  const [estimateWarnings, setEstimateWarnings] = useState<readonly string[]>([]);

  useEffect(() => {
    trackEvent("public_calculator_viewed", {
      surface: "public_calculator",
      route: "/calculator",
    });
    if (isFilingLaunchPhase) {
      setPageMetadata({
        title: "Personal income tax estimator | FileSmart",
        description: "Estimate your 2026 personal income tax using the Nigeria Tax Act 2025. The estimator does not submit a tax return.",
        path: "/calculator",
      });
    }
  }, []);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setEstimateWarnings([]);
  };

  const compute = () => {
    try {
      const calculation = calculateNigeriaTax(form);
      if (calculation.grossIncome <= 0) {
        setResult(null);
        setEstimateWarnings(["Enter at least one income amount before calculating an estimate."]);
        trackEvent("public_calculator_estimate_unavailable", {
          surface: "public_calculator",
          route: "/calculator",
          result: "estimate_unavailable",
        });
        return;
      }

      setResult(calculation);
      setEstimateWarnings([]);
      trackEvent("public_calculator_estimate_shown", {
        surface: "public_calculator",
        route: "/calculator",
        result: "estimate_shown",
      });
    } catch (error) {
      if (!(error instanceof TaxEstimateUnavailableError)) throw error;
      setResult(null);
      setEstimateWarnings(error.reasons);
      trackEvent("public_calculator_estimate_unavailable", {
        surface: "public_calculator",
        route: "/calculator",
        result: "estimate_unavailable",
      });
    }
  };

  return (
    <div className={isFilingLaunchPhase ? "min-h-screen bg-[#f8f7f3] text-[#12352f]" : undefined}>
    {isFilingLaunchPhase && <PublicNav />}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto pb-28 space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg text-foreground">Tax Estimator</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          <GlossaryText>Estimate 2026 personal income tax under the Nigeria Tax Act 2025</GlossaryText>
        </p>
        <p className="text-[11px] text-muted-foreground">
          <GlossaryText>{isFilingLaunchPhase ? "Use eligible deductions to estimate your tax. Calculations stay in this page; nothing is filed or sent to a tax authority." : "Use eligible deductions to estimate chargeable income before filing."}</GlossaryText>
        </p>
      </div>

      {/* Income inputs */}
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Employment Income</GlossaryText></p>
        <Field label="Annual Salary" hint="Gross value" value={form.annualSalary} onChange={(v) => update("annualSalary", v)} />
        <Field label="Commissions" value={form.commissions} onChange={(v) => update("commissions", v)} />
        <Field label="Bonuses" value={form.bonuses} onChange={(v) => update("bonuses", v)} />
        <Field label="Allowances" hint="Leave, 13th month, etc." value={form.allowances} onChange={(v) => update("allowances", v)} />
        <label htmlFor="estimator-minimum-wage" className="block text-xs font-semibold">Single full-year employment at or below national minimum wage?</label>
        <select id="estimator-minimum-wage" aria-label="Minimum-wage employment status" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.minimumWageEmployment} onChange={(event) => update("minimumWageEmployment", event.target.value)}>
          <option value="">Not confirmed</option><option value="yes">Yes, I confirm</option><option value="no">No</option>
        </select>
        <label htmlFor="tax-calculator-employment-period" className="block text-xs font-semibold">Employment period</label>
        <select id="tax-calculator-employment-period" aria-label="Employment period" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.employmentPeriod ?? ""} onChange={(event) => update("employmentPeriod", event.target.value)}>
          <option value="">Not confirmed</option><option value="full_year">One full year</option><option value="part_year">Part year</option><option value="multiple_employers">Multiple employers</option>
        </select>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Other Income</GlossaryText></p>
        <Field label="Business Income (Net)" value={form.businessIncome} onChange={(v) => update("businessIncome", v)} />
        <Field label="Rent Income (Net)" value={form.rentIncome} onChange={(v) => update("rentIncome", v)} />
        <Field label="Foreign Income" value={form.foreignIncome} onChange={(v) => update("foreignIncome", v)} />
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Benefits in Kind</GlossaryText></p>
        <Field label="Rent Paid by Employer" value={form.rentPaidByEmployer} onChange={(v) => update("rentPaidByEmployer", v)} />
        <Field label="Company Vehicle Cost" hint="Requires ownership or hire details; an estimate will be withheld" value={form.companyVehicleCost} onChange={(v) => update("companyVehicleCost", v)} />
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Deductions</GlossaryText></p>
        <Field label="Employee Pension" hint="Enter documented actual eligible contributions only" value={form.employeePension} onChange={(v) => update("employeePension", v)} />
        <Field label="National Housing Fund" value={form.nationalHousingFund} onChange={(v) => update("nationalHousingFund", v)} />
        <Field label="National Health Insurance" value={form.nationalHealthInsurance} onChange={(v) => update("nationalHealthInsurance", v)} />
        <Field label="Owner-occupied mortgage interest" value={form.mortgageInterest} onChange={(v) => update("mortgageInterest", v)} />
        <label htmlFor="tax-calculator-mortgage-principal-residence" className="block text-xs font-semibold">Mortgage is for principal residence</label>
        <select id="tax-calculator-mortgage-principal-residence" aria-label="Mortgage is for principal residence" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.mortgagePrincipalResidence ?? ""} onChange={(event) => update("mortgagePrincipalResidence", event.target.value)}>
          <option value="">Not confirmed</option><option value="yes">Yes</option><option value="no">No</option>
        </select>
        <Field label="Qualifying life-insurance or deferred-annuity premiums" hint="The Act refers to premiums paid in the year preceding assessment; confirm the applicable period and retain evidence" value={form.lifeInsurancePremium} onChange={(v) => update("lifeInsurancePremium", v)} />
        <label htmlFor="tax-calculator-life-insurance-paid-year" className="block text-xs font-semibold">Life-insurance premium paid year</label>
        <select id="tax-calculator-life-insurance-paid-year" aria-label="Life-insurance premium paid year" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.lifeInsurancePremiumPaidYear ?? ""} onChange={(event) => update("lifeInsurancePremiumPaidYear", event.target.value)}>
          <option value="">Not confirmed</option><option value="2025">2025</option>
        </select>
        <Field label="Annual Rent Paid" hint="20% of qualifying annual rent paid, with relief capped at ₦500,000" value={form.annualRentPaid} onChange={(v) => update("annualRentPaid", v)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="tax-calculator-rent-period-start" className="text-xs font-semibold">Rent period start</label>
            <Input id="tax-calculator-rent-period-start" aria-label="Rent period start" type="date" value={form.rentPeriodStart ?? ""} onChange={(event) => update("rentPeriodStart", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tax-calculator-rent-period-end" className="text-xs font-semibold">Rent period end</label>
            <Input id="tax-calculator-rent-period-end" aria-label="Rent period end" type="date" value={form.rentPeriodEnd ?? ""} onChange={(event) => update("rentPeriodEnd", event.target.value)} />
          </div>
        </div>
        <label htmlFor="tax-calculator-rent-shared" className="block text-xs font-semibold">Rent shared with others</label>
        <select id="tax-calculator-rent-shared" aria-label="Rent shared with others" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.rentSharedWithOthers ?? ""} onChange={(event) => update("rentSharedWithOthers", event.target.value)}>
          <option value="">Not confirmed</option><option value="no">No</option><option value="yes">Yes</option>
        </select>
        <p className="text-[10px] text-muted-foreground">Review facts are saved with your preparation. A cross-year or shared-tenancy rent entry prevents a numeric estimate until its attributable amount is confirmed.</p>
      </div>

      <Button onClick={compute} className="w-full gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
        <Calculator className="w-4 h-4" /> Calculate 2026 estimate
      </Button>

      {estimateWarnings.length > 0 && <div role="alert" aria-live="assertive" className="rounded-xl border border-warning bg-warning/10 p-4 text-sm">
        <p className="font-semibold">Cannot estimate yet</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">{estimateWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
      </div>}

      {/* Results */}
      {result && result.grossIncome > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          aria-live="polite"
          className="gradient-hero rounded-xl p-5 text-primary-foreground space-y-4"
        >
          <h4 className="font-display font-bold text-sm flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Tax Estimate
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70"><GlossaryText>Gross Income</GlossaryText></p>
              <p className="font-display font-bold text-lg">{fmtN(result.grossIncome)}</p>
            </div>
            <div className="bg-background/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70"><GlossaryText>Eligible deductions and reliefs</GlossaryText></p>
              <p className="font-display font-bold text-lg">{fmtN(result.totalDeductions)}</p>
            </div>
          </div>

          <div className="bg-background/10 rounded-xl p-3">
            <p className="text-[10px] opacity-70"><GlossaryText>Taxable Income</GlossaryText></p>
            <p className="font-display font-bold text-xl">{fmtN(result.taxableIncome)}</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold"><GlossaryText>Band Breakdown</GlossaryText></p>
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
              <span className="opacity-70"><GlossaryText>Computed Tax</GlossaryText></span>
              <span className="font-semibold">{fmtN(result.computedTax)}</span>
            </div>
          </div>

          <div className="bg-background/20 rounded-xl p-4 text-center">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold"><GlossaryText>Estimated tax before credits</GlossaryText></p>
            <p className="font-display font-bold text-2xl mt-1">{fmtN(result.finalTax)}</p>
            <p className="text-[10px] opacity-70 mt-0.5"><GlossaryText>Effective rate</GlossaryText>: {result.effectiveRate.toFixed(1)}%</p>
          </div>

          <p className="text-[9px] opacity-60 text-center">
            Estimate before PAYE and withholding-tax credits. Confirm deductible amounts and supporting records. This is not a government assessment or filing.
          </p>
        </motion.div>
      )}

      {result && result.grossIncome > 0 && (
        <Button
          onClick={() => navigate("/declare")}
          variant="outline"
          className="w-full gap-2"
        >
          Continue tax preparation <ArrowRight className="w-4 h-4" />
        </Button>
      )}
      {result && result.grossIncome > 0 && isFilingLaunchPhase && (
        <Button asChild variant="outline" className="w-full gap-2">
          <Link to={publicFilingPath}>Join the filing waitlist <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      )}
    </motion.div>
    {isFilingLaunchPhase && <PublicFooter />}
    </div>
  );
};

export default TaxCalculator;
