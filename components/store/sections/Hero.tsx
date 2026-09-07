import { splitLines } from '@/lib/text';
import type { SectionData } from './types';

export default function Hero({ section }: { section: SectionData }) {
  const lines = splitLines(section.title);
  const lastLine = lines[lines.length - 1] ?? '';
  const leadingLines = lines.slice(0, -1);
  const lastLineText = lastLine.endsWith('.') ? lastLine.slice(0, -1) : lastLine;

  return (
    <section className="hero" id="inicio">
      <div className="hero__media product-grid corner-frame">
        {section.images.slice(0, 4).map((img, idx) => (
          <img
            key={idx}
            src={img.media.url}
            alt={img.media.altText}
            width={img.media.width ?? undefined}
            height={img.media.height ?? undefined}
            fetchPriority={idx === 0 ? 'high' : undefined}
            loading={idx === 0 ? undefined : 'lazy'}
            decoding={idx === 0 ? undefined : 'async'}
          />
        ))}
      </div>

      <span className="hero__vtext" aria-hidden="true">PERFORMANCE&nbsp;APPAREL</span>

      <div className="hero__content">
        <p className="eyebrow reveal">{section.subtitle}</p>
        <h1 className="hero__title reveal">
          {leadingLines.map((line, idx) => (
            <span className="line" key={idx}>{line}</span>
          ))}
          <span className="line accent">{lastLineText}<span className="dot">.</span></span>
        </h1>
        <p className="hero__sub reveal">{section.body}</p>
        <div className="hero__cta reveal">
          <a href={section.ctaUrl || '#productos'} className="btn btn--primary">{section.ctaLabel || 'Comprar ahora'}</a>
          <a href="#coleccion" className="btn btn--ghost">Ver colección</a>
        </div>
      </div>

      <div className="hero__index" aria-hidden="true">
        <span>N.01</span>
        <span className="hero__index-line"></span>
        <span>TANK COLLECTION</span>
      </div>

      <a href="#coleccion" className="hero__scroll" aria-label="Desplazarse hacia abajo">
        <span>SCROLL</span>
        <i></i>
      </a>
    </section>
  );
}
