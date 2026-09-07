'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { logAudit } from '@/lib/audit';

export type CollectionInput = {
  slug: string;
  name: string;
  description: string;
  imageId: string | null;
  status: 'active' | 'inactive';
  bundleQty: number | null;
  bundlePrice: number | null;
};

export async function listCollections() {
  return db.collection.findMany({
    include: { image: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' }
  });
}

export async function getCollection(id: string) {
  return db.collection.findUnique({ where: { id } });
}

export async function createCollection(input: CollectionInput) {
  const admin = await requireAdmin();
  const last = await db.collection.findFirst({ orderBy: { sortOrder: 'desc' } });

  const collection = await db.collection.create({
    data: { ...input, sortOrder: (last?.sortOrder ?? -1) + 1 }
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'create',
    entityType: 'Collection',
    entityId: collection.id,
    summary: `Creó la colección "${collection.name}"`
  });

  revalidatePath('/');
  return collection;
}

export async function updateCollection(id: string, input: CollectionInput) {
  const admin = await requireAdmin();
  const collection = await db.collection.update({ where: { id }, data: input });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'Collection',
    entityId: id,
    summary: `Editó la colección "${collection.name}"`
  });

  revalidatePath('/');
  return collection;
}

export async function deleteCollection(id: string) {
  const admin = await requireAdmin();
  const productCount = await db.product.count({ where: { collectionId: id } });
  if (productCount > 0) {
    throw new Error(`No se puede eliminar: hay ${productCount} producto(s) en esta colección.`);
  }

  const collection = await db.collection.delete({ where: { id } });

  await logAudit({
    adminUserId: admin.id,
    action: 'delete',
    entityType: 'Collection',
    entityId: id,
    summary: `Eliminó la colección "${collection.name}"`
  });

  revalidatePath('/');
}
