import { Input } from "@/components/ui/input";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import { GlossaryText } from "@/components/glossary/GlossaryText";
import { calculateRentRelief, RENT_RELIEF_CAP } from "@/lib/rent-relief";
import { NairaSymbol } from "@/components/ui/NairaText";

interface DeductionsStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
}

const DeductionsStep = ({ form, update }: DeductionsStepProps) => {
  const rentNum = parseFloat(form.annualRentPaid?.replace(/,/g, "") || "0");
  const rentCalculation = calculateRentRelief(rentNum);
  const rentRelief = rentNum > 0 ? rentCalculation.relief.toLocaleString() : "";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-foreground text-sm"><GlossaryText>Allowable Deductions</GlossaryText></h3>
        <p className="text-[11px] text-muted-foreground"><GlossaryText>Reduce your taxable income with eligible deductions</GlossaryText></p>
      </div>

      <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Employee Pension</GlossaryText></p>
        <div className="space-y-1.5">
          <div className="text-xs font-semibold"><GlossaryText>Pension Contribution</GlossaryText></div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
            <Input
              className="pl-8"
              placeholder="0.00"
              aria-label="Pension Contribution"
              value={form.employeePension}
              onChange={(e) => update("employeePension", e.target.value)}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            <GlossaryText>Enter only actual qualifying pension contributions supported by your records.</GlossaryText>
          </p>
        </div>
      </div>

      <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Other qualifying annual deductions</p>
        {([
          ["nationalHousingFund", "National Housing Fund"],
          ["nationalHealthInsurance", "National Health Insurance"],
          ["mortgageInterest", "Owner-occupied mortgage interest"],
          ["lifeInsurancePremium", "Qualifying life-insurance or deferred-annuity premiums"],
        ] as const).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <label htmlFor={key} className="text-xs font-semibold">{label}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"><NairaSymbol /></span>
              <Input id={key} aria-label={label} className="pl-8" placeholder="0.00" value={form[key] ?? ""} onChange={(event) => update(key, event.target.value)} />
            </div>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground">For life-insurance or deferred-annuity premiums, enter only an amount that qualifies for this assessment year; the Act refers to premiums paid in the preceding year. Confirm the applicable period and keep your policy and payment records.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="life-insurance-premium-paid-year" className="text-xs font-semibold">Life-insurance premium paid year</label>
            <select id="life-insurance-premium-paid-year" aria-label="Life-insurance premium paid year" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.lifeInsurancePremiumPaidYear ?? ""} onChange={(event) => update("lifeInsurancePremiumPaidYear", event.target.value)}>
              <option value="">Not confirmed</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="mortgage-principal-residence" className="text-xs font-semibold">Mortgage is for principal residence</label>
            <select id="mortgage-principal-residence" aria-label="Mortgage is for principal residence" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.mortgagePrincipalResidence ?? ""} onChange={(event) => update("mortgagePrincipalResidence", event.target.value)}>
              <option value="">Not confirmed</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Claim only amounts that meet the Nigeria Tax Act 2025 conditions and for which you have supporting documents. No amount is added automatically.</p>
      </div>

      <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"><GlossaryText>Rent Relief</GlossaryText></p>
        <div className="space-y-1.5">
          <div className="text-xs font-semibold"><GlossaryText>Annual Rent Paid</GlossaryText></div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
            <Input
              className="pl-8"
              placeholder="0.00"
              aria-label="Annual Rent Paid"
              value={form.annualRentPaid}
              onChange={(e) => update("annualRentPaid", e.target.value)}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            <GlossaryText>20% of qualifying annual rent paid, with relief capped at ₦500,000. Attach documentation.</GlossaryText>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="rent-period-start" className="text-xs font-semibold">Rent period start</label>
              <Input id="rent-period-start" aria-label="Rent period start" type="date" value={form.rentPeriodStart ?? ""} onChange={(event) => update("rentPeriodStart", event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rent-period-end" className="text-xs font-semibold">Rent period end</label>
              <Input id="rent-period-end" aria-label="Rent period end" type="date" value={form.rentPeriodEnd ?? ""} onChange={(event) => update("rentPeriodEnd", event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rent-shared-with-others" className="text-xs font-semibold">Rent shared with others</label>
            <select id="rent-shared-with-others" aria-label="Rent shared with others" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={form.rentSharedWithOthers ?? ""} onChange={(event) => update("rentSharedWithOthers", event.target.value)}>
              <option value="">Not confirmed</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <p className="text-[10px] text-muted-foreground">These facts are saved for review. A period crossing tax years or shared rent currently prevents a numeric estimate until the attributable amount is confirmed.</p>
          {rentRelief && (
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
              <span className="text-[10px] text-primary font-semibold">
                <GlossaryText>Relief</GlossaryText>: <NairaSymbol />{rentRelief} (20% of <NairaSymbol />{rentCalculation.annualRentPaid.toLocaleString()} annual rent, relief capped at <NairaSymbol />{RENT_RELIEF_CAP.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeductionsStep;
