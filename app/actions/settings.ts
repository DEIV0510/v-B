'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-admin';
import { logAudit } from '@/lib/audit';

export type SiteSettingsInput = {
  storeName: string;
  logoMediaId: string | null;
  faviconMediaId: string | null;
  whatsappNumber: string;
  whatsappMessageTemplate: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  email: string;
  address: string;
  hours: string;
  shippingCost: number;
};

export async function getSiteSettings() {
  const settings = await db.siteSettings.findUnique({
    where: { id: 'singleton' },
    include: { logoMedia: true, faviconMedia: true }
  });
  if (settings) return settings;
  return db.siteSettings.create({ data: { id: 'singleton' }, include: { logoMedia: true, faviconMedia: true } });
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  const admin = await requireAdmin();

  const settings = await db.siteSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...input },
    update: input
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'SiteSettings',
    entityId: 'singleton',
    summary: 'Actualizó la configuración del sitio'
  });

  revalidatePath('/');
  revalidatePath('/admin', 'layout');
  return settings;
}

export type SeoSettingsInput = {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageId: string | null;
  canonicalUrl: string;
};

export async function getSeoSettings(page: string) {
  return db.seoSettings.findUnique({ where: { page }, include: { ogImage: true } });
}

export async function updateSeoSettings(page: string, input: SeoSettingsInput) {
  const admin = await requireAdmin();

  const seo = await db.seoSettings.upsert({
    where: { page },
    create: { page, ...input },
    update: input
  });

  await logAudit({
    adminUserId: admin.id,
    action: 'update',
    entityType: 'SeoSettings',
    entityId: page,
    summary: `Actualizó el SEO de "${page}"`
  });

  revalidatePath('/');
  return seo;
}
