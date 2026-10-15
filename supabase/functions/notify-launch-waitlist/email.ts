import type { PendingLaunchWaitlistEntry } from "./handler.ts";

export interface ResendEmailConfig {
  apiKey: string;
  from: string;
  appOrigin: string;
  fetcher?: typeof fetch;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function validateAppOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("APP_ORIGIN must be an HTTPS origin without a path");
  }
  return url.origin;
}

export function createResendWaitlistSender(config: ResendEmailConfig) {
  const fetcher = config.fetcher ?? fetch;
  const appOrigin = validateAppOrigin(config.appOrigin);

  return async (entry: PendingLaunchWaitlistEntry): Promise<void> => {
    const name = entry.name?.trim();
    const greeting = name ? `Hello ${name},` : "Hello,";
    const destination = `${appOrigin}/onboarding`;
    const text = `${greeting}\n\nFileSmart tax filing is now open. You can start your guided tax preparation here: ${destination}\n\nThis message was sent because you asked to be notified when FileSmart filing opened.`;
    const html = `<p>${escapeHtml(greeting)}</p><p>FileSmart tax filing is now open. You can start your guided tax preparation here:</p><p><a href="${escapeHtml(destination)}">Open FileSmart</a></p><p>This message was sent because you asked to be notified when FileSmart filing opened.</p>`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          "content-type": "application/json",
          "idempotency-key": `filesmart-launch-${entry.id}`,
        },
        body: JSON.stringify({
          from: config.from,
          to: [entry.email],
          subject: "FileSmart tax filing is now open",
          text,
          html,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) throw new Error("Email provider rejected the launch notification");
  };
}
