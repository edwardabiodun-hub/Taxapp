import { NavLink, useLocation } from "react-router-dom";
import { Home, FilePlus, Calculator, FileText, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessageCount } from "@/hooks/use-local-data";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/declare", icon: FilePlus, label: "Declare" },
  { to: "/calculator", icon: Calculator, label: "Estimate" },
  { to: "/submissions", icon: FileText, label: "History" },
  { to: "/messages", icon: Mail, label: "Messages" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const unreadCount = useUnreadMessageCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 px-2 py-1 group"
            >
              <div
                className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[var(--primary-tint)]"
                    : "group-hover:bg-muted"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {item.to === "/messages" && unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] leading-none"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
