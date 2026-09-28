'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  poster: string;
  label: string;
};

// Video en bucle de la franja inmersiva: se descarga al acercarse, arranca solo y se pausa fuera de vista.
// No se filtra por prefers-reduced-motion a propósito: el dueño lo quiere siempre en marcha y el botón lo pausa.
export default function ImmersiveVideo({ src, poster, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inRange = useRef(false);
  const manualPause = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [paused, setPaused] = useState(false);

  const setVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!el) return;
    // React solo fija la propiedad muted; iOS y los WebViews miran también el atributo.
    el.defaultMuted = true;
    el.muted = true;
  }, []);

  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || manualPause.current || !inRange.current) return;
    video.muted = true;
    video.play().catch((e: unknown) => {
      if ((e as { name?: string } | null)?.name === 'NotAllowedError') setBlocked(true);
    });
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onChange = (near: boolean) => {
      inRange.current = near;
      if (near) {
        setMounted(true);
        tryPlay();
      } else {
        videoRef.current?.pause();
      }
    };
    if (typeof IntersectionObserver !== 'function') {
      onChange(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => onChange(entry?.isIntersecting ?? false), {
      rootMargin: '250px 0px',
      threshold: 0.01
    });
    io.observe(wrap);
    return () => io.disconnect();
  }, [tryPlay]);

  useEffect(() => {
    if (!mounted) return;
    tryPlay();
    // Con datos suficientes y sin arrancar tras unos segundos, el navegador lo está bloqueando.
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (video && inRange.current && !manualPause.current && video.paused && video.readyState >= 3) setBlocked(true);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [mounted, tryPlay]);

  useEffect(() => {
    if (!blocked) return;
    // Autoplay bloqueado (ahorro de batería de iOS, WebViews): el primer toque en la página lo arranca.
    const events = ['touchend', 'pointerup', 'click', 'keydown'] as const;
    events.forEach((name) => document.addEventListener(name, tryPlay, { passive: true }));
    return () => events.forEach((name) => document.removeEventListener(name, tryPlay));
  }, [blocked, tryPlay]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') tryPlay();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tryPlay]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      manualPause.current = false;
      inRange.current = true;
      setPaused(false);
      tryPlay();
    } else {
      manualPause.current = true;
      setPaused(true);
      video.pause();
    }
  };

  const showControl = mounted && (playing || blocked || paused);
  const centered = blocked && !playing;

  return (
    <div ref={wrapRef} className="immersive__video-wrap">
      {mounted ? (
        <video
          ref={setVideo}
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
          onPlaying={() => {
            setPlaying(true);
            setBlocked(false);
          }}
          onPause={() => setPlaying(false)}
          onCanPlay={tryPlay}
        />
      ) : (
        <img className="immersive__video" src={poster} alt={label} />
      )}
      {showControl && (
        <button
          type="button"
          className={`immersive__ctl${centered ? ' immersive__ctl--center' : ''}`}
          onClick={toggle}
          aria-label={playing ? 'Pausar video' : 'Reproducir video'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
          </svg>
        </button>
      )}
    </div>
  );
}
