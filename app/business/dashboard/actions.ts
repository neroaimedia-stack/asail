"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setCampaignStatus(formData: FormData) {
  const campaignId = formData.get("campaignId");
  const nextStatus = formData.get("nextStatus");

  if (typeof campaignId !== "string" || typeof nextStatus !== "string") {
    redirect("/business/dashboard");
  }

  if (!["active", "paused"].includes(nextStatus)) {
    redirect("/business/dashboard");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/dashboard");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  await supabase
    .from("campaigns")
    .update({ status: nextStatus })
    .eq("id", campaignId)
    .eq("business_id", business.id);

  revalidatePath("/business/dashboard");
}
