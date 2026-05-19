"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getBusinessId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/review");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/business/onboarding");
  }

  return { businessId: business.id as string, supabase };
}

async function canReviewVideo(videoId: string, businessId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("videos")
    .select("id, campaigns!inner(business_id)")
    .eq("id", videoId)
    .eq("status", "pending")
    .eq("campaigns.business_id", businessId)
    .maybeSingle();

  return Boolean(data);
}

export async function acceptVideo(formData: FormData) {
  const videoId = formData.get("videoId");

  if (typeof videoId !== "string") {
    redirect("/business/review");
  }

  const { businessId, supabase } = await getBusinessId();

  if (!(await canReviewVideo(videoId, businessId))) {
    redirect("/business/review");
  }

  await supabase
    .from("videos")
    .update({
      reviewed_at: new Date().toISOString(),
      status: "accepted",
    })
    .eq("id", videoId);

  revalidatePath("/business/review");
  revalidatePath("/business/dashboard");
}

export async function rejectVideo(formData: FormData) {
  const videoId = formData.get("videoId");
  const rejectionReason = formData.get("rejectionReason");

  if (typeof videoId !== "string") {
    redirect("/business/review");
  }

  const reason =
    typeof rejectionReason === "string" ? rejectionReason.trim() : "";

  if (!reason) {
    redirect("/business/review?error=Add%20a%20rejection%20reason.");
  }

  const { businessId, supabase } = await getBusinessId();

  if (!(await canReviewVideo(videoId, businessId))) {
    redirect("/business/review");
  }

  await supabase
    .from("videos")
    .update({
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      status: "rejected",
    })
    .eq("id", videoId);

  revalidatePath("/business/review");
  revalidatePath("/business/dashboard");
}
