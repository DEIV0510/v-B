'use client';

import { useRef, useState } from 'react';
import { deleteMedia, updateMediaAlt, uploadMedia } from '@/app/actions/media';

type Media = { id: string; url: string; filename: string; altText: string; sizeBytes: number | null };

export default function MediaLibrary({ initialMedia }: { initialMedia: Media[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState('');

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const created = await uploadMedia(fd);
      setMedia((prev) => [created, ...prev]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id: string, filename: string) {
    if (!window.confirm(`¿Eliminar "${filename}"?`)) return;
    try {
      await deleteMedia(id);
      setMedia((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar (puede estar en uso)');
    }
  }

  async function saveAlt(id: string) {
    const updated = await updateMediaAlt(id, altDraft);
    setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, altText: updated.altText } : m)));
    setEditing(null);
  }

  return (
    <>
      <div className="admin-card">
        <form onSubmit={onUpload} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="image/*" />
          <button type="submit" className="admin-btn admin-btn--primary" disabled={uploading}>
            {uploading ? 'Subiendo…' : 'Subir imagen'}
          </button>
        </form>
        {error && <div className="admin-alert admin-alert--error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      <div className="media-grid">
        {media.map((m) => (
          <div key={m.id} className="media-grid__item" style={{ cursor: 'default' }}>
            <img src={m.url} alt={m.altText} />
            {editing === m.id ? (
              <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input
                  type="text"
                  value={altDraft}
                  onChange={(e) => setAltDraft(e.target.value)}
                  placeholder="Texto alternativo"
                  style={{ fontSize: 11, padding: 4, background: 'var(--c-void)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--c-white)' }}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" className="admin-btn admin-btn--small" onClick={() => saveAlt(m.id)}>Guardar</button>
                  <button type="button" className="admin-btn admin-btn--small" onClick={() => setEditing(null)}>×</button>
                </div>
              </div>
            ) : (
              <>
                <small>{m.filename}</small>
                <div style={{ display: 'flex', gap: 4, padding: '0 6px 6px' }}>
                  <button type="button" className="admin-btn admin-btn--small" onClick={() => { setEditing(m.id); setAltDraft(m.altText); }}>Alt</button>
                  <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={() => onDelete(m.id, m.filename)}>Eliminar</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
