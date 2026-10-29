export interface PricingPlan {
  name: string;
  range: string;
  price: string;
  description: string;
  features: string[];
}

export async function getPricingCatalog(): Promise<PricingPlan[]> {
  try {
    const { supabase } = await import("@/lib/supabase-client");
    const { data, error } = await supabase.functions.invoke("pricing-catalog", { body: {} });
    if (error || !data || !Array.isArray(data.plans)) {
      throw new Error("Pricing is unavailable right now. Please try again later.");
    }
    return data.plans as PricingPlan[];
  } catch {
    throw new Error("Pricing is unavailable right now. Please try again later.");
  }
}
