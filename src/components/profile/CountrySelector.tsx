import { MapPin, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { africanCountries } from "@/types/declaration";

interface CountrySelectorProps {
  country: string;
  setCountry: (code: string) => void;
}

const CountrySelector = ({ country, setCountry }: CountrySelectorProps) => (
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
);

export default CountrySelector;
