import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background safe-area-top safe-area-bottom">
      <TopBar />
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
