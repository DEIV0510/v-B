import { listHomeSections } from '@/app/actions/home-sections';
import HomeSectionsEditor from '@/components/admin/HomeSectionsEditor';

const LABELS: Record<string, string> = {
  hero: 'Hero (portada)',
  value: 'Disciplina',
  detail: 'Detalles / acabados',
  shop_licra: 'Tienda — Nuevo drop (licra)',
  shop_tank: 'Tienda — Tank collection',
  immersive: 'Sección inmersiva',
  about: 'Nosotros',
  final_cta: 'CTA final'
};

export default async function HomeSectionsPage() {
  const sections = await listHomeSections();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Inicio</h1>
          <p>Textos, imágenes y orden de las 8 secciones de la página principal.</p>
        </div>
      </div>

      <HomeSectionsEditor
        sections={sections.map((s) => ({
          key: s.key,
          label: LABELS[s.key] ?? s.key,
          title: s.title,
          subtitle: s.subtitle,
          body: s.body,
          ctaLabel: s.ctaLabel,
          ctaUrl: s.ctaUrl,
          isActive: s.isActive,
          imageMediaIds: s.images.map((i) => i.mediaId)
        }))}
      />
    </>
  );
}
