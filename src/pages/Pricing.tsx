import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { setPageMetadata } from "@/lib/seo";
import { NairaText } from "@/components/ui/NairaText";
import { isFilingLaunchPhase, publicFilingPath } from "@/lib/launch-phase";
import { getPricingCatalog, type PricingPlan } from "@/lib/pricing-catalog";

const Pricing = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => setPageMetadata({ title: "FileSmart pricing | FileSmart", description: "Review FileSmart's planned account options and filing prices.", path: "/pricing" }), []);

  async function loadPricing() {
    setLoading(true);
    setError("");
    try {
      setPlans(await getPricingCatalog());
    } catch {
      setPlans([]);
      setError("We couldn't load pricing right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPricing(); }, []);

  return <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]"><PublicNav /><main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Pricing</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">File for free if you qualify.</h1><p className="mt-5 text-lg leading-8 text-[#55736c]">Create a free account to review planned filing options. Eligibility and final prices will be confirmed before paid plans launch.</p><Button asChild className="mt-7 min-h-11 rounded-full bg-[#12352f] px-6 text-[#fbfaf5] hover:bg-[#1c4e44]"><Link to={isFilingLaunchPhase ? publicFilingPath : "/onboarding"}>{isFilingLaunchPhase ? "Join filing waitlist" : "File for free with FileSmart"} <ArrowRight className="h-4 w-4" /></Link></Button></div>
      {loading ? <div role="status" className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4" aria-label="Loading pricing">{[1, 2, 3, 4].map((item) => <div key={item} className="h-80 animate-pulse rounded-[2rem] border border-[#b9cec3] bg-white" />)}</div> : error ? <section role="alert" className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-[#e7c7be] bg-white p-7 text-center"><AlertCircle className="h-7 w-7 text-[#a33b2b]" /><p>{error}</p><Button type="button" variant="outline" onClick={() => void loadPricing()}>Try again</Button></section> : <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4" aria-label="Planned pricing plans">{plans.map((plan) => <article key={plan.name} className="flex flex-col rounded-[2rem] border border-[#b9cec3] bg-white p-6 shadow-[0_18px_45px_rgba(18,53,47,0.08)]"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#d48a18]">{plan.name}</p><p className="mt-4 min-h-12 text-sm font-semibold text-[#55736c]"><NairaText>{plan.range}</NairaText></p><p className="mt-6 text-4xl font-bold"><NairaText>{plan.price}</NairaText></p><p className="mt-3 min-h-20 text-sm leading-6 text-[#55736c]">{plan.description}</p><ul className="mt-5 space-y-3 border-t border-[#e0e9e1] pt-5">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-[#3c8d6d]" />{feature}</li>)}</ul><Button asChild variant="outline" className="mt-7 min-h-11 w-full rounded-full border-[#12352f] text-[#12352f] hover:bg-[#edf4ee]"><Link to={isFilingLaunchPhase ? publicFilingPath : "/onboarding"}>{isFilingLaunchPhase ? "Join filing waitlist" : "File for free"} <ArrowRight className="h-4 w-4" /></Link></Button></article>)}</section>}
      {!loading && !error && <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#e4d5b7] bg-[#fff9ed] p-5 text-sm leading-6 text-[#55736c]"><p><strong className="text-[#12352f]">Indicative pricing:</strong> these amounts are planned launch examples, not a payment offer. Final eligibility, included services, and any state or complexity fees will be confirmed before paid plans become available.</p></section>}
    </main><PublicFooter /></div>;
};

export default Pricing;
