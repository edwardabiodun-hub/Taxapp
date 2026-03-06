import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Building2, ChevronRight, LogOut, Lock, Calendar, Globe, Users, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountryTheme } from "@/contexts/CountryThemeContext";
import { africanCountries } from "@/types/declaration";
import { useProfile } from "@/hooks/use-local-data";
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

const Profile = () => {
  const { country, setCountry } = useCountryTheme();
  const selectedCountry = africanCountries.find((c) => c.code === country);
  const profile = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: "", email: "", phone: "",
    dateOfBirth: undefined, gender: "",
    countryOfBirth: "", nationality: "", taxId: "",
  });

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

  const handleSave = async () => {
    if (!profile) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
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

  const displayName = profile?.name || "Loading...";
  const displayEmail = profile?.email || "—";
  const displayPhone = profile?.phone || "—";
  const displayTaxId = profile?.taxId || "—";
  const birthCountry = africanCountries.find((c) => c.code === profile?.countryOfBirth);
  const displayDob = profile?.dateOfBirth
    ? format(new Date(profile.dateOfBirth), "dd MMM yyyy")
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-6 pb-28"
    >
      {/* Avatar Card */}
      <div className="gradient-hero rounded-2xl p-6 text-center text-primary-foreground shadow-elevated">
        <div className="w-20 h-20 rounded-full bg-background/20 mx-auto flex items-center justify-center mb-3">
          <User className="w-10 h-10" />
        </div>
        <h2 className="font-display font-bold text-xl">{displayName}</h2>
        <p className="text-sm opacity-80">{displayEmail}</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-background/15 rounded-full px-4 py-1.5">
          <span className="text-xs font-medium">Tax ID: {displayTaxId}</span>
        </div>
      </div>

      {/* Personal Info */}
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
                onClick={() => setEditing(false)}
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
            <EditField label="Full Name" icon={User}>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </EditField>
            <EditField label="Email" icon={Globe}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
              />
            </EditField>
            <EditField label="Phone" icon={Phone}>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </EditField>
            <EditField label="Date of Birth" icon={Calendar}>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm",
                    !form.dateOfBirth && "text-muted-foreground"
                  )}>
                    {form.dateOfBirth ? format(form.dateOfBirth, "dd MMM yyyy") : "Select date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={form.dateOfBirth}
                    onSelect={(d) => setForm({ ...form, dateOfBirth: d })}
                    captionLayout="dropdown-buttons"
                    fromYear={1930}
                    toYear={new Date().getFullYear() - 16}
                  />
                </PopoverContent>
              </Popover>
            </EditField>
            <EditField label="Gender" icon={Users}>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {genders.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </EditField>
            <EditField label="Country of Birth" icon={Globe}>
              <Select value={form.countryOfBirth} onValueChange={(v) => setForm({ ...form, countryOfBirth: v })}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {africanCountries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditField>
            <EditField label="Nationality" icon={Globe}>
              <Select value={form.nationality} onValueChange={(v) => setForm({ ...form, nationality: v })}>
                <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                <SelectContent>
                  {nationalities.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </EditField>
            <EditField label="Tax ID" icon={Building2}>
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="Tax ID number"
              />
            </EditField>
          </div>
        ) : (
          <>
            <InfoRow icon={Phone} label="Phone" value={displayPhone} />
            <InfoRow icon={Calendar} label="Date of Birth" value={displayDob} />
            <InfoRow icon={Users} label="Gender" value={profile?.gender || "—"} />
            <InfoRow
              icon={Globe}
              label="Country of Birth"
              value={birthCountry ? `${birthCountry.flag} ${birthCountry.name}` : profile?.countryOfBirth || "—"}
            />
            <InfoRow icon={Globe} label="Nationality" value={profile?.nationality || "—"} />
            <InfoRow icon={MapPin} label="Tax Residence" value={`${selectedCountry?.flag || ""} ${selectedCountry?.name || country}`} />
            <InfoRow icon={Building2} label="Tax ID" value={displayTaxId} />
          </>
        )}
      </div>

      {/* Country Selector */}
      <div className="bg-card rounded-xl shadow-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Tax Jurisdiction</p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Select your country to customize the app theme and tax rules
        </p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {africanCountries.map((c) => (
            <button
              key={c.code}
              disabled={!c.active}
              onClick={() => c.active && setCountry(c.code)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left",
                c.active && country === c.code
                  ? "border-primary bg-primary/5 shadow-card"
                  : c.active
                  ? "border-border bg-card hover:border-primary/40"
                  : "border-border/50 bg-muted/50 opacity-60 cursor-not-allowed"
              )}
            >
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-semibold truncate", !c.active && "text-muted-foreground")}>
                  {c.name}
                </p>
                {!c.active && (
                  <span className="text-[9px] text-muted-foreground">Coming soon</span>
                )}
              </div>
              {!c.active && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
              {c.active && country === c.code && (
                <div className="w-4 h-4 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="bg-card rounded-xl shadow-card divide-y divide-border">
        {[
          { icon: User, label: "Personal Details" },
          { icon: Building2, label: "Business Details" },
        ].map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
          >
            <item.icon className="w-5 h-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-card-foreground text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors">
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-semibold">Sign Out</span>
      </button>
    </motion.div>
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

const EditField = ({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Label>
    {children}
  </div>
);

export default Profile;
