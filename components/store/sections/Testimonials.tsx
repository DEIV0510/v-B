import { splitLines } from '@/lib/text';
import type { SectionData } from './types';

type Props = {
  section: SectionData;
  trustCount: number | null;
};

export default function Testimonials({ section, trustCount }: Props) {
  const lines = splitLines(section.title);
  const hasImages = section.images.length > 0;

  if (trustCount === null && !hasImages) return null;

  return (
    <section className="testimonials">
      <div className="testimonials__head">
        {section.subtitle && <p className="eyebrow reveal">{section.subtitle}</p>}
        {lines.length > 0 && (
          <h2 className="section-title reveal">
            {lines.map((line, idx) => (
              <span className="line" key={idx}>{line}</span>
            ))}
          </h2>
        )}

        {trustCount !== null && (
          <div className="testimonials__badge reveal">
            <strong>+{trustCount.toLocaleString('es-CO')}</strong>
            <span>clientes satisfechos</span>
          </div>
        )}

        {section.body && <p className="testimonials__lede reveal">{section.body}</p>}
      </div>

      {hasImages && (
        <div className="testimonials__grid reveal">
          {section.images.map((img, idx) => (
            <img
              key={idx}
              src={img.media.url}
              alt={img.media.altText || 'Testimonio de cliente V&B'}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      )}
    </section>
  );
}
