import { redirect } from "next/navigation";
import { SettingsClient, type SettingsData } from "./settings-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const defaultPreferences = {
  campaign_alerts: true,
  in_app_campaign_alerts: true,
  in_app_invitations: true,
  in_app_messages: true,
  in_app_video_updates: true,
  invitations: true,
  messages: true,
  video_updates: true,
};

async function getSettingsData(): Promise<SettingsData> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/auth/login?redirectedFrom=/settings");
  }

  const user = session.user;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, avatar_url, deleted_at, last_seen")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.deleted_at) {
    await supabase.auth.signOut();
    redirect("/auth/login?redirectedFrom=/settings");
  }

  const [{ data: preferences }, businessResult, creatorResult] = await Promise.all([
    admin
      .from("email_preferences")
      .select(
        "video_updates, invitations, campaign_alerts, messages, in_app_video_updates, in_app_invitations, in_app_campaign_alerts, in_app_messages",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("businesses")
      .select(
        "id, business_name, category, description, logo_url, website_url, phone_number, address, country",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("creators")
      .select(
        "id, handle, platform, categories, bio, profile_photo_url, phone_number, country, date_of_birth, youtube_connected, youtube_channel_name, tiktok_connected, instagram_connected, needs_reauth",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const role = profile.role as "admin" | "business" | "creator";

  return {
    business: businessResult.data
      ? {
          address: (businessResult.data.address as string | null) ?? "",
          businessName: businessResult.data.business_name as string,
          category: businessResult.data.category as string,
          country: (businessResult.data.country as string | null) ?? "",
          description: (businessResult.data.description as string | null) ?? "",
          logoUrl: (businessResult.data.logo_url as string | null) ?? null,
          phoneNumber: (businessResult.data.phone_number as string | null) ?? "",
          websiteUrl: (businessResult.data.website_url as string | null) ?? "",
        }
      : null,
    creator: creatorResult.data
      ? {
          bio: (creatorResult.data.bio as string | null) ?? "",
          categories: (creatorResult.data.categories as string[] | null) ?? [],
          country: (creatorResult.data.country as string | null) ?? "",
          dateOfBirth: (creatorResult.data.date_of_birth as string | null) ?? "",
          handle: creatorResult.data.handle as string,
          instagramConnected: Boolean(creatorResult.data.instagram_connected),
          needsReauth: Boolean(creatorResult.data.needs_reauth),
          phoneNumber: (creatorResult.data.phone_number as string | null) ?? "",
          platform: creatorResult.data.platform as "instagram" | "tiktok" | "youtube",
          profilePhotoUrl:
            (creatorResult.data.profile_photo_url as string | null) ??
            (profile.avatar_url as string | null) ??
            null,
          tiktokConnected: Boolean(creatorResult.data.tiktok_connected),
          youtubeChannelName:
            (creatorResult.data.youtube_channel_name as string | null) ?? "",
          youtubeConnected: Boolean(creatorResult.data.youtube_connected),
        }
      : null,
    email: user.email ?? "",
    preferences: {
      ...defaultPreferences,
      ...(preferences as Partial<typeof defaultPreferences> | null),
    },
    profile: {
      fullName: profile.full_name as string,
      lastSeen: (profile.last_seen as string | null) ?? null,
      role,
    },
    session: {
      lastActive: new Date().toISOString(),
      userAgent: "Current browser session",
    },
  };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { error?: string; saved?: string; tab?: string };
}) {
  const data = await getSettingsData();

  return (
    <SettingsClient
      data={data}
      initialMessage={searchParams?.saved ?? null}
      initialError={searchParams?.error ?? null}
      initialTab={searchParams?.tab ?? null}
    />
  );
}
