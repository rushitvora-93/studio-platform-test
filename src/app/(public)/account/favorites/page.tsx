"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Trash2, Music } from "lucide-react";
import { getFavorites, removeFromFavorites } from "@/actions/beats";
import { AudioPlayer } from "@/components/beats/audio-player";
import { toast } from "@/components/ui/toaster";
import type { Beat } from "@/types";

type FavoriteBeat = Beat & { favorited_at: string };

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteBeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getFavorites();
      if (!result.success) {
        if (result.error === "Connexion requise") {
          router.push("/login?redirect=/account/favorites");
          return;
        }
        toast({ title: "Erreur", description: result.error, variant: "error" });
        setLoading(false);
        return;
      }
      setFavorites(result.data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleRemove(beatId: string, beatTitle: string) {
    setRemoving(beatId);
    const result = await removeFromFavorites(beatId);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "error" });
      setRemoving(null);
      return;
    }
    setFavorites((prev) => prev.filter((b) => b.id !== beatId));
    toast({ title: `${beatTitle} retiré des favoris`, variant: "success" });
    setRemoving(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-12 md:px-6 md:py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-bg-surface" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] px-4 py-12 md:px-6 md:py-20">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Mon compte
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight">
            Mes favoris
          </h1>
          <p className="text-sm text-text-secondary">
            {favorites.length} beat{favorites.length !== 1 ? "s" : ""} sauvegardé{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-bg-surface p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-hover">
            <Music className="h-8 w-8 text-text-muted" />
          </div>
          <p className="font-display font-semibold">Aucun favori pour l&apos;instant</p>
          <p className="mt-1 text-sm text-text-secondary">
            Swipe à droite sur un beat pour l&apos;ajouter ici.
          </p>
          <Link
            href="/beats"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.3)] transition-opacity hover:opacity-90"
          >
            Découvrir les beats
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((beat) => (
            <div
              key={beat.id}
              className="cursor-pointer rounded-xl border border-border-subtle bg-bg-surface p-4"
            >
              <div className="flex items-start gap-4">
                {/* Cover */}
                <Link href={`/beats/${beat.slug}`} className="flex-shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/40 to-magenta-500/40">
                    {beat.cover_image_url ? (
                      <img
                        src={beat.cover_image_url}
                        alt={beat.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-display text-2xl text-white/30">♫</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/beats/${beat.slug}`}
                    className="truncate font-display font-semibold transition-colors hover:text-purple-400"
                  >
                    {beat.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                    {beat.bpm && <span>{beat.bpm} BPM</span>}
                    {beat.key && <><span>·</span><span>{beat.key}</span></>}
                    {beat.genre && <><span>·</span><span>{beat.genre}</span></>}
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-text-primary">
                    {beat.price_simple}€
                    {beat.price_exclusive && (
                      <span className="ml-1 font-normal text-text-muted">
                        / {beat.price_exclusive}€ (exclu)
                      </span>
                    )}
                  </p>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemove(beat.id, beat.title)}
                  disabled={removing === beat.id}
                  className="flex-shrink-0 cursor-pointer rounded-lg p-2 text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                  aria-label="Retirer des favoris"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Audio player */}
              <div className="mt-3 border-t border-border-subtle pt-3">
                <AudioPlayer
                  beatId={beat.id}
                  previewUrl={beat.audio_preview_url}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
