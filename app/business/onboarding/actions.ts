"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const businessCategories = ["Restaurant", "Hotel", "SaaS", "Retail", "Other"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/business/onboarding?error=${encodeURIComponent(message)}`);
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function completeBusinessOnboarding(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/onboarding");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "business") {
    redirectWithError("Business onboarding is only available to business users.");
  }

  const businessName = getString(formData, "businessName");
  const category = getString(formData, "category");
  const description = getString(formData, "description");
  const logo = formData.get("logo");

  if (!businessName) {
    redirectWithError("Business name is required.");
  }

  if (!businessCategories.includes(category)) {
    redirectWithError("Choose a valid business category.");
  }

  if (description.length > 300) {
    redirectWithError("Short description must be 300 characters or fewer.");
  }

  let logoUrl: string | null = null;

  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) {
      redirectWithError("Logo must be an image file.");
    }

    const extension = safeFileName(logo.name).split(".").pop() || "png";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, logo, {
        cacheControl: "3600",
        upsert: true,
        contentType: logo.type,
      });

    if (uploadError) {
      redirectWithError(uploadError.message);
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    logoUrl = data.publicUrl;
  }

  const { error } = await supabase.from("businesses").insert({
    user_id: user.id,
    business_name: businessName,
    category,
    description: description || null,
    logo_url: logoUrl,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/business/dashboard");
}
