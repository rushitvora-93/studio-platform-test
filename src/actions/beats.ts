"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResponse } from "@/types";
import type { Beat, BeatPurchase, LicenseType } from "@/types";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, readFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { createCheckoutSession } from "@/lib/stripe";

export async function getPublishedBeats(): Promise<ActionResponse<Beat[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beats")
    .select("*")
    .eq("is_published", true)
    .eq("is_exclusive_sold", false)
    .order("created_at", { ascending: false })
    .returns<Beat[]>();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function getBeatBySlug(
  slug: string,
): Promise<ActionResponse<Beat>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beats")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single<Beat>();

  if (error || !data) return { success: false, error: "Beat introuvable" };
  return { success: true, data };
}

export async function incrementPlayCount(beatId: string): Promise<void> {
  const supabase = await createClient();
  // Fetch current count and increment
  const { data } = await supabase
    .from("beats")
    .select("play_count")
    .eq("id", beatId)
    .single<{ play_count: number }>();

  if (data) {
    await supabase
      .from("beats")
      .update({ play_count: data.play_count + 1 })
      .eq("id", beatId);
  }
}

export async function purchaseBeat(
  beatId: string,
  licenseType: LicenseType,
): Promise<ActionResponse<{ checkoutUrl: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Connexion requise pour acheter" };
  }

  // Get beat details
  const { data: beat } = await supabase
    .from("beats")
    .select("*")
    .eq("id", beatId)
    .eq("is_published", true)
    .single<Beat>();

  if (!beat) {
    return { success: false, error: "Beat introuvable" };
  }

  if (beat.is_exclusive_sold) {
    return { success: false, error: "Ce beat a déjà été vendu en licence exclusive" };
  }

  // Determine price
  const price =
    licenseType === "exclusive" && beat.price_exclusive
      ? beat.price_exclusive
      : beat.price_simple;

  // Create purchase record (pending)
  const { data: purchase, error } = await supabase
    .from("beat_purchases")
    .insert({
      user_id: user.id,
      beat_id: beatId,
      license_type: licenseType,
      price_paid: price,
    })
    .select()
    .single<BeatPurchase>();

  if (error || !purchase) {
    return { success: false, error: "Erreur lors de la création de l'achat" };
  }

  // If exclusive, mark beat as sold
  if (licenseType === "exclusive") {
    await supabase
      .from("beats")
      .update({ is_exclusive_sold: true })
      .eq("id", beatId);
  }

  // Create Stripe checkout (mock)
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await createCheckoutSession({
    amount: price,
    description: `${beat.title} — Licence ${licenseType === "exclusive" ? "Exclusive" : "Simple"}`,
    successUrl: `${origin}/beats/purchase/confirmation?purchase_id=${purchase.id}`,
    cancelUrl: `${origin}/beats/${beat.slug}`,
    metadata: {
      purchase_id: purchase.id,
      beat_id: beatId,
      license_type: licenseType,
    },
  });

  // TODO: Send receipt email via Resend

  return { success: true, data: { checkoutUrl: session.url } };
}

export async function getPurchaseById(
  purchaseId: string,
): Promise<ActionResponse<BeatPurchase & { beat_title: string; beat_slug: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Non connecté" };
  }

  const { data: purchase } = await supabase
    .from("beat_purchases")
    .select("*")
    .eq("id", purchaseId)
    .eq("user_id", user.id)
    .single<BeatPurchase>();

  if (!purchase) {
    return { success: false, error: "Achat introuvable" };
  }

  const { data: beat } = await supabase
    .from("beats")
    .select("title, slug")
    .eq("id", purchase.beat_id)
    .single<{ title: string; slug: string }>();

  return {
    success: true,
    data: {
      ...purchase,
      beat_title: beat?.title ?? "Beat",
      beat_slug: beat?.slug ?? "",
    },
  };
}

// ── Beat download ──

