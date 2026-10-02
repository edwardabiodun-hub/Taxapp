import { Bell, MessageCircleQuestion } from "lucide-react";
import { useLocation } from "react-router-dom";
import filesmartIcon from "@/assets/filesmart-icon.png";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/declare": "New Declaration",
  "/submissions": "Submissions",
  "/profile": "Profile",
};

const TopBar = ({ supportOpen, onOpenSupport }: { supportOpen: boolean; onOpenSupport: () => void }) => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "FileSmart";

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <img src={filesmartIcon} alt="" className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">FileSmart</p>
            <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Open tax support assistant" aria-haspopup="dialog" aria-expanded={supportOpen} onClick={onOpenSupport} className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Notifications" className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full bg-muted hover:bg-primary/10 transition-colors">
            <Bell className="w-5 h-5 text-foreground" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
