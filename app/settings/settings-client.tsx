"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  changeEmail,
  changePassword,
  deleteAccount,
  disconnectPlatform,
  markAllNotificationsRead,
  updateBusinessProfile,
  updateCreatorProfile,
  updateEmailPreferences,
} from "./actions";

type TabId = "account" | "danger" | "notifications" | "platforms" | "profile";

export type SettingsData = {
  business: {
    address: string;
    businessName: string;
    category: string;
    country: string;
    description: string;
    logoUrl: string | null;
    phoneNumber: string;
    websiteUrl: string;
  } | null;
  creator: {
    bio: string;
    categories: string[];
    country: string;
    dateOfBirth: string;
    handle: string;
    instagramConnected: boolean;
    needsReauth: boolean;
    phoneNumber: string;
    platform: "instagram" | "tiktok" | "youtube";
    profilePhotoUrl: string | null;
    tiktokConnected: boolean;
    youtubeChannelName: string;
    youtubeConnected: boolean;
  } | null;
  email: string;
  preferences: {
    campaign_alerts: boolean;
    in_app_campaign_alerts: boolean;
    in_app_invitations: boolean;
    in_app_messages: boolean;
    in_app_video_updates: boolean;
    invitations: boolean;
    messages: boolean;
    video_updates: boolean;
  };
  profile: {
    fullName: string;
    lastSeen: string | null;
    role: "admin" | "business" | "creator";
  };
  session: {
    lastActive: string;
    userAgent: string;
  };
};

const businessCategories = ["Restaurant", "Hotel", "SaaS", "Retail", "Other"];
const creatorCategories = ["Food", "Travel", "Tech", "Lifestyle", "Fashion", "Other"];
const tabs: Array<{ creatorOnly?: boolean; id: TabId; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { creatorOnly: true, id: "platforms", label: "Connected platforms" },
  { id: "danger", label: "Danger zone" },
];

