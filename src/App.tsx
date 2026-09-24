import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CountryThemeProvider } from "@/contexts/CountryThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useHasProfile } from "@/hooks/use-has-profile";
import { useHasAccount } from "@/hooks/use-has-account";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewDeclaration from "./pages/NewDeclaration";
import Submissions from "./pages/Submissions";
import SubmissionDetail from "./pages/SubmissionDetail";
import Profile from "./pages/Profile";
import TaxCalculator from "./pages/TaxCalculator";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
  </div>
);

const AppRoutes = () => {
  const { loading: profileLoading, hasProfile } = useHasProfile();
  const { loading: accountLoading, hasAccount } = useHasAccount();
  const { isUnlocked } = useAuth();

  if (profileLoading || accountLoading) {
    return <LoadingScreen />;
  }

  // No local login credential yet: either a first-time install, or (there
  // are no production users on the pre-auth schema, so not specially
  // handled) someone who created a profile before this login gate existed.
  // Onboarding creates the account and profile together.
  if (!hasAccount) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  if (!isUnlocked) {
    return <Login />;
  }

  if (!hasProfile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CountryThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </CountryThemeProvider>
  </QueryClientProvider>
);

export default App;
