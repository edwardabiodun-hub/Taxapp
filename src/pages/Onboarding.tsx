import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, User, Phone, MapPin, Calendar, Globe, Users, Building2, Check, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { db } from "@/lib/local-db";
import { signUp, type AuthResult } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { africanCountries } from "@/types/declaration";

const MIN_PASSWORD_LENGTH = 8;

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: Date | undefined;
  gender: string;
  countryOfBirth: string;
  nationality: string;
  country: string;
  taxId: string;
  consentAccepted: boolean;
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

/** Decides where Onboarding sends the user once signUp() resolves.
 * Exported and unit-tested directly (see Onboarding.test.tsx) rather than
 * only through the full 3-step wizard UI, which Radix's Select/Calendar
 * components make unreliable to drive in jsdom. */
export function resolvePostSignUpRoute(
  result: Pick<AuthResult, "needsEmailConfirmation">,
  email: string
): { path: string; state?: { email: string } } {
  if (result.needsEmailConfirmation) {
    // AuthContext won't see a session until the link is confirmed —
    // App.tsx will correctly show the unauthenticated routes (not the
    // main app) until then. Route to a dedicated screen rather than a
    // toast so the "activate your email" message survives navigation
    // and a page refresh.
    return { path: "/check-email", state: { email } };
  }
  return { path: "/" };
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: undefined,
    gender: "",
    countryOfBirth: "",
    nationality: "",
    country: "",
    taxId: "",
    consentAccepted: false,
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
      if (!form.password) errs.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
      else if (form.password.length < MIN_PASSWORD_LENGTH) errs.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
      if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
      else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
      if (!form.consentAccepted) errs.consentAccepted = "You must accept the privacy notice to continue";
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

    setSubmitting(true);
    try {
      const result = await signUp(form.email.trim(), form.password);
      if (!result.success) {
        toast({ title: "Couldn't create your account", description: result.error, variant: "destructive" });
        return;
      }
      if (!result.userId) {
        // Shouldn't happen alongside success:true, but don't silently
        // create a profile with no id to link it to if it somehow does.
        toast({ title: "Something went wrong creating your account", variant: "destructive" });
        return;
      }

      await db.profiles.put({
        id: result.userId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth ? format(form.dateOfBirth, "yyyy-MM-dd") : "",
        gender: form.gender,
        countryOfBirth: form.countryOfBirth,
        nationality: form.nationality,
        country: form.country,
        taxId: form.taxId.trim(),
        consentAcceptedAt: new Date().toISOString(),
      });

      const route = resolvePostSignUpRoute(result, form.email.trim());
      if (route.path === "/") {
        toast({ title: "Profile created!", description: "Welcome to FileSmart" });
      }
      navigate(route.path, route.state ? { state: route.state } : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 text-primary-foreground safe-area-top">
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
                <Field label="Password" icon={KeyRound} error={errors.password}>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className={cn(errors.password && "border-destructive")}
                  />
                </Field>
                <Field label="Confirm Password" icon={KeyRound} error={errors.confirmPassword}>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    className={cn(errors.confirmPassword && "border-destructive")}
                  />
                </Field>

                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      <p className="font-semibold text-foreground text-xs">How we handle your data</p>
                      <p>
                        The details you enter — including your name, contact
                        information, and tax identification number — are
                        encrypted and stored only on this device. They are
                        not uploaded or shared with anyone unless and until
                        you submit a tax declaration for filing.
                      </p>
                      <p className="italic">
                        Placeholder notice — pending final legal/compliance
                        review before this app collects real user data.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-1">
                    <Checkbox
                      id="consent"
                      checked={form.consentAccepted}
                      onCheckedChange={(checked) => update("consentAccepted", checked === true)}
                      className={cn("mt-0.5", errors.consentAccepted && "border-destructive")}
                    />
                    <Label htmlFor="consent" className="text-xs font-normal leading-snug text-foreground">
                      I have read and agree to how my data will be handled, as described above.
                    </Label>
                  </div>
                  {errors.consentAccepted && (
                    <p className="text-xs text-destructive pl-1">{errors.consentAccepted}</p>
                  )}
                </div>
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
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 gap-2 gradient-accent text-accent-foreground border-0 hover:opacity-90"
            >
              <Check className="w-4 h-4" /> {submitting ? "Creating…" : "Create Profile"}
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
