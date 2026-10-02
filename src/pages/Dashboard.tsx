import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FilePlus, TrendingUp, FileCheck, FileText, ArrowRight, Calculator, RefreshCw, AlertTriangle, Upload } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SubmissionCard from "@/components/submissions/SubmissionCard";
import DeadlineCard from "@/components/deadlines/DeadlineCard";
import { useProfile, useDeclarations, usePreparations, useSubmissionRecords } from "@/hooks/use-local-data";
import { useSync } from "@/hooks/use-sync";
import { getJurisdictionCapability, listNigeriaJurisdictions } from "@/data/jurisdiction-registry";
import { resolveDeadline } from "@/lib/deadline-service";

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
  const preparations = usePreparations();
  const submissionRecords = useSubmissionRecords();
  const { status: syncStatus, runSync } = useSync();

  const latestPreparation = preparations[0];
  const latestCapability = latestPreparation
    ? getJurisdictionCapability(latestPreparation.jurisdictionCode)
    : undefined;
  const dashboardDeadline = latestPreparation?.jurisdictionCode
    ? resolveDeadline(
        latestCapability ?? getJurisdictionCapability("NG-UNKNOWN"),
        latestPreparation.taxYear,
      )
    : null;

  const auditRequests = declarations.filter((d) => d.status === "audit_request");
  const readyPreparations = preparations.filter((preparation) => preparation.status === "ready_for_review").length;
  const exportedPreparations = preparations.filter((preparation) => preparation.status === "exported").length;
  const recentRecords = submissionRecords.slice(0, 3);

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

      <motion.div variants={item}>
        <DeadlineCard deadline={dashboardDeadline} />
      </motion.div>

      <motion.div variants={item} className="rounded-2xl border border-border/70 bg-card p-4 shadow-card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display font-bold text-sm text-card-foreground">Preparation overview</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Choose any Nigerian jurisdiction, prepare locally, and export a package for your own review.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
            Local-first
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted/60 px-2 py-2">
            <p className="text-lg font-display font-bold text-foreground">{preparations.length}</p>
            <p className="text-[10px] text-muted-foreground">Saved</p>
          </div>
          <div className="rounded-xl bg-muted/60 px-2 py-2">
            <p className="text-lg font-display font-bold text-foreground">{readyPreparations}</p>
            <p className="text-[10px] text-muted-foreground">Ready to review</p>
          </div>
          <div className="rounded-xl bg-muted/60 px-2 py-2">
            <p className="text-lg font-display font-bold text-foreground">{exportedPreparations}</p>
            <p className="text-[10px] text-muted-foreground">Exported</p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {latestPreparation && latestCapability
            ? `${latestCapability.name}: ${latestPreparation.calculationLabel} · ${latestCapability.primaryReadiness}.`
            : `${listNigeriaJurisdictions().length} Nigerian jurisdictions are available for generic preparation.`}
        </p>
      </motion.div>

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
        className="w-full gradient-hero rounded-2xl p-5 flex items-center gap-4 shadow-elevated text-primary-foreground group"
      >
        <div className="p-3 rounded-xl bg-background/15">
          <FilePlus className="w-6 h-6" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display font-bold text-lg">Start a preparation</p>
          <p className="text-sm opacity-80">Choose a jurisdiction and save your work locally</p>
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
          <p className="text-xs opacity-80">Explore a generic Nigerian PIT estimate</p>
        </div>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <StatCard icon={FileCheck} label="Preparations" value={String(preparations.length)} subtitle="Saved locally" variant="default" />
        <StatCard icon={TrendingUp} label="Ready" value={String(readyPreparations)} subtitle="For your review" variant="primary" />
        <StatCard icon={FileText} label="Exported" value={String(exportedPreparations)} subtitle="Packages created" variant="default" />
        <StatCard icon={FilePlus} label="Jurisdictions" value={String(listNigeriaJurisdictions().length)} subtitle="Generic preparation" variant="accent" />
      </motion.div>

      {/* Recent */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-foreground">Recent preparations</h3>
          <button
            onClick={() => navigate("/submissions")}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </button>
        </div>
        <div className="space-y-2">
          {recentRecords.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">No preparations yet.</p>
          )}
          {recentRecords.map((record) => {
            const preparation = record.kind === "preparation" ? record.preparation : undefined;
            const declaration = record.kind === "legacy" ? record.declaration : record.legacy;
            const capability = getJurisdictionCapability(preparation?.jurisdictionCode || declaration?.country || "NG-UNKNOWN");
            return (
              <SubmissionCard
                key={record.id}
                submission={{
                  id: record.id,
                  taxYear: preparation?.taxYear || declaration?.taxYear || "—",
                  type: preparation ? `${capability.shortName} PIT preparation` : declaration?.type || "Legacy declaration",
                  status: preparation?.status || declaration?.status || "draft",
                  date: new Date(preparation?.updatedAt || declaration?.updatedAt || declaration?.createdAt || "").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                  amount: declaration?.amount || "—",
                  calculationLabel: preparation?.calculationLabel,
                  readiness: preparation?.filingReadiness,
                  exportFormats: preparation?.status === "exported" ? ["PDF", "CSV", "XLSX"] : undefined,
                }}
                onClick={() => navigate(`/submissions/${record.id}`)}
              />
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
