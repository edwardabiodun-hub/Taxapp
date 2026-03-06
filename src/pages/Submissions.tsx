import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDeclarations } from "@/hooks/use-local-data";
import SubmissionCard from "@/components/submissions/SubmissionCard";

const filters = ["All", "Draft", "Submitted", "Processing", "Audit Request", "Approved"] as const;

const Submissions = () => {
  const [active, setActive] = useState<string>("All");
  const allDeclarations = useDeclarations();

  const filtered =
    active === "All"
      ? allDeclarations
      : allDeclarations.filter((d) => d.status === active.toLowerCase().replace(" ", "_"));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-4"
    >
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
              active === f
                ? "gradient-primary text-primary-foreground shadow-card"
                : "bg-muted text-muted-foreground hover:bg-primary/10"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">No submissions found.</p>
        )}
        {filtered.map((sub, i) => (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <SubmissionCard
              submission={{
                id: sub.id,
                taxYear: sub.taxYear,
                type: sub.type,
                status: sub.status as any,
                date: new Date(sub.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                amount: sub.amount || "—",
              }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Submissions;
