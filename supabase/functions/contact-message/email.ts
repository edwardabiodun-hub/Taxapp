import type { ContactMessage } from "./handler.ts";

export type ContactEmailConfig = { apiKey: string; from: string; fetcher?: typeof fetch };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function createResendContactSender(config: ContactEmailConfig) {
  const fetcher = config.fetcher ?? fetch;
  return async (message: ContactMessage): Promise<void> => {
    const safeName = escapeHtml(message.name);
    const safeEmail = escapeHtml(message.email);
    const safeSubject = escapeHtml(message.subject);
    const safeMessage = escapeHtml(message.message).replace(/\n/g, "<br>");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: config.from,
          to: ["hello@filesmartnaija.com"],
          reply_to: message.email,
          subject: `FileSmart website contact: ${message.subject.replace(/[\r\n]+/g, " ").trim()}`,
          text: `Name: ${message.name}\nEmail: ${message.email}\nSubject: ${message.subject}\n\n${message.message}`,
          html: `<p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Subject:</strong> ${safeSubject}</p><p>${safeMessage}</p>`,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) throw new Error("Email provider rejected the contact request");
  };
}
