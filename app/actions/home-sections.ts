'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { logAudit } from '@/lib/audit';

export type HomeSectionInput = {
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageMediaIds: string[];
  isActive: boolean;
};

export async function listHomeSections() {
  return db.homeSection.findMany({
    include: { images: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' }
  });
}

export async function updateHomeSection(key: string, input: HomeSectionInput) {
  const admin = await requireAdmin();

  const section = await db.homeSection.findUniqueOrThrow({ where: { key } });
  await db.homeSectionImage.deleteMany({ where: { homeSectionId: section.id } });

  const updated = await db.homeSection.update({
    where: { key },
    data: {
      title: input.title,
      subtitle: input.subtitle,
      body: input.body,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
      isActive: input.isActive,
      images: { create: input.imageMediaIds.map((mediaId, idx) => ({ mediaId, sortOrder: idx })) }
    }
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'HomeSection',
    entityId: key,
    summary: `Editó la sección de inicio "${key}"`
  });

  revalidatePath('/');
  return updated;
}

export async function reorderHomeSections(orderedKeys: string[]) {
  const admin = await requireAdmin();

  await db.$transaction(
    orderedKeys.map((key, index) => db.homeSection.update({ where: { key }, data: { sortOrder: index } }))
  );

  await logAudit({
    adminUserId: admin.id,
    action: 'reorder',
    entityType: 'HomeSection',
    entityId: 'bulk',
    summary: `Reordenó las secciones de inicio`
  });

  revalidatePath('/');
}
