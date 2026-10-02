import { lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CountryThemeProvider } from "@/contexts/CountryThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useHasProfile } from "@/hooks/use-has-profile";
import { useRestoreProfile } from "@/hooks/use-restore-profile";
import AppLayout from "./components/layout/AppLayout";
import RouteBoundary from "./components/layout/RouteBoundary";
import { loadJurisdictionCapabilities } from "@/lib/jurisdiction-service";
import WelcomePage from "./pages/Welcome";
import LoginPage from "./pages/Login";
import CheckEmailPage from "./pages/CheckEmail";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import OnboardingPage from "./pages/Onboarding";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewDeclaration = lazy(() => import("./pages/NewDeclaration"));
const Submissions = lazy(() => import("./pages/Submissions"));
const SubmissionDetail = lazy(() => import("./pages/SubmissionDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const TaxCalculator = lazy(() => import("./pages/TaxCalculator"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingScreen = ({ message = "Loading…" }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground text-sm">{message}</div>
  </div>
);

export const AppRoutes = () => {
  const { loading: profileLoading, hasProfile } = useHasProfile();
  const { loading: authLoading, isUnlocked, isPasswordRecovery } = useAuth();
  const { checking: restoringProfile } = useRestoreProfile(!hasProfile && isUnlocked && !isPasswordRecovery);

  if (profileLoading || authLoading) return <LoadingScreen />;

  if (isPasswordRecovery) return <Routes>
    <Route path="/reset-password" element={<RouteBoundary><ResetPasswordPage /></RouteBoundary>} />
    <Route path="*" element={<Navigate to="/reset-password" replace />} />
  </Routes>;

  if (!hasProfile && isUnlocked) {
    if (restoringProfile) return <LoadingScreen message="Restoring your profile…" />;
    return <Routes>
      <Route path="/onboarding" element={<RouteBoundary><OnboardingPage /></RouteBoundary>} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>;
  }

  if (!isUnlocked) return <Routes>
    <Route path="/welcome" element={<RouteBoundary><WelcomePage /></RouteBoundary>} />
    <Route path="/login" element={<RouteBoundary><LoginPage /></RouteBoundary>} />
    <Route path="/onboarding" element={<RouteBoundary><OnboardingPage /></RouteBoundary>} />
    <Route path="/check-email" element={<RouteBoundary><CheckEmailPage /></RouteBoundary>} />
    <Route path="/forgot-password" element={<RouteBoundary><ForgotPasswordPage /></RouteBoundary>} />
    <Route path="/reset-password" element={<RouteBoundary><ResetPasswordPage /></RouteBoundary>} />
    <Route path="*" element={<Navigate to={hasProfile ? "/login" : "/welcome"} replace />} />
  </Routes>;

  return <Routes>
      <Route path="/welcome" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route path="/check-email" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<RouteBoundary><Dashboard /></RouteBoundary>} />
        <Route path="/declare" element={<RouteBoundary><NewDeclaration /></RouteBoundary>} />
        <Route path="/submissions" element={<RouteBoundary><Submissions /></RouteBoundary>} />
        <Route path="/submissions/:id" element={<RouteBoundary><SubmissionDetail /></RouteBoundary>} />
        <Route path="/messages" element={<RouteBoundary><Messages /></RouteBoundary>} />
        <Route path="/calculator" element={<RouteBoundary><TaxCalculator /></RouteBoundary>} />
        <Route path="/profile" element={<RouteBoundary><Profile /></RouteBoundary>} />
      </Route>
      <Route path="*" element={<RouteBoundary><NotFound /></RouteBoundary>} />
    </Routes>;
};

const App = () => {
  useEffect(() => {
    void loadJurisdictionCapabilities().catch(() => undefined);
  }, []);

  return (
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
};

export default App;
