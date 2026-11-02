import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Calculator, ChevronDown, Info } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import { formatMoneyInput } from "@/lib/money-input";
import { calculatePayeEstimate, type PayeCalculationResult, type PayeCalculatorInput } from "@/lib/paye-calculator";
import { setPageMetadata } from "@/lib/seo";

const emptyInput: PayeCalculatorInput = {
  monthlyGrossSalary: "",
  monthlyCommissions: "",
  monthlyBonuses: "",
  monthlyAllowances: "",
  monthlyPension: "",
  monthlyNhf: "",
  monthlyNhis: "",
  annualRentPaid: "",
  lifeInsurancePremium: "",
  monthlyPayeAlreadySuffered: "",
};

const money = (value: number) => `₦${Math.round(value).toLocaleString("en-NG")}`;

type PayMode = "simple" | "itemised";
type EmploymentContext = "employee" | "contractor" | "unsure";
type DeductionKey = "pension" | "nhf" | "nhis" | "paye" | "rent" | "lifeInsurance";

const deductionDefaults: Record<DeductionKey, boolean> = {
  pension: false,
  nhf: false,
  nhis: false,
  paye: false,
  rent: false,
  lifeInsurance: false,
};

const Field = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const id = `paye-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#12352f]">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
        <Input
          id={id}
          aria-label={label}
          inputMode="decimal"
          value={value}
          placeholder="0"
          className="pl-8"
          onChange={(event) => onChange(formatMoneyInput(event.target.value))}
        />
      </div>
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
};

const ToggleRow = ({
  label,
  hint,
  switchLabel,
  checked,
  onCheckedChange,
  children,
}: {
  label: string;
  hint: string;
  switchLabel: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: ReactNode;
}) => (
  <div className="rounded-xl border border-[#e4ebe7] p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-[#12352f]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
      <Switch aria-label={switchLabel} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
    {checked && <div className="mt-4">{children}</div>}
  </div>
);

const PayeCalculator = () => {
  const [input, setInput] = useState<PayeCalculatorInput>(emptyInput);
  const [result, setResult] = useState<PayeCalculationResult | null>(null);
  const [warnings, setWarnings] = useState<readonly string[]>([]);
  const [payMode, setPayMode] = useState<PayMode>("simple");
  const [employmentContext, setEmploymentContext] = useState<EmploymentContext>("employee");
  const [deductionsOpen, setDeductionsOpen] = useState(false);
  const [enabledDeductions, setEnabledDeductions] = useState(deductionDefaults);

  const calculationInput = useMemo<PayeCalculatorInput>(() => ({
    ...input,
    monthlyCommissions: payMode === "itemised" ? input.monthlyCommissions : "",
    monthlyBonuses: payMode === "itemised" ? input.monthlyBonuses : "",
    monthlyAllowances: payMode === "itemised" ? input.monthlyAllowances : "",
    monthlyPension: enabledDeductions.pension ? input.monthlyPension : "",
    monthlyNhf: enabledDeductions.nhf ? input.monthlyNhf : "",
    monthlyNhis: enabledDeductions.nhis ? input.monthlyNhis : "",
    monthlyPayeAlreadySuffered: enabledDeductions.paye ? input.monthlyPayeAlreadySuffered : "",
    annualRentPaid: enabledDeductions.rent ? input.annualRentPaid : "",
    lifeInsurancePremium: enabledDeductions.lifeInsurance ? input.lifeInsurancePremium : "",
  }), [enabledDeductions, input, payMode]);

  useEffect(() => {
    setPageMetadata({
      title: "Nigeria PAYE Calculator 2026 | FileSmart",
      description: "Estimate your 2026 PAYE and take-home pay from monthly employment income using FileSmart's Nigeria Tax Act 2025 calculator.",
      path: "/paye-calculator",
    });
  }, []);

  useEffect(() => {
    const hasIncome = [calculationInput.monthlyGrossSalary, calculationInput.monthlyCommissions, calculationInput.monthlyBonuses, calculationInput.monthlyAllowances].some((value) => value.trim());

    if (!hasIncome) {
      setResult(null);
      setWarnings([]);
      return;
    }

    try {
      const estimate = calculatePayeEstimate(calculationInput);
      setResult(estimate);
      setWarnings(estimate.warnings);
    } catch (error) {
      setResult(null);
      setWarnings(error instanceof Error ? [error.message] : ["The estimate is unavailable until the amounts are corrected."]);
    }
  }, [calculationInput]);

  const update = (key: keyof PayeCalculatorInput, value: string) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const estimate = calculatePayeEstimate(calculationInput);
      setResult(estimate);
      setWarnings(estimate.warnings);
    } catch (error) {
      setResult(null);
      setWarnings(error instanceof Error ? [error.message] : ["The estimate is unavailable until the amounts are corrected."]);
    }
  };

  const toggleDeduction = (key: DeductionKey, checked: boolean) => {
    setEnabledDeductions((current) => ({ ...current, [key]: checked }));
  };

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
      <PublicNav />
      <main>
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c77b12]">Employee tax planning</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[#12352f] sm:text-5xl">PAYE calculator</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#55736d] sm:text-lg">See an indicative 2026 PAYE estimate and take-home pay from your monthly employment income. Results update as you enter your details.</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55736d]">This calculator is for planning only and does not submit a return or send your income to a tax authority.</p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-start">
            <form onSubmit={handleSubmit} aria-label="2026 PAYE calculator" className="space-y-5">
              <div className="rounded-2xl border border-[#d9e2dd] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-3 border-b border-[#e4ebe7] pb-5">
                  <div className="rounded-full bg-[#e9f2ed] p-2 text-[#19704e]"><Calculator className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h2 className="font-display text-xl font-bold">Your monthly income</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">Start with gross monthly pay before deductions.</p>
                  </div>
                </div>
                <div className="mt-6">
                  <fieldset>
                    <legend className="sr-only">How do you want to enter your pay?</legend>
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Pay entry mode">
                      <label className={`cursor-pointer rounded-xl border p-4 transition-colors ${payMode === "simple" ? "border-[#12352f] bg-[#f1f7f3]" : "border-[#e4ebe7]"}`}>
                        <input aria-label="Simple gross pay" className="sr-only" type="radio" name="pay-mode" value="simple" checked={payMode === "simple"} onChange={() => setPayMode("simple")} />
                        <span className="block font-semibold">Simple gross pay</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">Enter one monthly gross figure.</span>
                      </label>
                      <label className={`cursor-pointer rounded-xl border p-4 transition-colors ${payMode === "itemised" ? "border-[#12352f] bg-[#f1f7f3]" : "border-[#e4ebe7]"}`}>
                        <input aria-label="Itemise my pay" className="sr-only" type="radio" name="pay-mode" value="itemised" checked={payMode === "itemised"} onChange={() => setPayMode("itemised")} />
                        <span className="block font-semibold">Itemise my pay</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">Break salary, commissions, bonuses, and allowances out.</span>
                      </label>
                    </div>
                  </fieldset>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field label={payMode === "simple" ? "Monthly gross pay" : "Monthly gross salary"} hint="Use the gross amount before deductions." value={input.monthlyGrossSalary} onChange={(value) => update("monthlyGrossSalary", value)} />
                    {payMode === "itemised" && <>
                      <Field label="Monthly commissions" value={input.monthlyCommissions} onChange={(value) => update("monthlyCommissions", value)} />
                      <Field label="Monthly bonuses" value={input.monthlyBonuses} onChange={(value) => update("monthlyBonuses", value)} />
                      <Field label="Monthly allowances" hint="Include taxable allowances paid regularly." value={input.monthlyAllowances} onChange={(value) => update("monthlyAllowances", value)} />
                    </>}
                  </div>

                  <div className="mt-6 border-t border-[#e4ebe7] pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">Employment context</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Changes the guidance shown, not the baseline calculation.</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2026 only</span>
                    </div>
                    <fieldset className="mt-3">
                      <legend className="sr-only">Employment context</legend>
                      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Employment context">
                        {([
                          ["employee", "Employee on PAYE"],
                          ["contractor", "Contractor or temporary worker"],
                          ["unsure", "Not sure"],
                        ] as const).map(([value, label]) => (
                          <label key={value} className={`cursor-pointer rounded-xl border p-3 text-sm transition-colors ${employmentContext === value ? "border-[#12352f] bg-[#f1f7f3]" : "border-[#e4ebe7]"}`}>
                            <input aria-label={label} className="sr-only" type="radio" name="employment-context" value={value} checked={employmentContext === value} onChange={() => setEmploymentContext(value)} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d9e2dd] bg-white p-5 shadow-sm sm:p-7">
                <button type="button" className="flex w-full items-center justify-between gap-4 text-left" aria-expanded={deductionsOpen} onClick={() => setDeductionsOpen((open) => !open)}>
                  <span className="flex items-start gap-3">
                    <span className="rounded-full bg-[#fff3dc] p-2 text-[#b46c0b]"><Info className="h-5 w-5" aria-hidden="true" /></span>
                    <span><span className="block font-display text-xl font-bold">Adjust deductions</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">Optional. Use actual amounts from your payslip or records.</span></span>
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${deductionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {deductionsOpen && <div className="mt-6 space-y-3" aria-label="Optional deductions">
                  <p className="text-xs leading-5 text-muted-foreground">FileSmart does not assume contribution rates. Enable only items you can support with your payslip, agreement, receipt, or other records.</p>
                  <ToggleRow label="Pension contribution" hint="Enter the actual employee contribution shown on your payslip." switchLabel="Include pension contribution" checked={enabledDeductions.pension} onCheckedChange={(checked) => toggleDeduction("pension", checked)}><Field label="Monthly pension contribution" value={input.monthlyPension} onChange={(value) => update("monthlyPension", value)} /></ToggleRow>
                  <ToggleRow label="NHF contribution" hint="Enter the actual amount shown in your records." switchLabel="Include NHF contribution" checked={enabledDeductions.nhf} onCheckedChange={(checked) => toggleDeduction("nhf", checked)}><Field label="Monthly NHF contribution" value={input.monthlyNhf} onChange={(value) => update("monthlyNhf", value)} /></ToggleRow>
                  <ToggleRow label="NHIS contribution" hint="Enter the actual amount shown in your records." switchLabel="Include NHIS contribution" checked={enabledDeductions.nhis} onCheckedChange={(checked) => toggleDeduction("nhis", checked)}><Field label="Monthly NHIS contribution" value={input.monthlyNhis} onChange={(value) => update("monthlyNhis", value)} /></ToggleRow>
                  <ToggleRow label="PAYE already suffered" hint="This is treated as a credit, not an extra deduction." switchLabel="Include PAYE already suffered" checked={enabledDeductions.paye} onCheckedChange={(checked) => toggleDeduction("paye", checked)}><Field label="Monthly PAYE already suffered" hint="Keep payslip evidence; this is shown as a credit." value={input.monthlyPayeAlreadySuffered} onChange={(value) => update("monthlyPayeAlreadySuffered", value)} /></ToggleRow>
                  <ToggleRow label="Rent relief" hint="Enter qualifying annual rent. Relief is calculated at 20%, capped at ₦500,000." switchLabel="Include rent relief" checked={enabledDeductions.rent} onCheckedChange={(checked) => toggleDeduction("rent", checked)}><Field label="Annual rent paid" hint="Keep your tenancy agreement and rent receipt. Use the amount for the period under review." value={input.annualRentPaid} onChange={(value) => update("annualRentPaid", value)} /></ToggleRow>
                  <ToggleRow label="Life-insurance or deferred-annuity premium" hint="Use the qualifying preceding-year amount and retain evidence." switchLabel="Include life-insurance premium" checked={enabledDeductions.lifeInsurance} onCheckedChange={(checked) => toggleDeduction("lifeInsurance", checked)}><Field label="Qualifying life-insurance premium" hint="Keep the contract and payment statement." value={input.lifeInsurancePremium} onChange={(value) => update("lifeInsurancePremium", value)} /></ToggleRow>
                </div>}
              </div>

              <Button type="submit" className="w-full gap-2 bg-[#12352f] text-white hover:bg-[#0d2924]">Calculate 2026 PAYE estimate <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
              {warnings.length > 0 && <div role="alert" className="rounded-xl border border-[#e4b45c] bg-[#fff8e9] p-4 text-sm text-[#6d4a13]"><p className="font-semibold">Review notes</p><ul className="mt-2 list-disc space-y-1 pl-5">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
            </form>

            <aside className="lg:sticky lg:top-6" aria-label="PAYE calculation result">
              <div className="rounded-2xl border border-[#d9e2dd] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-[#e4ebe7] pb-5">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c77b12]">2026 tax year</p><h2 className="mt-1 font-display text-2xl font-bold">Your result</h2></div>
                  <span className="text-xs text-muted-foreground">Updates live</span>
                </div>

                {result ? (
                  <div role="status" aria-live="polite" className="mt-6 space-y-5">
                    <div className="rounded-2xl bg-[#e9f2ed] p-5"><p className="text-sm text-[#55736d]">Annual PAYE estimate</p><p className="mt-1 font-display text-4xl font-bold text-[#12352f]">{money(result.annualPaye)}</p><p className="mt-2 text-sm text-[#55736d]">Monthly equivalent: <strong>{money(result.monthlyPaye)}</strong></p></div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><div className="rounded-xl border border-[#e4ebe7] p-4"><p className="text-xs text-muted-foreground">Estimated monthly take-home</p><p className="mt-1 text-xl font-bold">{money(result.estimatedMonthlyTakeHome)}</p></div><div className="rounded-xl border border-[#e4ebe7] p-4"><p className="text-xs text-muted-foreground">Effective rate</p><p className="mt-1 text-xl font-bold">{result.effectiveRate.toFixed(1)}%</p></div></div>
                    <div className="rounded-xl border border-[#e4ebe7] p-4"><div className="flex justify-between gap-4 text-sm"><span>Annual gross income</span><strong>{money(result.annualGrossIncome)}</strong></div><div className="mt-2 flex justify-between gap-4 text-sm"><span>Eligible deductions</span><strong>{money(result.annualDeductions)}</strong></div><div className="mt-2 flex justify-between gap-4 text-sm"><span>PAYE credit</span><strong>{money(result.annualPayeCredit)}</strong></div><div className="mt-3 border-t border-[#e4ebe7] pt-3 flex justify-between gap-4 text-sm font-semibold"><span>Balance after PAYE credit</span><strong>{money(result.estimatedBalanceAfterCredits)}</strong></div></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Band breakdown</p><div className="mt-3 space-y-2">{result.bands.filter((band) => band.income > 0).map((band) => <div key={band.range} className="flex justify-between gap-4 text-sm"><span>{band.range} at {(band.rate * 100).toFixed(0)}%</span><strong>{money(band.tax)}</strong></div>)}</div></div>
                    <div className="rounded-xl border border-[#e4ebe7] bg-[#fbfcfa] p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Assumptions used</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground"><li>Tax year: 2026</li><li>Documented deductions entered above only</li><li>Employment context: {employmentContext === "employee" ? "Employee on PAYE" : employmentContext === "contractor" ? "Contractor or temporary worker" : "Not sure"}</li></ul></div>
                    <p className="text-xs leading-5 text-muted-foreground">This is an indicative estimate, not a final assessment or filing. Confirm your payslip, deductions, withholding credits, residency and any special facts with a qualified tax professional.</p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-[#cbdad2] bg-[#f8fbf9] p-6 text-sm text-muted-foreground"><p className="font-semibold text-[#12352f]">Your PAYE estimate will appear here</p><p className="mt-2 leading-6">Enter your monthly gross salary or other employment income to see the 2026 result update automatically.</p></div>
                )}

                <div className="mt-6 space-y-3 border-t border-[#e4ebe7] pt-5"><Link className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#b9d2c5] px-4 text-sm font-semibold text-[#12352f] hover:bg-[#f1f7f3]" to="/filing-waitlist">Join the filing waitlist <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link className="inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-[#19704e] hover:text-[#12352f]" to="/learn">Explore tax education <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default PayeCalculator;
