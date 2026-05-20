import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SearchType = "campaigns" | "creators";

function cleanQuery(value: string | null) {
  return (value ?? "").trim().slice(0, 120);
}

function cleanType(value: string | null): SearchType {
  return value === "creators" ? "creators" : "campaigns";
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = cleanQuery(searchParams.get("q"));
  const type = cleanType(searchParams.get("type"));

  if (!q) {
    return NextResponse.json({ q, results: [], type });
  }

  const admin = createAdminClient();
  const rpcName = type === "creators" ? "search_creators" : "search_campaigns";
  const { data, error } = await admin.rpc(rpcName, { search_query: q });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    q,
    results: data ?? [],
    type,
  });
}
