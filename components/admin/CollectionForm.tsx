'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCollection, updateCollection, deleteCollection, type CollectionInput } from '@/app/actions/collections';
import MediaPicker from '@/components/admin/MediaPicker';

type Props = {
  mode: 'create' | 'edit';
  collectionId?: string;
  initial?: Partial<CollectionInput>;
};

export default function CollectionForm({ mode, collectionId, initial }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageId, setImageId] = useState<string | null>(initial?.imageId ?? null);
  const [status, setStatus] = useState<'active' | 'inactive'>(initial?.status ?? 'active');
  const [hasBundle, setHasBundle] = useState(!!(initial?.bundleQty && initial?.bundlePrice));
  const [bundleQty, setBundleQty] = useState<number>(initial?.bundleQty ?? 3);
  const [bundlePrice, setBundlePrice] = useState<number>(initial?.bundlePrice ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const input: CollectionInput = {
      slug,
      name,
      description,
      imageId,
      status,
      bundleQty: hasBundle ? Number(bundleQty) : null,
      bundlePrice: hasBundle ? Number(bundlePrice) : null
    };

    try {
      if (mode === 'create') await createCollection(input);
      else if (collectionId) await updateCollection(collectionId, input);
      router.push('/admin/colecciones');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la colección');
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!collectionId) return;
    if (!window.confirm('¿Eliminar esta colección?')) return;
    try {
      await deleteCollection(collectionId);
      router.push('/admin/colecciones');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="admin-field">
        <label htmlFor="name">Nombre</label>
        <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="admin-field">
        <label htmlFor="slug">Slug</label>
        <input id="slug" type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>
      <div className="admin-field">
        <label htmlFor="description">Descripción</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <MediaPicker label="Imagen de portada" value={imageId} onChange={setImageId} />

      <fieldset className="admin-fieldset">
        <legend>Promoción combo</legend>
        <label className="admin-field--row"><input type="checkbox" checked={hasBundle} onChange={(e) => setHasBundle(e.target.checked)} /> Esta colección tiene combo por cantidad</label>
        {hasBundle && (
          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="bundleQty">Cantidad del combo</label>
              <input id="bundleQty" type="number" min={2} value={bundleQty} onChange={(e) => setBundleQty(Number(e.target.value))} />
            </div>
            <div className="admin-field">
              <label htmlFor="bundlePrice">Precio del combo (COP)</label>
              <input id="bundlePrice" type="number" min={0} value={bundlePrice} onChange={(e) => setBundlePrice(Number(e.target.value))} />
            </div>
          </div>
        )}
      </fieldset>

      <div className="admin-field admin-field--row">
        <input type="checkbox" id="active" checked={status === 'active'} onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')} />
        <label htmlFor="active">Colección activa</label>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear colección' : 'Guardar cambios'}
        </button>
        <button type="button" className="admin-btn" onClick={() => router.push('/admin/colecciones')}>Cancelar</button>
        {mode === 'edit' && (
          <button type="button" className="admin-btn admin-btn--danger" onClick={onDelete}>Eliminar</button>
        )}
      </div>
    </form>
  );
}
