import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FilePlus, TrendingUp, FileCheck, DollarSign, ArrowRight, Calculator } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SubmissionCard, { SubmissionItem } from "@/components/submissions/SubmissionCard";

const mockSubmissions: SubmissionItem[] = [
  { id: "1", taxYear: "2025", type: "Income Tax", status: "approved", date: "15 Jan 2026", amount: "KES 45,200" },
  { id: "2", taxYear: "2025", type: "VAT Return", status: "processing", date: "28 Feb 2026", amount: "NGN 120,000" },
  { id: "3", taxYear: "2024", type: "Income Tax", status: "submitted", date: "10 Feb 2026", amount: "GHS 8,500" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 py-6 max-w-lg mx-auto space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={item}>
        <p className="text-muted-foreground text-sm">Welcome back,</p>
        <h2 className="text-2xl font-display font-bold text-foreground">Amara Okafor</h2>
      </motion.div>

      {/* Quick Action */}
      <motion.button
        variants={item}
        onClick={() => navigate("/declare")}
        className="w-full gradient-hero rounded-2xl p-5 flex items-center gap-4 shadow-elevated text-primary-foreground group"
      >
        <div className="p-3 rounded-xl bg-background/15">
          <FilePlus className="w-6 h-6" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display font-bold text-lg">New Tax Declaration</p>
          <p className="text-sm opacity-80">File your taxes quickly & easily</p>
        </div>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Tax Calculator */}
      <motion.button
        variants={item}
        onClick={() => navigate("/calculator")}
        className="w-full gradient-accent rounded-2xl p-4 flex items-center gap-4 shadow-card text-accent-foreground group"
      >
        <div className="p-2.5 rounded-xl bg-background/15">
          <Calculator className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display font-bold">Tax Estimator</p>
          <p className="text-xs opacity-80">Calculate your liability before filing</p>
        </div>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <StatCard icon={FileCheck} label="Filed" value="12" subtitle="Total submissions" variant="default" />
        <StatCard icon={TrendingUp} label="Approved" value="10" subtitle="83% success" variant="primary" />
        <StatCard icon={DollarSign} label="Tax Paid" value="KES 320K" subtitle="This year" variant="default" />
        <StatCard icon={FilePlus} label="Pending" value="2" subtitle="Awaiting review" variant="accent" />
      </motion.div>

      {/* Recent */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-foreground">Recent Submissions</h3>
          <button
            onClick={() => navigate("/submissions")}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </button>
        </div>
        <div className="space-y-2">
          {mockSubmissions.map((sub) => (
            <SubmissionCard key={sub.id} submission={sub} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
