import { db } from '@/lib/db';

export async function getActiveHomeSections() {
  const sections = await db.homeSection.findMany({
    where: { isActive: true },
    include: { images: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' }
  });
  return new Map(sections.map((s) => [s.key, s]));
}

export async function getCollectionWithProducts(slug: string) {
  return db.collection.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: 'active' },
        include: { mainImage: true },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
}

export async function getSiteSettingsPublic() {
  const settings = await db.siteSettings.findUnique({
    where: { id: 'singleton' },
    include: { logoMedia: true, faviconMedia: true }
  });
  return (
    settings ?? {
      storeName: 'V&B Performance Apparel',
      logoMedia: null,
      faviconMedia: null,
      whatsappNumber: '',
      whatsappMessageTemplate: 'Hola V&B, quiero hacer este pedido:',
      instagramUrl: '',
      tiktokUrl: '',
      facebookUrl: '',
      email: '',
      address: '',
      hours: '',
      shippingCost: 14900
    }
  );
}

export async function getSeoForPage(page: string) {
  return db.seoSettings.findUnique({ where: { page }, include: { ogImage: true } });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      mainImage: true,
      collection: true,
      images: { include: { media: true }, orderBy: { sortOrder: 'asc' } }
    }
  });
}

export async function getAllActiveProducts() {
  return db.product.findMany({
    where: { status: 'active' },
    select: { id: true, slug: true, name: true }
  });
}

/** Prioriza productos de la misma colección; completa con otros activos si faltan. */
export async function getRelatedProducts(productId: string, collectionId: string, limit = 4) {
  const sameCollection = await db.product.findMany({
    where: { status: 'active', collectionId, id: { not: productId } },
    include: { mainImage: true },
    orderBy: { sortOrder: 'asc' },
    take: limit
  });

  if (sameCollection.length >= limit) return sameCollection;

  const others = await db.product.findMany({
    where: { status: 'active', collectionId: { not: collectionId }, id: { not: productId } },
    include: { mainImage: true },
    orderBy: { sortOrder: 'asc' },
    take: limit - sameCollection.length
  });

  return [...sameCollection, ...others];
}
