import type { NextAuthConfig } from 'next-auth';

/**
 * Config sin providers (sin bcrypt/Prisma) para que el middleware, que corre
 * en el Edge runtime, no intente empaquetar código Node-only. auth.ts extiende
 * esto agregando el provider de Credentials para uso en Server Components/Actions.
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin') && nextUrl.pathname !== '/admin/login';

      if (isAdminRoute) return isLoggedIn;
      if (nextUrl.pathname === '/admin/login' && isLoggedIn) {
        return Response.redirect(new URL('/admin', nextUrl));
      }
      return true;
    }
  }
};
