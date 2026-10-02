import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { PreparationStatus } from "@/domain/tax-readiness";
import { usePreparations } from "@/hooks/use-local-data";
import SubmissionCard from "@/components/submissions/SubmissionCard";

const filters: readonly { label: string; status?: PreparationStatus }[] = [
  { label: "All" },
  { label: "Draft", status: "draft" },
  { label: "Ready for review", status: "ready_for_review" },
  { label: "Exported", status: "exported" },
  { label: "User submitted", status: "user_submitted" },
  { label: "Authority confirmed", status: "authority_confirmed" },
];

const Submissions = () => {
  const [active, setActive] = useState("All");
  const navigate = useNavigate();
  const preparations = usePreparations();
  const activeFilter = filters.find((filter) => filter.label === active);
  const filtered = activeFilter?.status
    ? preparations.filter((preparation) => preparation.status === activeFilter.status)
    : preparations;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-4"
    >
      <div>
        <h1 className="font-display font-bold text-lg text-foreground">Preparations and filing status</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Exporting a package does not submit it to a tax authority. Authority confirmation is recorded only with explicit evidence.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Preparation status filters">
        {filters.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={active === f.label}
            onClick={() => setActive(f.label)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
              active === f.label
                ? "gradient-primary text-primary-foreground shadow-card"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">No preparations found.</p>
        )}
        {filtered.map((preparation, i) => {
          const capability = getJurisdictionCapability(preparation.jurisdictionCode);
          return (
          <motion.div
            key={preparation.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <SubmissionCard
              submission={{
                id: preparation.id,
                taxYear: preparation.taxYear,
                type: `${capability.shortName} PIT preparation`,
                status: preparation.status,
                date: new Date(preparation.updatedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                amount: "—",
                capability,
              }}
              onClick={() => navigate(`/submissions/${preparation.id}`)}
            />
          </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Submissions;
