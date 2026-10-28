import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
const Landing = lazy(() => import("./pages/Landing"));
const Learn = lazy(() => import("./pages/Learn"));
const Guide = lazy(() => import("./pages/Guide"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const FilingWaitlist = lazy(() => import("./pages/FilingWaitlist"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const PublicLogin = lazy(() => import("./pages/PublicLogin"));
const CheckEmail = lazy(() => import("./pages/CheckEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const TaxCalculator = lazy(() => import("./pages/TaxCalculator"));
const FilingDirectory = lazy(() => import("./pages/FilingDirectory"));
const PublicNotFound = lazy(() => import("./components/public/PublicNotFound"));

const Waiting = () => <main className="flex min-h-screen items-center justify-center bg-[#f8f7f3] px-5 text-[#12352f]" role="status">Loading FileSmart…</main>;

export const PublicRoutes = () => {
  const { loading, isUnlocked, isPasswordRecovery } = useAuth();
  if (isPasswordRecovery) return <Suspense fallback={<Waiting />}><Routes>
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="*" element={<Navigate to="/reset-password" replace />} />
  </Routes></Suspense>;

  return <Suspense fallback={<Waiting />}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/learn" element={<Learn />} />
    <Route path="/learn/:slug" element={<Guide />} />
    <Route path="/how-it-works" element={<HowItWorks />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/disclaimer" element={<Disclaimer />} />
    <Route path="/filing-waitlist" element={<FilingWaitlist />} />
    <Route path="/filing-directory" element={<FilingDirectory />} />
    <Route path="/calculator" element={<TaxCalculator />} />
    <Route path="/create-account" element={<CreateAccount />} />
    <Route path="/onboarding" element={loading ? <Waiting /> : <Navigate to={isUnlocked ? "/filing-waitlist" : "/create-account"} replace />} />
    <Route path="/pricing" element={loading ? <Waiting /> : isUnlocked ? <Pricing /> : <Navigate to="/create-account" replace state={{ from: "/pricing" }} />} />
    <Route path="/login" element={loading ? <Waiting /> : isUnlocked ? <Navigate to="/filing-waitlist" replace /> : <PublicLogin />} />
    <Route path="/check-email" element={<CheckEmail />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
    {["/welcome", "/declare", "/submissions", "/submissions/:id", "/messages", "/profile", "/receipt-scanner", "/tax-calendar", "/invoices"].map((path) =>
      <Route key={path} path={path} element={<Navigate to="/filing-waitlist" replace />} />)}
    <Route path="*" element={<PublicNotFound />} />
  </Routes></Suspense>;
};

const PublicApp = () => <AuthProvider><TooltipProvider><Toaster /><Sonner /><BrowserRouter><PublicRoutes /></BrowserRouter></TooltipProvider></AuthProvider>;

export default PublicApp;
