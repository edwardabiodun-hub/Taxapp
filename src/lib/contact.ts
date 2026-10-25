import { supabase } from "./supabase-client";

export type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const safeError = "We couldn't send your message right now. Please try again or email hello@filesmartnaija.com.";

export async function submitContactMessage(message: ContactMessage, website = ""): Promise<void> {
  const { data, error } = await supabase.functions.invoke("contact-message", {
    body: { ...message, website },
  });
  if (error || data?.ok !== true) throw new Error(safeError);
}
