import { FormEvent, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth";
import { setPageMetadata } from "@/lib/seo";

const PublicLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setPageMetadata({ title: "Sign in to FileSmart | FileSmart", description: "Sign in to your FileSmart account to review your account and planned pricing.", path: "/login" }), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await signIn(email, password);
      if (!result.success) setError("We couldn't sign you in. Check your details or reset your password.");
    } catch {
      setError("We couldn't reach the account service. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]"><PublicNav /><main className="mx-auto max-w-xl px-5 py-14 sm:px-8 sm:py-20"><section className="rounded-[2rem] border border-[#b9cec3] bg-white p-7 shadow-[0_24px_60px_rgba(18,53,47,0.1)] sm:p-9"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Your FileSmart account</p><h1 className="mt-3 text-3xl font-bold">Sign in</h1><p className="mt-2 text-sm leading-6 text-[#55736c]">View planned pricing and your account. Filing tools will open at launch.</p><form onSubmit={handleSubmit} className="mt-7 space-y-5"><div><Label htmlFor="public-login-email">Email address</Label><Input id="public-login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-11" /></div><div><Label htmlFor="public-login-password">Password</Label><PasswordInput id="public-login-password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-11" /></div>{error && <p role="alert" className="rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a33b2b]">{error}</p>}<Button type="submit" disabled={submitting} className="min-h-11 w-full rounded-full bg-[#12352f] text-white hover:bg-[#1c4e44]">{submitting ? "Signing in…" : "Sign in"} <ArrowRight className="h-4 w-4" /></Button></form><div className="mt-5 flex justify-between gap-3 text-sm"><Link to="/forgot-password" className="font-semibold underline">Forgot password?</Link><Link to="/create-account" className="font-semibold underline">Create account</Link></div></section></main><PublicFooter /></div>;
};

export default PublicLogin;
