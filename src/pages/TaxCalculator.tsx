import { useEffect, useState, type FormEvent } from "react";
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

const moneyFieldKeys = new Set([
  "annualSalary", "commissions", "bonuses", "allowances", "businessIncome", "businessExpenses",
  "businessLoanInterest", "businessPremisesRent", "businessRepairsMaintenance",
  "businessEmployeeRemuneration", "businessBadDebts", "businessProfessionalFees", "rentIncome",
  "foreignIncome", "digitalAssetGains", "digitalAssetCharges", "chargeableGains", "rentPaidByEmployer",
  "companyVehicleCost", "payeAlreadySuffered", "employeePension", "nationalHousingFund",
  "nationalHealthInsurance", "mortgageInterest", "lifeInsurancePremium", "annualRentPaid",
]);

function formatMoneyInput(value: string): string {
  const sanitized = value.replace(/[^\d.]/g, "");
  if (!sanitized) return "";

  const decimalIndex = sanitized.indexOf(".");
  const integerPart = decimalIndex === -1 ? sanitized : sanitized.slice(0, decimalIndex);
  const decimalPart = decimalIndex === -1 ? undefined : sanitized.slice(decimalIndex + 1).replace(/\./g, "").slice(0, 2);
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || (decimalPart !== undefined ? "0" : "");
  const formattedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
}

function hasIncomeInput(form: NigeriaDeclarationForm): boolean {
  return [
    form.annualSalary, form.commissions, form.bonuses, form.allowances, form.businessIncome,
    form.rentIncome, form.foreignIncome, form.digitalAssetGains, form.chargeableGains,
  ].some((value) => Boolean(value?.trim()));
}

