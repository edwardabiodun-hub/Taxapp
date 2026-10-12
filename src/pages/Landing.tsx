import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  FileCheck2,
  HelpCircle,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { setPageMetadata } from "@/lib/seo";
import { taxGuides } from "@/content/tax-guides";
import { cn } from "@/lib/utils";
import { useState } from "react";

const benefits = [
  {
    icon: FileCheck2,
    title: "A calmer way to prepare",
    description: "Move through your return in plain language, one decision at a time.",
  },
  {
    icon: ShieldCheck,
    title: "Built around your privacy",
    description: "Keep your tax preparation focused and understandable from the first step.",
  },
  {
    icon: CalendarDays,
    title: "Know what is next",
    description: "See the filing window, required information, and progress before you finish.",
  },
];

const faqs = [
  {
    question: "Can I start my tax preparation in a browser?",
    answer: "Yes. FileSmart is designed to let you begin your preparation online. Select Start Filing Online to create your profile and enter the guided workflow.",
  },
  {
    question: "Does FileSmart submit my return to the tax authority?",
    answer: "The current experience helps you prepare and review your information. Direct submission depends on the supported integration for your filing route; we will always make that limitation clear.",
  },
  {
    question: "What do I need before I start?",
    answer: "Have your tax identification details, income information, eligible deductions, and supporting documents available. You can work through the questions at your own pace.",
  },
  {
    question: "Is this professional tax advice?",
    answer: "No. FileSmart provides general tax information and guided preparation support. For complex or disputed situations, speak with a qualified tax professional or the relevant tax authority.",
  },
];

