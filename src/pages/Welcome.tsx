import { Link } from "react-router-dom";
import { Calculator, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import filesmartIcon from "@/assets/filesmart-icon.png";

const features = [
  {
    icon: Calculator,
    title: "Estimate your taxes",
    description: "See what you owe before you file",
  },
  {
    icon: RefreshCcw,
    title: "Track your refund",
    description: "Follow your filing from submission to payout",
  },
];

const Welcome = () => (
  <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
    <div className="w-full max-w-sm flex-1 flex flex-col items-center text-center space-y-6">
      <img src={filesmartIcon} alt="FileSmart" className="h-14 w-14" />

      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl text-foreground">Welcome to FileSmart</h1>
        <p className="text-sm text-muted-foreground">
          Simple tools to file your taxes and track your refund
        </p>
      </div>

      <div className="w-full rounded-2xl gradient-primary h-40" aria-hidden="true" />

      <div className="w-full space-y-3 pt-2">
        <Button asChild className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90">
          <Link to="/login">Sign In</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          New to FileSmart?{" "}
          <Link to="/onboarding" className="text-primary font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>

      <div className="w-full pt-6 space-y-3 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Features</p>
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Welcome;
