import { splitLines } from '@/lib/text';
import type { SectionData } from './types';

/** Prueba social dentro del hero, justo debajo de los botones. El contenido
 *  sale de la seccion 'testimonios' del panel: si el dueño la apaga o cambia
 *  los textos ahi, esto cambia con ella. */
export type HeroTrust = { section: SectionData; count: number | null } | null;

type Props = { section: SectionData; trust?: HeroTrust };

export default function Hero({ section, trust }: Props) {
  const lines = splitLines(section.title);
  const lastLine = lines[lines.length - 1] ?? '';
  const leadingLines = lines.slice(0, -1);
  const lastLineText = lastLine.endsWith('.') ? lastLine.slice(0, -1) : lastLine;

  // El titular de testimonios se guarda en 3 renglones apilados para su seccion
  // propia; aqui va en una sola linea para no plantar un segundo titular
  // gigante debajo del "HECHO PARA RENDIR".
  const trustClaim = trust ? splitLines(trust.section.title).join(' ') : '';
  const showTrust = !!trust && (trust.count !== null || !!trustClaim || !!trust.section.body);

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

        {showTrust && trust && (
          <div className="hero__trust reveal">
            {trust.section.subtitle && <p className="hero__trust-eyebrow">{trust.section.subtitle}</p>}
            <div className="hero__trust-row">
              {trust.count !== null && (
                <p className="hero__trust-count">
                  <strong>+{trust.count.toLocaleString('es-CO')}</strong>
                  <span>clientes satisfechos</span>
                </p>
              )}
              <div className="hero__trust-copy">
                {trustClaim && <p className="hero__trust-claim">{trustClaim}</p>}
                {trust.section.body && <p className="hero__trust-lede">{trust.section.body}</p>}
              </div>
            </div>
          </div>
        )}
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