const Landing = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(
    () =>
      setPageMetadata({
        title: "FileSmart | Simple Nigerian tax preparation",
        description: "Prepare your Nigerian personal income tax information with a clear, guided online experience.",
        path: "/",
      }),
    [],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f3] text-[#12352f]">
      <header className="sticky top-0 z-50 border-b border-[#dce6df]/80 bg-[#f8f7f3]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="FileSmart home">
            <img src="/brand/filesmart-lockup.png" alt="FileSmart brand lockup" className="h-14 w-14 max-w-full object-contain sm:h-16 sm:w-16" />
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#55736c] md:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="transition-colors hover:text-[#12352f]">How it works</a>
            <a href="#why-filesmart" className="transition-colors hover:text-[#12352f]">Why FileSmart</a>
            <a href="#questions" className="transition-colors hover:text-[#12352f]">Questions</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a href="#questions" className="px-3 py-2 text-sm font-semibold text-[#55736c] hover:text-[#12352f]">Learn more</a>
            <Button asChild className="rounded-full bg-[#12352f] px-5 text-[#fbfaf5] shadow-none hover:bg-[#1c4e44]">
              <Link to="/onboarding">Start online <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          <button
            type="button"
            className="rounded-full p-2 text-[#12352f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d48a18] focus-visible:ring-offset-2 md:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" className="border-t border-[#dce6df] px-5 py-4 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm font-semibold">
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="#why-filesmart" onClick={() => setMenuOpen(false)}>Why FileSmart</a>
              <a href="#questions" onClick={() => setMenuOpen(false)}>Questions</a>
              <Button asChild className="w-full rounded-full bg-[#12352f] text-[#fbfaf5]">
                <Link to="/onboarding">Start filing online <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:pb-28">
          <div className="relative z-10">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cdded6] bg-[#eef5ef] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#236052]">
              <Sparkles className="h-3.5 w-3.5 text-[#d48a18]" /> Tax preparation for Nigeria
            </p>
            <h1 className="max-w-2xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-[#12352f] sm:text-6xl lg:text-[4.7rem]">
              Tax should feel <span className="text-[#d48a18]">clear,</span> not confusing.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#55736c] sm:text-xl">
              FileSmart helps Nigerian individuals prepare their personal income tax information with a guided online experience built for real life.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 rounded-full bg-[#12352f] px-7 text-[#fbfaf5] shadow-[0_12px_24px_rgba(18,53,47,0.16)] hover:bg-[#1c4e44]">
                <Link to="/onboarding">Start filing online <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <a href="#how-it-works" className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#b8cec4] px-7 text-sm font-bold text-[#12352f] transition-colors hover:bg-white">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#55736c]">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#3c8d6d]" /> Guided step by step</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#3c8d6d]" /> Start in your browser</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[30rem] lg:mx-0 lg:justify-self-end">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#f2b84b]/25 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#b9cec3] bg-[#fffdf8] p-5 shadow-[0_24px_60px_rgba(18,53,47,0.13)] sm:p-7">
              <div className="flex items-start justify-between border-b border-[#e5ece6] pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a968d]">Your preparation</p>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Make a clear start</h2>
                </div>
                <span className="rounded-full bg-[#eaf5ec] px-3 py-1 text-xs font-bold text-[#2f7b5c]">0% started</span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ["01", "Your details", "Tell us where you file"],
                  ["02", "Income", "Add what you earned"],
                  ["03", "Deductions", "Review what may apply"],
                ].map(([number, title, description], index) => (
                  <div key={number} className={cn("flex items-center gap-4 rounded-2xl border p-4", index === 0 ? "border-[#d5e8dc] bg-[#f1f8f1]" : "border-[#e8eeea] bg-[#fffdf8]")}>
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold", index === 0 ? "bg-[#12352f] text-white" : "bg-[#edf1ed] text-[#7a968d]")}>{number}</span>
                    <div>
                      <p className="font-semibold text-[#12352f]">{title}</p>
                      <p className="mt-0.5 text-sm text-[#7a968d]">{description}</p>
                    </div>
                    {index === 0 ? <ArrowRight className="ml-auto h-4 w-4 text-[#236052]" /> : <Check className="ml-auto h-4 w-4 text-[#c6d2cb]" />}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#12352f] p-4 text-[#fbfaf5]">
                <CalendarDays className="h-5 w-5 text-[#f2b84b]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b9d2c5]">Keep your deadline in view</p>
                  <p className="mt-1 text-sm font-semibold">Know your filing window before you begin.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why-filesmart" className="border-y border-[#e0e9e1] bg-[#edf4ee]">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Why FileSmart</p>
              <h2 className="mt-3 max-w-md font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">The confidence to take the next step.</h2>
              <p className="mt-4 max-w-md leading-7 text-[#55736c]">Tax language can be difficult. Your preparation experience does not have to be.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-3xl border border-[#d7e4d9] bg-[#fbfdf9] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dcefe0] text-[#236052]"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-5 font-display text-lg font-bold leading-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#688179]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">How it works</p>
              <h2 className="mt-3 max-w-sm font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">A guided path, from first question to ready review.</h2>
              <p className="mt-5 max-w-sm leading-7 text-[#55736c]">Start online, work at your own pace, and keep your information organized as you go.</p>
              <Button asChild className="mt-8 rounded-full bg-[#12352f] px-6 text-[#fbfaf5] hover:bg-[#1c4e44]"><Link to="/onboarding">Begin your preparation <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="space-y-5">
              {[
                ["01", "Create your profile", "Enter the essentials so your preparation is set up for your tax residence."],
                ["02", "Work through the guide", "Add employment, business, investment, benefit, and deduction information in plain language."],
                ["03", "Review before you finish", "See what you entered, attach supporting documents, and understand the next step."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-5 border-b border-[#e2eae3] pb-6 last:border-0">
                  <span className="font-display text-sm font-bold text-[#d48a18]">{number}</span>
                  <div><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-2 max-w-lg leading-7 text-[#688179]">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="questions" className="bg-[#12352f] text-[#fbfaf5]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:py-24">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f2b84b]">Questions, answered</p>
              <h2 className="mt-3 max-w-sm font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">No jargon. No guesswork.</h2>
              <p className="mt-5 max-w-sm leading-7 text-[#b9d2c5]">We explain what the product can do today, and where you may need your tax authority or a professional adviser.</p>
              <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-[#dbeae0]"><HelpCircle className="h-5 w-5 text-[#f2b84b]" /> Need more help? Start with the guided flow.</div>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.question} className="border-b border-[#376057]">
                    <button type="button" className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b84b]" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(isOpen ? null : index)}>
                      <span>{faq.question}</span><ChevronDown className={cn("h-5 w-5 shrink-0 text-[#f2b84b] transition-transform", isOpen && "rotate-180")} />
                    </button>
                    <div id={`faq-answer-${index}`} hidden={!isOpen}>
                      <p className="max-w-2xl pb-5 pr-8 leading-7 text-[#b9d2c5]">{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]"><BookOpen className="h-4 w-4" /> Learn with FileSmart</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Start with clearer tax information</h2>
            </div>
            <Button asChild variant="link" className="h-auto justify-start p-0 text-[#12352f] sm:justify-end"><Link to="/learn">View all guides <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {taxGuides.slice(0, 3).map((guide) => <Link key={guide.slug} to={`/learn/${guide.slug}`} className="rounded-2xl border border-[#dce6df] bg-white/60 p-5 transition-colors hover:border-[#12352f]"><p className="text-sm font-semibold text-[#b06b12]">{guide.readTimeMinutes} min read</p><h3 className="mt-3 text-lg font-bold leading-snug">{guide.title}</h3><p className="mt-2 text-sm leading-6 text-[#55736c]">{guide.summary}</p></Link>)}
          </div>
        </section>
      </main>

      <footer className="bg-[#0d2924] text-[#b9d2c5]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 text-sm sm:px-8 md:flex-row md:items-center md:justify-between">
          <div><img src="/brand/filesmart-lockup.png" alt="FileSmart brand lockup" className="h-14 w-14 max-w-full object-contain" /><p className="mt-1">Simple Nigerian tax preparation.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-2"><a href="#questions" className="hover:text-white">Support</a><Link to="/privacy" className="hover:text-white">Privacy notice</Link><Link to="/terms" className="hover:text-white">Terms and conditions</Link><Link to="/disclaimer" className="hover:text-white">Disclaimer</Link></div>
          <p className="max-w-xs text-xs leading-5 md:text-right">General information only. FileSmart is not a substitute for professional tax advice.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
