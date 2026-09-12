'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

/* =========================================================================
   UN SOLO requestAnimationFrame PARA TODA LA PÁGINA
   La home pinta 6 tarjetas; seis bucles rAF propios serían seis veces el mismo
   trabajo de scheduler en un teléfono. Aquí hay UNA suscripción compartida que
   se apaga sola cuando nadie la usa.
   ========================================================================= */
type Ticker = (now: number) => void;
const subs = new Set<Ticker>();
let rafId: number | null = null;
let seq = 0;

function loop(now: number) {
  rafId = subs.size > 0 ? requestAnimationFrame(loop) : null;
  for (const fn of Array.from(subs)) fn(now);
}

function subscribe(fn: Ticker): () => void {
  subs.add(fn);
  if (rafId === null) rafId = requestAnimationFrame(loop);
  return () => {
    subs.delete(fn);
    if (subs.size === 0 && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

const PERSPECTIVE = 900;
/** Mouse/lápiz: mismo rango que la versión anterior (16° de recorrido total). */
const MAX_DEG_POINTER = 8;
/** Dedo: menos grados, porque la mano tapa la foto y el exceso se ve tosco. */
const MAX_DEG_TOUCH = 6;
/**
 * UMBRAL del gesto táctil. El "touch slop" de Chrome son ~8px: pasados esos
 * píxeles el navegador ya decidió que el gesto es scroll (y en la vitrina móvil,
 * swipe del carrusel). A los 10px soltamos el efecto y devolvemos el gesto
 * entero a la página. Es una red de seguridad: normalmente el propio navegador
 * avisa antes con 'pointercancel'.
 */
const TOUCH_SLOP = 10;
const IDLE_DEG = 1.15;
const IDLE_LIFT = 0.01;
const IDLE_MS_X = 10700;
const IDLE_MS_Y = 7100;
const TILT_SCALE = 0.022;
const EASE_IN = 0.28;
const EASE_OUT = 0.11;
const GLARE_POINTER = 0.28;
const GLARE_TOUCH = 0.2;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Efecto 3D sobre la foto existente (no es un visor 360° real: para eso está
 * ProductSpin). Da volumen de tres formas, por orden de sutileza:
 *
 *  1. Respiración ociosa: oscilación lentísima (±1.15°, ciclos de 7 y 10,7 s)
 *     para que la foto "tenga volumen" sin que nadie la toque. Es lo único que
 *     se percibe en el teléfono sin interactuar.
 *  2. Dedo: Pointer Events. Al apoyar el dedo la foto se inclina hacia él y se
 *     hunde un poco. NO se llama preventDefault ni se toca el click, así que el
 *     tap sigue abriendo el producto (la foto vive dentro de un <a>) y el
 *     scroll / carrusel siguen siendo del navegador.
 *  3. Mouse: igual que antes (pointermove cubre el mouse sin botón).
 *
 * DeviceOrientation: DESCARTADO a propósito. En iOS exige
 * DeviceOrientationEvent.requestPermission() desde un gesto del usuario, o sea
 * un botón pidiendo permiso de movimiento dentro de una tienda. En Android
 * llega sin permiso pero movería las 6 tarjetas a la vez mientras la mano se
 * inclina al hacer scroll: eso se lee como tembleque, no como premium.
 *
 * Rendimiento: solo transform y opacity, escritos desde el rAF compartido; la
 * única lectura de layout es un getBoundingClientRect por gesto (táctil) o por
 * pointermove (mouse), nunca intercalada con escrituras en el mismo handler.
 * Fuera de pantalla (IntersectionObserver) o con la pestaña oculta no se hace
 * nada, y con prefers-reduced-motion el efecto no arranca.
 */
export default function TiltImage({ src, alt, className, width, height, priority }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);

  /** Solo para disparar los efectos de suscripción; la animación lee el ref. */
  const [reducedMotion, setReducedMotion] = useState(false);
  const reduced = useRef(false);

  /* Estado de animación en refs, NUNCA en state: un setState por frame serían
     60 renders por segundo y 6 tarjetas a la vez. */
  const cur = useRef({ rx: 0, ry: 0, sc: 0, gx: 0, gy: 0, go: 0 });
  const tgt = useRef({ rx: 0, ry: 0, sc: 0, gx: 0, gy: 0, go: 0 });
  const idleW = useRef(1);
  const phase = useRef(0);
  const rect = useRef<DOMRect | null>(null);
  const gesture = useRef<{ id: number; x0: number; y0: number; alive: boolean } | null>(null);
  const hovering = useRef(false);
  const inView = useRef(false);
  const unsub = useRef<null | (() => void)>(null);

  const halt = useCallback(() => {
    unsub.current?.();
    unsub.current = null;
    rootRef.current?.classList.remove('is-live');
  }, []);

  /** Vuelve al reposo de golpe y devuelve el control al CSS (borra el inline). */
  const hardReset = useCallback(() => {
    gesture.current = null;
    hovering.current = false;
    cur.current = { rx: 0, ry: 0, sc: 0, gx: 0, gy: 0, go: 0 };
    tgt.current = { rx: 0, ry: 0, sc: 0, gx: 0, gy: 0, go: 0 };
    idleW.current = 1;
    if (stageRef.current) stageRef.current.style.transform = '';
    if (glareRef.current) {
      glareRef.current.style.opacity = '';
      glareRef.current.style.transform = '';
    }
  }, []);

  const frame = useCallback(
    (now: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const g = gesture.current;
      const gestured = !!g && g.alive;
      // El hover del mouse cuenta igual que el dedo: si no, la respiración se
      // superpondría al cursor y el seguimiento perdería nitidez.
      const active = gestured || hovering.current;

      idleW.current += ((active ? 0 : 1) - idleW.current) * 0.08;

      const t = tgt.current;
      let rx = t.rx;
      let ry = t.ry;
      let sc = t.sc;

      if (!reduced.current && idleW.current > 0.002) {
        const w = idleW.current;
        const a = Math.sin(now / IDLE_MS_X + phase.current);
        const b = Math.cos(now / IDLE_MS_Y + phase.current * 1.7);
        rx += a * IDLE_DEG * w;
        ry += b * IDLE_DEG * w;
        sc += IDLE_LIFT * (0.5 + 0.5 * a) * w;
      }

      const k = active ? EASE_IN : EASE_OUT;
      const c = cur.current;
      c.rx += (rx - c.rx) * k;
      c.ry += (ry - c.ry) * k;
      c.sc += (sc - c.sc) * k;
      c.gx += (t.gx - c.gx) * k;
      c.gy += (t.gy - c.gy) * k;
      c.go += (t.go - c.go) * (active ? EASE_IN : 0.16);

      stage.style.transform =
        `perspective(${PERSPECTIVE}px) rotateX(${c.rx.toFixed(3)}deg) ` +
        `rotateY(${c.ry.toFixed(3)}deg) scale(${(1 + c.sc).toFixed(4)})`;

      const glare = glareRef.current;
      if (glare) {
        glare.style.opacity = c.go < 0.003 ? '0' : c.go.toFixed(3);
        glare.style.transform = `translate3d(${c.gx.toFixed(1)}px, ${c.gy.toFixed(1)}px, 0)`;
      }

      // Con prefers-reduced-motion no hay respiración: en cuanto todo vuelve al
      // reposo se suelta el rAF para no gastar un frame de más.
      if (
        reduced.current &&
        !active &&
        Math.abs(c.rx) < 0.01 &&
        Math.abs(c.ry) < 0.01 &&
        Math.abs(c.sc) < 0.0005 &&
        c.go < 0.004
      ) {
        hardReset();
        halt();
      }
    },
    [halt, hardReset]
  );

  const ensure = useCallback(() => {
    if (unsub.current || !inView.current) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    rootRef.current?.classList.add('is-live');
    unsub.current = subscribe(frame);
  }, [frame]);

  const applyPoint = useCallback((clientX: number, clientY: number, touch: boolean) => {
    const r = rect.current;
    if (!r || r.width === 0 || r.height === 0) return;
    const x = clamp01((clientX - r.left) / r.width);
    const y = clamp01((clientY - r.top) / r.height);
    const max = touch ? MAX_DEG_TOUCH : MAX_DEG_POINTER;
    const mag = Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2);
    const t = tgt.current;
    t.ry = (x - 0.5) * 2 * max;
    t.rx = (0.5 - y) * 2 * max;
    // La escala mínima es la que evita que la rotación destape las esquinas.
    t.sc = TILT_SCALE * (0.55 + 0.45 * mag);
    t.gx = (x - 0.5) * r.width;
    t.gy = (y - 0.5) * r.height;
    t.go = touch ? GLARE_TOUCH : GLARE_POINTER;
  }, []);

  const release = useCallback(() => {
    gesture.current = null;
    hovering.current = false;
    tgt.current = { rx: 0, ry: 0, sc: 0, gx: 0, gy: 0, go: 0 };
    if (!inView.current) {
      hardReset();
      halt();
      return;
    }
    ensure();
  }, [ensure, halt, hardReset]);

  /* ---------- prefers-reduced-motion: SIEMPRE en effect, nunca en render ----------
     (mismo patrón que components/store/ProductSpin.tsx; leerlo en render
     producía marcado distinto en servidor y cliente) */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = (matches: boolean) => {
      reduced.current = matches;
      setReducedMotion(matches);
      if (matches) {
        hardReset();
        halt();
      }
    };
    apply(mq.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [halt, hardReset]);

  /* ---------- fase desfasada por instancia: que las tarjetas no respiren al unísono ---------- */
  useEffect(() => {
    phase.current = (seq++ % 12) * 0.618034 * Math.PI * 2;
  }, []);

  /* ---------- solo animar lo que está en pantalla ---------- */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (typeof IntersectionObserver !== 'function') {
      inView.current = true;
      if (!reducedMotion) ensure();
      return () => halt();
    }

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        inView.current = visible;
        if (!visible) {
          halt();
          hardReset();
        } else if (!reducedMotion) {
          ensure();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      halt();
    };
  }, [ensure, halt, hardReset, reducedMotion]);

  /* ---------- pestaña oculta: cero trabajo ---------- */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') halt();
      else if (!reducedMotion) ensure();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [ensure, halt, reducedMotion]);

  /* ---------- gesto táctil / lápiz ----------
     No se llama preventDefault en ningún momento: el navegador conserva el
     scroll vertical y el swipe del carrusel, y el tap sigue navegando al
     producto. setPointerCapture solo mantiene el flujo de pointermove si el
     dedo se sale un poco de la tarjeta; si el navegador se queda el gesto llega
     'pointercancel' y volvemos al reposo. */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced.current || e.pointerType === 'mouse') return;
    rect.current = e.currentTarget.getBoundingClientRect();
    gesture.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, alive: true };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* algunos navegadores lanzan si el puntero ya se soltó */
    }
    applyPoint(e.clientX, e.clientY, true);
    // Empujón de apoyo: aunque el dedo no se mueva, la foto se hunde.
    tgt.current.sc = TILT_SCALE;
    ensure();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g && g.id === e.pointerId) {
      if (!g.alive) return;
      if (Math.abs(e.clientX - g.x0) > TOUCH_SLOP || Math.abs(e.clientY - g.y0) > TOUCH_SLOP) {
        // El gesto es de la página (scroll o carrusel): se suelta el efecto.
        g.alive = false;
        release();
        return;
      }
      // Durante el gesto se reutiliza el rect medido en pointerdown: cero
      // lecturas de layout por frame.
      applyPoint(e.clientX, e.clientY, true);
      return;
    }
    if (reduced.current || e.pointerType !== 'mouse') return;
    rect.current = e.currentTarget.getBoundingClientRect();
    hovering.current = true;
    applyPoint(e.clientX, e.clientY, false);
    ensure();
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g && g.id === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ya no había captura */
      }
    }
    release();
  };

  return (
    <div
      ref={rootRef}
      className={`tilt-image${className ? ` ${className}` : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      onPointerLeave={() => release()}
    >
      {/* Capa que recibe la rotación 3D. Se separa del <img> a propósito: así el
          transform en línea que escribe el JS ya no pisa las reglas del CSS
          sobre la propia imagen. */}
      <div className="tilt-image__stage" ref={stageRef}>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          fetchPriority={priority ? 'high' : undefined}
          loading={priority ? undefined : 'lazy'}
          decoding={priority ? undefined : 'async'}
        />
      </div>
      <span className="tilt-image__glare" ref={glareRef} aria-hidden="true" />
    </div>
  );
}
