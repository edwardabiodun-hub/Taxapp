import { useState } from "react";
import { Lock, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signIn } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setChecking(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        // AuthContext picks up a successful sign-in automatically via
        // Supabase's onAuthStateChange — nothing to do here on success.
        setError("Incorrect email or password.");
        toast({ title: "Incorrect email or password", variant: "destructive" });
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1.5">
          <div className="mx-auto w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-xl text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your tax records</p>
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
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <KeyRound className="w-4 h-4 text-primary" /> Password
          </Label>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(error && "border-destructive")}
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={checking}
          className="w-full gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90"
        >
          {checking ? "Checking…" : "Unlock"}
        </Button>
      </form>
    </div>
  );
};

export default Login;
