'use client';

import { useState } from 'react';
import { updateSiteSettings, type SiteSettingsInput } from '@/app/actions/settings';
import MediaPicker from '@/components/admin/MediaPicker';

export default function SettingsForm({ initial }: { initial: SiteSettingsInput }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SiteSettingsInput>(key: K, value: SiteSettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateSiteSettings(form);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      {saved && <div className="admin-alert admin-alert--ok">Configuración guardada.</div>}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <fieldset className="admin-fieldset">
        <legend>WhatsApp</legend>
        <div className="admin-field">
          <label>Número de WhatsApp</label>
          <input type="text" placeholder="57XXXXXXXXXX" value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
          <small>Formato internacional sin +, ej: 573001234567. Sin este número el checkout no funciona.</small>
        </div>
        <div className="admin-field">
          <label>Mensaje inicial del pedido</label>
          <textarea value={form.whatsappMessageTemplate} onChange={(e) => set('whatsappMessageTemplate', e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Envío</legend>
        <div className="admin-field">
          <label>Costo de envío (COP)</label>
          <input type="number" min={0} value={form.shippingCost} onChange={(e) => set('shippingCost', Number(e.target.value))} />
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Marca</legend>
        <div className="admin-field">
          <label>Nombre de la tienda</label>
          <input type="text" value={form.storeName} onChange={(e) => set('storeName', e.target.value)} />
        </div>
        <MediaPicker label="Logo" value={form.logoMediaId} onChange={(id) => set('logoMediaId', id)} />
        <MediaPicker label="Favicon" value={form.faviconMediaId} onChange={(id) => set('faviconMediaId', id)} />
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Redes sociales</legend>
        <div className="admin-field">
          <label>Instagram</label>
          <input type="url" placeholder="https://instagram.com/…" value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>TikTok</label>
          <input type="url" placeholder="https://tiktok.com/@…" value={form.tiktokUrl} onChange={(e) => set('tiktokUrl', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>Facebook</label>
          <input type="url" placeholder="https://facebook.com/…" value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Contacto</legend>
        <div className="admin-field">
          <label>Correo</label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>Dirección</label>
          <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="admin-field">
          <label>Horario</label>
          <input type="text" value={form.hours} onChange={(e) => set('hours', e.target.value)} />
        </div>
      </fieldset>

      <button type="submit" className="admin-btn admin-btn--primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </form>
  );
}
