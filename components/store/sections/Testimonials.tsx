import type { SectionData } from './types';

type Props = {
  section: SectionData;
};

type Shot = { src: string; alt: string; width?: number; height?: number };

/* Conversaciones de WhatsApp que entregó el dueño, una imagen por cliente. Son el
   respaldo: si desde /admin/inicio se suben capturas propias a esta sección, esas
   las reemplazan. Que la sección se vea o no lo sigue decidiendo "Visible" en el panel. */
const DEFAULT_SHOTS: Shot[] = [
  {
    src: '/assets/img/testimonios/cliente-andres.webp',
    width: 415,
    height: 630,
    alt: 'Captura de WhatsApp: Andrés G. avisa que su pedido V&B llegó en perfecto estado.'
  },
  {
    src: '/assets/img/testimonios/cliente-daniel.webp',
    width: 378,
    height: 630,
    alt: 'Captura de WhatsApp: Daniel R. cuenta que la tela del buzo V&B es cómoda y de muy buena calidad.'
  },
  {
    src: '/assets/img/testimonios/cliente-santiago.webp',
    width: 412,
    height: 630,
    alt: 'Captura de WhatsApp: Santiago M. cuenta que le llegaron las 3 licras V&B y que la calidad se nota.'
  },
  {
    src: '/assets/img/testimonios/cliente-mateo.webp',
    width: 415,
    height: 657,
    alt: 'Captura de WhatsApp: Mateo L. confirma que su paquete V&B llegó en orden y agradece el servicio.'
  },
  {
    src: '/assets/img/testimonios/cliente-julian.webp',
    width: 378,
    height: 657,
    alt: 'Captura de WhatsApp: Julián P. probó el buzo V&B en el gym, dice que se ajusta perfecto y quiere pedir otro color.'
  },
  {
    src: '/assets/img/testimonios/cliente-camilo.webp',
    width: 412,
    height: 657,
    alt: 'Captura de WhatsApp: Camilo T. dice que su pedido V&B llegó perfecto y que la calidad es premium.'
  }
];

export default function Testimonials({ section }: Props) {
  const uploaded: Shot[] = section.images.map((img) => ({
    src: img.media.url,
    alt: img.media.altText || 'Testimonio de cliente V&B',
    width: img.media.width ?? undefined,
    height: img.media.height ?? undefined
  }));
  const shots = uploaded.length > 0 ? uploaded : DEFAULT_SHOTS;

  return (
    <section className="testimonials">
      <div className="testimonials__head">
        <p className="eyebrow reveal">CLIENTES SATISFECHOS</p>
        <h2 className="section-title reveal">
          <span className="line">ASÍ NOS</span>
          <span className="line">
            ESCRIBEN<span className="dot">.</span>
          </span>
        </h2>
        <p className="testimonials__lede reveal">Mensajes de clientes al recibir su pedido.</p>
      </div>

      <div className="testimonials__grid reveal">
        {shots.map((shot, idx) => (
          <img
            key={idx}
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

      {shots.length > 1 && (
        <p className="testimonials__hint" aria-hidden="true">
          Desliza para ver más →
        </p>
      )}
    </section>
  );
}
