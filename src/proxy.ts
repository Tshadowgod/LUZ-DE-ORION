import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? 'ldo-fallback-secret-change-me');

// Modo mantenimiento. Queda APAGADO por defecto: la tienda esta abierta.
//
// Para pausar la tienda: poner MANTENIMIENTO=1 en las variables de entorno
// (Vercel > Settings > Environment Variables). No hace falta tocar el codigo.
const enMantenimiento = ['1', 'true', 'si', 'yes'].includes(
  (process.env.MANTENIMIENTO ?? '').toLowerCase(),
);

// El panel, el login y las APIs siguen abiertos aunque la tienda este pausada:
// asi podés seguir cargando productos mientras los clientes ven el aviso.
const RUTAS_SIEMPRE_ABIERTAS = ['/admin', '/login', '/api', '/mantenimiento'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('ldo_admin')?.value;
    const isValid = token
      ? await jwtVerify(token, getSecret()).then(() => true).catch(() => false)
      : false;

    if (!isValid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  if (enMantenimiento && !RUTAS_SIEMPRE_ABIERTAS.some((r) => pathname.startsWith(r))) {
    // rewrite y no redirect: la persona queda en el enlace que le pasaste
    // (por ejemplo /productos/12) y ve el aviso ahi mismo.
    return NextResponse.rewrite(new URL('/mantenimiento', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todo menos los archivos estaticos y los iconos.
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.svg).*)',
  ],
};
