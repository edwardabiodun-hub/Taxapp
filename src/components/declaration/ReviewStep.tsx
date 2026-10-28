import { FileText, Paperclip, Calculator } from "lucide-react";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import type { UploadedDoc } from "./DocumentsStep";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { CalculationResult } from "@/lib/calculation-service";
import { NairaText } from "@/components/ui/NairaText";
import { calculateRentRelief } from "@/lib/rent-relief";

interface ReviewStepProps {
  form: NigeriaDeclarationForm;
  documents?: UploadedDoc[];
  capability?: JurisdictionCapability;
  calculation: CalculationResult;
}

const SummaryRow = ({ label, value, badge }: { label: string; value: string; badge?: string }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      {badge && (
        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
          badge === "Exempt" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
        }`}>
          {badge}
        </span>
      )}
    </div>
    <span className="font-medium text-foreground text-xs">{value || "—"}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{title}</p>
    {children}
  </div>
);

const fmt = (v: string) => v ? `₦${v}` : "—";
const fmtN = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const reviewValue = (value: string | undefined) => {
  const normalized = value?.trim() ?? "";
  return ({
    yes: "Yes",
    no: "No",
    full_year: "One full year",
    part_year: "Part year",
    multiple_employers: "Multiple employers",
  }[normalized] ?? normalized) || "Not confirmed";
};

const ReviewStep = ({ form, documents, capability, calculation }: ReviewStepProps) => {
  const tax = calculation.tax;
  const annualRent = form.annualRentPaid ?? "";
  const rentReliefDisplay = !annualRent.trim()
    ? "—"
    : /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(annualRent.trim())
      ? fmt(calculateRentRelief(Number(annualRent.replace(/,/g, ""))).relief.toLocaleString("en-NG"))
      : "Needs review";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm">Review preparation</h3>
        <p className="text-[11px] text-muted-foreground">Review the local preparation before saving or exporting it.</p>
      </div>

      {/* Tax Calculation Card */}
      {tax && (
        <div className="gradient-hero rounded-2xl p-5 text-primary-foreground shadow-elevated space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <h4 className="font-display font-bold text-sm">Tax Liability Estimate</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70">Gross Income</p>
              <p className="font-display font-bold text-lg">{fmtN(tax.grossIncome)}</p>
            </div>
            <div className="bg-background/10 rounded-xl p-3">
              <p className="text-[10px] opacity-70">Eligible deductions and reliefs</p>
              <p className="font-display font-bold text-lg">{fmtN(tax.totalDeductions)}</p>
            </div>
          </div>

          <div className="bg-background/10 rounded-xl p-3">
            <p className="text-[10px] opacity-70">Taxable Income</p>
            <p className="font-display font-bold text-xl">{fmtN(tax.taxableIncome)}</p>
          </div>

          {/* Band breakdown */}
          <div className="space-y-1.5">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">Tax Band Breakdown</p>
            {tax.bands.map((band, i) => (
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
              <span className="font-semibold">{fmtN(tax.computedTax)}</span>
            </div>
          </div>

          <div className="bg-background/20 rounded-xl p-4 text-center">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">Estimated tax before credits</p>
            <p className="font-display font-bold text-2xl mt-1">{fmtN(tax.finalTax)}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Effective rate: {tax.effectiveRate.toFixed(1)}%</p>
          </div>

          <div className="bg-background/15 border border-primary-foreground/20 rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-semibold flex items-center gap-1.5">
              ⚠️ Disclaimer
            </p>
            <p className="text-[10px] opacity-80 leading-relaxed">
              This tax computation is an <strong>estimate only</strong> and is provided for informational purposes. 
              Based on the Nigeria Tax Act 2025 for tax year 2026. PAYE and withholding-tax credits are not included. Actual liability depends on your documents and the relevant tax authority. This is not professional tax advice.
            </p>
          </div>
        </div>
      )}

      {/* Summary details */}
      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <Section title="General">
          <SummaryRow label="Tax Year" value={form.taxYear} />
          <SummaryRow label="Jurisdiction" value={capability?.name || "Not selected"} />
          <SummaryRow label="Readiness" value={capability?.primaryReadiness || "Not yet supported"} />
          <SummaryRow label="Calculation" value={calculation?.label || "Not filing-ready"} />
          <SummaryRow label="Rule profile" value={calculation?.ruleProfile.profileId || "Not configured"} />
          <SummaryRow label="Rule version" value={calculation?.ruleProfileVersion || "Not configured"} />
          <SummaryRow label="Rule source" value={calculation?.source || "Not configured"} />
          <SummaryRow label="Rule reviewed" value={calculation?.verifiedAt || "Not reviewed"} />
        </Section>

        {calculation && calculation.missingInputWarnings.length > 0 && (
          <>
            <div className="border-t border-border" />
            <Section title="Unresolved items">
              <ul className="list-disc space-y-1 pl-4 text-xs text-warning">
                {calculation.missingInputWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </Section>
          </>
        )}

        <div className="border-t border-border" />

        <Section title="Earned Income">
          <SummaryRow label="Annual Salary" value={fmt(form.annualSalary)} />
          <SummaryRow label="Commissions" value={fmt(form.commissions)} />
          <SummaryRow label="Bonuses" value={fmt(form.bonuses)} />
          <SummaryRow label="Allowances" value={fmt(form.allowances)} />
          <SummaryRow label="Employment period" value={reviewValue(form.employmentPeriod)} />
          <SummaryRow label="Business Income (Net)" value={fmt(form.businessIncome)} />
          <SummaryRow label="Pension Received" value={fmt(form.pensionReceived)} />
          <SummaryRow label="Annuity Insurance" value={fmt(form.annuityInsurance)} />
          <SummaryRow label="Gratuities" value={fmt(form.gratuities)} />
          <SummaryRow label="Foreign Income" value={fmt(form.foreignIncome)} />
        </Section>

        <div className="border-t border-border" />

        <Section title="Investment Income">
          <SummaryRow label="Nigerian Dividends" value={fmt(form.nigerianDividends)} />
          <SummaryRow label="Other Dividends" value={fmt(form.otherDividends)} />
          <SummaryRow label="Interest Income" value={fmt(form.interestIncome)} />
          <SummaryRow label="Rent Income (Net)" value={fmt(form.rentIncome)} />
          <SummaryRow label="Other Profits" value={fmt(form.otherInvestmentIncome)} />
        </Section>

        <div className="border-t border-border" />

        <Section title="Benefits in Kind">
          <SummaryRow label="Rent (Self)" value={fmt(form.rentPaidBySelf)} />
          <SummaryRow label="Rent (Employer)" value={fmt(form.rentPaidByEmployer)} />
          <SummaryRow label="Domestic Staff (Self)" value={fmt(form.domesticStaffBySelf)} />
          <SummaryRow label="Domestic Staff (Employer)" value={fmt(form.domesticStaffByEmployer)} />
          <SummaryRow label="Company Vehicle" value={fmt(form.companyVehicleCost)} />
        </Section>

        <div className="border-t border-border" />

        <Section title="Deductions">
          <SummaryRow label="Employee Pension" value={fmt(form.employeePension)} />
          <SummaryRow label="National Housing Fund" value={fmt(form.nationalHousingFund)} />
          <SummaryRow label="National Health Insurance" value={fmt(form.nationalHealthInsurance)} />
          <SummaryRow label="Owner-occupied mortgage interest" value={fmt(form.mortgageInterest)} />
          <SummaryRow label="Mortgage principal residence" value={reviewValue(form.mortgagePrincipalResidence)} />
          <SummaryRow label="Qualifying life-insurance / deferred-annuity premiums" value={fmt(form.lifeInsurancePremium)} />
          <SummaryRow label="Life-insurance premium paid year" value={reviewValue(form.lifeInsurancePremiumPaidYear)} />
          <SummaryRow label="Annual Rent Paid" value={fmt(form.annualRentPaid)} />
          <SummaryRow label="Rent period" value={form.rentPeriodStart || form.rentPeriodEnd ? `${reviewValue(form.rentPeriodStart)} to ${reviewValue(form.rentPeriodEnd)}` : "Not confirmed"} />
          <SummaryRow label="Rent shared with others" value={reviewValue(form.rentSharedWithOthers)} />
          <SummaryRow label="Potential rent relief (subject to validation)" value={rentReliefDisplay} />
        </Section>

        {documents && documents.length > 0 && (
          <>
            <div className="border-t border-border" />
            <Section title={`Documents (${documents.length})`}>
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{doc.file.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                    {doc.category.replace("_", " ")}
                  </span>
                </div>
              ))}
            </Section>
          </>
        )}
        {(!documents || documents.length === 0) && (
          <>
            <div className="border-t border-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="text-xs">No documents attached</span>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        Saving creates a local preparation only. It does not file a tax return or confirm acceptance by an authority.
      </p>
    </div>
  );
};

export default ReviewStep;
