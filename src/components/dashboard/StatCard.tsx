import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "primary" | "accent";
}

const StatCard = ({ icon: Icon, label, value, subtitle, variant = "default" }: StatCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl p-4 shadow-card transition-all hover:shadow-elevated",
        variant === "primary" && "gradient-primary text-primary-foreground",
        variant === "accent" && "gradient-accent text-accent-foreground",
        variant === "default" && "bg-card text-card-foreground"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            "p-2 rounded-lg",
            variant === "default" ? "bg-primary/10" : "bg-background/20"
          )}
        >
          <Icon className={cn("w-4 h-4", variant === "default" ? "text-primary" : "text-current")} />
        </div>
        <span className={cn("text-xs font-medium", variant === "default" ? "text-muted-foreground" : "text-current/80")}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-display font-bold">{value}</p>
      {subtitle && (
        <p className={cn("text-xs mt-1", variant === "default" ? "text-muted-foreground" : "text-current/70")}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
