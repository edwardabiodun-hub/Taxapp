import { useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { setPageMetadata } from "@/lib/seo";
import { NairaText } from "@/components/ui/NairaText";

const plans = [
  { name: "Basic", range: "Below ₦2,000,000 annual gross income", price: "₦0", description: "A free starting point for straightforward individual preparation.", features: ["Guided tax preparation", "Tax estimation tools", "Education and general support"] },
  { name: "Silver", range: "₦2,000,000 to below ₦5,000,000", price: "₦5,000", description: "Planned support for taxpayers with more income to organise and review.", features: ["Everything in Basic", "Expanded preparation support", "Review-ready income summary"] },
  { name: "Premium", range: "₦5,000,000 to ₦10,000,000", price: "₦10,000", description: "Planned support for higher-income preparation and more involved records.", features: ["Everything in Silver", "More detailed preparation guidance", "Priority launch information"] },
  { name: "Premium Plus", range: "Above ₦10,000,000", price: "From ₦15,000", description: "Planned pricing for higher-income or more complex preparation needs.", features: ["Everything in Premium", "Complexity-based pricing", "Human-support pathway"] },
];

const Pricing = () => {
  useEffect(() => setPageMetadata({ title: "FileSmart pricing | FileSmart", description: "See the FileSmart preparation experience and available account options.", path: "/pricing" }), []);

  return <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]"><PublicNav /><main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Pricing</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">File for free if you qualify.</h1><p className="mt-5 text-lg leading-8 text-[#55736c]"><NairaText>If your annual gross income is below ₦2 million, the planned Basic filing plan is ₦0. Higher income bands have planned prices shown below so you can understand the direction before paid plans launch.</NairaText></p><Button asChild className="mt-7 min-h-11 rounded-full bg-[#12352f] px-6 text-[#fbfaf5] hover:bg-[#1c4e44]"><Link to="/onboarding">File for free with FileSmart <ArrowRight className="h-4 w-4" /></Link></Button></div><section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4" aria-label="Planned pricing plans">{plans.map((plan) => <article key={plan.name} className="flex flex-col rounded-[2rem] border border-[#b9cec3] bg-white p-6 shadow-[0_18px_45px_rgba(18,53,47,0.08)]"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#d48a18]">{plan.name}</p><p className="mt-4 min-h-12 text-sm font-semibold text-[#55736c]"><NairaText>{plan.range}</NairaText></p><p className="mt-6 text-4xl font-bold"><NairaText>{plan.price}</NairaText></p><p className="mt-3 min-h-20 text-sm leading-6 text-[#55736c]">{plan.description}</p><ul className="mt-5 space-y-3 border-t border-[#e0e9e1] pt-5">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-[#3c8d6d]" />{feature}</li>)}</ul><Button asChild variant="outline" className="mt-7 min-h-11 w-full rounded-full border-[#12352f] text-[#12352f] hover:bg-[#edf4ee]"><Link to="/onboarding">File for free <ArrowRight className="h-4 w-4" /></Link></Button></article>)}</section><section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#e4d5b7] bg-[#fff9ed] p-5 text-sm leading-6 text-[#55736c]"><p><strong className="text-[#12352f]">Indicative pricing:</strong> these amounts are planned launch examples, not a payment offer. Final eligibility, included services, and any state or complexity fees will be confirmed before paid plans become available.</p></section></main><PublicFooter /></div>;
};

export default Pricing;
