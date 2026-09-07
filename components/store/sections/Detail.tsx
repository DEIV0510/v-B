import { splitLines } from '@/lib/text';
import type { SectionData } from './types';

const CAPTIONS = ['Tela premium de secado rápido', 'Ajuste anatómico premium', 'Acabado y costura reforzada'];
const BENTO_CLASS = ['bento__item--a', 'bento__item--b', 'bento__item--c'];

export default function Detail({ section }: { section: SectionData }) {
  const lines = splitLines(section.title);
  const images = section.images.slice(0, 3);

  return (
    <section className="detail" id="detalles">
      <div className="detail__head">
        <p className="eyebrow reveal">{section.subtitle}</p>
        <h2 className="section-title reveal">
          {lines.map((line, idx) => (
            <span className="line" key={idx}>{line}</span>
          ))}
        </h2>
      </div>

      <div className="bento reveal">
        {images.map((img, idx) => (
          <figure className={`bento__item ${BENTO_CLASS[idx]}`} key={idx}>
            <img
              src={img.media.url}
              alt={img.media.altText}
              width={img.media.width ?? undefined}
              height={img.media.height ?? undefined}
              loading="lazy"
              decoding="async"
            />
            <figcaption><span>{String(idx + 1).padStart(2, '0')}</span>{CAPTIONS[idx]}</figcaption>
          </figure>
        ))}
      </div>

      <ul className="features reveal">
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 20c8-1 13-6 15-15-9 1-14 6-15 15Z" strokeLinejoin="round" /><path d="M8 16c2-3 5-6 9-8" /></svg>
          <span>Ligero</span>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 8h11a3 3 0 1 0-3-3" strokeLinecap="round" /><path d="M3 13h15a3 3 0 1 1-3 3" strokeLinecap="round" /><path d="M3 18h9a3 3 0 1 0-3-3" strokeLinecap="round" /></svg>
          <span>Transpirable</span>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 3c3.5 4.2 6 7.8 6 11a6 6 0 1 1-12 0c0-3.2 2.5-6.8 6-11Z" strokeLinejoin="round" /></svg>
          <span>Secado rápido</span>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z" strokeLinejoin="round" /></svg>
          <span>Premium</span>
        </li>
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" strokeLinejoin="round" /><path d="M3 7l9 5 9-5M12 12v10" strokeLinejoin="round" /></svg>
          <span>Hecho en Colombia</span>
        </li>
      </ul>
    </section>
  );
}
