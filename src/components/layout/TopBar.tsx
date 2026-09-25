import { Bell, User } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/declare": "New Declaration",
  "/submissions": "Submissions",
  "/profile": "Profile",
};

const TopBar = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "FileSmart";

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">FileSmart</p>
          <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
        </div>
        <button className="relative p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
