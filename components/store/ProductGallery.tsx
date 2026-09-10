'use client';

import { useState } from 'react';
import TiltImage from '@/components/store/TiltImage';

type GalleryImage = { url: string; altText: string; width: number | null; height: number | null };

export default function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) return null;

  return (
    <div className="product-detail__gallery corner-frame">
      <TiltImage
        className="product-detail__main"
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
