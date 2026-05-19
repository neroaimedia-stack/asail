import { redirect } from "next/navigation";
import { completeCreatorOnboarding } from "./actions";
import { createClient } from "@/lib/supabase/server";

const platforms = [
  { label: "TikTok", value: "tiktok" },
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
];

const categories = ["Food", "Travel", "Tech", "Lifestyle", "Fashion", "Other"];

export default async function CreatorOnboardingPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/creator/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator") {
    redirect("/auth/login?error=Creator%20account%20required.");
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (creator) {
    redirect("/creator/browse");
  }

  return (
    <main className="min-h-screen bg-indigo-50 px-6 py-10 text-slate-950">
      <section className="mx-auto w-full max-w-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            Set up your creator profile
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add the profile details businesses will see when reviewing your
            submissions.
          </p>
        </div>

        {searchParams?.error ? (
          <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {searchParams.error}
          </p>
        ) : null}

        <form
          action={completeCreatorOnboarding}
          className="space-y-5 rounded-lg border border-indigo-200 bg-white p-6 shadow-sm"
        >
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Display name
            </span>
            <input
              className="mt-2 w-full rounded-md border border-indigo-200 px-3 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              defaultValue={(profile?.full_name as string | undefined) ?? ""}
              name="displayName"
              required
              type="text"
            />
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">
              Platform
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {platforms.map((platform) => (
                <label
                  className="flex items-center gap-3 rounded-md border border-indigo-200 px-3 py-3 text-sm text-slate-800"
                  key={platform.value}
                >
                  <input
                    className="h-4 w-4 accent-indigo-600"
                    defaultChecked={platform.value === "instagram"}
                    name="platform"
                    type="radio"
                    value={platform.value}
                  />
                  {platform.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Handle on that platform
            </span>
            <div className="mt-2 flex rounded-md border border-indigo-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="flex items-center border-r border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700">
                @
              </span>
              <input
                className="w-full rounded-r-md px-3 py-3 text-slate-950 outline-none"
                name="handle"
                placeholder="asailcreator"
                required
                type="text"
              />
            </div>
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">
              Content categories
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  className="flex items-center gap-3 rounded-md border border-indigo-200 px-3 py-3 text-sm text-slate-800"
                  key={category}
                >
                  <input
                    className="h-4 w-4 accent-indigo-600"
                    name="categories"
                    type="checkbox"
                    value={category}
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Short bio
            </span>
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-indigo-200 px-3 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              maxLength={200}
              name="bio"
              placeholder="A quick intro for brands reviewing your work."
            />
            <span className="mt-2 block text-xs text-slate-500">
              200 characters max
            </span>
          </label>

          <button
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            type="submit"
          >
            Complete creator profile
          </button>
        </form>
      </section>
    </main>
  );
}
