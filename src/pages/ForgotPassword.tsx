import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resetPasswordForEmail } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      const result = await resetPasswordForEmail(email, `${window.location.origin}/reset-password`);
      // Always show the same confirmation on success, whether or not the
      // email is registered — this can't be used to probe which emails
      // have accounts.
      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        toast({ title: "Something went wrong", description: result.error, variant: "destructive" });
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="font-display font-bold text-xl text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a
            link to reset your password.
          </p>
          <Link to="/login" className="text-sm text-primary font-medium hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1.5">
          <h1 className="font-display font-bold text-xl text-foreground">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <Mail className="w-4 h-4 text-primary" /> Email
          </Label>
          <Input
            type="email"
            autoComplete="username"
            placeholder="amara@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(error && "border-destructive")}
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
