"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const businessCategories = ["Restaurant", "Hotel", "SaaS", "Retail", "Other"];
const creatorCategories = ["Food", "Travel", "Tech", "Lifestyle", "Fashion", "Other"];

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

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function settingsRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/settings?${search.toString()}`);
}

async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/settings");
  }

  return { supabase, user };
}

async function uploadImage({
  file,
  prefix,
  userId,
}: {
  file: File | null;
  prefix: string;
  userId: string;
}) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    settingsRedirect({ error: "Upload must be an image file.", tab: "profile" });
  }

  const supabase = createClient();
  const extension = safeFileName(file.name).split(".").pop() || "png";
  const path = `${userId}/${prefix}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("logos").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    settingsRedirect({ error: error.message, tab: "profile" });
  }

  return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

export async function updateBusinessProfile(formData: FormData) {
  const { supabase, user } = await getUser();
  const businessName = getString(formData, "businessName");
  const category = getString(formData, "category");
  const description = getString(formData, "description");
  const logo = formData.get("logo");

  if (!businessName || !businessCategories.includes(category)) {
    settingsRedirect({ error: "Add a valid business name and category.", tab: "profile" });
  }

  if (description.length > 300) {
    settingsRedirect({ error: "Description must be 300 characters or fewer.", tab: "profile" });
  }

  const logoUrl = await uploadImage({
    file: logo instanceof File ? logo : null,
    prefix: "logo",
    userId: user.id,
  });

  const payload: Record<string, string | null> = {
    address: getString(formData, "address") || null,
    business_name: businessName,
    category,
    country: getString(formData, "country") || null,
    description: description || null,
    phone_number: getString(formData, "phoneNumber") || null,
    website_url: getString(formData, "websiteUrl") || null,
  };

  if (logoUrl) {
    payload.logo_url = logoUrl;
  }

  const { error } = await supabase
    .from("businesses")
    .update(payload)
    .eq("user_id", user.id);

  if (error) {
    settingsRedirect({ error: error.message, tab: "profile" });
  }

  revalidatePath("/", "layout");
  settingsRedirect({ saved: "profile", tab: "profile" });
}

export async function updateCreatorProfile(formData: FormData) {
  const { supabase, user } = await getUser();
  const displayName = getString(formData, "displayName");
  const handle = normalizeHandle(getString(formData, "handle"));
  const bio = getString(formData, "bio");
  const categories = getStrings(formData, "categories");
  const photo = formData.get("profilePhoto");

  if (!displayName || !handle) {
    settingsRedirect({ error: "Display name and handle are required.", tab: "profile" });
  }

  if (bio.length > 200) {
    settingsRedirect({ error: "Bio must be 200 characters or fewer.", tab: "profile" });
  }

  if (!categories.length || categories.some((category) => !creatorCategories.includes(category))) {
    settingsRedirect({ error: "Choose at least one valid category.", tab: "profile" });
  }

  const photoUrl = await uploadImage({
    file: photo instanceof File ? photo : null,
    prefix: "profile",
    userId: user.id,
  });

  const [{ error: profileError }, creatorResult] = await Promise.all([
    supabase.from("profiles").update({ full_name: displayName }).eq("id", user.id),
    supabase
      .from("creators")
      .update({
        bio: bio || null,
        categories,
        country: getString(formData, "country") || null,
        date_of_birth: getString(formData, "dateOfBirth") || null,
        handle,
        phone_number: getString(formData, "phoneNumber") || null,
        ...(photoUrl ? { profile_photo_url: photoUrl } : {}),
      })
      .eq("user_id", user.id),
  ]);

  if (profileError || creatorResult.error) {
    settingsRedirect({
      error: profileError?.message ?? creatorResult.error?.message ?? "Could not update profile.",
      tab: "profile",
    });
  }

  revalidatePath("/", "layout");
  settingsRedirect({ saved: "profile", tab: "profile" });
}

export async function updateEmailPreferences(formData: FormData) {
  const { user } = await getUser();
  const admin = createAdminClient();
  const { error } = await admin.from("email_preferences").upsert({
    campaign_alerts: formData.get("campaign_alerts") === "on",
    in_app_campaign_alerts: formData.get("in_app_campaign_alerts") === "on",
    in_app_invitations: formData.get("in_app_invitations") === "on",
    in_app_messages: formData.get("in_app_messages") === "on",
    in_app_video_updates: formData.get("in_app_video_updates") === "on",
    invitations: formData.get("invitations") === "on",
    messages: formData.get("messages") === "on",
    updated_at: new Date().toISOString(),
    user_id: user.id,
    video_updates: formData.get("video_updates") === "on",
  });

  if (error) {
    settingsRedirect({ error: "Could not save preferences.", tab: "notifications" });
  }

  revalidatePath("/settings");
  settingsRedirect({ saved: "notifications", tab: "notifications" });
}

export async function markAllNotificationsRead() {
  const { user } = await getUser();
  const admin = createAdminClient();
  await admin.from("notifications").update({ read: true }).eq("user_id", user.id);
  revalidatePath("/settings");
  settingsRedirect({ saved: "notifications_read", tab: "notifications" });
}

export async function changeEmail(formData: FormData) {
  const { supabase } = await getUser();
  const email = getString(formData, "newEmail");

  if (!email || !email.includes("@")) {
    settingsRedirect({ error: "Enter a valid email address.", tab: "account" });
  }

  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    settingsRedirect({ error: error.message, tab: "account" });
  }

  settingsRedirect({ saved: "email", tab: "account" });
}

export async function changePassword(formData: FormData) {
  const { supabase, user } = await getUser();
  const currentPassword = getString(formData, "currentPassword");
  const newPassword = getString(formData, "newPassword");
  const confirmPassword = getString(formData, "confirmPassword");

  const email = user.email;

  if (!email || !currentPassword) {
    settingsRedirect({ error: "Current password is required.", tab: "account" });
  }

  if (newPassword !== confirmPassword) {
    settingsRedirect({ error: "New passwords do not match.", tab: "account" });
  }

  if (newPassword.length < 8 || !/\d/.test(newPassword)) {
    settingsRedirect({
      error: "Password must be at least 8 characters and include a number.",
      tab: "account",
    });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    settingsRedirect({ error: "Current password is incorrect.", tab: "account" });
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    settingsRedirect({ error: error.message, tab: "account" });
  }

  settingsRedirect({ saved: "password", tab: "account" });
}

export async function disconnectPlatform(formData: FormData) {
  const { supabase, user } = await getUser();
  const platform = getString(formData, "platform");
  const updates: Record<string, boolean | null> = {};

  if (platform === "youtube") {
    updates.youtube_connected = false;
    updates.youtube_channel_name = null;
  } else if (platform === "tiktok") {
    updates.tiktok_connected = false;
  } else if (platform === "instagram") {
    updates.instagram_connected = false;
  } else {
    settingsRedirect({ error: "Unknown platform.", tab: "platforms" });
  }

  const { error } = await supabase.from("creators").update(updates).eq("user_id", user.id);

  if (error) {
    settingsRedirect({ error: error.message, tab: "platforms" });
  }

  revalidatePath("/settings");
  settingsRedirect({ saved: "platform", tab: "platforms" });
}

export async function deleteAccount(formData: FormData) {
  const { supabase, user } = await getUser();
  const confirmation = getString(formData, "confirmation");

  if (confirmation !== "DELETE") {
    settingsRedirect({ error: "Type DELETE to confirm account deletion.", tab: "danger" });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    settingsRedirect({ error: error.message, tab: "danger" });
  }

  await supabase.auth.signOut();
  redirect("/");
}
