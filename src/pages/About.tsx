import { useEffect } from "react";
import { ArrowRight, HeartHandshake, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import { setPageMetadata } from "@/lib/seo";

const About = () => {
  useEffect(() => setPageMetadata({ title: "About FileSmart | Nigerian tax preparation", description: "Learn why FileSmart is building a calmer, clearer tax preparation experience for people filing in Nigeria.", path: "/about" }), []);

  return <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]"><PublicNav /><main>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">About FileSmart</p><h1 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Tax preparation should meet people where they are.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#55736c]">FileSmart makes personal tax preparation more understandable, approachable, and easier to complete online.</p><Button asChild className="mt-8 min-h-11 rounded-full bg-[#12352f] px-6 text-[#fbfaf5] hover:bg-[#1c4e44]"><Link to="/learn">Explore tax education <ArrowRight className="h-4 w-4" /></Link></Button></div><div className="overflow-hidden rounded-[2rem] border border-[#b9cec3] bg-white shadow-[0_24px_60px_rgba(18,53,47,0.13)]"><img src="/images/filesmart-hero-tax-preparation.png" alt="Woman reviewing tax preparation information at a laptop" className="aspect-[4/3] w-full object-cover" /></div></section>
    <section className="border-y border-[#e0e9e1] bg-[#edf4ee]"><div className="mx-auto grid max-w-6xl gap-5 px-5 py-16 sm:px-8 md:grid-cols-3 lg:py-20"><article className="rounded-3xl bg-[#fbfdf9] p-6"><MapPin className="h-6 w-6 text-[#d48a18]" /><h2 className="mt-5 text-xl font-bold">Rooted in local tax realities</h2><p className="mt-3 leading-7 text-[#55736c]">Our language, examples, and preparation guidance reflect the people and filing requirements we serve.</p></article><article className="rounded-3xl bg-[#fbfdf9] p-6"><HeartHandshake className="h-6 w-6 text-[#d48a18]" /><h2 className="mt-5 text-xl font-bold">Human by design</h2><p className="mt-3 leading-7 text-[#55736c]">We use plain language and clear next steps to reduce friction without pretending tax is one-size-fits-all.</p></article><article className="rounded-3xl bg-[#fbfdf9] p-6"><ShieldCheck className="h-6 w-6 text-[#d48a18]" /><h2 className="mt-5 text-xl font-bold">Clear boundaries</h2><p className="mt-3 leading-7 text-[#55736c]">FileSmart explains what the product can support today and where a tax authority or qualified adviser is still the right source.</p></article></div></section>
  </main><PublicFooter /></div>;
};

export default About;