function formatPlatform(value: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
  };

  return labels[value] ?? value;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Current session";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SettingsClient({
  data,
  initialError,
  initialMessage,
  initialTab,
}: {
  data: SettingsData;
  initialError: string | null;
  initialMessage: string | null;
  initialTab: string | null;
}) {
  const availableTabs = tabs.filter(
    (tab) => !tab.creatorOnly || data.profile.role === "creator",
  );
  const [activeTab, setActiveTab] = useState<TabId>(
    availableTabs.some((tab) => tab.id === initialTab)
      ? (initialTab as TabId)
      : "profile",
  );
  const [bio, setBio] = useState(data.creator?.bio ?? "");
  const [description, setDescription] = useState(data.business?.description ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isBusiness = data.profile.role === "business";
  const isCreator = data.profile.role === "creator";
  const accent = isBusiness
    ? "bg-[#fff8ed] text-amber-950"
    : "bg-indigo-50 text-slate-950";
  const successText = useMemo(() => {
    if (!initialMessage) {
      return null;
    }

    if (initialMessage === "profile") {
      return "Profile updated.";
    }

    if (initialMessage === "notifications") {
      return "Notification preferences saved.";
    }

    if (initialMessage === "notifications_read") {
      return "All notifications marked as read.";
    }

    if (initialMessage === "email") {
      return "Verification sent to your new email.";
    }

    if (initialMessage === "password") {
      return "Password updated.";
    }

    if (initialMessage === "platform") {
      return "Platform disconnected.";
    }

    return "Settings updated.";
  }, [initialMessage]);

  return (
    <main className={`min-h-screen px-5 py-7 md:px-8 ${accent}`}>
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            className="text-sm font-semibold opacity-80 hover:opacity-100"
            href={isBusiness ? "/business/dashboard" : "/creator/dashboard"}
          >
            Back to dashboard
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm opacity-75">
            Manage your profile, account, notifications, and platform access.
          </p>
        </header>

        {successText ? (
          <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successText}
          </p>
        ) : null}

        {initialError ? (
          <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {initialError}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-stone-200 bg-white p-2 text-stone-950">
            <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {availableTabs.map((tab) => (
                <button
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-stone-950 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="rounded-lg border border-stone-200 bg-white p-5 text-stone-950">
            {activeTab === "profile" && isBusiness && data.business ? (
              <BusinessProfileForm
                business={data.business}
                description={description}
                setDescription={setDescription}
              />
            ) : null}

            {activeTab === "profile" && isCreator && data.creator ? (
              <CreatorProfileForm
                creator={data.creator}
                fullName={data.profile.fullName}
                bio={bio}
                setBio={setBio}
              />
            ) : null}

            {activeTab === "account" ? <AccountTab data={data} /> : null}
            {activeTab === "notifications" ? (
              <NotificationsTab preferences={data.preferences} />
            ) : null}
            {activeTab === "platforms" && data.creator ? (
              <PlatformsTab creator={data.creator} />
            ) : null}
            {activeTab === "danger" ? (
              <DangerTab
                deleteOpen={deleteOpen}
                setDeleteOpen={setDeleteOpen}
              />
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function BusinessProfileForm({
  business,
  description,
  setDescription,
}: {
  business: NonNullable<SettingsData["business"]>;
  description: string;
  setDescription: (value: string) => void;
}) {
  return (
    <form action={updateBusinessProfile} className="space-y-5">
      <SectionTitle title="Business profile" />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField defaultValue={business.businessName} label="Business name" name="businessName" required />
        <label className="block">
          <FieldLabel>Category</FieldLabel>
          <select className={inputClass} defaultValue={business.category} name="category">
            {businessCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <TextareaField
        counter={`${description.length}/300`}
        label="Description"
        maxLength={300}
        name="description"
        onChange={setDescription}
        value={description}
      />
      <ImageUpload currentUrl={business.logoUrl} label="Logo upload" name="logo" />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField defaultValue={business.websiteUrl} label="Website URL" name="websiteUrl" type="url" />
        <TextField defaultValue={business.phoneNumber} label="Phone number" name="phoneNumber" />
        <TextField defaultValue={business.address} label="Address" name="address" />
        <TextField defaultValue={business.country} label="Country" name="country" />
      </div>
      <SaveButton />
    </form>
  );
}

function CreatorProfileForm({
  bio,
  creator,
  fullName,
  setBio,
}: {
  bio: string;
  creator: NonNullable<SettingsData["creator"]>;
  fullName: string;
  setBio: (value: string) => void;
}) {
  return (
    <form action={updateCreatorProfile} className="space-y-5">
      <SectionTitle title="Creator profile" />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField defaultValue={fullName} label="Display name" name="displayName" required />
        <TextField defaultValue={creator.handle} label="Handle" name="handle" required />
      </div>
      <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
        Platform: <strong>{formatPlatform(creator.platform)}</strong>. Contact support to change your platform.
      </div>
      <TextareaField
        counter={`${bio.length}/200`}
        label="Bio"
        maxLength={200}
        name="bio"
        onChange={setBio}
        value={bio}
      />
      <div>
        <FieldLabel>Content categories</FieldLabel>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {creatorCategories.map((category) => (
            <label
              className="flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm"
              key={category}
            >
              <input
                defaultChecked={creator.categories.includes(category)}
                name="categories"
                type="checkbox"
                value={category}
              />
              {category}
            </label>
          ))}
        </div>
      </div>
      <ImageUpload currentUrl={creator.profilePhotoUrl} label="Profile photo upload" name="profilePhoto" />
      <div className="grid gap-4 md:grid-cols-3">
        <TextField defaultValue={creator.phoneNumber} label="Phone number" name="phoneNumber" />
        <TextField defaultValue={creator.country} label="Country" name="country" />
        <TextField defaultValue={creator.dateOfBirth} label="Date of birth" name="dateOfBirth" type="date" />
      </div>
      <p className="text-xs text-stone-500">
        Your full date of birth is stored privately. Others only see age when relevant.
      </p>
      <SaveButton />
    </form>
  );
}

function AccountTab({ data }: { data: SettingsData }) {
  return (
    <div className="space-y-8">
      <SectionTitle title="Account" />
      <div className="rounded-lg border border-stone-200 p-4">
        <div className="text-sm text-stone-500">Email address</div>
        <div className="mt-1 font-semibold">{data.email}</div>
      </div>
      <form action={changeEmail} className="rounded-lg border border-stone-200 p-4">
        <h2 className="font-semibold">Change email</h2>
        <p className="mt-1 text-sm text-stone-600">
          We will send a verification link to the new address.
        </p>
        <TextField label="New email" name="newEmail" type="email" />
        <SaveButton label="Send verification" />
      </form>
      <form action={changePassword} className="rounded-lg border border-stone-200 p-4">
        <h2 className="font-semibold">Change password</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <TextField label="Current password" name="currentPassword" type="password" />
          <TextField label="New password" name="newPassword" type="password" />
          <TextField label="Confirm new password" name="confirmPassword" type="password" />
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Password must be at least 8 characters and include one number.
        </p>
        <SaveButton label="Update password" />
      </form>
      <div className="rounded-lg border border-stone-200 p-4">
        <h2 className="font-semibold">Active sessions</h2>
        <div className="mt-3 rounded-md bg-stone-50 p-3 text-sm text-stone-700">
          <div>Device/browser: {data.session.userAgent}</div>
          <div className="mt-1">Last active: {formatDateTime(data.profile.lastSeen ?? data.session.lastActive)}</div>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({
  preferences,
}: {
  preferences: SettingsData["preferences"];
}) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Notifications" />
      <form action={updateEmailPreferences} className="space-y-6">
        <div>
          <h2 className="font-semibold">Email notifications</h2>
          <div className="mt-3 space-y-3">
            <Toggle defaultChecked={preferences.video_updates} label="Video updates" name="video_updates" />
            <Toggle defaultChecked={preferences.invitations} label="Invitations" name="invitations" />
            <Toggle defaultChecked={preferences.campaign_alerts} label="Campaign alerts" name="campaign_alerts" />
            <Toggle defaultChecked={preferences.messages} label="Message notifications" name="messages" />
          </div>
        </div>
        <div>
          <h2 className="font-semibold">In-app notifications</h2>
          <div className="mt-3 space-y-3">
            <Toggle defaultChecked={preferences.in_app_video_updates} label="Video updates" name="in_app_video_updates" />
            <Toggle defaultChecked={preferences.in_app_invitations} label="Invitations" name="in_app_invitations" />
            <Toggle defaultChecked={preferences.in_app_campaign_alerts} label="Campaign alerts" name="in_app_campaign_alerts" />
            <Toggle defaultChecked={preferences.in_app_messages} label="Message notifications" name="in_app_messages" />
          </div>
        </div>
        <SaveButton label="Save preferences" />
      </form>
      <form action={markAllNotificationsRead}>
        <button
          className="rounded-md border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-100"
          type="submit"
        >
          Mark all notifications as read
        </button>
      </form>
    </div>
  );
}

function PlatformsTab({
  creator,
}: {
  creator: NonNullable<SettingsData["creator"]>;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Connected platforms" />
      {creator.needsReauth ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          One or more platforms need to be reconnected. Your view counts may be outdated.
        </p>
      ) : null}
      <PlatformCard
        connected={creator.youtubeConnected}
        connectHref="/api/auth/youtube/connect"
        detail={creator.youtubeChannelName}
        label="YouTube"
        platform="youtube"
      />
      <PlatformCard
        connected={creator.tiktokConnected}
        connectHref="/api/auth/tiktok/connect"
        detail={creator.handle}
        label="TikTok"
        note="TikTok connection coming soon - pending platform approval"
        platform="tiktok"
      />
      <PlatformCard
        connected={creator.instagramConnected}
        connectHref="/api/auth/instagram/connect"
        detail={creator.handle}
        label="Instagram"
        note="Instagram connection coming soon - pending platform approval"
        platform="instagram"
      />
    </div>
  );
}

function DangerTab({
  deleteOpen,
  setDeleteOpen,
}: {
  deleteOpen: boolean;
  setDeleteOpen: (value: boolean) => void;
}) {
  return (
    <div>
      <SectionTitle title="Danger zone" />
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-800">Delete my account</h2>
        <p className="mt-2 text-sm leading-6 text-red-700">
          This soft-deletes your account and signs you out. Asail keeps audit data for marketplace records.
        </p>
        <button
          className="mt-4 rounded-md border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
          onClick={() => setDeleteOpen(true)}
          type="button"
        >
          Delete my account
        </button>
      </div>
      {deleteOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4"
          role="dialog"
        >
          <form
            action={deleteAccount}
            className="w-full max-w-md rounded-lg border border-red-200 bg-white p-5 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-red-800">Confirm deletion</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              This will permanently delete your account, all your data, and cannot be undone.
            </p>
            <TextField label='Type "DELETE" to confirm' name="confirmation" />
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold"
                onClick={() => setDeleteOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                type="submit"
              >
                Confirm delete
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm font-semibold text-stone-700">{children}</span>;
}

function TextField({
  defaultValue,
  label,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="mt-4 block">
      <FieldLabel>{label}</FieldLabel>
      <input
        className={inputClass}
        defaultValue={defaultValue}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function TextareaField({
  counter,
  label,
  maxLength,
  name,
  onChange,
  value,
}: {
  counter: string;
  label: string;
  maxLength: number;
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        className="mt-2 min-h-28 w-full rounded-md border border-stone-300 px-3 py-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
        maxLength={maxLength}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <span className="mt-1 block text-xs text-stone-500">{counter}</span>
    </label>
  );
}

function ImageUpload({
  currentUrl,
  label,
  name,
}: {
  currentUrl: string | null;
  label: string;
  name: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-2 flex items-center gap-4">
        {currentUrl ? (
          <Image
            alt={label}
            className="h-16 w-16 rounded-md border border-stone-200 object-cover"
            height={64}
            src={currentUrl}
            width={64}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-xs text-stone-500">
            None
          </div>
        )}
        <input accept="image/*" className="text-sm" name={name} type="file" />
      </div>
    </label>
  );
}

function SaveButton({ label = "Save changes" }: { label?: string }) {
  return (
    <button
      className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
      type="submit"
    >
      {label}
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="border-b border-stone-200 pb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

function Toggle({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-stone-200 px-4 py-3">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      <input
        className="h-5 w-5 accent-stone-950"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
    </label>
  );
}

function PlatformCard({
  connected,
  connectHref,
  detail,
  label,
  note,
  platform,
}: {
  connected: boolean;
  connectHref: string;
  detail: string;
  label: string;
  note?: string;
  platform: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{label}</h3>
            {connected ? (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                Connected
              </span>
            ) : null}
          </div>
          {connected ? (
            <p className="mt-1 text-sm text-stone-600">{detail || label}</p>
          ) : note ? (
            <p className="mt-1 text-sm font-medium text-amber-700">{note}</p>
          ) : null}
        </div>
        {connected ? (
          <form action={disconnectPlatform}>
            <input name="platform" type="hidden" value={platform} />
            <button
              className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              type="submit"
            >
              Disconnect
            </button>
          </form>
        ) : (
          <Link
            className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            href={connectHref}
          >
            Connect {label}
          </Link>
        )}
      </div>
    </div>
  );
}
