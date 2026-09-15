'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  poster: string;
  label: string;
};

/**
 * Video en bucle de la sección inmersiva (licra girando en 3D).
 *
 * - El <video> ni se monta hasta que la franja está a punto de entrar en pantalla
 *   (IntersectionObserver con rootMargin amplio): antes de eso solo hay una <img>
 *   con el póster, así que nadie descarga el video si no llega a esa parte.
 * - Al montarlo lleva autoPlay nativo (además de muted/loop/playsInline) en vez de
 *   depender solo de un play() por JS: es el único modo de autoplay que iOS Safari
 *   y los navegadores embebidos (WhatsApp/Instagram) respetan de forma consistente
 *   sin gesto del usuario. El IntersectionObserver lo pausa (y lo vuelve a montar
 *   desde el póster) si el cliente sigue bajando y sale del margen — no sigue
 *   sonando de fondo ni gastando batería fuera de vista.
 * - Con "reducir movimiento" activado nunca se monta: se queda quieto en el póster.
 */
export default function ImmersiveVideo({ src, poster, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearView, setNearView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (typeof IntersectionObserver !== 'function') {
      setNearView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setNearView(entry?.isIntersecting ?? false), {
      rootMargin: '250px 0px',
      threshold: 0.01
    });
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Móvil en ahorro de datos o navegador que bloquea igual: queda el póster.
    });
  }, [nearView]);

  const showVideo = nearView && !reducedMotion;

  return (
    <div ref={wrapRef} className="immersive__video-wrap">
      {showVideo ? (
        <video
          ref={videoRef}
          className="immersive__video"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-label={label}
        />
      ) : (
        <img className="immersive__video" src={poster} alt={label} />
      )}
    </div>
  );
}
