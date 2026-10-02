import { lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CountryThemeProvider } from "@/contexts/CountryThemeContext";
import { useHasProfile } from "@/hooks/use-has-profile";
import AppLayout from "./components/layout/AppLayout";
import RouteBoundary from "./components/layout/RouteBoundary";
import { loadJurisdictionCapabilities } from "@/lib/jurisdiction-service";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewDeclaration = lazy(() => import("./pages/NewDeclaration"));
const Submissions = lazy(() => import("./pages/Submissions"));
const SubmissionDetail = lazy(() => import("./pages/SubmissionDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const TaxCalculator = lazy(() => import("./pages/TaxCalculator"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { loading, hasProfile } = useHasProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<RouteBoundary><Onboarding /></RouteBoundary>} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/declare" element={<NewDeclaration />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />
        <Route path="/calculator" element={<TaxCalculator />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<RouteBoundary><NotFound /></RouteBoundary>} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    void loadJurisdictionCapabilities().catch(() => undefined);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CountryThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </CountryThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
