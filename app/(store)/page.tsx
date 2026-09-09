import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getCollectionWithProducts, getSeoForPage } from '@/lib/store-data';
import Hero from '@/components/store/sections/Hero';
import Value from '@/components/store/sections/Value';
import Detail from '@/components/store/sections/Detail';
import ShopSection from '@/components/store/sections/ShopSection';
import Immersive from '@/components/store/sections/Immersive';
import About from '@/components/store/sections/About';
import FinalCta from '@/components/store/sections/FinalCta';
import Testimonials from '@/components/store/sections/Testimonials';
import { getTrustBadgeCount } from '@/app/actions/track';
import type { SectionData } from '@/components/store/sections/types';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoForPage('home');
  if (!seo) return {};
  return {
    title: seo.title || undefined,
    description: seo.metaDescription || undefined,
    alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    openGraph: {
      title: seo.ogTitle || seo.title || undefined,
      description: seo.ogDescription || seo.metaDescription || undefined,
      images: seo.ogImage ? [{ url: seo.ogImage.url }] : undefined
    }
  };
}

function toSectionData(section: {
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  images: { media: { url: string; altText: string; width: number | null; height: number | null } }[];
}): SectionData {
  return section;
}

export default async function HomePage() {
  const sections = await db.homeSection.findMany({
    where: { isActive: true },
    include: { images: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' }
  });

  const [licra, tank] = await Promise.all([getCollectionWithProducts('licra'), getCollectionWithProducts('tank')]);
  const trustCount = await getTrustBadgeCount();
  const licraProducts = licra?.products.map((p) => ({ ...p, sizes: p.sizes as string[] })) ?? [];
  const tankProducts = tank?.products.map((p) => ({ ...p, sizes: p.sizes as string[] })) ?? [];

  return (
    <>
      {sections.map((section) => {
        const data = toSectionData(section);
        switch (section.key) {
          case 'hero':
            return <Hero key={section.id} section={data} />;
          case 'value':
            return <Value key={section.id} section={data} />;
          case 'detail':
            return <Detail key={section.id} section={data} />;
          case 'shop_licra':
            return licra ? (
              <ShopSection
                key={section.id}
                section={data}
                variant="licra"
                sectionId="productos"
                products={licraProducts}
                bundleQty={licra.bundleQty}
                bundlePrice={licra.bundlePrice}
              />
            ) : null;
          case 'shop_tank':
            return tank ? (
              <ShopSection key={section.id} section={data} variant="tank" sectionId="tank" products={tankProducts} />
            ) : null;
          case 'immersive':
            return <Immersive key={section.id} section={data} />;
          case 'about':
            return <About key={section.id} section={data} />;
          case 'testimonials':
            return <Testimonials key={section.id} section={data} trustCount={trustCount} />;
          case 'final_cta':
            return <FinalCta key={section.id} section={data} />;
          default:
            return null;
        }
      })}
    </>
  );
}
