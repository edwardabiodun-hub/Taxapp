import { FileText, Paperclip, Calculator } from "lucide-react";
import { stateName, type NigeriaDeclarationForm } from "@/types/declaration";
import type { UploadedDoc } from "./DocumentsStep";
import { calculateStateTax } from "@/lib/tax/state-tax";

interface ReviewStepProps {
  form: NigeriaDeclarationForm;
  documents?: UploadedDoc[];
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

const ReviewStep = ({ form, documents }: ReviewStepProps) => {
  const tax = calculateStateTax(form, form.state);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm">Review & Submit</h3>
        <p className="text-[11px] text-muted-foreground">Please review all information before submitting</p>
      </div>

      {/* Tax Calculation Card */}
      {tax.grossIncome > 0 && (
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
              <p className="text-[10px] opacity-70">Deductions (incl. CRA)</p>
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
            <div className="flex justify-between text-[11px]">
              <span className="opacity-70">Minimum Tax (1%)</span>
              <span className="font-semibold">{fmtN(tax.minimumTax)}</span>
            </div>
          </div>

          <div className="bg-background/20 rounded-xl p-4 text-center">
            <p className="text-[10px] opacity-70 uppercase tracking-wider font-semibold">Estimated Tax Payable</p>
            <p className="font-display font-bold text-2xl mt-1">{fmtN(tax.finalTax)}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Effective rate: {tax.effectiveRate.toFixed(1)}%</p>
          </div>

          <div className="bg-background/15 border border-primary-foreground/20 rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-semibold flex items-center gap-1.5">
              ⚠️ Disclaimer
            </p>
            <p className="text-[10px] opacity-80 leading-relaxed">
              This tax computation is an <strong>estimate only</strong> and is provided for informational purposes. 
              The final tax liability is subject to assessment, verification, and approval by the Federal Inland Revenue Service (FIRS) 
              or the relevant State Internal Revenue Service (SIRS). Actual amounts may vary based on additional reviews, 
              audits, or adjustments by the tax authorities. This does not constitute professional tax advice.
            </p>
          </div>
        </div>
      )}

      {/* Summary details */}
      <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
        <Section title="General">
          <SummaryRow label="Tax Year" value={form.taxYear} />
          <SummaryRow label="Country" value="Nigeria 🇳🇬" />
          <SummaryRow label="State" value={stateName(form.state)} />
        </Section>

        <div className="border-t border-border" />

        <Section title="Earned Income">
          <SummaryRow label="Annual Salary" value={fmt(form.annualSalary)} />
          <SummaryRow label="Commissions & Bonuses" value={fmt(form.commissions)} />
          <SummaryRow label="Allowances" value={fmt(form.allowances)} />
          <SummaryRow label="Business Income (Net)" value={fmt(form.businessIncome)} />
          <SummaryRow label="Pension Received" value={fmt(form.pensionReceived)} badge="Exempt" />
          <SummaryRow label="Annuity Insurance" value={fmt(form.annuityInsurance)} />
          <SummaryRow label="Gratuities" value={fmt(form.gratuities)} badge="Exempt" />
          <SummaryRow label="Foreign Income" value={fmt(form.foreignIncome)} />
        </Section>

        <div className="border-t border-border" />

        <Section title="Investment Income">
          <SummaryRow label="Nigerian Dividends" value={fmt(form.nigerianDividends)} badge="Exempt" />
          <SummaryRow label="Other Dividends" value={fmt(form.otherDividends)} badge="Exempt" />
          <SummaryRow label="Interest Income" value={fmt(form.interestIncome)} badge="Exempt" />
          <SummaryRow label="Rent Income (Net)" value={fmt(form.rentIncome)} />
          <SummaryRow label="Other Profits" value={fmt(form.otherInvestmentIncome)} />
        </Section>

        <div className="border-t border-border" />

        <Section title="Benefits in Kind">
          <SummaryRow label="Rent (Self)" value={fmt(form.rentPaidBySelf)} badge="Exempt" />
          <SummaryRow label="Rent (Employer)" value={fmt(form.rentPaidByEmployer)} />
          <SummaryRow label="Domestic Staff (Self)" value={fmt(form.domesticStaffBySelf)} badge="Exempt" />
          <SummaryRow label="Domestic Staff (Employer)" value={fmt(form.domesticStaffByEmployer)} />
          <SummaryRow label="Company Vehicle" value={fmt(form.companyVehicleCost)} />
        </Section>

        <div className="border-t border-border" />

        <Section title="Deductions">
          <SummaryRow label="Employee Pension" value={fmt(form.employeePension)} />
          <SummaryRow label="Rent Relief" value={fmt(form.annualRentPaid)} />
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

      <p className="text-[10px] text-muted-foreground text-center">
        By submitting, you confirm all information is accurate and complete per the Personal Income Tax Act 2025.
      </p>
    </div>
  );
};

export default ReviewStep;
