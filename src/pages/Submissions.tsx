import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { PreparationStatus } from "@/domain/tax-readiness";
import { useSubmissionRecords } from "@/hooks/use-local-data";
import SubmissionCard from "@/components/submissions/SubmissionCard";

const filters: readonly {
  label: string;
  status?: PreparationStatus;
  legacy?: boolean;
}[] = [
  { label: "All" },
  { label: "Draft", status: "draft" },
  { label: "Ready for review", status: "ready_for_review" },
  { label: "Exported", status: "exported" },
  { label: "User submitted", status: "user_submitted" },
  { label: "Authority confirmed", status: "authority_confirmed" },
  { label: "Legacy records", legacy: true },
];

const Submissions = () => {
  const [active, setActive] = useState("All");
  const navigate = useNavigate();
  const records = useSubmissionRecords();
  const activeFilter = filters.find((filter) => filter.label === active);
  const filtered = records.filter((record) => {
    if (!activeFilter?.status && !activeFilter?.legacy) return true;
    if (activeFilter.legacy) return record.kind === "legacy";
    return record.kind === "preparation" && record.preparation.status === activeFilter.status;
  });

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
        {filtered.map((record, i) => {
          const preparation = record.kind === "preparation" ? record.preparation : undefined;
          const declaration = record.kind === "legacy" ? record.declaration : record.legacy;
          const jurisdictionCode = preparation?.jurisdictionCode || declaration?.country || "NG";
          const capability = getJurisdictionCapability(jurisdictionCode);
          return (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <SubmissionCard
              submission={{
                id: record.id,
                taxYear: preparation?.taxYear || declaration?.taxYear || "—",
                type: preparation ? `${capability.shortName} PIT preparation` : declaration?.type || "Legacy declaration",
                status: preparation?.status || declaration?.status || "draft",
                date: new Date(preparation?.updatedAt || declaration?.updatedAt || declaration?.createdAt || "").toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                amount: declaration?.amount || "—",
                capability,
              }}
              onClick={() => navigate(`/submissions/${record.id}`)}
            />
          </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Submissions;
