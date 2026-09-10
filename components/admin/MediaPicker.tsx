'use client';

import { useEffect, useRef, useState } from 'react';
import { listMedia, uploadMedia } from '@/app/actions/media';

type Media = { id: string; url: string; filename: string; altText: string };

type Props =
  | { multiple?: false; value: string | null; onChange: (mediaId: string | null) => void; label: string }
  | { multiple: true; value: string[]; onChange: (mediaIds: string[]) => void; label: string };

export default function MediaPicker(props: Props) {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    listMedia()
      .then(setMedia)
      .finally(() => setLoading(false));
  }, []);

  const selectedIds = props.multiple ? props.value : props.value ? [props.value] : [];

  function toggle(id: string) {
    if (props.multiple) {
      const next = props.value.includes(id) ? props.value.filter((v) => v !== id) : [...props.value, id];
      props.onChange(next);
    } else {
      props.onChange(props.value === id ? null : id);
    }
  }

  async function onUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const created = await uploadMedia(fd);
      setMedia((prev) => [created, ...prev]);
      toggle(created.id);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  const selectedMedia = media.filter((m) => selectedIds.includes(m.id));

  return (
    <div className="admin-field">
      <label>{props.label}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {selectedMedia.length > 0 ? (
          selectedMedia.map((m) => <img key={m.id} src={m.url} alt={m.altText} style={{ width: 60, height: 74, objectFit: 'cover', borderRadius: 4 }} />)
        ) : (
          <span style={{ fontSize: 12.5, color: 'var(--c-grey-dim2)' }}>Sin imagen seleccionada</span>
        )}
      </div>
      <button type="button" className="admin-btn admin-btn--small" onClick={() => setOpen((v) => !v)}>
        {open ? 'Cerrar galería' : 'Elegir imagen'}
      </button>

      {open && (
        <div style={{ marginTop: 12, border: '1px solid var(--line)', borderRadius: 8, padding: 14 }}>
          {/* Sin <form> a proposito: este componente se usa dentro de otros
              formularios (producto, coleccion, config) y anidar forms es HTML
              invalido — rompe la hidratacion de React. */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            <input ref={fileRef} type="file" accept="image/*" />
            <button type="button" className="admin-btn admin-btn--small" disabled={uploading} onClick={onUpload}>
              {uploading ? 'Subiendo…' : 'Subir nueva'}
            </button>
          </div>
          {error && <div className="admin-alert admin-alert--error">{error}</div>}
          {loading ? (
            <p style={{ fontSize: 12.5, color: 'var(--c-grey-dim)' }}>Cargando imágenes…</p>
          ) : (
            <div className="media-grid">
              {media.map((m) => (
                <div
                  key={m.id}
                  className={`media-grid__item${selectedIds.includes(m.id) ? ' is-selected' : ''}`}
                  onClick={() => toggle(m.id)}
                >
                  <img src={m.url} alt={m.altText} />
                  <small>{m.filename}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
