import { splitLines } from '@/lib/text';
import type { SectionData } from './types';

export default function Value({ section }: { section: SectionData }) {
  const bg = section.images[0]?.media;
  const lines = splitLines(section.title);

  return (
    <section className="value" id="coleccion">
      <div className="value__bg" aria-hidden="true">
        {bg && <img src={bg.url} alt="" width={bg.width ?? undefined} height={bg.height ?? undefined} loading="lazy" decoding="async" />}
      </div>
      <div className="value__inner">
        <p className="eyebrow reveal">{section.subtitle}</p>
        <h2 className="value__title reveal">
          {lines.map((line, idx) => (
            <span className="line" key={idx}>{line}</span>
          ))}
        </h2>
        <p className="value__caption reveal">{section.body}</p>
      </div>
    </section>
  );
}
