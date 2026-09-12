"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Trash2, Music, Upload, AlertTriangle, Pencil, Check, X, GripVertical } from "lucide-react";
import { checkAdminAccess } from "@/actions/admin";
import {
  getAdminBeats,
  adminUpdateBeat,
  adminDeleteBeat,
  adminReorderBeats,
  type AdminBeat,
} from "@/actions/admin-beats";
import { toast } from "@/components/ui/toaster";

function getStatusLabel(beat: AdminBeat): { label: string; color: string } {
  if (beat.is_exclusive_sold) return { label: "Vendu (exclusif)", color: "text-error" };
  if (beat.is_published) return { label: "Publié", color: "text-success" };
  return { label: "Brouillon", color: "text-warning" };
}

type EditState = {
  title: string;
  bpm: string;
  key: string;
  genre: string;
  price_simple: string;
  price_exclusive: string;
};

export default function AdminBeatsCatalogPage() {
  const router = useRouter();
  const [beats, setBeats] = useState<AdminBeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    title: "",
    bpm: "",
    key: "",
    genre: "",
    price_simple: "",
    price_exclusive: "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const access = await checkAdminAccess();
      if (!access.success || !access.data.isAdmin) {
        router.push("/");
        return;
      }
      const result = await getAdminBeats();
      if (result.success) setBeats(result.data);
      setLoading(false);
    }
    load();
  }, [router]);

  function startEditing(beat: AdminBeat) {
    setEditingId(beat.id);
    setEditState({
      title: beat.title,
      bpm: beat.bpm?.toString() ?? "",
      key: beat.key ?? "",
      genre: beat.genre ?? "",
      price_simple: beat.price_simple.toString(),
      price_exclusive: beat.price_exclusive?.toString() ?? "",
    });
  }

  async function handleSave(beatId: string) {
    setSaving(true);
    const result = await adminUpdateBeat(beatId, {
      title: editState.title.trim() || undefined,
      bpm: editState.bpm ? parseInt(editState.bpm) : undefined,
      key: editState.key.trim() || undefined,
      genre: editState.genre.trim() || undefined,
      price_simple: editState.price_simple ? parseInt(editState.price_simple) : undefined,
      price_exclusive: editState.price_exclusive ? parseInt(editState.price_exclusive) : null,
    });
    setSaving(false);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "error" });
      return;
    }
    setBeats((prev) =>
      prev.map((b) =>
        b.id === beatId
          ? {
              ...b,
              title: editState.title.trim() || b.title,
              bpm: editState.bpm ? parseInt(editState.bpm) : b.bpm,
              key: editState.key.trim() || b.key,
              genre: editState.genre.trim() || b.genre,
              price_simple: editState.price_simple ? parseInt(editState.price_simple) : b.price_simple,
              price_exclusive: editState.price_exclusive ? parseInt(editState.price_exclusive) : null,
            }
          : b,
      ),
    );
    setEditingId(null);
    toast({ title: "Beat mis à jour", variant: "success" });
  }

  async function handleTogglePublish(beat: AdminBeat) {
    const result = await adminUpdateBeat(beat.id, {
      is_published: !beat.is_published,
    });
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "error" });
      return;
    }
    setBeats((prev) =>
      prev.map((b) =>
        b.id === beat.id ? { ...b, is_published: !b.is_published } : b,
      ),
    );
    toast({
      title: beat.is_published ? "Beat dépublié" : "Beat publié",
      variant: "success",
    });
  }

  async function handleDelete(beatId: string) {
    setDeleting(true);
    const result = await adminDeleteBeat(beatId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (!result.success) {
      toast({ title: "Erreur", description: result.error, variant: "error" });
      return;
    }
    setBeats((prev) => prev.filter((b) => b.id !== beatId));
    toast({ title: "Beat supprimé définitivement", variant: "success" });
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== dragId) setDragOverId(id);
  }

  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const reordered = [...beats];
    const fromIndex = reordered.findIndex((b) => b.id === dragId);
    const toIndex = reordered.findIndex((b) => b.id === targetId);
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setBeats(reordered);
    setDragId(null);
    setDragOverId(null);
    await adminReorderBeats(reordered.map((b) => b.id));
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-24 md:px-8 md:pt-8">
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
    <div className="px-4 pt-6 pb-24 md:px-8 md:pt-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-bold leading-tight">
            Catalogue Beats
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {beats.length} beat{beats.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/beats/upload"
          className="flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Upload className="h-4 w-4" />
          Uploader un beat
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {beats.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-8 text-center">
            <Music className="mx-auto h-10 w-10 text-text-muted" />
            <p className="mt-3 font-display font-semibold">Aucun beat</p>
          </div>
        ) : (
          beats.map((beat) => {
            const status = getStatusLabel(beat);
            const isEditing = editingId === beat.id;

            return (
              <div
                key={beat.id}
                draggable
                onDragStart={() => handleDragStart(beat.id)}
                onDragOver={(e) => handleDragOver(e, beat.id)}
                onDrop={(e) => handleDrop(e, beat.id)}
                onDragEnd={handleDragEnd}
                className={`rounded-lg border bg-bg-surface p-4 transition-opacity ${
                  dragId === beat.id
                    ? "opacity-40"
                    : dragOverId === beat.id
                      ? "border-purple-500"
                      : "border-border-subtle"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag handle */}
                  <div className="mt-1 flex-shrink-0 cursor-grab text-text-muted active:cursor-grabbing">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  {/* Cover image */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-purple-600/40 to-pink-500/40">
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

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold">
                      {beat.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      {beat.bpm && <span>{beat.bpm} BPM</span>}
                      {beat.key && <span>{beat.key}</span>}
                      {beat.genre && <span>{beat.genre}</span>}
                      <span>·</span>
                      <span>{beat.sales_count} vente{beat.sales_count > 1 ? "s" : ""}</span>
                    </div>
                    <p className={`mt-1 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </p>
                  </div>

                  {/* Price + edit toggle */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-display text-sm font-bold text-text-primary">
                      {beat.price_simple}€
                      {beat.price_exclusive && (
                        <span className="ml-1 text-xs font-normal text-text-muted">
                          / {beat.price_exclusive}€
                        </span>
                      )}
                    </span>
                    {!beat.is_exclusive_sold && (
                      <button
                        type="button"
                        onClick={() => isEditing ? setEditingId(null) : startEditing(beat)}
                        className="flex cursor-pointer items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary"
                      >
                        {isEditing ? (
                          <><X className="h-3 w-3" /> Annuler</>
                        ) : (
                          <><Pencil className="h-3 w-3" /> Modifier</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="col-span-2 sm:col-span-3">
                        <label className="mb-1 block text-xs text-text-muted">Titre</label>
                        <input
                          type="text"
                          value={editState.title}
                          onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
                          className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-text-muted">BPM</label>
                        <input
                          type="number"
                          value={editState.bpm}
                          onChange={(e) => setEditState((s) => ({ ...s, bpm: e.target.value }))}
                          className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-text-muted">Tonalité</label>
                        <input
                          type="text"
                          value={editState.key}
                          onChange={(e) => setEditState((s) => ({ ...s, key: e.target.value }))}
                          className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-text-muted">Genre</label>
                        <input
                          type="text"
                          value={editState.genre}
                          onChange={(e) => setEditState((s) => ({ ...s, genre: e.target.value }))}
                          className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-text-muted">Prix simple (€)</label>
                        <input
                          type="number"
                          min={1}
                          value={editState.price_simple}
                          onChange={(e) => setEditState((s) => ({ ...s, price_simple: e.target.value }))}
                          className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-text-muted">Prix exclusif (€)</label>
                        <input
                          type="number"
                          min={0}
                          value={editState.price_exclusive}
                          onChange={(e) => setEditState((s) => ({ ...s, price_exclusive: e.target.value }))}
                          placeholder="Optionnel"
                          className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-2 text-sm placeholder:text-text-muted"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="cursor-pointer rounded-lg border border-border-default px-4 py-2 text-sm text-text-muted transition-colors hover:text-text-primary"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave(beat.id)}
                        disabled={saving}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {saving ? "Sauvegarde..." : "Sauvegarder"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!beat.is_exclusive_sold && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(beat)}
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-hover"
                    >
                      {beat.is_published ? (
                        <><EyeOff className="h-3 w-3" /> Dépublier</>
                      ) : (
                        <><Eye className="h-3 w-3" /> Publier</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(beat.id)}
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
                    >
                      <Trash2 className="h-3 w-3" /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-bg-surface p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-error" />
              <h2 className="font-display text-lg font-bold">Supprimer ce beat ?</h2>
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              Cette action est irréversible. Le beat et ses fichiers audio seront définitivement supprimés.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 cursor-pointer rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="flex-1 cursor-pointer rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
