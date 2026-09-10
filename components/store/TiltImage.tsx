'use client';

import { useRef, useState, type CSSProperties } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

const RESET_TRANSFORM = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';

/**
 * Efecto 3D sobre la foto existente (no es un visor 360° real: no hay
 * fotos multi-ángulo del producto). Inclina la imagen según la posición
 * del mouse y agrega un brillo que sigue el cursor, dando sensación de
 * profundidad/premium sin necesitar una sesión de fotos nueva.
 */
export default function TiltImage({ src, alt, className, width, height, priority }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(RESET_TRANSFORM);
  const [glareStyle, setGlareStyle] = useState<CSSProperties>({ opacity: 0 });

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 16;
    const rotateX = (0.5 - y) * 16;
    setTransform(`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`);
    setGlareStyle({
      opacity: 0.28,
      background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,.5), transparent 55%)`
    });
  }

  function onMouseLeave() {
    setTransform(RESET_TRANSFORM);
    setGlareStyle({ opacity: 0 });
  }

  return (
    <div ref={ref} className={`tilt-image${className ? ` ${className}` : ''}`} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        fetchPriority={priority ? 'high' : undefined}
        loading={priority ? undefined : 'lazy'}
        decoding={priority ? undefined : 'async'}
        style={{ transform }}
      />
      <span className="tilt-image__glare" style={glareStyle} aria-hidden="true" />
    </div>
  );
}
