import { useState, useEffect } from "react";
import { User, Phone, MapPin, Building2, Calendar, Globe, Users, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { africanCountries } from "@/types/declaration";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { db } from "@/lib/local-db";
import { toast } from "@/hooks/use-toast";

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];
const nationalities = [
  "Nigerian", "Kenyan", "Ghanaian", "South African", "Tanzanian",
  "Ugandan", "Rwandan", "Ethiopian", "Other",
];

interface EditForm {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date | undefined;
  gender: string;
  countryOfBirth: string;
  nationality: string;
  taxId: string;
}

interface ProfileFormProps {
  profile: any;
  country: string;
}

const ProfileForm = ({ profile, country }: ProfileFormProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: "", email: "", phone: "",
    dateOfBirth: undefined, gender: "",
    countryOfBirth: "", nationality: "", taxId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
        gender: profile.gender || "",
        countryOfBirth: profile.countryOfBirth || "",
        nationality: profile.nationality || "",
        taxId: profile.taxId || "",
      });
    }
  }, [profile, editing]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Invalid email format";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (!form.gender) errs.gender = "Gender is required";
    if (!form.countryOfBirth) errs.countryOfBirth = "Country of birth is required";
    if (!form.nationality) errs.nationality = "Nationality is required";
    if (!form.taxId.trim()) errs.taxId = "Tax ID is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateField = (key: keyof EditForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!validateForm()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await db.profiles.update(profile.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth.toISOString() : undefined,
        gender: form.gender,
        countryOfBirth: form.countryOfBirth,
        nationality: form.nationality,
        taxId: form.taxId.trim(),
      });
      setEditing(false);
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedCountry = africanCountries.find((c) => c.code === country);
  const birthCountry = africanCountries.find((c) => c.code === profile?.countryOfBirth);
  const displayPhone = profile?.phone || "—";
  const displayTaxId = profile?.taxId || "—";
  const displayDob = profile?.dateOfBirth
    ? format(new Date(profile.dateOfBirth), "dd MMM yyyy")
    : "—";

  return (
    <div className="bg-card rounded-xl shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Personal Information</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing(false); setErrors({}); }}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-3">
              <Check className="w-3.5 h-3.5 mr-1" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-4 pt-1">
          <EditField label="Full Name" icon={User} error={errors.name} required>
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Full name" className={cn(errors.name && "border-destructive")} />
          </EditField>
          <EditField label="Email" icon={Globe} error={errors.email} required>
            <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Email address" className={cn(errors.email && "border-destructive")} />
          </EditField>
          <EditField label="Phone" icon={Phone} error={errors.phone} required>
            <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Phone number" className={cn(errors.phone && "border-destructive")} />
          </EditField>
          <EditField label="Date of Birth" icon={Calendar} error={errors.dateOfBirth} required>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm",
                  !form.dateOfBirth && "text-muted-foreground",
                  errors.dateOfBirth && "border-destructive"
                )}>
                  {form.dateOfBirth ? format(form.dateOfBirth, "dd MMM yyyy") : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={form.dateOfBirth} onSelect={(d) => updateField("dateOfBirth", d)} captionLayout="dropdown-buttons" fromYear={1930} toYear={new Date().getFullYear() - 16} />
              </PopoverContent>
            </Popover>
          </EditField>
          <EditField label="Gender" icon={Users} error={errors.gender} required>
            <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
              <SelectTrigger className={cn(errors.gender && "border-destructive")}><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>{genders.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </EditField>
          <EditField label="Country of Birth" icon={Globe} error={errors.countryOfBirth} required>
            <Select value={form.countryOfBirth} onValueChange={(v) => updateField("countryOfBirth", v)}>
              <SelectTrigger className={cn(errors.countryOfBirth && "border-destructive")}><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>{africanCountries.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </EditField>
          <EditField label="Nationality" icon={Globe} error={errors.nationality} required>
            <Select value={form.nationality} onValueChange={(v) => updateField("nationality", v)}>
              <SelectTrigger className={cn(errors.nationality && "border-destructive")}><SelectValue placeholder="Select nationality" /></SelectTrigger>
              <SelectContent>{nationalities.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </EditField>
          <EditField label="Tax ID" icon={Building2} error={errors.taxId} required>
            <Input value={form.taxId} onChange={(e) => updateField("taxId", e.target.value)} placeholder="Tax ID number" className={cn(errors.taxId && "border-destructive")} />
          </EditField>
        </div>
      ) : (
        <>
          <InfoRow icon={Phone} label="Phone" value={displayPhone} />
          <InfoRow icon={Calendar} label="Date of Birth" value={displayDob} />
          <InfoRow icon={Users} label="Gender" value={profile?.gender || "—"} />
          <InfoRow icon={Globe} label="Country of Birth" value={birthCountry ? `${birthCountry.flag} ${birthCountry.name}` : profile?.countryOfBirth || "—"} />
          <InfoRow icon={Globe} label="Nationality" value={profile?.nationality || "—"} />
          <InfoRow icon={MapPin} label="Tax Residence" value={`${selectedCountry?.flag || ""} ${selectedCountry?.name || country}`} />
          <InfoRow icon={Building2} label="Tax ID" value={displayTaxId} />
        </>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-card-foreground">{value}</p>
    </div>
  </div>
);

const EditField = ({ label, icon: Icon, error, required, children }: { label: string; icon: any; error?: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className={cn("flex items-center gap-1.5 text-xs", error ? "text-destructive" : "text-muted-foreground")}>
      <Icon className="w-3.5 h-3.5" />
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default ProfileForm;
