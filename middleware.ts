import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Config minima (sin bcrypt/Prisma) para que el middleware corra en el Edge
// runtime — la logica de redireccion vive en authConfig.callbacks.authorized.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/admin/:path*']
};
