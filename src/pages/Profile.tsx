import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Building2, ChevronRight, LogOut } from "lucide-react";

const profileData = {
  name: "Amara Okafor",
  email: "amara@example.com",
  phone: "+254 712 345 678",
  country: "Kenya",
  taxId: "A012345678Z",
};

const menuItems = [
  { icon: User, label: "Personal Details" },
  { icon: Building2, label: "Business Details" },
  { icon: Mail, label: "Notifications" },
  { icon: MapPin, label: "Tax Jurisdictions" },
];

const Profile = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-6"
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
        <InfoRow icon={MapPin} label="Country" value={profileData.country} />
        <InfoRow icon={Building2} label="Tax ID" value={profileData.taxId} />
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
