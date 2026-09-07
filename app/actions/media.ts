'use server';

import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { logAudit } from '@/lib/audit';

export async function listMedia() {
  return db.media.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function uploadMedia(formData: FormData) {
  const admin = await requireAdmin();

  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Archivo inválido');
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes');
  if (file.size > 8 * 1024 * 1024) throw new Error('La imagen no puede pesar más de 8MB');

  const altText = String(formData.get('altText') ?? '');
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');

  const blob = await put(`vb/${Date.now()}-${safeName}`, file, {
    access: 'public',
    addRandomSuffix: true
  });

  const media = await db.media.create({
    data: {
      url: blob.url,
      pathname: blob.pathname,
      filename: file.name,
      altText,
      sizeBytes: file.size
    }
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'upload',
    entityType: 'Media',
    entityId: media.id,
    summary: `Subió la imagen "${file.name}"`
  });

  revalidatePath('/admin/imagenes');
  return media;
}

export async function deleteMedia(id: string) {
  const admin = await requireAdmin();
  const media = await db.media.findUniqueOrThrow({ where: { id } });

  const inUse = await Promise.all([
    db.product.count({ where: { mainImageId: id } }),
    db.productImage.count({ where: { mediaId: id } }),
    db.collection.count({ where: { imageId: id } }),
    db.homeSectionImage.count({ where: { mediaId: id } }),
    db.banner.count({ where: { imageId: id } }),
    db.siteSettings.count({ where: { OR: [{ logoMediaId: id }, { faviconMediaId: id }] } }),
    db.seoSettings.count({ where: { ogImageId: id } })
  ]);
  if (inUse.some((count) => count > 0)) {
    throw new Error('Esta imagen está en uso — quítala de donde se usa antes de eliminarla.');
  }

  // solo intenta borrar del Blob si es una URL de Vercel Blob (las 16 imágenes
  // originales migradas viven en /public y no deben borrarse del disco)
  if (media.url.includes('.blob.vercel-storage.com')) {
    await del(media.url).catch(() => {});
  }

  await db.media.delete({ where: { id } });

  await logAudit({
    adminUserId: admin.id,
    action: 'delete',
    entityType: 'Media',
    entityId: id,
    summary: `Eliminó la imagen "${media.filename}"`
  });

  revalidatePath('/admin/imagenes');
}

export async function updateMediaAlt(id: string, altText: string) {
  const admin = await requireAdmin();
  const media = await db.media.update({ where: { id }, data: { altText } });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'Media',
    entityId: id,
    summary: `Actualizó el texto alternativo de "${media.filename}"`
  });

  revalidatePath('/admin/imagenes');
  return media;
}
