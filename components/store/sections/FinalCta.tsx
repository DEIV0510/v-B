import { splitLines } from '@/lib/text';
import type { SectionData } from './types';

export default function FinalCta({ section }: { section: SectionData }) {
  const img = section.images[0]?.media;
  const lines = splitLines(section.title);
  const lastLine = lines[lines.length - 1] ?? '';
  const leadingLines = lines.slice(0, -1);
  const lastLineText = lastLine.endsWith('.') ? lastLine.slice(0, -1) : lastLine;

  return (
    <section className="final-cta grain">
      <div className="final-cta__figure product-cover corner-frame">
        {img && <img src={img.url} alt={img.altText} width={img.width ?? undefined} height={img.height ?? undefined} loading="lazy" decoding="async" />}
      </div>
      <div className="final-cta__scrim" aria-hidden="true"></div>
      <div className="final-cta__content reveal">
        <h2 className="final-cta__title">
          {leadingLines.map((line, idx) => (
            <span className="line" key={idx}>{line}</span>
          ))}
          <span className="line accent">{lastLineText}<span className="dot">.</span></span>
        </h2>
        <a href={section.ctaUrl || '#productos'} className="btn btn--primary">{section.ctaLabel || 'Comprar ahora'}</a>
      </div>
    </section>
  );
}
