"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const value = getString(formData, key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function redirectWithError(message: string): never {
  redirect(`/business/campaigns/new?error=${encodeURIComponent(message)}`);
}

export async function createCampaign(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/campaigns/new");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (businessError) {
    redirectWithError(businessError.message);
  }

  if (!business) {
    redirect("/business/onboarding");
  }

  const title = getString(formData, "title");
  const brief = getString(formData, "brief");
  const instructions = getString(formData, "instructions");
  const totalBudget = getNumber(formData, "totalBudget");
  const cpmRate = getNumber(formData, "cpmRate");

  if (!title || !brief || !instructions) {
    redirectWithError("Fill in the campaign title, brief, and instructions.");
  }

  if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
    redirectWithError("Enter a total budget greater than 0.");
  }

  if (!Number.isFinite(cpmRate) || cpmRate <= 0) {
    redirectWithError("Enter a CPM rate greater than 0.");
  }

  const { error } = await supabase.from("campaigns").insert({
    business_id: business.id,
    title,
    brief,
    instructions,
    total_budget: totalBudget,
    cpm_rate: cpmRate,
    status: "active",
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/business/dashboard");
  revalidatePath("/business/campaigns");
  redirect("/business/dashboard");
}
