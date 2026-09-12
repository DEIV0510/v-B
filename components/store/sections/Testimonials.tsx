import type { SectionData } from './types';

type Props = {
  section: SectionData;
};

/**
 * Los textos y el contador de esta sección viven ahora dentro del hero, justo
 * debajo de "Comprar ahora" (ver Hero.tsx / HeroTrust). Aquí quedan solo las
 * capturas de clientes, que necesitan ancho propio y no caben arriba. Sin
 * capturas subidas desde /admin/inicio no se pinta nada: así no queda un hueco
 * ni un titular repetido.
 */
export default function Testimonials({ section }: Props) {
  if (section.images.length === 0) return null;

  return (
    <section className="testimonials">
      <div className="testimonials__grid reveal">
        {section.images.map((img, idx) => (
          <img
            key={idx}
            src={img.media.url}
            alt={img.media.altText || 'Testimonio de cliente V&B'}
            width={img.media.width ?? undefined}
            height={img.media.height ?? undefined}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
    </section>
  );
}
