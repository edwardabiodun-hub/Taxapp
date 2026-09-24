import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CountryThemeProvider } from "@/contexts/CountryThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useHasProfile } from "@/hooks/use-has-profile";
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
  const { loading: authLoading, isUnlocked } = useAuth();

  if (profileLoading || authLoading) {
    return <LoadingScreen />;
  }

  // No local profile yet: this device has never completed onboarding.
  // Onboarding creates the Supabase account and the local profile together
  // (using the account's real user id), so there's no separate "has an
  // account" check — hasProfile doubles as that signal.
  if (!hasProfile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // A profile exists locally, but there's no active (or cached) session —
  // either this is a fresh sign-in on a new device, or a session expired.
  if (!isUnlocked) {
    return <Login />;
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
