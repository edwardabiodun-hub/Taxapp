import type { NigeriaDeclarationForm } from "@/types/declaration";

interface ReviewStepProps {
  form: NigeriaDeclarationForm;
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

const ReviewStep = ({ form }: ReviewStepProps) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-display font-bold text-foreground text-sm">Review & Submit</h3>
      <p className="text-[11px] text-muted-foreground">Please review all information before submitting</p>
    </div>

    <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
      <Section title="General">
        <SummaryRow label="Tax Year" value={form.taxYear} />
        <SummaryRow label="Country" value="Nigeria 🇳🇬" />
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
    </div>

    <p className="text-[10px] text-muted-foreground text-center">
      By submitting, you confirm all information is accurate and complete per the Personal Income Tax Act 2025.
    </p>
  </div>
);

export default ReviewStep;
