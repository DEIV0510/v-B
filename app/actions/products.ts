'use server';

import { revalidatePath } from 'next/cache';
import { del } from '@vercel/blob';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { logAudit } from '@/lib/audit';

export type ProductInput = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  shortDescription: string;
  description: string;
  sku: string;
  color: string;
  sizes: string[];
  stock: number;
  collectionId: string;
  mediaVariant: 'cover' | 'contain';
  mainImageId: string | null;
  galleryMediaIds: string[];
  status: 'active' | 'inactive';
  isFeatured: boolean;
  isNew: boolean;
  isSoldout: boolean;
};

function revalidatePublic() {
  revalidatePath('/');
  revalidatePath('/producto/[slug]', 'page');
}

export async function listProducts() {
  return db.product.findMany({
    include: { mainImage: true, collection: true },
    orderBy: [{ collectionId: 'asc' }, { sortOrder: 'asc' }]
  });
}

export async function getProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      mainImage: true,
      images: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      _count: { select: { spinFrames: true } }
    }
  });
}

export async function createProduct(input: ProductInput) {
  const admin = await requireAdmin();

  const last = await db.product.findFirst({
    where: { collectionId: input.collectionId },
    orderBy: { sortOrder: 'desc' }
  });

  const product = await db.product.create({
    data: {
      slug: input.slug,
      name: input.name,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      shortDescription: input.shortDescription,
      description: input.description,
      sku: input.sku,
      color: input.color,
      sizes: input.sizes,
      stock: input.stock,
      collectionId: input.collectionId,
      mediaVariant: input.mediaVariant,
      mainImageId: input.mainImageId,
      status: input.status,
      isFeatured: input.isFeatured,
      isNew: input.isNew,
      isSoldout: input.isSoldout,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      images: {
        create: input.galleryMediaIds.map((mediaId, idx) => ({ mediaId, sortOrder: idx }))
      }
    }
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'create',
    entityType: 'Product',
    entityId: product.id,
    summary: `Creó el producto "${product.name}"`
  });

  revalidatePublic();
  return product;
}

export async function updateProduct(id: string, input: ProductInput) {
  const admin = await requireAdmin();

  await db.productImage.deleteMany({ where: { productId: id } });

  const product = await db.product.update({
    where: { id },
    data: {
      slug: input.slug,
      name: input.name,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      shortDescription: input.shortDescription,
      description: input.description,
      sku: input.sku,
      color: input.color,
      sizes: input.sizes,
      stock: input.stock,
      collectionId: input.collectionId,
      mediaVariant: input.mediaVariant,
      mainImageId: input.mainImageId,
      status: input.status,
      isFeatured: input.isFeatured,
      isNew: input.isNew,
      isSoldout: input.isSoldout,
      images: {
        create: input.galleryMediaIds.map((mediaId, idx) => ({ mediaId, sortOrder: idx }))
      }
    }
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'Product',
    entityId: product.id,
    summary: `Editó el producto "${product.name}"`
  });

  revalidatePublic();
  return product;
}

export async function deleteProduct(id: string) {
  const admin = await requireAdmin();

  // Los frames del 360 se borran en cascada en la DB, pero los blobs no:
  // hay que quitarlos antes o quedan huérfanos sin ninguna pantalla que los liste.
  const frames = await db.productSpinFrame.findMany({ where: { productId: id }, select: { url: true } });
  for (const f of frames) {
    if (f.url.includes('.blob.vercel-storage.com')) {
      await del(f.url).catch(() => {});
    }
  }

  const product = await db.product.delete({ where: { id } });

  await logAudit({
    adminUserId: admin.id,
    action: 'delete',
    entityType: 'Product',
    entityId: id,
    summary: `Eliminó el producto "${product.name}"`
  });

  revalidatePublic();
}

export async function duplicateProduct(id: string) {
  const admin = await requireAdmin();
  const source = await db.product.findUniqueOrThrow({
    where: { id },
    include: { images: true }
  });

  const copy = await db.product.create({
    data: {
      slug: `${source.slug}-copia-${Date.now().toString(36)}`,
      name: `${source.name} (copia)`,
      price: source.price,
      compareAtPrice: source.compareAtPrice,
      shortDescription: source.shortDescription,
      description: source.description,
      sku: source.sku,
      color: source.color,
      sizes: source.sizes as string[],
      stock: source.stock,
      collectionId: source.collectionId,
      mediaVariant: source.mediaVariant,
      mainImageId: source.mainImageId,
      status: 'inactive',
      isFeatured: false,
      isNew: source.isNew,
      isSoldout: source.isSoldout,
      sortOrder: source.sortOrder + 1,
      images: { create: source.images.map((img) => ({ mediaId: img.mediaId, sortOrder: img.sortOrder })) }
    }
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'duplicate',
    entityType: 'Product',
    entityId: copy.id,
    summary: `Duplicó "${source.name}" como "${copy.name}"`
  });

  revalidatePublic();
  return copy;
}

export async function toggleProductField(
  id: string,
  field: 'status' | 'isFeatured' | 'isNew' | 'isSoldout'
) {
  const admin = await requireAdmin();
  const product = await db.product.findUniqueOrThrow({ where: { id } });

  let data: Record<string, unknown> = {};
  if (field === 'status') {
    data.status = product.status === 'active' ? 'inactive' : 'active';
  } else {
    data[field] = !product[field];
  }

  const updated = await db.product.update({ where: { id }, data });

  await logAudit({
    adminUserId: admin.id,
    action: 'toggle',
    entityType: 'Product',
    entityId: id,
    summary: `Cambió "${field}" de "${product.name}"`
  });

  revalidatePublic();
  return updated;
}

export async function reorderProducts(orderedIds: string[]) {
  const admin = await requireAdmin();

  await db.$transaction(
    orderedIds.map((id, index) => db.product.update({ where: { id }, data: { sortOrder: index } }))
  );

  await logAudit({
    adminUserId: admin.id,
    action: 'reorder',
    entityType: 'Product',
    entityId: 'bulk',
    summary: `Reordenó ${orderedIds.length} productos`
  });

  revalidatePublic();
}
