import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import OfflineBanner from "./OfflineBanner";
import RouteBoundary from "./RouteBoundary";
import { SyncProvider } from "@/contexts/SyncContext";
import { SupportChat } from "@/components/support/SupportChat";

const AppLayout = () => {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <SyncProvider>
      <div className="flex flex-col min-h-screen bg-background safe-area-top safe-area-bottom">
        <TopBar supportOpen={supportOpen} onOpenSupport={() => setSupportOpen(true)} />
        <OfflineBanner />
        <main className="flex-1 pb-20 overflow-y-auto">
          <RouteBoundary><Outlet /></RouteBoundary>
        </main>
        <BottomNav />
        <SupportChat open={supportOpen} onOpenChange={setSupportOpen} />
      </div>
    </SyncProvider>
  );
};

export default AppLayout;
