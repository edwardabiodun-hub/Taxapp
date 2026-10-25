import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPageMetadata } from "@/lib/seo";
import { joinLaunchWaitlist, WaitlistError } from "@/lib/waitlist";

const FilingWaitlist = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notificationConsent, setNotificationConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "joined" | "already_joined">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setPageMetadata({
      title: "Join the FileSmart filing waitlist | FileSmart",
      description: "Join the FileSmart filing waitlist and be notified when the Nigerian tax-season filing experience opens.",
      path: "/filing-waitlist",
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!notificationConsent) {
      setError("Please agree to be notified when filing opens.");
      return;
    }

    setStatus("submitting");
    try {
      const result = await joinLaunchWaitlist({ email, name, source: "filing-cta", notificationConsent });
      setStatus(result.status);
    } catch (caughtError) {
      setStatus("idle");
      setError(caughtError instanceof WaitlistError && caughtError.code === "rate_limit"
        ? "Too many requests. Please try again later."
        : "We could not save your request right now. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
      <PublicNav />
      <main className="mx-auto grid max-w-6xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Filing opens soon</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Be first to file with FileSmart.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#55736c]">We are preparing the filing experience for the upcoming Nigerian tax season. Join the waitlist and we will let you know when filing is available.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {["Guided preparation", "Clear tax explanations", "Launch notification"].map((item) => <div key={item} className="rounded-2xl border border-[#d7e4d9] bg-white p-4"><CheckCircle2 className="h-5 w-5 text-[#3c8d6d]" /><p className="mt-3 text-sm font-semibold">{item}</p></div>)}
          </div>
          <Link to="/" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#12352f] hover:underline"><ArrowLeft className="h-4 w-4" /> Back to FileSmart</Link>
        </section>

        <section className="rounded-[2rem] border border-[#b9cec3] bg-white p-7 shadow-[0_24px_60px_rgba(18,53,47,0.1)] sm:p-9" aria-live="polite">
          {status === "joined" || status === "already_joined" ? (
            <div className="py-6">
              <CheckCircle2 className="h-10 w-10 text-[#3c8d6d]" />
              <h2 className="mt-5 text-3xl font-bold">You're on the list.</h2>
              <p className="mt-4 leading-7 text-[#55736c]">{status === "already_joined" ? "This email is already registered for the filing waitlist." : "We'll notify you when the filing season experience opens."}</p>
              <Button asChild className="mt-8 min-h-11 rounded-full bg-[#12352f] text-[#fbfaf5] hover:bg-[#1c4e44]"><Link to="/learn">Explore tax education <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Join the waitlist</p><h2 className="mt-3 text-3xl font-bold">We’ll let you know when filing opens.</h2></div>
              <div><Label htmlFor="waitlist-name">Name <span className="font-normal text-[#688179]">(optional)</span></Label><Input id="waitlist-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-11" /></div>
              <div><Label htmlFor="waitlist-email">Email address</Label><Input id="waitlist-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-11" /></div>
              <label className="flex gap-3 text-sm leading-6 text-[#55736c]" htmlFor="waitlist-consent"><input id="waitlist-consent" type="checkbox" checked={notificationConsent} onChange={(event) => setNotificationConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#12352f]" /> <span>Notify me when FileSmart filing opens. I understand this is a launch notification, not a filing confirmation.</span></label>
              {error && <p role="alert" className="rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a33b2b]">{error}</p>}
              <Button type="submit" disabled={status === "submitting"} className="min-h-11 w-full rounded-full bg-[#12352f] text-[#fbfaf5] hover:bg-[#1c4e44]">{status === "submitting" ? "Saving your place…" : "Join filing waitlist"} <ArrowRight className="h-4 w-4" /></Button>
              <p className="text-xs leading-5 text-[#688179]">We’ll use your email for the FileSmart filing launch notification you requested.</p>
            </form>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default FilingWaitlist;
