/** Constantes y utilidades del visor 360. Modulo plano (sin 'use server'):
 *  lo importan el Server Component del detalle, el visor cliente, el editor
 *  del admin y las Server Actions. */

/** Menos de esto se ve a saltos (12 frames = 30 grados por paso), asi que el
 *  visor no se muestra en la tienda aunque el admin lo active. */
export const MIN_SPIN_FRAMES = 12;
export const RECOMMENDED_SPIN_FRAMES = 24;
export const MAX_SPIN_FRAMES = 36;

/** Lado largo al que se redimensiona cada frame antes de subirlo. */
export const SPIN_MAX_SIDE = 900;
/** Tope duro que valida el servidor: ningun frame crudo entra a la secuencia. */
export const SPIN_MAX_BYTES = 600 * 1024;

/** Modulo positivo: wrap(-1, 24) === 23. */
export function wrap(n: number, len: number): number {
  return ((n % len) + len) % len;
}
