import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SupportAssistant from "./SupportAssistant";
import { isFilingLaunchPhase, publicFilingPath } from "@/lib/launch-phase";

const links = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/learn", label: "Tax education" },
  { to: "/about", label: "About FileSmart" },
];

const productLinks = [
  { to: "/calculator", label: "Tax estimator" },
  { to: isFilingLaunchPhase ? publicFilingPath : "/declare", label: "File taxes" },
  { to: isFilingLaunchPhase ? publicFilingPath : "/pricing", label: "Pricing" },
  { to: "/contact", label: "Contact" },
];

const PublicNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#dce6df]/80 bg-[#f8f7f3]/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="inline-flex min-h-11 shrink-0 flex-col items-start justify-center gap-2 py-2" aria-label="FileSmart home">
            <img src="/brand/filesmart-lockup.png" alt="FileSmart brand lockup" className="h-24 w-auto object-contain sm:h-28" />
            <span className="max-w-[190px] text-[13px] leading-5 text-[#55736c]">Your connect for smarter, easier tax filing.</span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm font-medium text-[#55736c] lg:flex" aria-label="Main navigation">
            {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `inline-flex min-h-11 items-center border-b-2 px-1 transition-colors hover:text-[#12352f] ${isActive ? "border-[#d48a18] text-[#12352f]" : "border-transparent"}`}>{link.label}</NavLink>)}
            {productLinks.map((link) => <NavLink key={link.to} to={link.to} className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 hover:text-[#12352f]">{link.label}</NavLink>)}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/#questions" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#55736c] hover:text-[#12352f]">Questions</Link>
            {isFilingLaunchPhase && <Link to="/create-account" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[#55736c] hover:text-[#12352f]">Create free account</Link>}
            <Button asChild className="min-h-11 rounded-full bg-[#12352f] px-5 text-[#fbfaf5] shadow-none hover:bg-[#1c4e44]"><Link to={publicFilingPath}>{isFilingLaunchPhase ? "Join waitlist" : "File for free"} <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>

          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full p-2 text-[#12352f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d48a18] focus-visible:ring-offset-2 lg:hidden" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-navigation" className="border-t border-[#dce6df] px-5 py-4 lg:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm font-semibold">
              <NavLink to="/" className="inline-flex min-h-11 items-center" end>Home</NavLink>
              {links.map((link) => <NavLink key={link.to} to={link.to} className="inline-flex min-h-11 items-center">{link.label}</NavLink>)}
              {productLinks.map((link) => <NavLink key={link.to} to={link.to} className="inline-flex min-h-11 items-center">{link.label}</NavLink>)}
              <Link to="/#questions" className="inline-flex min-h-11 items-center">Questions</Link>
              {isFilingLaunchPhase && <Link to="/create-account" className="inline-flex min-h-11 items-center">Create free account</Link>}
              <Button asChild className="mt-2 min-h-11 w-full rounded-full bg-[#12352f] text-[#fbfaf5]"><Link to={publicFilingPath}>{isFilingLaunchPhase ? "Join waitlist" : "File for free"} <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
          </nav>
        )}
      </header>
      <SupportAssistant />
    </>
  );
};

export default PublicNav;
