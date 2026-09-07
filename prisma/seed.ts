import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const db = new PrismaClient();

async function upsertMedia(pathname: string, filename: string, altText: string) {
  const url = `/assets/img/${pathname}`;
  const existing = await db.media.findFirst({ where: { pathname: url } });
  if (existing) return existing;
  return db.media.create({ data: { url, pathname: url, filename, altText } });
}

async function main() {
  // ---------- 1. Admin user ----------
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@vbperformance.com').toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 12);

  await db.adminUser.upsert({
    where: { email },
    create: { email, passwordHash },
    update: {}
  });

  // ---------- 2. Media (las 16 imágenes reales ya existentes) ----------
  const media = {
    logoFull: await upsertMedia('brand/logo-full.webp', 'logo-full.webp', 'V&B'),
    logoMark: await upsertMedia('brand/logo-mark.webp', 'logo-mark.webp', 'V&B'),
    logoMarkLg: await upsertMedia('brand/logo-mark-lg.webp', 'logo-mark-lg.webp', 'V&B'),
    logoPlate: await upsertMedia('brand/logo-plate.webp', 'logo-plate.webp', 'V&B'),
    faviconPng: await upsertMedia('brand/favicon.png', 'favicon.png', ''),
    favicon32: await upsertMedia('brand/favicon-32.png', 'favicon-32.png', ''),
    appleTouchIcon: await upsertMedia('brand/apple-touch-icon.png', 'apple-touch-icon.png', ''),

    tankBlack: await upsertMedia('product/tank-black.webp', 'tank-black.webp', 'Camiseta tank V&B Performance Apparel color negro'),
    tankWhite: await upsertMedia('product/tank-white.webp', 'tank-white.webp', 'Camiseta tank V&B Performance Apparel color blanco'),
    tankMerlot: await upsertMedia('product/tank-merlot.webp', 'tank-merlot.webp', 'Camiseta tank V&B Performance Apparel color merlot'),
    licraBlack: await upsertMedia('product/licra-black.webp', 'licra-black.webp', 'Licra de compresión V&B manga larga color negro'),
    licraWhite: await upsertMedia('product/licra-white.webp', 'licra-white.webp', 'Licra de compresión V&B manga larga color blanco'),
    licraGray: await upsertMedia('product/licra-gray.webp', 'licra-gray.webp', 'Licra de compresión V&B manga larga color gris'),
    detailBlack: await upsertMedia('product/detail-black.webp', 'detail-black.webp', 'Costura y logo V&B en tela premium de secado rápido, camiseta tank negra'),
    detailWhite: await upsertMedia('product/detail-white.webp', 'detail-white.webp', 'Costura y logo V&B en tela premium de secado rápido, camiseta tank blanca'),
    detailMerlot: await upsertMedia('product/detail-merlot.webp', 'detail-merlot.webp', 'Detalle de etiqueta técnica y costura en camiseta tank V&B color merlot')
  };

  // ---------- 3. Collections ----------
  const tankCollection = await db.collection.upsert({
    where: { slug: 'tank' },
    create: {
      slug: 'tank',
      name: 'Tank Collection',
      description: 'Camiseta tipo tank V&B Performance Apparel.',
      imageId: media.tankBlack.id,
      status: 'active',
      sortOrder: 1
    },
    update: {}
  });

  const licraCollection = await db.collection.upsert({
    where: { slug: 'licra' },
    create: {
      slug: 'licra',
      name: 'Nuevo Drop — Licra de compresión',
      description: 'Licra de compresión manga larga. Disciplina, enfoque y resultados en cada capa.',
      imageId: media.licraBlack.id,
      status: 'active',
      sortOrder: 0,
      bundleQty: 3,
      bundlePrice: 169900
    },
    update: {}
  });

  // ---------- 4. Products (datos reales confirmados en index.html) ----------
  type SeedProduct = {
    slug: string;
    name: string;
    price: number;
    collectionId: string;
    mediaVariant: 'cover' | 'contain';
    color: string;
    mainImageId: string;
    isSoldout?: boolean;
    sortOrder: number;
  };

  const products: SeedProduct[] = [
    { slug: 'tank-black', name: 'TANK BLACK', price: 44900, collectionId: tankCollection.id, mediaVariant: 'cover', color: 'Negro', mainImageId: media.tankBlack.id, sortOrder: 0 },
    { slug: 'tank-white', name: 'TANK WHITE', price: 44900, collectionId: tankCollection.id, mediaVariant: 'cover', color: 'Blanco', mainImageId: media.tankWhite.id, sortOrder: 1 },
    { slug: 'tank-merlot', name: 'TANK MERLOT', price: 44900, collectionId: tankCollection.id, mediaVariant: 'cover', color: 'Merlot', mainImageId: media.tankMerlot.id, isSoldout: true, sortOrder: 2 },
    { slug: 'licra-black', name: 'LICRA BLACK', price: 69900, collectionId: licraCollection.id, mediaVariant: 'contain', color: 'Negro', mainImageId: media.licraBlack.id, sortOrder: 0 },
    { slug: 'licra-white', name: 'LICRA WHITE', price: 69900, collectionId: licraCollection.id, mediaVariant: 'contain', color: 'Blanco', mainImageId: media.licraWhite.id, sortOrder: 1 },
    { slug: 'licra-gray', name: 'LICRA GRAY', price: 69900, collectionId: licraCollection.id, mediaVariant: 'contain', color: 'Gris', mainImageId: media.licraGray.id, sortOrder: 2 }
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        price: p.price,
        collectionId: p.collectionId,
        mediaVariant: p.mediaVariant,
        color: p.color,
        mainImageId: p.mainImageId,
        isSoldout: !!p.isSoldout,
        status: 'active',
        sortOrder: p.sortOrder,
        images: { create: [{ mediaId: p.mainImageId, sortOrder: 0 }] }
      },
      update: {}
    });
  }

  // ---------- 5. Home sections (8 fijas) ----------
  type SeedSection = {
    key: string;
    sortOrder: number;
    title: string;
    subtitle: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
    imageIds: string[];
  };

  const sections: SeedSection[] = [
    {
      key: 'hero',
      sortOrder: 0,
      subtitle: 'V&B — PERFORMANCE APPAREL',
      title: 'HECHO\nPARA\nRENDIR.',
      body: 'Diseñado para acompañarte en cada entrenamiento y cada reto.',
      ctaLabel: 'Comprar ahora',
      ctaUrl: '#productos',
      imageIds: [media.tankBlack.id, media.tankWhite.id, media.licraBlack.id, media.licraGray.id]
    },
    {
      key: 'value',
      sortOrder: 1,
      subtitle: 'DISCIPLINA',
      title: 'CADA RETO.\nCADA ENTRENAMIENTO.\nCADA DÍA.',
      body: 'En V&B creemos que el rendimiento comienza con la disciplina.',
      imageIds: [media.detailBlack.id]
    },
    {
      key: 'detail',
      sortOrder: 2,
      subtitle: 'ACABADOS',
      title: 'DETALLES\nQUE MARCAN\nLA DIFERENCIA.',
      body: '',
      imageIds: [media.detailBlack.id, media.detailWhite.id, media.detailMerlot.id]
    },
    {
      key: 'shop_licra',
      sortOrder: 3,
      subtitle: 'NUEVO DROP',
      title: 'MISMA MENTALIDAD.\nNUEVO NIVEL.',
      body: 'Licra de compresión manga larga. Disciplina, enfoque y resultados en cada capa.',
      imageIds: []
    },
    {
      key: 'shop_tank',
      sortOrder: 4,
      subtitle: 'TANK COLLECTION',
      title: 'ELIGE TU\nRENDIMIENTO.',
      body: '',
      imageIds: []
    },
    {
      key: 'immersive',
      sortOrder: 5,
      subtitle: 'MÁS ALLÁ DEL ENTRENAMIENTO',
      title: 'NO ES SOLO\nPARA ENTRENAR.',
      body: 'Diseñado para acompañarte en tu día a día. Comodidad, estilo y rendimiento en cualquier plan.',
      imageIds: [media.licraGray.id]
    },
    {
      key: 'about',
      sortOrder: 6,
      subtitle: 'NOSOTROS',
      title: 'Más que ropa deportiva.',
      body: 'V&B representa disciplina, constancia y la búsqueda de la mejor versión de uno mismo.',
      imageIds: [media.tankBlack.id, media.tankMerlot.id, media.tankWhite.id, media.licraBlack.id]
    },
    {
      key: 'final_cta',
      sortOrder: 7,
      subtitle: '',
      title: 'HECHO\nPARA\nRENDIR.',
      body: '',
      ctaLabel: 'Comprar ahora',
      ctaUrl: '#productos',
      imageIds: [media.detailBlack.id]
    }
  ];

  for (const s of sections) {
    const section = await db.homeSection.upsert({
      where: { key: s.key },
      create: {
        key: s.key,
        title: s.title,
        subtitle: s.subtitle,
        body: s.body,
        ctaLabel: s.ctaLabel ?? '',
        ctaUrl: s.ctaUrl ?? '',
        isActive: true,
        sortOrder: s.sortOrder
      },
      update: {}
    });

    const existingImages = await db.homeSectionImage.count({ where: { homeSectionId: section.id } });
    if (existingImages === 0 && s.imageIds.length) {
      await db.homeSectionImage.createMany({
        data: s.imageIds.map((mediaId, idx) => ({ homeSectionId: section.id, mediaId, sortOrder: idx }))
      });
    }
  }

  // ---------- 6. Site settings ----------
  await db.siteSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      storeName: 'V&B Performance Apparel',
      logoMediaId: media.logoFull.id,
      faviconMediaId: media.favicon32.id,
      whatsappNumber: '',
      whatsappMessageTemplate: 'Hola V&B, quiero hacer este pedido:',
      instagramUrl: '',
      tiktokUrl: '',
      facebookUrl: '',
      shippingCost: 13000
    },
    update: {}
  });

  // ---------- 7. SEO ----------
  await db.seoSettings.upsert({
    where: { page: 'home' },
    create: {
      page: 'home',
      title: 'V&B Performance Apparel | Hecho Para Rendir',
      metaDescription:
        'V&B Performance Apparel — ropa deportiva premium para quienes exigen más de sí mismos. Camisetas tipo tank en negro, blanco y merlot. Hecho para rendir.'
    },
    update: {}
  });

  console.log('\nSeed completo.');
  console.log('--------------------------------------------------');
  console.log('Credenciales del panel /admin:');
  console.log('  Usuario:     ' + email);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('  Contraseña:  ' + password + '  (generada automáticamente, guárdala)');
  } else {
    console.log('  Contraseña:  la definida en SEED_ADMIN_PASSWORD');
  }
  console.log('--------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
