import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendConfirmationEmail } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const RESEND_COOLDOWN_SECONDS = 30;

const CheckEmail = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const result = await resendConfirmationEmail(email);
      if (!result.success) {
        toast({ title: "Couldn't resend the email", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Email sent", description: `Check ${email} for the confirmation link.` });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display font-bold text-xl text-foreground">Confirm your email</h1>
          <p className="text-sm text-muted-foreground">
            {email ? (
              <>
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{email}</span>. Open it to activate your account.
              </>
            ) : (
              "Check your inbox for a confirmation link to activate your account."
            )}
          </p>
        </div>

        {email && (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full"
          >
            {cooldown > 0 ? `Resend email (${cooldown}s)` : resending ? "Sending…" : "Resend email"}
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          Already confirmed?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CheckEmail;
