import { splitLines } from '@/lib/text';
import type { SectionData } from './types';

export default function Immersive({ section }: { section: SectionData }) {
  const img = section.images[0]?.media;
  const lines = splitLines(section.title);
  const lastLine = lines[lines.length - 1] ?? '';
  const leadingLines = lines.slice(0, -1);
  const lastLineText = lastLine.endsWith('.') ? lastLine.slice(0, -1) : lastLine;

  return (
    <section className="immersive grain">
      <div className="immersive__figure product-cover corner-frame reveal">
        {img && <img src={img.url} alt={img.altText} width={img.width ?? undefined} height={img.height ?? undefined} loading="lazy" decoding="async" />}
      </div>

      <div className="immersive__mark reveal">
        <span>V&amp;B</span>
        <small>PERFORMANCE APPAREL</small>
      </div>

      <div className="immersive__quote reveal">
        <p className="eyebrow">{section.subtitle}</p>
        <h2 className="immersive__strong">
          {leadingLines.map((line, idx) => (
            <span className="line" key={idx}>{line}</span>
          ))}
          <span className="line">{lastLineText}<span className="dot">.</span></span>
        </h2>
        <p className="immersive__text">{section.body}</p>

        <ul className="trust-row">
          <li>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.3-.6-2.1-1.1-3-2.5-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2.9.4 1.3.5.5.2 1 .1 1.3-.1.4-.2 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z" /></svg>
            <span>Escríbenos por WhatsApp</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 7h11v10H2z" strokeLinejoin="round" /><path d="M13 10h4l4 3.2V17h-8z" strokeLinejoin="round" /><circle cx="6" cy="18.5" r="1.6" /><circle cx="16.5" cy="18.5" r="1.6" /></svg>
            <span>Envíos a todo Colombia</span>
          </li>
        </ul>
      </div>

      <div className="immersive__index" aria-hidden="true">
        <span>N.02</span>
        <span>LAT 10.46&deg; N — COL</span>
      </div>
    </section>
  );
}
