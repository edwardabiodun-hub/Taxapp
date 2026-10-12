import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalPageProps = {
  title: string;
  effectiveDate: string;
  sections: LegalSection[];
  disclaimerTone?: "caution" | "neutral";
};

export const LEGAL_CONFIG = {
  operatorLabel: "Operator identity pending approval",
  privacyContactLabel: "Privacy contact pending approval",
  effectiveDate: "Effective date pending operator approval",
  disputeLanguage: "Dispute-resolution language pending operator and legal approval.",
  contactPlaceholder: "Contact details pending operator approval.",
} as const;

const toneClasses = {
  caution: "border-[#e6c995] bg-[#fff8e8] text-[#684713]",
  neutral: "border-[#dce6df] bg-white text-[#23483f]",
} as const;

const LegalPage = ({ title, effectiveDate, sections, disclaimerTone = "neutral" }: LegalPageProps) => (
  <div className="min-h-screen overflow-x-hidden bg-[#f8f7f3] text-[#12352f]">
    <header className="border-b border-[#dce6df] bg-[#f8f7f3]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#55736c] hover:text-[#12352f]">
          <ArrowLeft className="h-4 w-4" /> FileSmart home
        </Link>
        <span className="font-display text-xl font-bold tracking-tight">FileSmart</span>
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]">FileSmart legal information</p>
      <h1 className="mt-4 break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-sm text-[#55736c]">{effectiveDate}</p>

      <div className={`mt-8 flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${toneClasses[disclaimerTone]}`} role="note">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p><strong>Draft notice:</strong> This legal text requires operator approval before launch and is not finalized legal advice.</p>
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl border border-[#dce6df] bg-white/70 p-5 text-sm leading-6 text-[#55736c] sm:grid-cols-2">
        <p><strong className="text-[#12352f]">Operator:</strong> {LEGAL_CONFIG.operatorLabel}</p>
        <p><strong className="text-[#12352f]">Privacy contact:</strong> {LEGAL_CONFIG.privacyContactLabel}</p>
      </div>

      <article className="mt-10 space-y-8 text-[#23483f]">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#12352f]">{section.heading}</h2>
            <div className="mt-3 space-y-3 leading-7">
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </article>

      <footer className="mt-12 border-t border-[#dce6df] pt-6 text-sm leading-6 text-[#55736c]">
        <p><strong className="text-[#12352f]">Dispute language:</strong> {LEGAL_CONFIG.disputeLanguage}</p>
        <p className="mt-2"><strong className="text-[#12352f]">Contact:</strong> {LEGAL_CONFIG.contactPlaceholder}</p>
      </footer>
    </main>
  </div>
);

export default LegalPage;
