import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { africanCountries, nigerianStates, type NigeriaDeclarationForm } from "@/types/declaration";
import { Lock, MapPin } from "lucide-react";
import { useCountryTheme } from "@/contexts/CountryThemeContext";

interface CountryStepProps {
  form: NigeriaDeclarationForm;
  update: (key: string, value: string) => void;
  errors?: string[];
}

const CountryStep = ({ form, update, errors = [] }: CountryStepProps) => {
  const { setCountry } = useCountryTheme();
  const hasTaxYearError = errors.some((e) => e.toLowerCase().includes("tax year"));
  const hasCountryError = errors.some((e) => e.toLowerCase().includes("country"));

  const handleCountrySelect = (code: string) => {
    update("country", code);
    setCountry(code);
  };

  const handleStateSelect = (code: string) => {
    update("state", code);
  };

  const hasStateError = errors.some((e) => e.toLowerCase().includes("state"));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className={cn("text-sm font-semibold", hasTaxYearError && "text-destructive")}>Tax Year *</Label>
        <Select value={form.taxYear} onValueChange={(v) => update("taxYear", v)}>
          <SelectTrigger className={cn(hasTaxYearError && "border-destructive ring-destructive/20")}>
            <SelectValue placeholder="Select tax year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
        {hasTaxYearError && <p className="text-[10px] text-destructive font-medium">Please select a tax year</p>}
      </div>

      <div className="space-y-3">
        <Label className={cn("text-sm font-semibold", hasCountryError && "text-destructive")}>Select Country *</Label>
        <div className="grid grid-cols-2 gap-2">
          {africanCountries.map((country) => (
            <button
              key={country.code}
              disabled={!country.active}
              onClick={() => country.active && handleCountrySelect(country.code)}
              className={cn(
                "relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                country.active && form.country === country.code
                  ? "border-primary bg-primary/5 shadow-card"
                  : country.active
                  ? "border-border bg-card hover:border-primary/40"
                  : "border-border/50 bg-muted/50 opacity-60 cursor-not-allowed"
              )}
            >
              <span className="text-2xl">{country.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", !country.active && "text-muted-foreground")}>
                  {country.name}
                </p>
                {!country.active && (
                  <span className="text-[10px] text-muted-foreground font-medium">Coming soon</span>
                )}
              </div>
              {!country.active && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              {country.active && form.country === country.code && (
                <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
        {hasCountryError && <p className="text-[10px] text-destructive font-medium">Please select a country</p>}
      </div>

      {form.country === "ng" && (
        <div className="space-y-3">
          <Label className={cn("text-sm font-semibold", hasStateError && "text-destructive")}>Select State *</Label>
          <div className="grid grid-cols-2 gap-2">
            {nigerianStates.map((state) => (
              <button
                key={state.code}
                disabled={!state.active}
                onClick={() => state.active && handleStateSelect(state.code)}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  state.active && form.state === state.code
                    ? "border-primary bg-primary/5 shadow-card"
                    : state.active
                    ? "border-border bg-card hover:border-primary/40"
                    : "border-border/50 bg-muted/50 opacity-60 cursor-not-allowed"
                )}
              >
                <MapPin className={cn("w-5 h-5 shrink-0", state.active ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold truncate", !state.active && "text-muted-foreground")}>
                    {state.name}
                  </p>
                  {!state.active && (
                    <span className="text-[10px] text-muted-foreground font-medium">Coming soon</span>
                  )}
                </div>
                {!state.active && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                {state.active && form.state === state.code && (
                  <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {hasStateError && <p className="text-[10px] text-destructive font-medium">Please select a state</p>}
        </div>
      )}
    </div>
  );
};

export default CountryStep;
