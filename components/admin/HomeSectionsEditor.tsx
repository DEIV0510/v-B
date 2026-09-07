'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateHomeSection, reorderHomeSections, type HomeSectionInput } from '@/app/actions/home-sections';
import MediaPicker from '@/components/admin/MediaPicker';

type Section = {
  key: string;
  label: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
  imageMediaIds: string[];
};

export default function HomeSectionsEditor({ sections: initialSections }: { sections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  function updateLocal(key: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    setReordering(true);
    await reorderHomeSections(next.map((s) => s.key));
    setReordering(false);
    router.refresh();
  }

  async function toggleActive(key: string, isActive: boolean) {
    const section = sections.find((s) => s.key === key);
    if (!section) return;
    updateLocal(key, { isActive });
    await updateHomeSection(key, toInput({ ...section, isActive }));
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {sections.map((section, index) => (
        <div className="admin-card" key={section.key} style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button type="button" className="admin-btn admin-btn--small" disabled={index === 0 || reordering} onClick={() => move(index, -1)}>↑</button>
                <button type="button" className="admin-btn admin-btn--small" disabled={index === sections.length - 1 || reordering} onClick={() => move(index, 1)}>↓</button>
              </div>
              <div>
                <strong>{section.label}</strong>
                <div>
                  <span className={`admin-badge ${section.isActive ? 'admin-badge--ok' : 'admin-badge--off'}`}>
                    {section.isActive ? 'Visible' : 'Oculta'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="admin-field--row" style={{ fontSize: 12.5 }}>
                <input type="checkbox" checked={section.isActive} onChange={(e) => toggleActive(section.key, e.target.checked)} /> Visible
              </label>
              <button type="button" className="admin-btn admin-btn--small" onClick={() => setOpenKey(openKey === section.key ? null : section.key)}>
                {openKey === section.key ? 'Cerrar' : 'Editar'}
              </button>
            </div>
          </div>

          {openKey === section.key && <SectionEditor section={section} onChange={(patch) => updateLocal(section.key, patch)} onSaved={() => router.refresh()} />}
        </div>
      ))}
    </div>
  );
}

function toInput(section: Section): HomeSectionInput {
  return {
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    ctaLabel: section.ctaLabel,
    ctaUrl: section.ctaUrl,
    imageMediaIds: section.imageMediaIds,
    isActive: section.isActive
  };
}

function SectionEditor({ section, onChange, onSaved }: { section: Section; onChange: (patch: Partial<Section>) => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    setSaving(true);
    setSaved(false);
    await updateHomeSection(section.key, toInput(section));
    setSaving(false);
    setSaved(true);
    onSaved();
  }

  return (
    <div className="admin-form" style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
      {saved && <div className="admin-alert admin-alert--ok">Guardado.</div>}
      <div className="admin-field">
        <label>Texto pequeño (eyebrow)</label>
        <input type="text" value={section.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} />
      </div>
      <div className="admin-field">
        <label>Título</label>
        <textarea value={section.title} onChange={(e) => onChange({ title: e.target.value })} />
        <small>Cada línea (Enter) aparece como una fila del título.</small>
      </div>
      <div className="admin-field">
        <label>Texto / descripción</label>
        <textarea value={section.body} onChange={(e) => onChange({ body: e.target.value })} />
      </div>
      <div className="admin-grid-2">
        <div className="admin-field">
          <label>Texto del botón</label>
          <input type="text" value={section.ctaLabel} onChange={(e) => onChange({ ctaLabel: e.target.value })} />
        </div>
        <div className="admin-field">
          <label>Enlace del botón</label>
          <input type="text" value={section.ctaUrl} onChange={(e) => onChange({ ctaUrl: e.target.value })} />
        </div>
      </div>
      <MediaPicker label="Imágenes de la sección" multiple value={section.imageMediaIds} onChange={(ids) => onChange({ imageMediaIds: ids })} />
      <button type="button" className="admin-btn admin-btn--primary" onClick={onSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
        {saving ? 'Guardando…' : 'Guardar sección'}
      </button>
    </div>
  );
}
