import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updatePassword } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { isPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="font-display font-bold text-xl text-foreground">This link no longer works</h1>
          <p className="text-sm text-muted-foreground">
            This reset-password link is invalid or has expired. Request a new one to continue.
          </p>
          <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords don't match";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) {
        toast({ title: "Couldn't update your password", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Password updated", description: "Sign in with your new password." });
      await signOut();
      navigate("/login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1.5">
          <h1 className="font-display font-bold text-xl text-foreground">Set a new password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <KeyRound className="w-4 h-4 text-primary" /> New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(errors.password && "border-destructive")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirm-password"
            className="flex items-center gap-2 text-sm font-medium text-card-foreground"
          >
            <KeyRound className="w-4 h-4 text-primary" /> Confirm password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(errors.confirmPassword && "border-destructive")}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90"
        >
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
