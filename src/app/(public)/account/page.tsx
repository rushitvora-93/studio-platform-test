"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Trash2, Clock, SlidersHorizontal, Heart } from "lucide-react";
import Link from "next/link";
import { getProfile, updateProfile, signOut, deleteAccount } from "@/actions/profile";
import { toast } from "@/components/ui/toaster";
import type { Profile } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<(Profile & { email: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getProfile();
      if (!result.success) {
        // Not authenticated — redirect to login
        router.push("/login?redirect=/account");
        return;
      }
      setProfile(result.data);
      setFullName(result.data.full_name);
      setPhone(result.data.phone ?? "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    // Client-side validation
    if (!fullName.trim()) {
      setErrors({ fullName: "Le nom est requis" });
      setSaving(false);
      return;
    }

    const result = await updateProfile({
      fullName: fullName.trim(),
      phone: phone.trim() || null,
    });

    if (!result.success) {
      setErrors({ form: result.error });
      setSaving(false);
      return;
    }

    setProfile((prev) => prev ? { ...prev, ...result.data } : prev);
    toast({
      title: "Profil mis à jour",
      description: "Tes informations ont été enregistrées.",
      variant: "success",
    });
    setSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const result = await deleteAccount();
    if (!result.success) {
      toast({
        title: "Erreur",
        description: result.error,
        variant: "error",
      });
      setDeleting(false);
      setShowDeleteDialog(false);
      return;
    }
    router.push("/");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-12 md:px-6 md:py-20">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-bg-surface" />
          <div className="h-48 rounded-lg bg-bg-surface" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="px-4 pt-6 pb-24 md:mx-auto md:max-w-[600px] md:px-6 md:pt-12">
      <h1 className="font-display text-[30px] font-bold leading-tight mb-6">Mon compte</h1>

      {/* Centered Avatar */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full" style={{
          padding: "3px",
          backgroundImage: "linear-gradient(#141414, #141414), linear-gradient(135deg, #8B5CF6, #D946EF, #F43F5E)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}>
          <div className="flex h-full w-full items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #2d1b69, #0f3460)" }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-white">
                {profile.full_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
        </div>
        <h3 className="font-display text-xl font-semibold">{profile.full_name}</h3>
        <p className="text-xs text-text-secondary">{profile.email}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/account/history" className="flex-1 rounded-xl border border-border-subtle bg-bg-elevated p-4 text-center transition-colors hover:border-border-default">
          <Clock className="mx-auto mb-2 h-5 w-5 text-purple-500" />
          <span className="text-xs font-medium">Historique</span>
        </Link>
        <Link href="/account/mixing" className="flex-1 rounded-xl border border-border-subtle bg-bg-elevated p-4 text-center transition-colors hover:border-border-default">
          <SlidersHorizontal className="mx-auto mb-2 h-5 w-5 text-purple-500" />
          <span className="text-xs font-medium">Mixages</span>
        </Link>
        <Link href="/account/favorites" className="flex-1 rounded-xl border border-border-subtle bg-bg-elevated p-4 text-center transition-colors hover:border-border-default">
          <Heart className="mx-auto mb-2 h-5 w-5 text-purple-500" />
          <span className="text-xs font-medium">Favoris</span>
        </Link>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="space-y-5">
        <h3 className="font-display text-xl font-semibold">Informations personnelles</h3>

        {/* Name */}
        <div>
          <label
            htmlFor="fullName"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Nom complet
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-error">{errors.fullName}</p>
          )}
        </div>

        {/* Email (read-only) */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="w-full rounded-lg border border-border-subtle bg-bg-elevated/50 px-4 py-2.5 text-sm text-text-muted"
          />
          <p className="mt-1 text-xs text-text-muted">
            L&apos;email ne peut pas être modifié
          </p>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
            className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-error">{errors.phone}</p>
          )}
        </div>

        {/* Form error */}
        {errors.form && (
          <p className="text-sm text-error">{errors.form}</p>
        )}

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_4px_32px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Sauvegarder"}
        </button>
      </form>

      {/* Sign out */}
      <div className="mt-8 border-t border-border-subtle pt-8">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg border border-border-default px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>

      {/* Delete account (RGPD) */}
      <div className="mt-6 border-t border-border-subtle pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Zone dangereuse
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          La suppression de ton compte est irréversible. Toutes tes données
          (réservations, achats, mixages) seront définitivement effacées.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className="mt-3 flex items-center gap-2 rounded-lg border border-error/50 px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteDialog(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-subtle bg-bg-surface p-6">
            <h2 className="font-display text-lg font-bold">
              Supprimer ton compte ?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Cette action est <span className="font-semibold text-error">irréversible</span>.
              Toutes tes données personnelles seront supprimées :
            </p>
            <ul className="mt-2 space-y-1 text-sm text-text-muted">
              <li>• Profil et informations personnelles</li>
              <li>• Historique des réservations</li>
              <li>• Achats de beats</li>
              <li>• Commandes de mixage</li>
            </ul>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-border-default px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
