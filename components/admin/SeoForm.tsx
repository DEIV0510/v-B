'use client';

import { useState } from 'react';
import { updateSeoSettings, type SeoSettingsInput } from '@/app/actions/settings';
import MediaPicker from '@/components/admin/MediaPicker';

export default function SeoForm({ page, initial }: { page: string; initial: SeoSettingsInput }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SeoSettingsInput>(key: K, value: SeoSettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateSeoSettings(page, form);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {saved && <div className="admin-alert admin-alert--ok">SEO guardado.</div>}
      <div className="admin-field">
        <label>Título (pestaña del navegador)</label>
        <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="admin-field">
        <label>Meta descripción</label>
        <textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} />
      </div>
      <div className="admin-field">
        <label>Título al compartir (Open Graph)</label>
        <input type="text" value={form.ogTitle} onChange={(e) => set('ogTitle', e.target.value)} />
      </div>
      <div className="admin-field">
        <label>Descripción al compartir</label>
        <textarea value={form.ogDescription} onChange={(e) => set('ogDescription', e.target.value)} />
      </div>
      <MediaPicker label="Imagen al compartir" value={form.ogImageId} onChange={(id) => set('ogImageId', id)} />
      <div className="admin-field">
        <label>URL canónica (opcional)</label>
        <input type="url" value={form.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} />
      </div>
      <button type="submit" className="admin-btn admin-btn--primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Guardando…' : 'Guardar SEO'}
      </button>
    </form>
  );
}
