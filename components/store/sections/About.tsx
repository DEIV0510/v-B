import type { SectionData } from './types';

export default function About({ section }: { section: SectionData }) {
  const images = section.images.slice(0, 4);

  return (
    <section className="about" id="nosotros">
      <div className="about__media product-grid corner-frame reveal">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.media.url}
            alt={img.media.altText}
            width={img.media.width ?? undefined}
            height={img.media.height ?? undefined}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
      <div className="about__content">
        <p className="eyebrow reveal">{section.subtitle}</p>
        <h2 className="about__title reveal">{section.title}</h2>
        <p className="about__text reveal">{section.body}</p>

        <ol className="benefits reveal">
          <li>
            <span className="benefits__n">01</span>
            <div>
              <h3>Diseño minimalista</h3>
              <p>Cada detalle pensado para una apariencia limpia y moderna.</p>
            </div>
          </li>
          <li>
            <span className="benefits__n">02</span>
            <div>
              <h3>Rendimiento</h3>
              <p>Materiales diseñados para acompañar cada entrenamiento.</p>
            </div>
          </li>
          <li>
            <span className="benefits__n">03</span>
            <div>
              <h3>Calidad premium</h3>
              <p>Comodidad y estilo para quienes exigen más.</p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
