import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth";
import { setPageMetadata } from "@/lib/seo";

const CreateAccount = () => {
  const { isUnlocked } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"created">();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => setPageMetadata({
    title: "Create a free FileSmart account | FileSmart",
    description: "Create a free FileSmart account and get ready for the filing launch.",
    path: "/create-account",
  }), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await signUp(email, password);
      if (!response.success) {
        setError("We couldn't create your account. Check the details or try signing in.");
        return;
      }
      if (response.needsEmailConfirmation) {
        navigate("/check-email", { state: { email } });
      } else {
        setResult("created");
      }
    } catch {
      setError("We couldn't reach the account service. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
    <PublicNav />
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Start with a free account</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Get ready for filing season.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[#55736c]">Create your account now. Filing tools will open when the tax season launch begins; until then, you can explore public tax education and request a launch notification.</p>
        <Link to="/filing-waitlist" className="mt-7 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">Join the filing waitlist <ArrowRight className="h-4 w-4" /></Link>
      </section>

      <section className="rounded-[2rem] border border-[#b9cec3] bg-white p-7 shadow-[0_24px_60px_rgba(18,53,47,0.1)] sm:p-9" aria-live="polite">
        {isUnlocked && !result ? <div className="py-5">
          <CheckCircle2 className="h-10 w-10 text-[#3c8d6d]" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-bold">Your account is ready</h2>
          <p className="mt-4 leading-7 text-[#55736c]">Review planned pricing with your account. Filing tools will open when the tax season launch begins.</p>
          <Button asChild className="mt-7 min-h-11 rounded-full bg-[#12352f] text-white hover:bg-[#1c4e44]"><Link to="/pricing">View pricing <ArrowRight className="h-4 w-4" /></Link></Button>
        </div> : result ? <div className="py-5">
          <CheckCircle2 className="h-10 w-10 text-[#3c8d6d]" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-bold">Your account is ready</h2>
          <p className="mt-4 leading-7 text-[#55736c]">You can review planned pricing. Filing tools will open when the tax season launch begins.</p>
          <div className="mt-7 flex flex-col gap-3"><Button asChild className="min-h-11 rounded-full bg-[#12352f] text-white hover:bg-[#1c4e44]"><Link to="/pricing">View pricing <ArrowRight className="h-4 w-4" /></Link></Button><Link to="/filing-waitlist" className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold underline">Join the filing waitlist <ArrowRight className="h-4 w-4" /></Link></div>
        </div> : <form onSubmit={handleSubmit} className="space-y-5">
          <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Free account</p><h2 className="mt-3 text-3xl font-bold">Create your account</h2><p className="mt-2 text-sm leading-6 text-[#55736c]">You’ll need an account to view pricing. Filing tools remain closed until launch.</p></div>
          <div><Label htmlFor="account-email">Email address</Label><Input id="account-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-11" /></div>
          <div><Label htmlFor="account-password">Password</Label><PasswordInput id="account-password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-11" /><p className="mt-1 text-xs text-[#688179]">Use at least 8 characters.</p></div>
          <label htmlFor="account-terms" className="flex items-start gap-3 text-sm leading-6 text-[#55736c]"><input id="account-terms" type="checkbox" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 accent-[#12352f]" /><span>I agree to the <Link to="/terms" className="underline">Terms</Link> and acknowledge the <Link to="/privacy" className="underline">Privacy Notice</Link>.</span></label>
          {error && <p role="alert" className="rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a33b2b]">{error}</p>}
          <Button type="submit" disabled={submitting} className="min-h-11 w-full rounded-full bg-[#12352f] text-white hover:bg-[#1c4e44]">{submitting ? "Creating account…" : "Create free account"} <ArrowRight className="h-4 w-4" /></Button>
          <p className="text-center text-sm text-[#55736c]">Already have an account? <Link to="/login" className="font-semibold underline">Sign in</Link></p>
        </form>}
      </section>
    </main>
    <PublicFooter />
  </div>;
};

export default CreateAccount;
