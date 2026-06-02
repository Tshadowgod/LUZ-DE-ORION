import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? 'ldo-fallback-secret-change-me');

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('ldo_admin')?.value;
  const isValid = token
    ? await jwtVerify(token, getSecret()).then(() => true).catch(() => false)
    : false;

  if (!isValid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
