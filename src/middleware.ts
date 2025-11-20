import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PREFIXES = [
  '/procurement',
  '/supply',
  '/budget',
  '/accounting',
  '/cashier',
  '/logs',
  '/admin',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });
  if (!token?.email) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/procurement/:path*',
    '/supply/:path*',
    '/budget/:path*',
    '/accounting/:path*',
    '/cashier/:path*',
    '/logs/:path*',
    '/admin/:path*',
  ],
};



