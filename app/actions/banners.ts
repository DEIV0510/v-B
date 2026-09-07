'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { logAudit } from '@/lib/audit';

export type BannerInput = {
  imageId: string | null;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  status: 'active' | 'inactive';
  startsAt: Date | null;
  endsAt: Date | null;
};

export async function listBanners() {
  return db.banner.findMany({ include: { image: true }, orderBy: { sortOrder: 'asc' } });
}

export async function createBanner(input: BannerInput) {
  const admin = await requireAdmin();
  const last = await db.banner.findFirst({ orderBy: { sortOrder: 'desc' } });

  const banner = await db.banner.create({ data: { ...input, sortOrder: (last?.sortOrder ?? -1) + 1 } });

  await logAudit({
    adminUserId: admin.id,
    action: 'create',
    entityType: 'Banner',
    entityId: banner.id,
    summary: `Creó el banner "${banner.title || banner.id}"`
  });

  revalidatePath('/');
  return banner;
}

export async function updateBanner(id: string, input: BannerInput) {
  const admin = await requireAdmin();
  const banner = await db.banner.update({ where: { id }, data: input });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'Banner',
    entityId: id,
    summary: `Editó el banner "${banner.title || banner.id}"`
  });

  revalidatePath('/');
  return banner;
}

export async function deleteBanner(id: string) {
  const admin = await requireAdmin();
  await db.banner.delete({ where: { id } });

  await logAudit({
    adminUserId: admin.id,
    action: 'delete',
    entityType: 'Banner',
    entityId: id,
    summary: `Eliminó un banner`
  });

  revalidatePath('/');
}
