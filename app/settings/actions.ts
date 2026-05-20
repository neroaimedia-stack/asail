"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateEmailPreferences(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/settings");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("email_preferences").upsert({
    campaign_alerts: formData.get("campaign_alerts") === "on",
    invitations: formData.get("invitations") === "on",
    messages: formData.get("messages") === "on",
    user_id: user.id,
    video_updates: formData.get("video_updates") === "on",
  });

  if (error) {
    redirect("/settings?error=Could%20not%20save%20preferences.");
  }

  revalidatePath("/settings");
  revalidatePath("/business/settings");
  revalidatePath("/creator/settings");
  redirect("/settings?saved=1");
}
