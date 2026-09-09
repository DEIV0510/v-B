'use server';

import { db } from '@/lib/db';

/** Cuenta una visita real — el cliente solo llama esto una vez por sesión de
 * navegador (guardado en sessionStorage), así que no es una métrica exacta
 * de "personas únicas" pero sí de visitas reales, no un número inventado. */
export async function incrementVisitorCount() {
  await db.siteSettings.update({
    where: { id: 'singleton' },
    data: { visitorCount: { increment: 1 } }
  }).catch(() => {
    // si todavia no existe la fila singleton, no hay nada que contar
  });
}

export async function getTrustBadgeCount() {
  const settings = await db.siteSettings.findUnique({
    where: { id: 'singleton' },
    select: { trustBadgeEnabled: true, trustBadgeBaseCount: true, visitorCount: true }
  });
  if (!settings || !settings.trustBadgeEnabled) return null;
  return settings.trustBadgeBaseCount + settings.visitorCount;
}
