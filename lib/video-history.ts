import { createAdminClient } from "@/lib/supabase/admin";

export async function recordVideoHistory({
  changedBy,
  note,
  status,
  videoId,
}: {
  changedBy?: string | null;
  note: string;
  status: string;
  videoId: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("video_history").insert({
    changed_by: changedBy ?? null,
    note,
    status,
    video_id: videoId,
  });

  if (error) {
    throw error;
  }
}
