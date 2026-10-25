import { useEffect } from "react";
import { ArrowRight, CheckCircle2, FileText, ListChecks, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import { setPageMetadata } from "@/lib/seo";

const steps = [
  { icon: UserRound, number: "01", title: "Create your profile", text: "Tell FileSmart the basics about where you live and how you earn income." },
  { icon: FileText, number: "02", title: "Add your information", text: "Work through plain-language prompts for income, benefits, investments, and deductions." },
  { icon: ListChecks, number: "03", title: "Review your preparation", text: "Check your entries, attach supporting documents, and understand the next step." },
];

const HowItWorks = () => {
  useEffect(() => setPageMetadata({ title: "How FileSmart works | FileSmart", description: "See how FileSmart guides individuals in Nigeria through personal income tax preparation, step by step.", path: "/how-it-works" }), []);

  return <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]"><PublicNav /><main>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">How it works</p><h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">A clearer path to getting prepared.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#55736c]">FileSmart breaks preparation into focused steps, so you can work at your own pace without guessing what comes next.</p><Button asChild className="mt-8 min-h-11 rounded-full bg-[#12352f] px-6 text-[#fbfaf5] hover:bg-[#1c4e44]"><Link to="/onboarding">Start filing online <ArrowRight className="h-4 w-4" /></Link></Button></div>
      <div className="overflow-hidden rounded-[2rem] border border-[#b9cec3] bg-white shadow-[0_24px_60px_rgba(18,53,47,0.13)]"><img src="/images/filesmart-small-business.png" alt="Two small-business owners reviewing information together at a laptop" className="h-full min-h-72 w-full object-cover" /></div>
    </section>
    <section className="border-y border-[#e0e9e1] bg-[#edf4ee]"><div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20"><div className="grid gap-5 md:grid-cols-3">{steps.map(({ icon: Icon, number, title, text }) => <article key={number} className="rounded-3xl border border-[#d7e4d9] bg-[#fbfdf9] p-6"><div className="flex items-center justify-between"><span className="font-display text-sm font-bold text-[#d48a18]">{number}</span><Icon className="h-5 w-5 text-[#236052]" /></div><h2 className="mt-8 text-xl font-bold">{title}</h2><p className="mt-3 leading-7 text-[#55736c]">{text}</p></article>)}</div></div></section>
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">What FileSmart does not do</p><h2 className="mt-3 text-3xl font-bold">Preparation support, with clear boundaries.</h2><p className="mt-4 leading-7 text-[#55736c]">FileSmart provides general information and a guided preparation experience. It is not a substitute for professional tax advice, and direct submission depends on the filing route and available integration.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><p className="flex gap-3 leading-7"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#3c8d6d]" />Your information stays organized as you work.</p><p className="flex gap-3 leading-7"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#3c8d6d]" />You can review before deciding your next step.</p></div></div></section>
  </main><PublicFooter /></div>;
};

export default HowItWorks;