function getEstimate(form: NigeriaDeclarationForm): { result: TaxBreakdown | null; warnings: readonly string[] } {
  try {
    const calculation = calculateNigeriaTax(form);
    if (calculation.reportedIncome <= 0) {
      return { result: null, warnings: ["Enter at least one income amount before calculating an estimate."] };
    }
    return { result: calculation, warnings: calculation.warnings };
  } catch (error) {
    if (!(error instanceof TaxEstimateUnavailableError)) throw error;
    return { result: null, warnings: error.reasons };
  }
}

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
    if (!hasIncomeInput(form)) {
      setResult(null);
      setEstimateWarnings([]);
      return;
    }

    const estimate = getEstimate(form);
    setResult(estimate.result);
    setEstimateWarnings(estimate.warnings);
  }, [form]);

  useEffect(() => {
    trackEvent("public_calculator_viewed", {
      surface: "public_calculator",
      route: "/calculator",
    });
    if (isFilingLaunchPhase) {
      setPageMetadata({
        title: "Nigeria Personal Income Tax Calculator 2026 | FileSmart",
        description: "Calculate an indicative 2026 Nigeria personal income tax result using the Nigeria Tax Act 2025. The calculator does not submit a tax return.",
        path: "/calculator",
      });
    }
  }, []);

  const update = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: moneyFieldKeys.has(key) ? formatMoneyInput(value) : value,
    }));
  };

  const compute = () => {
    const estimate = getEstimate(form);
    setResult(estimate.result);
    setEstimateWarnings(estimate.warnings);
    if (estimate.result) {
      trackEvent("public_calculator_estimate_shown", {
        surface: "public_calculator",
        route: "/calculator",
        result: "estimate_shown",
      });
    } else {
      trackEvent("public_calculator_estimate_unavailable", {
        surface: "public_calculator",
        route: "/calculator",
        result: "estimate_unavailable",
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    compute();
  };

  return (
    <div className={isFilingLaunchPhase ? "min-h-screen bg-[#f8f7f3] text-[#12352f]" : undefined}>
    {isFilingLaunchPhase && <PublicNav />}
    <div className="px-4 py-6 max-w-lg mx-auto pb-28 space-y-5">
      <form onSubmit={handleSubmit} aria-label="2026 tax estimate calculator" className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg text-foreground">Nigeria Tax Calculator</h1>
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
        <label htmlFor="estimator-minimum-wage" className="block text-xs font-semibold">National minimum wage disclosure (optional)</label>
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
        <Field label="Business Income (Gross)" hint="Enter gross receipts; claim qualifying business costs below" value={form.businessIncome} onChange={(v) => update("businessIncome", v)} />
        <Field label="Other allowable business expenses" value={form.businessExpenses} onChange={(v) => update("businessExpenses", v)} />
        <Field label="Business loan interest" value={form.businessLoanInterest} onChange={(v) => update("businessLoanInterest", v)} />
        <Field label="Business premises rent" value={form.businessPremisesRent} onChange={(v) => update("businessPremisesRent", v)} />
        <Field label="Business repairs and maintenance" value={form.businessRepairsMaintenance} onChange={(v) => update("businessRepairsMaintenance", v)} />
        <Field label="Employee remuneration and benefits" value={form.businessEmployeeRemuneration} onChange={(v) => update("businessEmployeeRemuneration", v)} />
        <Field label="Bad debts" value={form.businessBadDebts} onChange={(v) => update("businessBadDebts", v)} />
        <Field label="Professional fees" value={form.businessProfessionalFees} onChange={(v) => update("businessProfessionalFees", v)} />
        <Field label="Rent Income" hint="Use the amount applicable to the assessment period" value={form.rentIncome} onChange={(v) => update("rentIncome", v)} />
        <Field label="Foreign Income" hint="Included provisionally; treaty and foreign-tax review may change the result" value={form.foreignIncome} onChange={(v) => update("foreignIncome", v)} />
        <Field label="Digital-asset gains" hint="Gains before attributable charges" value={form.digitalAssetGains} onChange={(v) => update("digitalAssetGains", v)} />
        <Field label="Digital-asset attributable charges" value={form.digitalAssetCharges} onChange={(v) => update("digitalAssetCharges", v)} />
        <Field label="Chargeable gains (disclose for review)" hint="Not included in this automated calculation yet" value={form.chargeableGains} onChange={(v) => update("chargeableGains", v)} />
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Benefits in Kind</GlossaryText></p>
        <Field label="Rent Paid by Employer" value={form.rentPaidByEmployer} onChange={(v) => update("rentPaidByEmployer", v)} />
        <Field label="Company Vehicle Cost" hint="Disclosed for review; statutory valuation is not automated" value={form.companyVehicleCost} onChange={(v) => update("companyVehicleCost", v)} />
      </div>

      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Deductions</GlossaryText></p>
        <Field label="PAYE already suffered" hint="Enter PAYE already deducted by your employer; keep payslip evidence" value={form.payeAlreadySuffered} onChange={(v) => update("payeAlreadySuffered", v)} />
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
        <label htmlFor="tax-calculator-life-insurance-withdrawn" className="block text-xs font-semibold">Premium withdrawn?</label>
        <select id="tax-calculator-life-insurance-withdrawn" aria-label="Life-insurance premium withdrawn" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.lifeInsurancePremiumWithdrawn ?? ""} onChange={(event) => update("lifeInsurancePremiumWithdrawn", event.target.value)}>
          <option value="">Not confirmed</option><option value="no">No</option><option value="yes">Yes</option>
        </select>
        <Field label="Insurance or annuity beneficiary" hint="Record the beneficiary for professional review" value={form.lifeInsuranceBeneficiary ?? ""} onChange={(v) => update("lifeInsuranceBeneficiary", v)} />
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
        <p className="text-[10px] text-muted-foreground">Enter only the rent attributable to this assessment period. Cross-year and shared-tenancy facts generate a review note rather than blocking the estimate.</p>
      </div>

      <Button type="submit" className="w-full gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
        <Calculator className="w-4 h-4" /> Calculate 2026 estimate
      </Button>

      {estimateWarnings.length > 0 && <div role="alert" aria-live="polite" className="rounded-xl border border-warning bg-warning/10 p-4 text-sm">
        <p className="font-semibold">Review notes</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">{estimateWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
      </div>}

      {/* Results */}
      {result && result.reportedIncome > 0 && (
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

          {result.excludedInvestmentIncome > 0 && <p className="text-[10px] opacity-80">{fmtN(result.excludedInvestmentIncome)} of disclosed investment income is shown separately and excluded from this estimate where final withholding tax applies.</p>}
          {result.disclosedUnclassifiedIncome > 0 && <p className="text-[10px] opacity-80">{fmtN(result.disclosedUnclassifiedIncome)} of disclosed income needs professional classification before relying on this numeric estimate.</p>}

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
            <div className="flex justify-between text-[11px]">
              <span className="opacity-70"><GlossaryText>PAYE already suffered</GlossaryText></span>
              <span className="font-semibold">{fmtN(result.payeCredit)}</span>
            </div>
          </div>

          <div className="bg-background/20 rounded-xl p-4 text-center">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold"><GlossaryText>Estimated balance after PAYE credit</GlossaryText></p>
            <p className="font-display font-bold text-2xl mt-1">{fmtN(result.estimatedBalanceAfterCredits)}</p>
            <p className="text-[10px] opacity-70 mt-0.5"><GlossaryText>Effective rate</GlossaryText>: {result.effectiveRate.toFixed(1)}%</p>
          </div>

          <p className="text-[9px] opacity-60 text-center">
            This is an indicative calculation, not a government assessment or filing. Confirm deductions, PAYE records, withholding-tax treatment and any review notes with a qualified tax professional.
          </p>
        </motion.div>
      )}

      {result && result.reportedIncome > 0 && (
        <Button
          type="button"
          onClick={() => navigate("/declare")}
          variant="outline"
          className="w-full gap-2"
        >
          Continue tax preparation <ArrowRight className="w-4 h-4" />
        </Button>
      )}
      {result && result.reportedIncome > 0 && isFilingLaunchPhase && (
        <Button asChild variant="outline" className="w-full gap-2">
          <Link to={publicFilingPath}>Join the filing waitlist <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      )}
      </form>
    </div>
    {isFilingLaunchPhase && <PublicFooter />}
    </div>
  );
};

export default TaxCalculator;
