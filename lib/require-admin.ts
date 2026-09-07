import { auth } from '@/auth';

export class UnauthorizedError extends Error {
  constructor() {
    super('No autorizado');
    this.name = 'UnauthorizedError';
  }
}

/** Every Server Action that mutates data must call this first — the middleware
 * only guards page navigation, it does not run for Server Action requests. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return { id: session.user.id as string, email: session.user.email as string };
}
