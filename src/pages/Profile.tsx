import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Building2, ChevronRight, LogOut, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCountryTheme } from "@/contexts/CountryThemeContext";
import { africanCountries } from "@/types/declaration";

const profileData = {
  name: "Amara Okafor",
  email: "amara@example.com",
  phone: "+234 812 345 6789",
  taxId: "A012345678Z",
};

const menuItems = [
  { icon: User, label: "Personal Details" },
  { icon: Building2, label: "Business Details" },
  { icon: Mail, label: "Notifications" },
];

const Profile = () => {
  const { country, setCountry } = useCountryTheme();
  const selectedCountry = africanCountries.find((c) => c.code === country);

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
        <h2 className="font-display font-bold text-xl">{profileData.name}</h2>
        <p className="text-sm opacity-80">{profileData.email}</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-background/15 rounded-full px-4 py-1.5">
          <span className="text-xs font-medium">Tax ID: {profileData.taxId}</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card rounded-xl shadow-card p-4 space-y-3">
        <InfoRow icon={Phone} label="Phone" value={profileData.phone} />
        <InfoRow icon={MapPin} label="Country" value={`${selectedCountry?.flag || ""} ${selectedCountry?.name || country}`} />
        <InfoRow icon={Building2} label="Tax ID" value={profileData.taxId} />
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
        {menuItems.map((item) => (
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

export default Profile;
