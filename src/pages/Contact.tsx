import { FormEvent, useEffect, useState } from "react";
import { Mail, MessageCircle, ArrowRight, LoaderCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage, type ContactMessage } from "@/lib/contact";
import { setPageMetadata } from "@/lib/seo";
import { isFilingLaunchPhase } from "@/lib/launch-phase";

const initialMessage: ContactMessage = { name: "", email: "", subject: "", message: "" };

const Contact = () => {
  const [form, setForm] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => setPageMetadata({ title: "Contact FileSmart | FileSmart", description: "Find support for FileSmart tax preparation questions.", path: "/contact" }), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    setIsSending(true);
    setStatus(null);
    try {
      const website = new FormData(event.currentTarget).get("website");
      await submitContactMessage(form, typeof website === "string" ? website : "");
      setForm(initialMessage);
      setStatus({ type: "success", message: "Thanks—your message has been sent. Our team will reply to the email address you provided." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "We couldn't send your message. Please try again or email hello@filesmartnaija.com.",
      });
    } finally {
      setIsSending(false);
    }
  }

  function updateField(field: keyof ContactMessage, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
      <PublicNav />
      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#d48a18]">Contact FileSmart</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">Need help finding your next step?</h1>
          <p className="mt-5 text-lg leading-8 text-[#55736c]">Ask a general question or send our team a message. We’ll point you toward the right next step.</p>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-5">
            <article className="rounded-3xl border border-[#d7e4d9] bg-white p-6">
              <MessageCircle className="h-6 w-6 text-[#d48a18]" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-bold">Ask tax support</h2>
              <p className="mt-3 leading-7 text-[#55736c]">Use the support assistant for general tax information and help finding where to start.</p>
            </article>
            <article className="rounded-3xl border border-[#d7e4d9] bg-white p-6">
              <Mail className="h-6 w-6 text-[#d48a18]" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-bold">Email our team</h2>
              <p className="mt-3 leading-7 text-[#55736c]">Prefer email? Write to us directly at</p>
              <a className="mt-2 inline-flex min-h-11 items-center font-semibold text-[#11664c] underline underline-offset-4" href="mailto:hello@filesmartnaija.com">hello@filesmartnaija.com</a>
              <Button asChild variant="link" className="mt-2 h-auto min-h-11 px-0 text-[#12352f]">
                <Link to={isFilingLaunchPhase ? "/create-account" : "/onboarding"}>Create a free account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </article>
          </div>

          <section className="rounded-3xl border border-[#d7e4d9] bg-white p-6 sm:p-8" aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading" className="text-2xl font-bold">Send us a message</h2>
            <p className="mt-2 text-[#55736c]">We’ll reply to the email address you provide.</p>
            <p className="mt-4 rounded-xl bg-[#fff7e8] p-4 text-sm leading-6 text-[#72521b]">For your security, don’t include your tax identification number, bank details, passwords, or other sensitive tax or financial information.</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="contact-website">Leave this field empty</label>
                <input id="contact-website" name="website" type="text" defaultValue="" tabIndex={-1} autoComplete="off" />
              </div>
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold">Your name</label>
                <Input id="contact-name" name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={(event) => updateField("name", event.target.value)} />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold">Email address</label>
                <Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </div>
              <div>
                <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold">Subject</label>
                <Input id="contact-subject" name="subject" required minLength={2} maxLength={120} value={form.subject} onChange={(event) => updateField("subject", event.target.value)} />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold">Message</label>
                <Textarea id="contact-message" name="message" required minLength={10} maxLength={4000} rows={6} value={form.message} onChange={(event) => updateField("message", event.target.value)} />
              </div>
              {status && <p role={status.type === "error" ? "alert" : "status"} className={`rounded-xl p-4 text-sm leading-6 ${status.type === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}>{status.message}</p>}
              <Button type="submit" disabled={isSending} className="min-h-12 w-full rounded-full bg-[#12352f] text-white hover:bg-[#1c4e44] sm:w-auto sm:min-w-48">
                {isSending ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</> : <>Send message <Send className="h-4 w-4" aria-hidden="true" /></>}
              </Button>
            </form>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Contact;
