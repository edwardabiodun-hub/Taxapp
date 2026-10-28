import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listFilingDirectoryEntries } from "@/domain/filing-directory";
import { setPageMetadata } from "@/lib/seo";

const statusLabel = (status: "verified" | "not_verified") =>
  status === "verified" ? "Verified" : "Not verified yet";

const FilingDirectory = () => {
  const [query, setQuery] = useState("");
  const entries = listFilingDirectoryEntries();
  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return entries;
    return entries.filter(({ name, shortName }) =>
      `${name} ${shortName}`.toLowerCase().includes(normalizedQuery),
    );
  }, [entries, query]);

  useEffect(() => setPageMetadata({
    title: "State filing directory | FileSmart",
    description: "Check the evidence status for online tax services and individual PIT filing routes across Nigeria.",
    path: "/filing-directory",
  }), []);

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">State filing directory</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">Know what has actually been verified.</h1>
          <p className="mt-5 text-lg leading-8 text-[#55736c]">
            We are building a source-backed directory of state tax services. Online tax submission and individual PIT filing are tracked separately so a generic preparation export is never mistaken for a direct authority connection.
          </p>
        </div>

        <section className="mt-10 rounded-3xl border border-[#e4d5b7] bg-[#fff9ed] p-6 sm:p-8" aria-labelledby="directory-status-heading">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[#b06b12]" aria-hidden="true" />
            <div>
              <h2 id="directory-status-heading" className="text-xl font-bold">Evidence-first status</h2>
              <p className="mt-2 leading-7 text-[#55736c]">No jurisdiction is marked as supported here until the relevant authority source, online service, and individual PIT workflow have been checked. Until then, FileSmart can prepare generic records and exports, but does not claim that those exports are direct filing submissions.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="min-h-11 rounded-full bg-[#12352f] text-white hover:bg-[#1c4e44]"><Link to="/calculator">Use the tax estimator <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline" className="min-h-11 rounded-full"><Link to="/contact">Tell us about a verified portal <ExternalLink className="h-4 w-4" /></Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="directory-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="directory-heading" className="text-2xl font-bold">All jurisdictions</h2>
              <p className="mt-1 text-[#55736c]">{visibleEntries.length} of {entries.length} jurisdictions shown</p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <label htmlFor="filing-directory-search" className="sr-only">Search jurisdictions</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#55736c]" aria-hidden="true" />
              <Input id="filing-directory-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a state or FCT" className="min-h-11 pl-9" />
            </div>
          </div>

          {visibleEntries.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleEntries.map((entry) => (
                <article key={entry.jurisdictionCode} className="rounded-2xl border border-[#d7e4d9] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b06b12]">{entry.jurisdictionCode}</p>
                      <h3 className="mt-2 text-lg font-bold">{entry.name}</h3>
                    </div>
                    <span className="rounded-full bg-[#edf4ee] px-3 py-1 text-xs font-semibold text-[#55736c]">Directory entry</span>
                  </div>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4 border-t border-[#edf1ec] pt-3"><dt className="text-[#55736c]">Online tax submission</dt><dd className="text-right font-semibold">{statusLabel(entry.onlineTaxSubmission)}</dd></div>
                    <div className="flex items-start justify-between gap-4 border-t border-[#edf1ec] pt-3"><dt className="text-[#55736c]">Individual PIT filing</dt><dd className="text-right font-semibold">{statusLabel(entry.individualPitSubmission)}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-[#d7e4d9] bg-white p-6 text-[#55736c]">No jurisdiction matches that search.</p>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default FilingDirectory;
