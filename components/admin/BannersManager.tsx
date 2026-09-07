'use client';

import { useState } from 'react';
import { createBanner, deleteBanner, updateBanner, type BannerInput } from '@/app/actions/banners';
import MediaPicker from '@/components/admin/MediaPicker';

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  status: 'active' | 'inactive';
  imageId: string | null;
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

const EMPTY: Omit<Banner, 'id' | 'imageUrl'> = {
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaUrl: '',
  status: 'inactive',
  imageId: null,
  startsAt: null,
  endsAt: null
};

export default function BannersManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [draft, setDraft] = useState<Omit<Banner, 'id' | 'imageUrl'>>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toInput(d: Omit<Banner, 'id' | 'imageUrl'>): BannerInput {
    return {
      imageId: d.imageId,
      title: d.title,
      subtitle: d.subtitle,
      ctaLabel: d.ctaLabel,
      ctaUrl: d.ctaUrl,
      status: d.status,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null
    };
  }

  async function onSave() {
    setSaving(true);
    try {
      if (editingId) {
        await updateBanner(editingId, toInput(draft));
        setBanners((prev) => prev.map((b) => (b.id === editingId ? { ...draft, id: b.id, imageUrl: b.imageUrl } : b)));
      } else {
        const created = await createBanner(toInput(draft));
        setBanners((prev) => [...prev, { ...draft, id: created.id, imageUrl: null }]);
      }
      setDraft(EMPTY);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('¿Eliminar este banner?')) return;
    await deleteBanner(id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  function onEdit(b: Banner) {
    setEditingId(b.id);
    setDraft({ title: b.title, subtitle: b.subtitle, ctaLabel: b.ctaLabel, ctaUrl: b.ctaUrl, status: b.status, imageId: b.imageId, startsAt: b.startsAt, endsAt: b.endsAt });
  }

  return (
    <>
      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th></th><th>Título</th><th>Estado</th><th>Vigencia</th><th></th></tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id}>
                <td>{b.imageUrl && <img src={b.imageUrl} alt="" />}</td>
                <td>{b.title || '(sin título)'}</td>
                <td><span className={`admin-badge ${b.status === 'active' ? 'admin-badge--ok' : 'admin-badge--off'}`}>{b.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                <td style={{ fontSize: 12 }}>{b.startsAt ? new Date(b.startsAt).toLocaleDateString('es-CO') : '—'} / {b.endsAt ? new Date(b.endsAt).toLocaleDateString('es-CO') : '—'}</td>
                <td className="admin-table__actions">
                  <button type="button" className="admin-btn admin-btn--small" onClick={() => onEdit(b)}>Editar</button>
                  <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={() => onDelete(b.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--c-grey-dim)' }}>Sin banners todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h2 style={{ fontSize: 15, marginBottom: 14 }}>{editingId ? 'Editar banner' : 'Nuevo banner'}</h2>
        <div className="admin-form">
          <div className="admin-field">
            <label>Título</label>
            <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Subtítulo</label>
            <input type="text" value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
          </div>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Texto del botón</label>
              <input type="text" value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Enlace</label>
              <input type="text" value={draft.ctaUrl} onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })} />
            </div>
          </div>
          <MediaPicker label="Imagen" value={draft.imageId} onChange={(id) => setDraft({ ...draft, imageId: id })} />
          <div className="admin-grid-2">
            <div className="admin-field">
              <label>Desde</label>
              <input type="date" value={draft.startsAt ? draft.startsAt.slice(0, 10) : ''} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div className="admin-field">
              <label>Hasta</label>
              <input type="date" value={draft.endsAt ? draft.endsAt.slice(0, 10) : ''} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>
          <label className="admin-field--row">
            <input type="checkbox" checked={draft.status === 'active'} onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'active' : 'inactive' })} /> Activo
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="admin-btn admin-btn--primary" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear banner'}
            </button>
            {editingId && (
              <button type="button" className="admin-btn" onClick={() => { setEditingId(null); setDraft(EMPTY); }}>Cancelar edición</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
