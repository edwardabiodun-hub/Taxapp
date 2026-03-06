import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NigeriaDeclarationForm } from "@/types/declaration";

interface BenefitsStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
}

const Field = ({ label, hint, value, onChange, badge }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; badge?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <Label className="text-xs font-semibold">{label}</Label>
      {badge && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
          badge === "Exempt" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
        }`}>
          {badge}
        </span>
      )}
    </div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
      <Input className="pl-8" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)} />
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

const BenefitsStep = ({ form, update }: BenefitsStepProps) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-display font-bold text-foreground text-sm">Benefits in Kind</h3>
      <p className="text-[11px] text-muted-foreground">Housing, domestic staff & company vehicles</p>
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Housing</p>
      <Field label="Rent Paid by You" badge="Exempt" hint="Name and address of premises owner" value={form.rentPaidBySelf} onChange={(v) => update("rentPaidBySelf", v)} />
      <TextField label="Premises Owner Address" hint="Address of premises owner" value={form.rentPaidBySelfAddress} onChange={(v) => update("rentPaidBySelfAddress", v)} />
      <Field label="Rent Paid by Employer" badge="Taxable" hint="Employer-provided housing" value={form.rentPaidByEmployer} onChange={(v) => update("rentPaidByEmployer", v)} />
      <TextField label="Employer Name & Address" hint="Name and address of employer" value={form.rentPaidByEmployerName} onChange={(v) => update("rentPaidByEmployerName", v)} />
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Domestic Staff</p>
      <Field label="Paid by You" badge="Exempt" hint="Names, addresses and amounts" value={form.domesticStaffBySelf} onChange={(v) => update("domesticStaffBySelf", v)} />
      <Field label="Paid by Employer" badge="Taxable" hint="Names, addresses and amounts" value={form.domesticStaffByEmployer} onChange={(v) => update("domesticStaffByEmployer", v)} />
    </div>

    <div className="space-y-3 bg-card rounded-xl p-4 shadow-card">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Company Vehicle</p>
      <Field label="Vehicle Cost" badge="Taxable" hint="Taxable at percentage cost per annum (e.g. 10%)" value={form.companyVehicleCost} onChange={(v) => update("companyVehicleCost", v)} />
      <TextField label="Vehicle Details" hint="Date of purchase, brand, model, year" value={form.companyVehicleDetails} onChange={(v) => update("companyVehicleDetails", v)} />
    </div>
  </div>
);

export default BenefitsStep;
