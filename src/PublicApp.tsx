import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Learn from "./pages/Learn";
import Guide from "./pages/Guide";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import FilingWaitlist from "./pages/FilingWaitlist";
import Pricing from "./pages/Pricing";
import TaxCalculator from "./pages/TaxCalculator";
import FilingDirectory from "./pages/FilingDirectory";
import PublicNotFound from "./components/public/PublicNotFound";
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const PublicLogin = lazy(() => import("./pages/PublicLogin"));
const CheckEmail = lazy(() => import("./pages/CheckEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const Waiting = () => <main className="flex min-h-screen items-center justify-center bg-[#f8f7f3] px-5 text-[#12352f]" role="status">Loading FileSmart…</main>;

export const PublicRoutes = () => {
  const { loading, isUnlocked, isPasswordRecovery } = useAuth();
  if (isPasswordRecovery) return <Suspense fallback={<Waiting />}><Routes>
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="*" element={<Navigate to="/reset-password" replace />} />
  </Routes></Suspense>;

  return <Routes>
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
    <Route path="/create-account" element={<Suspense fallback={<Waiting />}><CreateAccount /></Suspense>} />
    <Route path="/onboarding" element={loading ? <Waiting /> : <Navigate to={isUnlocked ? "/filing-waitlist" : "/create-account"} replace />} />
    <Route path="/pricing" element={loading ? <Waiting /> : isUnlocked ? <Pricing /> : <Navigate to="/create-account" replace state={{ from: "/pricing" }} />} />
    <Route path="/login" element={loading ? <Waiting /> : isUnlocked ? <Navigate to="/filing-waitlist" replace /> : <Suspense fallback={<Waiting />}><PublicLogin /></Suspense>} />
    <Route path="/check-email" element={<Suspense fallback={<Waiting />}><CheckEmail /></Suspense>} />
    <Route path="/forgot-password" element={<Suspense fallback={<Waiting />}><ForgotPassword /></Suspense>} />
    <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
    {["/welcome", "/declare", "/submissions", "/submissions/:id", "/messages", "/profile", "/receipt-scanner", "/tax-calendar", "/invoices"].map((path) =>
      <Route key={path} path={path} element={<Navigate to="/filing-waitlist" replace />} />)}
    <Route path="*" element={<PublicNotFound />} />
  </Routes>;
};

const PublicApp = () => <AuthProvider><TooltipProvider><BrowserRouter><PublicRoutes /></BrowserRouter></TooltipProvider></AuthProvider>;

export default PublicApp;
