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
 * - No usa autoPlay: se reproduce solo mientras la franja está en pantalla
 *   (IntersectionObserver) y se pausa al salir, para no gastar batería ni datos
 *   del celular en un video que nadie está viendo. preload="none" hace lo mismo
 *   con la descarga: el póster (primer fotograma) se ve hasta que hace falta.
 * - muted se fija por JS antes de play(): React no pinta el atributo muted en el
 *   HTML del servidor, y iOS solo deja reproducir sin gesto si el video está
 *   silenciado (el archivo además va sin pista de audio) y en línea (playsInline).
 * - Con "reducir movimiento" activado se queda quieto en el póster.
 */
export default function ImmersiveVideo({ src, poster, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    if (reducedMotion) {
      video.pause();
      return;
    }

    const play = () => {
      if (video.preload !== 'auto') video.preload = 'auto';
      video.play().catch(() => {
        // Modo ahorro de datos o navegador que bloquea: queda el póster, sin error.
      });
    };

    if (typeof IntersectionObserver !== 'function') {
      play();
      return () => video.pause();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play();
        else video.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(video);
    return () => {
      io.disconnect();
      video.pause();
    };
  }, [reducedMotion]);

  return (
    <video
      ref={ref}
      className="immersive__video"
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-label={label}
    />
  );
}
