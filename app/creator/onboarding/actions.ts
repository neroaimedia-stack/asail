"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const platforms = ["tiktok", "instagram", "youtube"];
const categories = ["Food", "Travel", "Tech", "Lifestyle", "Fashion", "Other"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getStrings(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeHandle(value: string) {
  const handle = value.replace(/^@+/, "").trim();
  return handle ? `@${handle}` : "";
}

function redirectWithError(message: string): never {
  redirect(`/creator/onboarding?error=${encodeURIComponent(message)}`);
}

export async function completeCreatorOnboarding(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/creator/onboarding");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "creator") {
    redirectWithError("Creator onboarding is only available to creator users.");
  }

  const displayName = getString(formData, "displayName");
  const platform = getString(formData, "platform");
  const handle = normalizeHandle(getString(formData, "handle"));
  const selectedCategories = getStrings(formData, "categories");
  const bio = getString(formData, "bio");

  if (!displayName) {
    redirectWithError("Display name is required.");
  }

  if (!platforms.includes(platform)) {
    redirectWithError("Choose a valid platform.");
  }

  if (!handle) {
    redirectWithError("Handle is required.");
  }

  if (
    selectedCategories.length === 0 ||
    selectedCategories.some((category) => !categories.includes(category))
  ) {
    redirectWithError("Choose at least one valid content category.");
  }

  if (bio.length > 200) {
    redirectWithError("Short bio must be 200 characters or fewer.");
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ full_name: displayName })
    .eq("id", user.id);

  if (profileUpdateError) {
    redirectWithError(profileUpdateError.message);
  }

  const { error } = await supabase.from("creators").insert({
    bio: bio || null,
    categories: selectedCategories,
    handle,
    platform,
    user_id: user.id,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/creator/browse");
}
