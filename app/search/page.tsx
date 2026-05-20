import { redirect } from "next/navigation";
import {
  SearchClient,
  type ActiveCampaign,
  type SearchTab,
} from "./search-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  type?: SearchTab;
};

async function getSearchPageData(searchParams?: SearchParams) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectedFrom=/search");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const defaultTab: SearchTab =
    searchParams?.type === "campaigns" || searchParams?.type === "creators"
      ? searchParams.type
      : profile?.role === "business"
        ? "creators"
        : "campaigns";

  let activeCampaigns: ActiveCampaign[] = [];

  if (profile?.role === "business") {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (business) {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title")
        .eq("business_id", business.id)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      activeCampaigns = (data ?? []) as ActiveCampaign[];
    }
  }

  return {
    activeCampaigns,
    defaultQuery: searchParams?.q ?? "",
    defaultTab,
    isBusiness: profile?.role === "business",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const { activeCampaigns, defaultQuery, defaultTab, isBusiness } =
    await getSearchPageData(searchParams);

  return (
    <SearchClient
      activeCampaigns={activeCampaigns}
      defaultQuery={defaultQuery}
      defaultTab={defaultTab}
      isBusiness={isBusiness}
    />
  );
}
