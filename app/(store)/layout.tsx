import { db } from '@/lib/db';
import { getSiteSettingsPublic, getAllActiveProducts } from '@/lib/store-data';
import Loader from '@/components/store/Loader';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import CartDrawer from '@/components/store/CartDrawer';
import SiteScript from '@/components/store/SiteScript';
import VisitorTracker from '@/components/store/VisitorTracker';
import type { BundleRule } from '@/lib/pricing';

// La tienda lee directo de la base de datos en cada visita — un cambio del
// admin (precio, texto, imagen) debe verse de inmediato, sin caché estática.
export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, products, collections] = await Promise.all([
    getSiteSettingsPublic(),
    getAllActiveProducts(),
    db.collection.findMany({ where: { bundleQty: { not: null }, bundlePrice: { not: null } } })
  ]);

  const bundleRules: BundleRule[] = collections.map((c) => ({
    collectionId: c.id,
    bundleQty: c.bundleQty as number,
    bundlePrice: c.bundlePrice as number
  }));

  const logoMarkUrl = '/assets/img/brand/logo-mark.webp';
  const logoMarkLgUrl = '/assets/img/brand/logo-mark-lg.webp';
  const logoFullUrl = settings.logoMedia?.url ?? '/assets/img/brand/logo-full.webp';

  return (
    <>
      <Loader logoMarkLgUrl={logoMarkLgUrl} />
      <Header logoUrl={logoMarkUrl} />

      <main id="main-content">{children}</main>

      <Footer
        logoFullUrl={logoFullUrl}
        instagramUrl={settings.instagramUrl}
        tiktokUrl={settings.tiktokUrl}
        facebookUrl={settings.facebookUrl}
      />

      <CartDrawer />

      <VisitorTracker />

      <SiteScript
        bundleRules={bundleRules}
        shippingCost={settings.shippingCost}
        searchProducts={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </>
  );
}
