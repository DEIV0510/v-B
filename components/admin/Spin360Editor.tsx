'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductSpin from '@/components/store/ProductSpin';
import { resizeForSpin } from '@/lib/image-resize';
import {
  clearSpinFrames,
  deleteSpinFrame,
  setSpinFrameOrder,
  setSpinSettings,
  uploadSpinFrame,
  type SpinFrameDTO
} from '@/app/actions/spin';
import {
  MAX_SPIN_FRAMES,
  MIN_SPIN_FRAMES,
  RECOMMENDED_SPIN_FRAMES,
  SPIN_MAX_SIDE
} from '@/lib/spin';

type Props = {
  productId: string;
  productName: string;
  initialFrames: SpinFrameDTO[];
  initialEnabled: boolean;
  initialReverse: boolean;
};

export default function Spin360Editor({
  productId,
  productName,
  initialFrames,
  initialEnabled,
  initialReverse
}: Props) {
  const router = useRouter();
  const [frames, setFrames] = useState<SpinFrameDTO[]>(initialFrames);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [reverse, setReverse] = useState(initialReverse);

  const [pending, setPending] = useState<File[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [preview, setPreview] = useState(0);

  const spinFrames = useMemo(
    () => frames.map((f) => ({ url: f.url, width: f.width, height: f.height })),
    [frames]
  );
  const enoughFrames = frames.length >= MIN_SPIN_FRAMES;

  function flash(msg: string) {
    setSaved(msg);
    window.setTimeout(() => setSaved(null), 2500);
  }

  /* ---------- paso 2: elegir archivos (se ordenan por nombre ANTES de subir) ---------- */
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    // numeric:true es obligatorio, si no IMG_10 queda antes que IMG_2.
    picked.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    if (frames.length + picked.length > MAX_SPIN_FRAMES) {
      setError(`Máximo ${MAX_SPIN_FRAMES} fotos en total. Ya tienes ${frames.length}.`);
      setPending(null);
      return;
    }
    setPending(picked);
  }

  async function confirmUpload() {
    if (!pending) return;
    setUploading(true);
    setDone(0);
    setError(null);

    const list = pending;
    const out: (SpinFrameDTO | null)[] = new Array(list.length).fill(null);
    let cursor = 0;
    let failed: string | null = null;

    const worker = async () => {
      while (cursor < list.length && !failed) {
        const i = cursor++;
        const file = list[i]!;
        try {
          const { blob, width, height } = await resizeForSpin(file, SPIN_MAX_SIDE);
          const fd = new FormData();
          fd.set('productId', productId);
          fd.set('file', new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: blob.type }));
          fd.set('width', String(width));
          fd.set('height', String(height));
          out[i] = await uploadSpinFrame(fd);
          setDone((d) => d + 1);
        } catch (err) {
          failed = `Falló la foto "${file.name}": ${err instanceof Error ? err.message : 'error desconocido'}`;
        }
      }
    };

    await Promise.all([worker(), worker(), worker()]);

    const uploaded = out.filter((f): f is SpinFrameDTO => f !== null);
    const merged = [...frames, ...uploaded];
    setFrames(merged);
    setPending(null);
    setUploading(false);

    if (failed) {
      setError(`${failed}. Las ${uploaded.length} que sí subieron quedaron guardadas; puedes volver a intentar con las que faltan.`);
    }
    if (uploaded.length) {
      await persistOrder(merged);
      flash(`${uploaded.length} foto(s) subidas.`);
    }
    router.refresh();
  }

  /* ---------- orden ---------- */
  async function persistOrder(next: SpinFrameDTO[]) {
    setFrames(next);
    try {
      await setSpinFrameOrder(productId, next.map((f) => f.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el orden');
    }
  }

  async function invertOrder() {
    await persistOrder([...frames].reverse());
    flash('Orden invertido.');
  }

  async function shiftStart(dir: -1 | 1) {
    if (!frames.length) return;
    const next = [...frames];
    if (dir === 1) next.push(next.shift()!);
    else next.unshift(next.pop()!);
    await persistOrder(next);
  }

  async function moveFrame(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= frames.length) return;
    const next = [...frames];
    [next[index], next[target]] = [next[target]!, next[index]!];
    await persistOrder(next);
  }

  async function removeFrame(frame: SpinFrameDTO) {
    if (!window.confirm('¿Eliminar esta foto de la secuencia?')) return;
    try {
      await deleteSpinFrame(productId, frame.id);
      const next = frames.filter((f) => f.id !== frame.id);
      setFrames(next);
      setPreview((p) => Math.min(p, Math.max(0, next.length - 1)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  async function clearAll() {
    if (!window.confirm('¿Borrar TODA la secuencia 360? Esta acción no se puede deshacer.')) return;
    try {
      await clearSpinFrames(productId);
      setFrames([]);
      setEnabled(false);
      setPreview(0);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar');
    }
  }

  async function saveSettings(nextEnabled: boolean, nextReverse: boolean) {
    setEnabled(nextEnabled);
    setReverse(nextReverse);
    try {
      await setSpinSettings(productId, { spinEnabled: nextEnabled, spinReverse: nextReverse });
      flash('Guardado.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  }

  const mixedOrientation =
    frames.length > 1 &&
    frames.some((f) => f.width && f.height && f.width > f.height) &&
    frames.some((f) => f.width && f.height && f.height >= f.width);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {saved && <div className="admin-alert admin-alert--ok">{saved}</div>}

      {/* PASO 1 */}
      <div className="admin-card">
        <h2 style={{ fontSize: 15, marginBottom: 10 }}>1. Cómo tomar las fotos</h2>
        <ul style={{ fontSize: 13.5, color: 'var(--c-grey-dim)', lineHeight: 1.7, paddingLeft: 18, listStyle: 'disc' }}>
          <li>Deja el celular <strong>quieto</strong> (trípode o apoyado). No lo muevas entre fotos.</li>
          <li>Gira la prenda un poquito y toma una foto. Repite hasta dar la vuelta completa.</li>
          <li>Lo ideal son <strong>{RECOMMENDED_SPIN_FRAMES} fotos</strong> (mínimo {MIN_SPIN_FRAMES}, máximo {MAX_SPIN_FRAMES}).</li>
          <li>Misma luz y misma distancia en todas: si cambian, el giro se ve parpadeando.</li>
          <li>Manda los archivos <strong>directo desde la galería</strong>. Si pasan por WhatsApp se renombran y se pierde el orden.</li>
        </ul>
      </div>

      {/* PASO 2 */}
      <div className="admin-card">
        <h2 style={{ fontSize: 15, marginBottom: 10 }}>2. Subir las fotos</h2>
        <input type="file" accept="image/*" multiple onChange={onPick} disabled={uploading} />
        <p style={{ fontSize: 12, color: 'var(--c-grey-dim2)', marginTop: 8 }}>
          Se reducen solas a {SPIN_MAX_SIDE}px antes de subir, así la página no se vuelve lenta.
        </p>

        {pending && !uploading && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, marginBottom: 8 }}>
              Se van a subir <strong>{pending.length}</strong> fotos en este orden:
            </p>
            <ol style={{ fontSize: 12, color: 'var(--c-grey-dim)', maxHeight: 160, overflowY: 'auto', paddingLeft: 22, listStyle: 'decimal' }}>
              {pending.map((f) => <li key={f.name}>{f.name}</li>)}
            </ol>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="admin-btn admin-btn--primary" onClick={confirmUpload}>
                Subir estas {pending.length}
              </button>
              <button type="button" className="admin-btn" onClick={() => setPending(null)}>Cancelar</button>
            </div>
          </div>
        )}

        {uploading && pending && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13 }}>Subiendo {done} de {pending.length}…</p>
            <div style={{ height: 4, background: 'var(--c-charcoal)', borderRadius: 2, marginTop: 8 }}>
              <div style={{ height: '100%', width: `${(done / pending.length) * 100}%`, background: 'var(--c-wine-3)', borderRadius: 2 }} />
            </div>
          </div>
        )}
      </div>

      {/* PASO 3 */}
      <div className="admin-card">
        <h2 style={{ fontSize: 15, marginBottom: 10 }}>3. Verificar el giro</h2>
        {frames.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--c-grey-dim)' }}>Todavía no hay fotos en la secuencia.</p>
        ) : (
          <>
            <div style={{ maxWidth: 320, aspectRatio: '4 / 5', background: 'var(--c-void)', border: '1px solid var(--line)' }}>
              <ProductSpin frames={spinFrames} alt={productName} autoSpin={false} frameIndex={preview} />
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={preview}
              onChange={(e) => setPreview(Number(e.target.value))}
              style={{ width: '100%', maxWidth: 320, marginTop: 12 }}
              aria-label="Deslizar para revisar el giro"
            />
            <p style={{ fontSize: 12, color: 'var(--c-grey-dim2)', marginTop: 4 }}>
              Foto {preview + 1} de {frames.length}. Arrastra el deslizador: si una foto está fuera de lugar, se nota al instante.
            </p>
            {mixedOrientation && (
              <div className="admin-alert admin-alert--error" style={{ marginTop: 12 }}>
                Hay fotos horizontales y verticales mezcladas — el giro va a saltar. Conviene tomarlas todas igual.
              </div>
            )}
            {frames.length < 16 && frames.length >= MIN_SPIN_FRAMES && (
              <div className="admin-alert admin-alert--error" style={{ marginTop: 12 }}>
                Con {frames.length} fotos el giro se va a ver a saltos. Sube más (lo ideal son {RECOMMENDED_SPIN_FRAMES}).
              </div>
            )}
          </>
        )}
      </div>

      {/* PASO 4 */}
      <div className="admin-card">
        <h2 style={{ fontSize: 15, marginBottom: 10 }}>4. Arreglar y publicar</h2>

        {frames.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <button type="button" className="admin-btn admin-btn--small" onClick={invertOrder}>Invertir orden</button>
              <button type="button" className="admin-btn admin-btn--small" onClick={() => shiftStart(-1)}>‹ Correr inicio</button>
              <button type="button" className="admin-btn admin-btn--small" onClick={() => shiftStart(1)}>Correr inicio ›</button>
              <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={clearAll}>Borrar toda la secuencia</button>
            </div>

            <div className="media-grid" style={{ marginBottom: 16 }}>
              {frames.map((f, idx) => (
                <div key={f.id} className="media-grid__item" style={{ cursor: 'default' }}>
                  <img src={f.url} alt="" />
                  <small style={{ textAlign: 'center', fontWeight: 700, color: 'var(--c-white)' }}>{idx + 1}</small>
                  <div style={{ display: 'flex', gap: 4, padding: '0 6px 6px', justifyContent: 'center' }}>
                    <button type="button" className="admin-btn admin-btn--small" onClick={() => moveFrame(idx, -1)} disabled={idx === 0} aria-label="Mover antes">←</button>
                    <button type="button" className="admin-btn admin-btn--small" onClick={() => moveFrame(idx, 1)} disabled={idx === frames.length - 1} aria-label="Mover después">→</button>
                    <button type="button" className="admin-btn admin-btn--small admin-btn--danger" onClick={() => removeFrame(f)} aria-label="Eliminar foto">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <label className="admin-field--row" style={{ marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={enabled}
            disabled={!enoughFrames}
            onChange={(e) => saveSettings(e.target.checked, reverse)}
          />
          Mostrar el visor 360° en la página del producto
        </label>
        {!enoughFrames && (
          <p style={{ fontSize: 12, color: 'var(--c-grey-dim2)', marginBottom: 8 }}>
            Necesitas al menos {MIN_SPIN_FRAMES} fotos para poder activarlo (tienes {frames.length}).
          </p>
        )}

        <label className="admin-field--row">
          <input type="checkbox" checked={reverse} onChange={(e) => saveSettings(enabled, e.target.checked)} />
          Invertir el sentido del giro al arrastrar
        </label>
      </div>
    </div>
  );
}
