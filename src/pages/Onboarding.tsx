import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, User, Phone, MapPin, Calendar, Globe, Users, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { db } from "@/lib/local-db";
import { toast } from "@/hooks/use-toast";
import { africanCountries } from "@/types/declaration";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date | undefined;
  gender: string;
  countryOfBirth: string;
  nationality: string;
  country: string;
  taxId: string;
}

const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

const nationalities = [
  "Nigerian", "Kenyan", "Ghanaian", "South African", "Tanzanian",
  "Ugandan", "Rwandan", "Ethiopian", "Other",
];

const steps = [
  { title: "Personal Details", subtitle: "Let's get to know you" },
  { title: "Identity", subtitle: "Date of birth, gender & nationality" },
  { title: "Tax Information", subtitle: "Your tax residence & ID" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: undefined,
    gender: "",
    countryOfBirth: "",
    nationality: "",
    country: "",
    taxId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof ProfileForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (step === 0) {
      if (!form.name.trim()) errs.name = "Full name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Invalid email format";
      if (!form.phone.trim()) errs.phone = "Phone number is required";
    } else if (step === 1) {
      if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
      if (!form.gender) errs.gender = "Gender is required";
      if (!form.countryOfBirth) errs.countryOfBirth = "Country of birth is required";
      if (!form.nationality) errs.nationality = "Nationality is required";
    } else if (step === 2) {
      if (!form.country) errs.country = "Tax residence country is required";
      if (!form.taxId.trim()) errs.taxId = "Tax ID is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (step < steps.length - 1) setStep((s) => s + 1);
  };

  const prev = () => {
    setErrors({});
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    await db.profiles.put({
      id: `user-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth ? format(form.dateOfBirth, "yyyy-MM-dd") : "",
      gender: form.gender,
      countryOfBirth: form.countryOfBirth,
      nationality: form.nationality,
      country: form.country,
      taxId: form.taxId.trim(),
    });

    toast({ title: "Profile created!", description: "Welcome to TaxEase Africa" });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-hero px-6 pt-12 pb-8 text-primary-foreground safe-area-top">
        <p className="text-xs font-medium opacity-70 tracking-wider uppercase">Step {step + 1} of {steps.length}</p>
        <h1 className="font-display font-bold text-2xl mt-1">{steps[step].title}</h1>
        <p className="text-sm opacity-80 mt-1">{steps[step].subtitle}</p>

        {/* Progress bar */}
        <div className="flex gap-1.5 mt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full flex-1 transition-all duration-300",
                i <= step ? "bg-primary-foreground" : "bg-primary-foreground/25"
              )}
            />
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {step === 0 && (
              <>
                <Field label="Full Name" icon={User} error={errors.name}>
                  <Input
                    placeholder="e.g. Amara Okafor"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={cn(errors.name && "border-destructive")}
                  />
                </Field>
                <Field label="Email Address" icon={Globe} error={errors.email}>
                  <Input
                    type="email"
                    placeholder="amara@example.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={cn(errors.email && "border-destructive")}
                  />
                </Field>
                <Field label="Phone Number" icon={Phone} error={errors.phone}>
                  <Input
                    type="tel"
                    placeholder="+234 812 345 6789"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={cn(errors.phone && "border-destructive")}
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Date of Birth" icon={Calendar} error={errors.dateOfBirth}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.dateOfBirth && "text-muted-foreground",
                          errors.dateOfBirth && "border-destructive"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {form.dateOfBirth ? format(form.dateOfBirth, "dd MMM yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={form.dateOfBirth}
                        onSelect={(d) => update("dateOfBirth", d)}
                        disabled={(date) => date > new Date() || date < new Date("1920-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        captionLayout="dropdown-buttons"
                        fromYear={1920}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field label="Gender" icon={Users} error={errors.gender}>
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger className={cn(errors.gender && "border-destructive")}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Country of Birth" icon={MapPin} error={errors.countryOfBirth}>
                  <Select value={form.countryOfBirth} onValueChange={(v) => update("countryOfBirth", v)}>
                    <SelectTrigger className={cn(errors.countryOfBirth && "border-destructive")}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {africanCountries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Nationality" icon={Globe} error={errors.nationality}>
                  <Select value={form.nationality} onValueChange={(v) => update("nationality", v)}>
                    <SelectTrigger className={cn(errors.nationality && "border-destructive")}>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {nationalities.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Tax Residence Country" icon={MapPin} error={errors.country}>
                  <div className="grid grid-cols-2 gap-2">
                    {africanCountries.filter((c) => c.active).map((c) => (
                      <button
                        key={c.code}
                        onClick={() => update("country", c.code)}
                        className={cn(
                          "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left",
                          form.country === c.code
                            ? "border-primary bg-primary/5 shadow-card"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <span className="text-xl">{c.flag}</span>
                        <p className="text-xs font-semibold">{c.name}</p>
                        {form.country === c.code && (
                          <div className="ml-auto w-4 h-4 rounded-full gradient-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Tax Identification Number (TIN)" icon={Building2} error={errors.taxId}>
                  <Input
                    placeholder="e.g. A012345678Z"
                    value={form.taxId}
                    onChange={(e) => update("taxId", e.target.value)}
                    className={cn(errors.taxId && "border-destructive")}
                  />
                </Field>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-8 pt-2 max-w-lg mx-auto w-full safe-area-bottom">
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={prev} className="flex-1 gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={next} className="flex-1 gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 gap-2 gradient-accent text-accent-foreground border-0 hover:opacity-90">
              <Check className="w-4 h-4" /> Create Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, icon: Icon, error, children }: {
  label: string;
  icon: any;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
      <Icon className="w-4 h-4 text-primary" />
      {label} <span className="text-destructive">*</span>
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default Onboarding;
