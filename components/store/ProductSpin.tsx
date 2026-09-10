'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { wrap } from '@/lib/spin';

export type SpinFrame = { url: string; width: number | null; height: number | null };

type Props = {
  /** Ya ordenados por sortOrder asc. */
  frames: SpinFrame[];
  /** Alt real del producto; lo lleva SOLO el frame 0. */
  alt: string;
  /** Invierte el sentido del arrastre (sesión de fotos girada al revés). */
  reverse?: boolean;
  className?: string;
  /** Giro automático de cortesía al entrar en pantalla. */
  autoSpin?: boolean;
  /** Control externo del frame (lo usa el editor del admin con su deslizador). */
  frameIndex?: number;
};

const AUTO_SPIN_MS = 2200;
const DECODE_GUARD_MS = 5000;
const MIN_FRAMES_TO_DRAG = 8;

export default function ProductSpin({
  frames,
  alt,
  reverse = false,
  className,
  autoSpin = true,
  frameIndex
}: Props) {
  const total = frames.length;
  const controlled = typeof frameIndex === 'number';

  const elRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(() => frames.map((_, i) => i === 0));
  const [armed, setArmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [autoDone, setAutoDone] = useState(false);

  const indexRef = useRef(0);
  const hasInteracted = useRef(false);
  const rafRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startIndexRef = useRef(0);
  /** Fuente de verdad del arrastre. El state `dragging` es solo para el CSS:
   *  en un gesto rapido el primer pointermove llega ANTES de que React
   *  re-renderice, y leyendo el state se perderian esos primeros movimientos. */
  const draggingRef = useRef(false);
  /** Momento en que se armó la precarga; alimenta el guard de 5s. */
  const armedAtRef = useRef<number | null>(null);
  const [guardTick, setGuardTick] = useState(0);

  const shownIndex = controlled ? wrap(frameIndex as number, total) : index;

  /* ---------- prefers-reduced-motion: SIEMPRE en effect, nunca en render ---------- */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* ---------- armado: esperar a estar en pantalla + a que el navegador respire ---------- */
  useEffect(() => {
    const el = elRef.current;
    if (!el || armed) return;

    let idleId: number | undefined;
    let timerId: number | undefined;

    const arm = () => {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (typeof w.requestIdleCallback === 'function') {
        idleId = w.requestIdleCallback(() => setArmed(true), { timeout: 1500 });
      } else {
        timerId = window.setTimeout(() => setArmed(true), 600);
      }
    };

    if (typeof IntersectionObserver !== 'function') {
      arm();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          arm();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);

    // Red de seguridad: si el observer nunca reporta interseccion (viewport de
    // altura 0, contenedores raros, navegadores con IO poco fiable), se arma
    // igual a los 3s. Sin esto el visor se quedaria mudo para siempre.
    const fallbackId = window.setTimeout(() => {
      io.disconnect();
      arm();
    }, 3000);

    return () => {
      io.disconnect();
      window.clearTimeout(fallbackId);
      const w = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (idleId !== undefined && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [armed]);

  /* ---------- precarga entrelazada (zancadas 8,4,2,1) ---------- */
  useEffect(() => {
    if (!armed || total <= 1) return;
    let aborted = false;

    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const lowData = !!nav.connection?.saveData || /^(slow-)?2g$/.test(nav.connection?.effectiveType ?? '');
    const lowMem = (nav.deviceMemory ?? 8) <= 4;
    if (lowData && !hasInteracted.current) return;

    // En equipos con poca memoria solo se bajan los índices pares.
    const targets: number[] = [];
    for (let i = 0; i < total; i++) {
      if (i === 0) continue;
      if (lowMem && i % 2 !== 0) continue;
      targets.push(i);
    }

    const queue: number[] = [];
    for (const stride of [8, 4, 2, 1]) {
      for (const i of targets) {
        if (i % stride === 0 && !queue.includes(i)) queue.push(i);
      }
    }
    for (const i of targets) if (!queue.includes(i)) queue.push(i);

    let cursor = 0;
    const worker = async () => {
      while (!aborted && cursor < queue.length) {
        const i = queue[cursor++]!;
        const frame = frames[i];
        if (!frame) continue;
        const img = new Image();
        img.decoding = 'async';
        img.src = frame.url;
        try {
          await img.decode();
        } catch {
          /* sigue: se usará el frame cargado más cercano */
        }
        if (aborted) return;
        setLoaded((prev) => {
          if (prev[i]) return prev;
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }
    };

    void Promise.all([worker(), worker(), worker(), worker()]);
    return () => {
      aborted = true;
    };
  }, [armed, frames, total]);

  const loadedCount = loaded.filter(Boolean).length;
  const canDrag = !controlled && total > 1 && loadedCount >= Math.min(MIN_FRAMES_TO_DRAG, total);

  /* ---------- giro automático de cortesía ---------- */
  useEffect(() => {
    if (controlled || !autoSpin || !armed || reduceMotion || autoDone) return;
    if (hasInteracted.current || total <= 1) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

    const ready = loadedCount >= Math.max(MIN_FRAMES_TO_DRAG, Math.floor(total * 0.9));
    const guardExpired = armedAtRef.current !== null && Date.now() - armedAtRef.current > DECODE_GUARD_MS;
    if (!ready && !guardExpired) return;
    if (loadedCount < MIN_FRAMES_TO_DRAG && !guardExpired) return;

    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (ts: number) => {
      if (hasInteracted.current) return;
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / AUTO_SPIN_MS);
      const next = wrap(Math.floor(ease(t) * total), total);
      indexRef.current = next;
      setIndex(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        indexRef.current = 0;
        setIndex(0);
        setAutoDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    const onHide = () => {
      if (document.visibilityState !== 'visible' && rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setAutoDone(true);
      }
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [controlled, autoSpin, armed, reduceMotion, autoDone, loadedCount, total, guardTick]);

  /* ---------- guard de 5s: si algún decode() no resuelve, girar igual ---------- */
  useEffect(() => {
    if (!armed || armedAtRef.current !== null) return;
    armedAtRef.current = Date.now();
    const id = window.setTimeout(() => setGuardTick((n) => n + 1), DECODE_GUARD_MS + 50);
    return () => window.clearTimeout(id);
  }, [armed]);

  const stopAuto = useCallback(() => {
    hasInteracted.current = true;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setAutoDone(true);
  }, []);

  /* ---------- arrastre (mouse + touch + lápiz, mismo código) ---------- */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDrag) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* algunos navegadores lanzan si el puntero ya se soltó */
    }
    startXRef.current = e.clientX;
    startIndexRef.current = indexRef.current;
    stopAuto();
    draggingRef.current = true;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !elRef.current) return;
    const rect = elRef.current.getBoundingClientRect();
    const pxPerFrame = rect.width / total;
    if (pxPerFrame <= 0) return;
    // Cálculo ABSOLUTO desde el origen del gesto: nunca acumula deltas (no deriva).
    const steps = Math.round((startXRef.current - e.clientX) / pxPerFrame);
    const next = wrap(startIndexRef.current + (reverse ? -steps : steps), total);
    if (next !== indexRef.current) {
      indexRef.current = next;
      setIndex(next);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ya no había captura */
    }
    draggingRef.current = false;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (controlled || total <= 1) return;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = wrap(indexRef.current + 1, total);
    else if (e.key === 'ArrowLeft') next = wrap(indexRef.current - 1, total);
    else if (e.key === 'Home') next = 0;
    if (next === null) return;
    e.preventDefault();
    stopAuto();
    indexRef.current = next;
    setIndex(next);
  };

  /* ---------- qué frame se pinta: el pedido, o el cargado más cercano ---------- */
  let visible = shownIndex;
  if (!loaded[visible]) {
    for (let d = 1; d <= total; d++) {
      const a = wrap(visible - d, total);
      const b = wrap(visible + d, total);
      if (loaded[a]) {
        visible = a;
        break;
      }
      if (loaded[b]) {
        visible = b;
        break;
      }
    }
  }

  if (total === 0) return null;

  const progress = total > 1 ? Math.round((loadedCount / total) * 100) : 100;
  const showHint = !controlled && canDrag && (reduceMotion || autoDone) && !hasInteracted.current;

  return (
    <div
      ref={elRef}
      className={`spin360${className ? ` ${className}` : ''}${dragging ? ' is-dragging' : ''}`}
      role="group"
      tabIndex={controlled ? -1 : 0}
      aria-label={`Vista 360 de ${alt}. Arrastra o usa las flechas para girar.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      {frames.map((frame, idx) => {
        if (idx !== 0 && !loaded[idx]) return null;
        return (
          <img
            key={idx}
            className={`spin360__frame${idx === visible ? ' is-active' : ''}`}
            src={frame.url}
            alt={idx === 0 ? alt : ''}
            width={frame.width ?? undefined}
            height={frame.height ?? undefined}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            fetchPriority={idx === 0 ? 'high' : undefined}
            decoding={idx === 0 ? undefined : 'async'}
          />
        );
      })}

      {!controlled && <span className="spin360__badge" aria-hidden="true">360°</span>}
      {showHint && <span className="spin360__hint" aria-hidden="true">Arrastra para girar</span>}
      {progress < 100 && <span className="spin360__bar" style={{ width: `${progress}%` }} aria-hidden="true" />}
    </div>
  );
}
