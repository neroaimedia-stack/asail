import { redirect } from "next/navigation";
import { completeBusinessOnboarding } from "./actions";
import { createClient } from "@/lib/supabase/server";

const categories = ["Restaurant", "Hotel", "SaaS", "Retail", "Other"];

export default async function BusinessOnboardingPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/business/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "business") {
    redirect("/auth/login?error=Business%20account%20required.");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (business) {
    redirect("/business/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#fff8ed] px-6 py-10 text-[#392514]">
      <section className="mx-auto w-full max-w-xl">
        <div className="mb-8 border-b border-amber-200 pb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Step 1 of 1 — Tell us about your business
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Set up your business profile
          </h1>
        </div>

        {searchParams?.error ? (
          <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {searchParams.error}
          </p>
        ) : null}

        <form
          action={completeBusinessOnboarding}
          className="space-y-5 rounded-lg border border-amber-200 bg-white p-6 shadow-sm"
        >
          <label className="block">
            <span className="text-sm font-semibold text-[#6a4521]">
              Business name
            </span>
            <input
              className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-[#392514] outline-none transition placeholder:text-[#9a7a58] focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              name="businessName"
              type="text"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#6a4521]">
              Category
            </span>
            <select
              className="mt-2 w-full rounded-md border border-amber-200 bg-white px-3 py-3 text-[#392514] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              name="category"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#6a4521]">
              Short description
            </span>
            <textarea
              className="mt-2 min-h-32 w-full resize-y rounded-md border border-amber-200 bg-white px-3 py-3 text-[#392514] outline-none transition placeholder:text-[#9a7a58] focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              maxLength={300}
              name="description"
              placeholder="A quick note about what you offer and what kind of creators fit your brand."
            />
            <span className="mt-2 block text-xs text-[#8a6337]">
              300 characters max
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#6a4521]">
              Logo upload
            </span>
            <input
              accept="image/*"
              className="mt-2 w-full rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-sm text-[#6a4521] file:mr-4 file:rounded-md file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-700"
              name="logo"
              type="file"
            />
          </label>

          <button
            className="w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
            type="submit"
          >
            Complete onboarding
          </button>
        </form>
      </section>
    </main>
  );
}
