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
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import CheckEmail from "./pages/CheckEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
  </div>
);

export const AppRoutes = () => {
  const { loading: profileLoading, hasProfile } = useHasProfile();
  const { loading: authLoading, isUnlocked, isPasswordRecovery } = useAuth();

  if (profileLoading || authLoading) {
    return <LoadingScreen />;
  }

  // A password-recovery session (the user just opened a valid reset-password
  // email link) takes priority over every other branch below — otherwise a
  // device with no local profile would force this session into onboarding,
  // and a device that already has one would land in the main app, in both
  // cases before the user has had a chance to set their new password.
  if (isPasswordRecovery) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/reset-password" replace />} />
      </Routes>
    );
  }

  // No local profile yet: this device has never completed onboarding.
  // Onboarding creates the Supabase account and the local profile together
  // (using the account's real user id), so there's no separate "has an
  // account" check — hasProfile doubles as that signal.
  if (!hasProfile && isUnlocked) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // No active session: whether or not a local profile exists, route through
  // the unauthenticated screens. /forgot-password and /reset-password stay
  // reachable regardless of hasProfile, since resetting a password is a
  // cross-device action that shouldn't depend on this device's local state.
  if (!isUnlocked) {
    return (
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to={hasProfile ? "/login" : "/welcome"} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/welcome" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="/check-email" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
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
