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
  trustBadgeEnabled: boolean;
  trustBadgeBaseCount: number;
  storeActive: boolean;
};

/** "instagram.com/vb.fitco" -> "https://instagram.com/vb.fitco". Lo que no sea
 *  http/https se guarda vacio (el icono simplemente no se pinta) en vez de lanzar:
 *  este formulario guarda tambien el WhatsApp, el envio y el modo mantenimiento,
 *  y un enlace mal pegado no puede dejar al dueño sin poder guardar el resto. */
function normalizeSocialUrl(raw: string): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export async function getSiteSettings() {
  // Solo el admin: crea la fila singleton si no existe. La tienda publica usa
  // getSiteSettingsPublic() de lib/store-data.ts, que nunca escribe.
  await requireAdmin();

  const settings = await db.siteSettings.findUnique({
    where: { id: 'singleton' },
    include: { logoMedia: true, faviconMedia: true }
  });
  if (settings) return settings;
  return db.siteSettings.create({ data: { id: 'singleton' }, include: { logoMedia: true, faviconMedia: true } });
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  const admin = await requireAdmin();

  const data: SiteSettingsInput = {
    ...input,
    instagramUrl: normalizeSocialUrl(input.instagramUrl),
    tiktokUrl: normalizeSocialUrl(input.tiktokUrl),
    facebookUrl: normalizeSocialUrl(input.facebookUrl)
  };

  const settings = await db.siteSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data
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
