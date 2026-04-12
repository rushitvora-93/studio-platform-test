"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Music } from "lucide-react";
import { getPublishedBeats, addToFavorites } from "@/actions/beats";
import { BeatSwipeCard } from "@/components/beats/beat-swipe-card";
import { BeatsOnboarding } from "@/components/beats/beats-onboarding";
import { useAudioStore } from "@/stores/audio-store";
import { toast } from "@/components/ui/toaster";
import type { Beat } from "@/types";

export default function BeatsPage() {
  const [beats, setBeats] = useState<Beat[]>([]);
  // currentIndex drives the counter and updates immediately on swipe
  const [currentIndex, setCurrentIndex] = useState(0);
  // renderIndex drives the card and updates after the exit animation
  const [renderIndex, setRenderIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const animatingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { play, stop } = useAudioStore();

  // Auto-play whenever the rendered beat changes (after first interaction)
  useEffect(() => {
    if (!hasInteracted || beats.length === 0 || renderIndex >= beats.length) return;
    const beat = beats[renderIndex];
    if (beat.audio_preview_url) {
      play(beat.id, beat.audio_preview_url);
    }
  }, [renderIndex, hasInteracted, beats, play]);

  useEffect(() => {
    // Check localStorage after mount (avoids SSR/hydration mismatch)
    const alreadyOnboarded = !!localStorage.getItem("studio_beats_onboarded");
    if (!alreadyOnboarded) {
      setShowOnboarding(true);
    } else {
      // User has already completed onboarding — treat as interacted
      setHasInteracted(true);
    }

    async function load() {
      const result = await getPublishedBeats();
      if (result.success && result.data.length > 0) {
        setBeats(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("studio_beats_onboarded", "true");
    setShowOnboarding(false);
    // Mark as interacted so auto-play works from now on
    setHasInteracted(true);
  }, []);

  const animateAndAdvance = useCallback(
    (direction: "left" | "right") => {
      if (animatingRef.current) return;
      animatingRef.current = true;

      stop();
      setExitDirection(direction);
      // Counter updates immediately so the user sees it change on swipe
      setCurrentIndex((i) => i + 1);

      if (direction === "right" && beats[renderIndex]) {
        const beat = beats[renderIndex];
        addToFavorites(beat.id).then((result) => {
          if (result.success) {
            toast({
              title: "Ajouté aux favoris",
              description: beat.title,
              variant: "success",
            });
          } else if (result.error === "Connexion requise") {
            toast({
              title: "Connecte-toi pour sauvegarder tes favoris",
              variant: "default",
            });
          }
        });
      }

      setTimeout(() => {
        // Card switches after exit animation completes
        setRenderIndex((i) => i + 1);
        setExitDirection(null);
        animatingRef.current = false;
      }, 400);
    },
    [beats, renderIndex, stop],
  );

  const handleSwipeLeft = useCallback(() => {
    animateAndAdvance("left");
  }, [animateAndAdvance]);

  const handleSwipeRight = useCallback(() => {
    animateAndAdvance("right");
  }, [animateAndAdvance]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-64 w-64 animate-pulse rounded-2xl bg-bg-surface" />
      </div>
    );
  }

  // Empty state
  if (beats.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-bg-surface">
          <Music className="h-10 w-10 text-text-muted" />
        </div>
        <h1 className="font-display text-xl font-bold">
          Nouveaux beats bientôt disponibles !
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Notre catalogue est en cours de préparation. Reviens vite.
        </p>
        <a
          href="/booking"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Réserver une session
        </a>
      </div>
    );
  }

  // All beats swiped
  if (renderIndex >= beats.length) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-bg-surface">
          <Music className="h-10 w-10 text-text-muted" />
        </div>
        <h1 className="font-display text-xl font-bold">
          Tu as tout écouté !
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Reviens bientôt pour découvrir de nouveaux beats.
        </p>
        <button
          type="button"
          onClick={() => {
            stop();
            setCurrentIndex(0);
            setRenderIndex(0);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border-default px-6 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover"
        >
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && (
        <BeatsOnboarding onComplete={handleOnboardingComplete} />
      )}

      <div className="beat-swipe-screen">
        {/* Counter — top right */}
        <div
          className="absolute left-0 right-0 top-0 z-10 flex items-center justify-end"
          style={{ padding: "var(--space-4, 16px)" }}
        >
          <span className="font-mono text-xs text-text-muted">
            {Math.min(currentIndex + 1, beats.length)} / {beats.length}
          </span>
        </div>

        {/* Swipe hint */}
        <div className="swipe-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Swipe pour découvrir
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Card stack */}
        <div className="beat-card-container">
          <div className="relative" style={{ width: "100%", maxWidth: 340, height: 460 }}>
            <BeatSwipeCard
              key={beats[renderIndex].id}
              beat={beats[renderIndex]}
              isTop={true}
              exitDirection={exitDirection}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          </div>
        </div>

        {/* Action buttons — prototype style */}
        <div className="swipe-actions">
          {/* Skip */}
          <button
            type="button"
            onClick={handleSwipeLeft}
            className="swipe-btn swipe-btn-skip"
            aria-label="Passer cette prod"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Like / Favorites */}
          <button
            type="button"
            onClick={handleSwipeRight}
            className="swipe-btn swipe-btn-like"
            aria-label="Ajouter aux favoris"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