export async function getBeatDownloadUrl(
  beatId: string,
): Promise<ActionResponse<{ url: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non connecté" };

  // Verify purchase exists with confirmed payment
  const { data: purchase } = await supabase
    .from("beat_purchases")
    .select("id, stripe_payment_intent_id")
    .eq("beat_id", beatId)
    .eq("user_id", user.id)
    .not("stripe_payment_intent_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (!purchase) {
    return { success: false, error: "Achat non trouvé" };
  }

  // Get beat's storage path
  const { data: beat } = await supabase
    .from("beats")
    .select("audio_full_url")
    .eq("id", beatId)
    .single<{ audio_full_url: string | null }>();

  if (!beat?.audio_full_url) {
    return { success: false, error: "Fichier audio introuvable" };
  }

  // Generate signed URL (15 minutes)
  const { data: signedUrl, error } = await supabase.storage
    .from("beat-files")
    .createSignedUrl(beat.audio_full_url, 900);

  if (error || !signedUrl) {
    return { success: false, error: "Impossible de générer le lien de téléchargement" };
  }

  return { success: true, data: { url: signedUrl.signedUrl } };
}

// ── Beatmaker management ──

export async function getMyBeats(): Promise<ActionResponse<Beat[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non connecté" };

  const { data, error } = await supabase
    .from("beats")
    .select("*")
    .eq("beatmaker_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Beat[]>();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createBeat(input: {
  title: string;
  bpm: number;
  key: string;
  genre: string;
  tags: string[];
  priceSimple: number;
  priceExclusive: number | null;
}): Promise<ActionResponse<Beat>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non connecté" };

  if (!input.title.trim()) return { success: false, error: "Le titre est requis" };
  if (input.priceSimple < 1) return { success: false, error: "Le prix simple doit être positif" };

  const slug = slugify(input.title) + "-" + Date.now().toString(36);

  const { data, error } = await supabase
    .from("beats")
    .insert({
      beatmaker_id: user.id,
      title: input.title.trim(),
      slug,
      bpm: input.bpm,
      key: input.key,
      genre: input.genre,
      tags: input.tags,
      price_simple: input.priceSimple,
      price_exclusive: input.priceExclusive,
      is_published: false,
      is_exclusive_sold: false,
    })
    .select()
    .single<Beat>();

  if (error || !data) return { success: false, error: error?.message ?? "Erreur" };
  return { success: true, data };
}

const AUDIO_EXTENSIONS = [".wav", ".mp3", ".aiff", ".flac"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_AUDIO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const VALID_AUDIO_MIMES = [
  "audio/wav", "audio/x-wav",
  "audio/mpeg", "audio/mp3",
  "audio/aiff", "audio/x-aiff",
  "audio/flac",
];
const VALID_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

function getExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return "." + parts.pop()!.toLowerCase();
}

/**
 * Trims an audio file to 30 seconds using the ffmpeg-static binary.
 * Returns a Buffer of the trimmed MP3, or null if trimming fails.
 */
