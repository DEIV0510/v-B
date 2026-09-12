'use client';

import { useState } from 'react';
import TiltImage from '@/components/store/TiltImage';
import ProductSpin, { type SpinFrame } from '@/components/store/ProductSpin';
import { MIN_SPIN_FRAMES } from '@/lib/spin';

type GalleryImage = { url: string; altText: string; width: number | null; height: number | null };

export type SpinData = { frames: SpinFrame[]; alt: string; reverse: boolean };

type Props = { images: GalleryImage[]; spin?: SpinData | null; mediaVariant?: 'cover' | 'contain' };

export default function ProductGallery({ images, spin, mediaVariant = 'cover' }: Props) {
  // Las licras vienen con mediaVariant 'contain': su foto es un recorte cerrado
  // (los brazos tocan los bordes), asi que recortarla ademas la deja incompleta.
  const mainClass = `product-detail__main${mediaVariant === 'contain' ? ' product-detail__main--contain' : ''}`;
  const hasSpin = !!spin && spin.frames.length >= MIN_SPIN_FRAMES;
  const [mode, setMode] = useState<'spin' | 'photo'>(hasSpin ? 'spin' : 'photo');
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  // ---- SIN 360: exactamente el mismo arbol que antes de esta funcion ----
  if (!hasSpin || !spin) {
    if (!active) return null;
    return (
      <div className="product-detail__gallery corner-frame">
        <TiltImage
          className={mainClass}
          src={active.url}
          alt={active.altText}
          width={active.width ?? undefined}
          height={active.height ?? undefined}
          priority
        />
        {images.length > 1 && (
          <div className="product-detail__thumbs">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`product-detail__thumb${idx === activeIndex ? ' is-active' : ''}`}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Ver foto ${idx + 1}`}
                aria-current={idx === activeIndex}
              >
                <img src={img.url} alt="" width={img.width ?? undefined} height={img.height ?? undefined} loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- CON 360: ambos paneles montados, se alternan por CSS ----
  return (
    <div className="product-detail__gallery corner-frame">
      <div className={`${mainClass} product-detail__pane`} data-mode={mode}>
        <ProductSpin frames={spin.frames} alt={spin.alt} reverse={spin.reverse} />
        {active && (
          <TiltImage
            src={active.url}
            alt={active.altText}
            width={active.width ?? undefined}
            height={active.height ?? undefined}
            priority
          />
        )}
      </div>
      <div className="product-detail__thumbs">
        <button
          type="button"
          className={`product-detail__thumb product-detail__thumb--spin${mode === 'spin' ? ' is-active' : ''}`}
          onClick={() => setMode('spin')}
          aria-label="Ver el producto en 360 grados"
          aria-current={mode === 'spin'}
        >
          <img src={spin.frames[0]!.url} alt="" loading="lazy" decoding="async" />
          <span aria-hidden="true">360°</span>
        </button>
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            className={`product-detail__thumb${mode === 'photo' && idx === activeIndex ? ' is-active' : ''}`}
            onClick={() => {
              setMode('photo');
              setActiveIndex(idx);
            }}
            aria-label={`Ver foto ${idx + 1}`}
            aria-current={mode === 'photo' && idx === activeIndex}
          >
            <img src={img.url} alt="" width={img.width ?? undefined} height={img.height ?? undefined} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
}
