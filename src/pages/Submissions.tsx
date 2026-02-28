import { motion } from "framer-motion";
import SubmissionCard, { SubmissionItem } from "@/components/submissions/SubmissionCard";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockData: SubmissionItem[] = [
  { id: "1", taxYear: "2025", type: "Income Tax", status: "approved", date: "15 Jan 2026", amount: "KES 45,200" },
  { id: "2", taxYear: "2025", type: "VAT Return", status: "processing", date: "28 Feb 2026", amount: "NGN 120,000" },
  { id: "3", taxYear: "2024", type: "Income Tax", status: "submitted", date: "10 Feb 2026", amount: "GHS 8,500" },
  { id: "4", taxYear: "2024", type: "Corporate Tax", status: "approved", date: "01 Dec 2025", amount: "KES 180,000" },
  { id: "5", taxYear: "2023", type: "PAYE", status: "rejected", date: "15 Jun 2024", amount: "ZAR 22,000" },
  { id: "6", taxYear: "2023", type: "Income Tax", status: "approved", date: "20 Mar 2024", amount: "KES 52,800" },
];

const filters = ["All", "Submitted", "Processing", "Approved", "Rejected"] as const;

const Submissions = () => {
  const [active, setActive] = useState<string>("All");

  const filtered = active === "All" ? mockData : mockData.filter((s) => s.status === active.toLowerCase());

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
            <SubmissionCard submission={sub} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Submissions;
