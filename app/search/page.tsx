import { redirect } from "next/navigation";
import {
  SearchClient,
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

  return {
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
  const { defaultQuery, defaultTab, isBusiness } = await getSearchPageData(
    searchParams,
  );

  return (
    <SearchClient
      defaultQuery={defaultQuery}
      defaultTab={defaultTab}
      isBusiness={isBusiness}
    />
  );
}