async function trim30s(audioFile: File, ext: string): Promise<Buffer | null> {
  // Resolve ffmpeg binary path at runtime — avoids Turbopack bundling issues with ffmpeg-static
  const { existsSync } = await import("fs");
  const binName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const ffmpegBin = join(process.cwd(), "node_modules", "ffmpeg-static", binName);
  if (!existsSync(ffmpegBin)) {
    console.error("[trim30s] ffmpeg binary not found at", ffmpegBin);
    return null;
  }

  const id = randomUUID();
  const inPath = join(tmpdir(), `beat-in-${id}${ext}`);
  const outPath = join(tmpdir(), `beat-preview-${id}.mp3`);

  try {
    await writeFile(inPath, Buffer.from(await audioFile.arrayBuffer()));

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegBin, [
        "-y",
        "-i", inPath,
        "-t", "30",
        "-acodec", "libmp3lame",
        "-ab", "128k",
        "-ar", "44100",
        outPath,
      ]);
      const stderr: string[] = [];
      proc.stderr?.on("data", (d: Buffer) => stderr.push(d.toString()));
      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-3).join("")}`));
        }
      });
      proc.on("error", reject);
    });

    const preview = await readFile(outPath);
    console.log(`[trim30s] Preview generated: ${preview.length} bytes`);
    return preview;
  } catch (err) {
    console.error("[trim30s] Failed:", err);
    return null;
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(outPath)]);
  }
}

export async function createBeatWithFiles(
  formData: FormData,
): Promise<ActionResponse<Beat>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non connecté" };

  // Verify user has beatmaker/engineer/admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile || !["beatmaker", "engineer", "admin"].includes(profile.role)) {
    return { success: false, error: "Rôle non autorisé pour uploader des beats" };
  }

  // Extract files and metadata
  const audioFile = formData.get("audio") as File | null;
  const coverFile = formData.get("cover") as File | null;
  const metadataRaw = formData.get("metadata") as string | null;

  if (!audioFile || !coverFile || !metadataRaw) {
    return { success: false, error: "Fichiers audio, image et métadonnées requis" };
  }

  // Validate files (extension + MIME type)
  const audioExt = getExtension(audioFile.name);
  if (!audioExt || !AUDIO_EXTENSIONS.includes(audioExt)) {
    return { success: false, error: `Format audio non supporté : ${audioExt || "inconnu"}` };
  }
  if (!VALID_AUDIO_MIMES.includes(audioFile.type)) {
    return { success: false, error: `Type MIME audio non supporté : ${audioFile.type}` };
  }
  if (audioFile.size > MAX_AUDIO_SIZE) {
    return { success: false, error: "Fichier audio trop volumineux (max 200 Mo)" };
  }

  const coverExt = getExtension(coverFile.name);
  if (!coverExt || !IMAGE_EXTENSIONS.includes(coverExt)) {
    return { success: false, error: `Format image non supporté : ${coverExt || "inconnu"}` };
  }
  if (!VALID_IMAGE_MIMES.includes(coverFile.type)) {
    return { success: false, error: `Type MIME image non supporté : ${coverFile.type}` };
  }
  if (coverFile.size > MAX_IMAGE_SIZE) {
    return { success: false, error: "Image trop volumineuse (max 10 Mo)" };
  }

  // Parse & validate metadata
  let metadata: {
    title: string;
    bpm: number;
    key: string;
    genre: string;
    tags: string[];
    priceSimple: number;
    priceExclusive: number | null;
    isPublished?: boolean;
  };
  try {
    metadata = JSON.parse(metadataRaw);
  } catch {
    return { success: false, error: "Métadonnées invalides" };
  }

  if (!metadata.title?.trim()) return { success: false, error: "Le titre est requis" };
  if (metadata.priceSimple < 1) return { success: false, error: "Le prix simple doit être positif" };

  const slug = slugify(metadata.title) + "-" + Date.now().toString(36);

  // Step 1: Insert beat record
  const { data: beat, error: insertError } = await supabase
    .from("beats")
    .insert({
      beatmaker_id: user.id,
      title: metadata.title.trim(),
      slug,
      bpm: metadata.bpm,
      key: metadata.key,
      genre: metadata.genre,
      tags: metadata.tags,
      price_simple: metadata.priceSimple,
      price_exclusive: metadata.priceExclusive,
      is_published: metadata.isPublished === true,
      is_exclusive_sold: false,
    })
    .select()
    .single<Beat>();

  if (insertError || !beat) {
    return { success: false, error: insertError?.message ?? "Erreur création beat" };
  }

  const basePath = `${user.id}/${beat.id}`;
  // Use service-role client for storage — avoids RLS on storage.objects
  // while auth/role checks are already enforced above in application code.
  const adminStorage = createAdminClient().storage;

  try {
    // Step 2: Upload cover image to beat-previews
    const coverPath = `${basePath}/cover${coverExt}`;
    const { error: coverErr } = await adminStorage
      .from("beat-previews")
      .upload(coverPath, coverFile, { upsert: true });
    if (coverErr) throw new Error(`Cover upload: ${coverErr.message}`);

    // Step 3: Upload full audio to beat-files (private)
    const audioPath = `${basePath}/audio${audioExt}`;
    const { error: audioErr } = await adminStorage
      .from("beat-files")
      .upload(audioPath, audioFile, { upsert: true });
    if (audioErr) throw new Error(`Audio upload: ${audioErr.message}`);

    // Step 4: Upload 30-second preview to beat-previews (public)
    const trimmed = await trim30s(audioFile, audioExt);
    const previewFile = trimmed ?? Buffer.from(await audioFile.arrayBuffer());
    const previewPath = `${basePath}/preview.mp3`;
    const { error: previewErr } = await adminStorage
      .from("beat-previews")
      .upload(previewPath, previewFile, { contentType: "audio/mpeg", upsert: true });
    if (previewErr) throw new Error(`Preview upload: ${previewErr.message}`);

    // Step 5: Get public URLs
    const { data: coverUrl } = adminStorage
      .from("beat-previews")
      .getPublicUrl(coverPath);
    const { data: previewUrl } = adminStorage
      .from("beat-previews")
      .getPublicUrl(`${basePath}/preview.mp3`);

    // Step 6: Update beat record with URLs
    const { data: updatedBeat, error: updateErr } = await supabase
      .from("beats")
      .update({
        cover_image_url: coverUrl.publicUrl,
        audio_preview_url: previewUrl.publicUrl,
        audio_full_url: audioPath, // Store path for signed URL generation
      })
      .eq("id", beat.id)
      .select()
      .single<Beat>();

    if (updateErr || !updatedBeat) {
      throw new Error(updateErr?.message ?? "Erreur mise à jour beat");
    }

    return { success: true, data: updatedBeat };
  } catch (err) {
    // Cleanup on failure: delete beat record and any uploaded files
    try {
      await supabase.from("beats").delete().eq("id", beat.id);
      await adminStorage.from("beat-previews").remove([
        `${basePath}/cover${coverExt}`,
        `${basePath}/preview.mp3`,
      ]);
      await adminStorage.from("beat-files").remove([`${basePath}/audio${audioExt}`]);
    } catch (cleanupErr) {
      console.error("[createBeatWithFiles] Cleanup failed for beat", beat.id, cleanupErr);
    }

    const message = err instanceof Error ? err.message : "Erreur upload";
    return { success: false, error: message };
  }
}

export async function updateBeat(
  beatId: string,
  input: {
    title?: string;
    bpm?: number;
    key?: string;
    genre?: string;
    tags?: string[];
    priceSimple?: number;
    priceExclusive?: number | null;
  },
): Promise<ActionResponse<Beat>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non connecté" };

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.bpm !== undefined) updateData.bpm = input.bpm;
  if (input.key !== undefined) updateData.key = input.key;
  if (input.genre !== undefined) updateData.genre = input.genre;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.priceSimple !== undefined) updateData.price_simple = input.priceSimple;
  if (input.priceExclusive !== undefined) updateData.price_exclusive = input.priceExclusive;

  const { data, error } = await supabase
    .from("beats")
    .update(updateData)
    .eq("id", beatId)
    .eq("beatmaker_id", user.id)
    .select()
    .single<Beat>();

  if (error || !data) return { success: false, error: error?.message ?? "Erreur" };
  return { success: true, data };
}

export async function toggleBeatPublish(
  beatId: string,
  publish: boolean,
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non connecté" };

  const { error } = await supabase
    .from("beats")
    .update({ is_published: publish })
    .eq("id", beatId)
    .eq("beatmaker_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ── Beatmaker sales tracking ──

export interface BeatSale {
  id: string;
  beat_title: string;
  license_type: LicenseType;
  price_paid: number;
  created_at: string;
  buyer_name: string; // anonymized
}

export interface BeatmakerSalesData {
  totalSold: number;
  totalRevenue: number;
  salesByBeat: { title: string; count: number; revenue: number }[];
  recentSales: BeatSale[];
}

export async function getBeatmakerSales(): Promise<ActionResponse<BeatmakerSalesData>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non connecté" };

  // Get all beats by this beatmaker
  const { data: myBeats } = await supabase
    .from("beats")
    .select("id, title")
    .eq("beatmaker_id", user.id)
    .returns<{ id: string; title: string }[]>();

  if (!myBeats || myBeats.length === 0) {
    return {
      success: true,
      data: { totalSold: 0, totalRevenue: 0, salesByBeat: [], recentSales: [] },
    };
  }

  const beatIds = myBeats.map((b) => b.id);
  const beatTitleMap = new Map(myBeats.map((b) => [b.id, b.title]));

  // Get all purchases for these beats
  const { data: purchases } = await supabase
    .from("beat_purchases")
    .select("id, beat_id, license_type, price_paid, created_at, user_id")
    .in("beat_id", beatIds)
    .order("created_at", { ascending: false })
    .returns<{
      id: string;
      beat_id: string;
      license_type: LicenseType;
      price_paid: number;
      created_at: string;
      user_id: string;
    }[]>();

  const sales = purchases ?? [];

  // Summary
  const totalSold = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.price_paid, 0);

  // Sales by beat
  const byBeat = new Map<string, { count: number; revenue: number }>();
  for (const sale of sales) {
    const existing = byBeat.get(sale.beat_id) ?? { count: 0, revenue: 0 };
    byBeat.set(sale.beat_id, {
      count: existing.count + 1,
      revenue: existing.revenue + sale.price_paid,
    });
  }
  const salesByBeat = Array.from(byBeat.entries()).map(([beatId, data]) => ({
    title: beatTitleMap.get(beatId) ?? "Beat",
    count: data.count,
    revenue: data.revenue,
  }));

  // Recent sales (anonymized buyer)
  const recentSales: BeatSale[] = sales.slice(0, 20).map((s) => ({
    id: s.id,
    beat_title: beatTitleMap.get(s.beat_id) ?? "Beat",
    license_type: s.license_type,
    price_paid: s.price_paid,
    created_at: s.created_at,
    buyer_name: `Client ${s.user_id.slice(0, 4)}***`,
  }));

  return { success: true, data: { totalSold, totalRevenue, salesByBeat, recentSales } };
}

// ── Favorites ──

export async function addToFavorites(beatId: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Connexion requise" };

  const { error } = await supabase
    .from("beat_favorites")
    .insert({ user_id: user.id, beat_id: beatId });

  // Ignore duplicate (already favorited)
  if (error && error.code !== "23505") {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function removeFromFavorites(beatId: string): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Connexion requise" };

  const { error } = await supabase
    .from("beat_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("beat_id", beatId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function getFavorites(): Promise<ActionResponse<(Beat & { favorited_at: string })[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Connexion requise" };

  // Step 1: get the user's favorited beat IDs in order
  const { data: favRows, error: favError } = await supabase
    .from("beat_favorites")
    .select("beat_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<{ beat_id: string; created_at: string }[]>();

  if (favError) return { success: false, error: favError.message };
  if (!favRows || favRows.length === 0) return { success: true, data: [] };

  const beatIds = favRows.map((f) => f.beat_id);
  const favMap = new Map(favRows.map((f) => [f.beat_id, f.created_at]));

  // Step 2: fetch the full beat records
  const { data: beats, error: beatsError } = await supabase
    .from("beats")
    .select("*")
    .in("id", beatIds)
    .returns<Beat[]>();

  if (beatsError) return { success: false, error: beatsError.message };

  // Merge and sort by favorited_at desc (preserving the original order)
  const result = (beats ?? [])
    .map((beat) => ({
      ...beat,
      favorited_at: favMap.get(beat.id) ?? beat.created_at,
    }))
    .sort(
      (a, b) =>
        new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime(),
    );

  return { success: true, data: result };
}
