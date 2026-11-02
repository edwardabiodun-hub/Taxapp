import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import type { SVGProps } from "react";
import { isFilingLaunchPhase, publicFilingPath } from "@/lib/launch-phase";

const XSocialIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L6.084 4.126H4.117z" />
  </svg>
);

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/filesmartnaija", Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/filesmartnaija/", Icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/filesmart-bridge-iq-ltd/", Icon: Linkedin },
  { label: "X", href: "https://x.com/FileSmartNaija", Icon: XSocialIcon },
] as const;

const PublicFooter = () => (
  <footer className="bg-[#0d2924] text-[#b9d2c5]">
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm sm:px-8 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
      <div>
        <img src="/brand/filesmart-lockup.png" alt="FileSmart" className="h-24 w-auto object-contain brightness-0 invert" />
        <p className="mt-2 max-w-[190px] text-[13px] leading-5 text-[#d3e4dc]">Your connect for smarter, easier tax filing.</p>
        <p className="mt-3 max-w-xs leading-6">Simple tax preparation, with a free place to start.</p>
        <nav className="mt-5 flex items-center gap-2" aria-label="FileSmart social media">
          {socialLinks.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={`FileSmart on ${label}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#b9d2c5]/35 text-[#d3e4dc] transition-colors hover:border-white hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d48a18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d2924]"
            >
              <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            </a>
          ))}
        </nav>
      </div>
      <div><p className="font-semibold text-white">Products</p><nav className="mt-3 flex flex-col items-start gap-1" aria-label="Footer product navigation"><Link to="/calculator" className="min-h-11 inline-flex items-center hover:text-white">Tax calculator</Link><Link to="/filing-directory" className="min-h-11 inline-flex items-center hover:text-white">Filing directory</Link><Link to={isFilingLaunchPhase ? publicFilingPath : "/declare"} className="min-h-11 inline-flex items-center hover:text-white">Prepare taxes</Link><Link to="/learn" className="min-h-11 inline-flex items-center hover:text-white">Tax education</Link><Link to="/pricing" className="min-h-11 inline-flex items-center hover:text-white">Pricing</Link></nav></div>
      <div><p className="font-semibold text-white">Company</p><nav className="mt-3 flex flex-col items-start gap-1" aria-label="Footer company navigation"><Link to="/how-it-works" className="min-h-11 inline-flex items-center hover:text-white">How it works</Link><Link to="/about" className="min-h-11 inline-flex items-center hover:text-white">About FileSmart</Link><Link to="/contact" className="min-h-11 inline-flex items-center hover:text-white">Contact</Link><Link to="/news" className="min-h-11 inline-flex items-center hover:text-white">News</Link><Link to="/learn" className="min-h-11 inline-flex items-center hover:text-white">Tax education</Link></nav></div>
      <div><p className="font-semibold text-white">Legal</p><nav className="mt-3 flex flex-col items-start gap-1" aria-label="Footer legal navigation"><Link to="/privacy" className="min-h-11 inline-flex items-center hover:text-white">Privacy notice</Link><Link to="/terms" className="min-h-11 inline-flex items-center hover:text-white">Terms and conditions</Link><Link to="/disclaimer" className="min-h-11 inline-flex items-center hover:text-white">Disclaimer</Link></nav></div>
    </div>
    <div className="border-t border-white/10"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs sm:px-8 md:flex-row md:items-center md:justify-between"><p>Free to start. Eligibility and filing requirements depend on your applicable tax authority and route.</p><p>General information only. FileSmart is not a substitute for professional tax advice.</p></div></div>
  </footer>
);

export default PublicFooter;
