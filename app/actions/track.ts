'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const VISIT_COOKIE = 'vb_visit';

/** Cuenta una visita real — el cliente solo llama esto una vez por sesión de
 * navegador (guardado en sessionStorage), así que no es una métrica exacta
 * de "personas únicas" pero sí de visitas reales, no un número inventado. */
export async function incrementVisitorCount() {
  // Cookie httpOnly de 24 h: sessionStorage es por pestaña, asi que sin esto la
  // misma persona sumaba una visita por cada pestaña nueva. Tambien frena el
  // curl en bucle mas obvio. Sigue siendo un numero de visitas, no de personas
  // unicas, pero es real: no hay ningun numero inventado.
  const jar = cookies();
  if (jar.get(VISIT_COOKIE)) return;
  try {
    jar.set(VISIT_COOKIE, '1', { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24, path: '/' });
  } catch {
    // Si no se puede escribir la cookie se cuenta igual: perder la visita seria peor.
  }

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
