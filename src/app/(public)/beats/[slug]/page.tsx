"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBeatBySlug, purchaseBeat } from "@/actions/beats";
import { AudioPlayer } from "@/components/beats/audio-player";
import { LicenseSelector } from "@/components/beats/license-selector";
import type { Beat } from "@/types";
import { toast } from "@/components/ui/toaster";

export default function BeatDetailPage() {
  const params = useParams<{ slug: string }>();
  const [beat, setBeat] = useState<Beat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<"simple" | "exclusive">(
    "simple",
  );
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getBeatBySlug(params.slug);
      if (result.success) {
        setBeat(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
    load();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-24 md:mx-auto md:max-w-[800px] md:px-6 md:pt-12">
        <div className="animate-pulse space-y-6">
          <div className="h-64 rounded-xl bg-bg-surface" />
          <div className="h-6 w-48 rounded bg-bg-surface" />
          <div className="h-4 w-32 rounded bg-bg-surface" />
        </div>
      </div>
    );
  }

  if (error || !beat) {
    return (
      <div className="px-4 pt-6 pb-24 text-center md:mx-auto md:max-w-[800px] md:px-6 md:pt-12">
        <h1 className="font-display text-[30px] font-bold leading-tight">Beat introuvable</h1>
        <p className="mt-2 text-text-secondary">
          Ce beat n&apos;existe pas ou a été retiré de la vente.
        </p>
        <Link
          href="/beats"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.3)] transition-opacity hover:opacity-90"
        >
          Explorer les beats
        </Link>
      </div>
    );
  }

  const price =
    selectedLicense === "exclusive" && beat.price_exclusive
      ? beat.price_exclusive
      : beat.price_simple;

  return (
    <div className="px-4 pt-6 pb-24 md:mx-auto md:max-w-[800px] md:px-6 md:pt-12">
      {/* Back link */}
      <Link
        href="/beats"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux beats
      </Link>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* Left: Beat info */}
        <div>
          {/* Cover with overlaid title */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-600/40 to-pink-500/40">
            {beat.cover_image_url ? (
              <img
                src={beat.cover_image_url}
                alt={beat.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-display text-8xl font-bold text-white/20">♫</span>
              </div>
            )}
            {/* Dark gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Title + metadata overlaid at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h1 className="font-display text-[26px] font-bold leading-tight text-white drop-shadow-md md:text-[30px]">
                {beat.title}
              </h1>
              <p className="mt-1 text-sm text-white/70">{beat.genre ?? "Beat"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {beat.bpm && (
                  <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs text-white backdrop-blur-sm">
                    {beat.bpm} BPM
                  </span>
                )}
                {beat.key && (
                  <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs text-white backdrop-blur-sm">
                    {beat.key}
                  </span>
                )}
                <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs text-white backdrop-blur-sm">
                  {beat.play_count} écoutes
                </span>
              </div>
            </div>
          </div>

          {/* Audio player */}
          <div className="mt-5">
            <AudioPlayer beatId={beat.id} previewUrl={beat.audio_preview_url} />
          </div>

          {/* Tags */}
          {beat.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {beat.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-bg-surface px-2.5 py-0.5 text-xs text-text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: License + Buy */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-5">
            <LicenseSelector
              priceSimple={beat.price_simple}
              priceExclusive={beat.price_exclusive}
              selectedLicense={selectedLicense}
              onSelect={setSelectedLicense}
            />

            <button
              type="button"
              disabled={buying}
              className="mt-5 w-full rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.3)] transition-opacity hover:opacity-90 disabled:opacity-50"
              onClick={async () => {
                setBuying(true);
                const result = await purchaseBeat(beat.id, selectedLicense);
                if (!result.success) {
                  if (result.error === "Connexion requise pour acheter") {
                    window.location.href = `/login?redirect=/beats/${beat.slug}`;
                    return;
                  }
                  toast({ title: "Erreur", description: result.error, variant: "error" });
                  setBuying(false);
                  return;
                }
                window.location.href = result.data.checkoutUrl;
              }}
            >
              {buying ? "Achat en cours..." : `Acheter pour ${price}€`}
            </button>

            <p className="mt-3 text-center text-xs text-text-muted">
              Téléchargement WAV instantané après paiement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
