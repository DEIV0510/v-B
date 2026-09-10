'use server';

import { put, del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { logAudit } from '@/lib/audit';
import { MAX_SPIN_FRAMES, SPIN_MAX_BYTES } from '@/lib/spin';

export type SpinFrameDTO = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

// Copia local privada: no se puede importar la de products.ts porque en un
// modulo 'use server' todos los exports deben ser funciones async.
function revalidatePublic() {
  revalidatePath('/');
  revalidatePath('/producto/[slug]', 'page');
}

const FRAME_ORDER = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }];

export async function getSpinFrames(productId: string): Promise<SpinFrameDTO[]> {
  await requireAdmin();
  const frames = await db.productSpinFrame.findMany({
    where: { productId },
    orderBy: FRAME_ORDER,
    select: { id: true, url: true, width: true, height: true, sortOrder: true }
  });
  return frames;
}

export async function uploadSpinFrame(formData: FormData): Promise<SpinFrameDTO> {
  const admin = await requireAdmin();

  const productId = String(formData.get('productId') ?? '');
  if (!productId) throw new Error('Falta el producto');

  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Archivo inválido');
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes');
  if (file.size > SPIN_MAX_BYTES) {
    throw new Error('Cada foto del 360 debe pesar menos de 600KB (se redimensionan solas al subirlas).');
  }

  const width = Number(formData.get('width')) || null;
  const height = Number(formData.get('height')) || null;

  const [product, count] = await Promise.all([
    db.product.findUnique({ where: { id: productId }, select: { id: true, name: true } }),
    db.productSpinFrame.count({ where: { productId } })
  ]);
  if (!product) throw new Error('El producto no existe');
  if (count >= MAX_SPIN_FRAMES) {
    throw new Error(`Máximo ${MAX_SPIN_FRAMES} fotos por secuencia 360.`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const blob = await put(`vb/spin/${productId}/${Date.now()}-${safeName}`, file, {
    access: 'public',
    addRandomSuffix: true
  });

  const frame = await db.productSpinFrame.create({
    data: {
      productId,
      url: blob.url,
      pathname: blob.pathname,
      width,
      height,
      sizeBytes: file.size,
      sortOrder: count
    },
    select: { id: true, url: true, width: true, height: true, sortOrder: true }
  });

  revalidatePublic();
  return frame;
}

export async function setSpinFrameOrder(productId: string, orderedFrameIds: string[]): Promise<void> {
  const admin = await requireAdmin();

  await db.$transaction(
    orderedFrameIds.map((id, index) =>
      db.productSpinFrame.updateMany({ where: { id, productId }, data: { sortOrder: index } })
    )
  );

  await logAudit({
    adminUserId: admin.id,
    action: 'reorder',
    entityType: 'ProductSpinFrame',
    entityId: productId,
    summary: `Reordenó la secuencia 360 (${orderedFrameIds.length} fotos)`
  });

  revalidatePublic();
}

export async function deleteSpinFrame(productId: string, frameId: string): Promise<void> {
  const admin = await requireAdmin();

  const frame = await db.productSpinFrame.findUnique({ where: { id: frameId } });
  if (!frame || frame.productId !== productId) throw new Error('Esa foto no pertenece a este producto');

  if (frame.url.includes('.blob.vercel-storage.com')) {
    await del(frame.url).catch(() => {});
  }
  await db.productSpinFrame.delete({ where: { id: frameId } });

  // Renumera para que no queden huecos en sortOrder.
  const rest = await db.productSpinFrame.findMany({
    where: { productId },
    orderBy: FRAME_ORDER,
    select: { id: true }
  });
  await db.$transaction(
    rest.map((f, index) => db.productSpinFrame.update({ where: { id: f.id }, data: { sortOrder: index } }))
  );

  await logAudit({
    adminUserId: admin.id,
    action: 'delete',
    entityType: 'ProductSpinFrame',
    entityId: productId,
    summary: 'Eliminó una foto de la secuencia 360'
  });

  revalidatePublic();
}

export async function clearSpinFrames(productId: string): Promise<void> {
  const admin = await requireAdmin();

  const frames = await db.productSpinFrame.findMany({ where: { productId }, select: { url: true } });
  for (const f of frames) {
    if (f.url.includes('.blob.vercel-storage.com')) {
      await del(f.url).catch(() => {});
    }
  }

  await db.productSpinFrame.deleteMany({ where: { productId } });
  await db.product.update({ where: { id: productId }, data: { spinEnabled: false } });

  await logAudit({
    adminUserId: admin.id,
    action: 'delete',
    entityType: 'ProductSpinFrame',
    entityId: productId,
    summary: `Borró la secuencia 360 completa (${frames.length} fotos)`
  });

  revalidatePublic();
}

export async function setSpinSettings(
  productId: string,
  settings: { spinEnabled: boolean; spinReverse: boolean }
): Promise<void> {
  const admin = await requireAdmin();

  const product = await db.product.update({
    where: { id: productId },
    data: { spinEnabled: settings.spinEnabled, spinReverse: settings.spinReverse },
    select: { name: true }
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'ProductSpinFrame',
    entityId: productId,
    summary: `${settings.spinEnabled ? 'Activó' : 'Desactivó'} el visor 360 de "${product.name}"`
  });

  revalidatePublic();
}
