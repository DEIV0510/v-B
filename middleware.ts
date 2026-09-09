import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Usa getToken directamente (no NextAuth(config).auth) — mas liviano y evita
// que el bundler de Vercel clasifique el middleware como funcion Node.js en
// vez de Edge (visto en produccion: "Cannot use import statement outside a
// module" al cargar middleware.js como funcion serverless).
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;

  if (isAdminRoute && !isLoggedIn) {
    const loginUrl = new URL('/admin/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/admin/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
