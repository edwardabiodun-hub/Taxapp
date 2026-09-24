import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FilePlus, TrendingUp, FileCheck, DollarSign, ArrowRight, Calculator, RefreshCw, AlertTriangle, Upload } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SubmissionCard from "@/components/submissions/SubmissionCard";
import { useProfile, useDeclarations } from "@/hooks/use-local-data";
import { useSync } from "@/hooks/use-sync";

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
  const profile = useProfile();
  const declarations = useDeclarations();
  const { status: syncStatus, runSync } = useSync();

  const approved = declarations.filter((d) => d.status === "approved").length;
  const pending = declarations.filter((d) => d.status === "submitted" || d.status === "processing" || d.status === "audit_request").length;
  const auditRequests = declarations.filter((d) => d.status === "audit_request");
  const recentSubmissions = declarations.slice(0, 3);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 py-6 max-w-lg mx-auto space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {profile?.name || "Loading..."}
          </h2>
        </div>
        <button
          onClick={runSync}
          disabled={syncStatus === "syncing"}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          title="Sync data"
        >
          <RefreshCw
            className={`w-5 h-5 text-muted-foreground ${syncStatus === "syncing" ? "animate-spin" : ""}`}
          />
        </button>
      </motion.div>

      {/* Sync indicator */}
      {syncStatus === "syncing" && (
        <motion.div variants={item} className="text-xs text-muted-foreground text-center">
          Syncing data…
        </motion.div>
      )}

      {/* Audit Request Banner */}
      {auditRequests.length > 0 && (
        <motion.div
          variants={item}
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-foreground">
                Action Required — Audit Request
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {auditRequests.length === 1
                  ? `Your ${auditRequests[0].type} (${auditRequests[0].taxYear}) needs additional documents.`
                  : `${auditRequests.length} declarations need additional documents from tax authorities.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/submissions")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold py-2.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Respond with Documents
          </button>
        </motion.div>
      )}

      {/* Quick Action */}
      <motion.button
        variants={item}
        onClick={() => navigate("/declare")}
        className="w-full gradient-primary rounded-xl p-5 flex items-center gap-4 text-primary-foreground group"
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
        <StatCard icon={FileCheck} label="Filed" value={String(declarations.length)} subtitle="Total submissions" variant="default" />
        <StatCard icon={TrendingUp} label="Approved" value={String(approved)} subtitle={`${declarations.length ? Math.round((approved / declarations.length) * 100) : 0}% success`} variant="primary" />
        <StatCard icon={DollarSign} label="Tax Paid" value="—" subtitle="This year" variant="default" />
        <StatCard icon={FilePlus} label="Pending" value={String(pending)} subtitle="Awaiting review" variant="accent" />
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
          {recentSubmissions.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">No declarations yet.</p>
          )}
          {recentSubmissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={{
                id: sub.id,
                taxYear: sub.taxYear,
                type: sub.type,
                status: sub.status as any,
                date: new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                amount: sub.amount || "—",
              }}
              onClick={() => navigate(`/submissions/${sub.id}`)}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
