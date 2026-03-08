import { User, Building2, ChevronRight, LogOut } from "lucide-react";

const ProfileMenu = () => (
  <>
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

    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors">
      <LogOut className="w-4 h-4" />
      <span className="text-sm font-semibold">Sign Out</span>
    </button>
  </>
);

export default ProfileMenu;
