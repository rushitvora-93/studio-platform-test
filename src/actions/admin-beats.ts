"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResponse, Beat } from "@/types";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  return { supabase, isAdmin: profile?.role === "admin" };
}

export interface AdminBeat extends Beat {
  sales_count: number;
}

export async function getAdminBeats(): Promise<ActionResponse<AdminBeat[]>> {
  const { supabase, isAdmin } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "Accès refusé" };

  let { data: beats, error } = await supabase
    .from("beats")
    .select("*")
    .order("sort_order", { ascending: true })
    .returns<Beat[]>();

  // Fallback if sort_order column doesn't exist yet (migration not applied)
  if (error?.message?.includes("sort_order")) {
    ({ data: beats, error } = await supabase
      .from("beats")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Beat[]>());
  }

  if (error) return { success: false, error: error.message };

  // Get sales counts
  const beatIds = (beats ?? []).map((b) => b.id);
  const { data: purchases } = beatIds.length > 0
    ? await supabase
        .from("beat_purchases")
        .select("beat_id")
        .in("beat_id", beatIds)
        .returns<{ beat_id: string }[]>()
    : { data: [] as { beat_id: string }[] };

  const salesMap = new Map<string, number>();
  for (const p of purchases ?? []) {
    salesMap.set(p.beat_id, (salesMap.get(p.beat_id) ?? 0) + 1);
  }

  const result: AdminBeat[] = (beats ?? []).map((b) => ({
    ...b,
    sales_count: salesMap.get(b.id) ?? 0,
  }));

  return { success: true, data: result };
}

export async function adminUpdateBeat(
  beatId: string,
  input: {
    title?: string;
    bpm?: number;
    key?: string;
    genre?: string;
    price_simple?: number;
    price_exclusive?: number | null;
    is_published?: boolean;
  },
): Promise<ActionResponse> {
  const { supabase, isAdmin } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "Accès refusé" };

  const { error } = await supabase
    .from("beats")
    .update(input)
    .eq("id", beatId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function adminReorderBeats(
  orderedIds: string[],
): Promise<ActionResponse> {
  const { supabase, isAdmin } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "Accès refusé" };

  const updates = orderedIds.map((id, index) =>
    supabase.from("beats").update({ sort_order: index }).eq("id", id),
  );
  await Promise.all(updates);
  return { success: true, data: undefined };
}

export async function adminDeleteBeat(beatId: string): Promise<ActionResponse> {
  const { supabase, isAdmin } = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "Accès refusé" };

  // Fetch beat to get owner id before deleting
  const { data: beat, error: fetchErr } = await supabase
    .from("beats")
    .select("id, beatmaker_id")
    .eq("id", beatId)
    .single<{ id: string; beatmaker_id: string }>();

  if (fetchErr || !beat) return { success: false, error: fetchErr?.message ?? "Beat introuvable" };

  // Hard delete the DB record (cascades to beat_favorites via FK)
  const { error: deleteErr } = await supabase
    .from("beats")
    .delete()
    .eq("id", beatId);

  if (deleteErr) return { success: false, error: deleteErr.message };

  // Best-effort storage cleanup (don't fail the action if this errors)
  try {
    const adminStorage = createAdminClient().storage;
    const basePath = `${beat.beatmaker_id}/${beat.id}`;

    // Collect all known paths under this beat's folder in both buckets
    const { data: previewFiles } = await adminStorage.from("beat-previews").list(basePath);
    const { data: privateFiles } = await adminStorage.from("beat-files").list(basePath);

    if (previewFiles?.length) {
      await adminStorage.from("beat-previews").remove(previewFiles.map((f) => `${basePath}/${f.name}`));
    }
    if (privateFiles?.length) {
      await adminStorage.from("beat-files").remove(privateFiles.map((f) => `${basePath}/${f.name}`));
    }
  } catch (err) {
    console.error("[adminDeleteBeat] Storage cleanup failed:", err);
  }

  return { success: true, data: undefined };
}
