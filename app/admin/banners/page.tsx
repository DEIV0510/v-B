import { listBanners } from '@/app/actions/banners';
import BannersManager from '@/components/admin/BannersManager';

export default async function BannersPage() {
  const banners = await listBanners();

  return (
    <>
      <div className="admin__page-head">
        <div>
          <h1>Banners</h1>
          <p>
            Fase B: por ahora puedes crearlos y programar sus fechas, pero todavía no se muestran en la
            tienda pública — eso llega junto con el flujo de borrador/publicación.
          </p>
        </div>
      </div>
      <BannersManager
        initialBanners={banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          ctaLabel: b.ctaLabel,
          ctaUrl: b.ctaUrl,
          status: b.status,
          imageId: b.imageId,
          imageUrl: b.image?.url ?? null,
          startsAt: b.startsAt ? b.startsAt.toISOString() : null,
          endsAt: b.endsAt ? b.endsAt.toISOString() : null
        }))}
      />
    </>
  );
}
