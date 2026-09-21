import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Ver el comentario en src/lib/auth.ts: sin valor de respaldo.
const getSecret = () => {
  const clave = process.env.JWT_SECRET;
  if (!clave) throw new Error('Falta la variable JWT_SECRET');
  return new TextEncoder().encode(clave);
};

/** Devuelve false ante cualquier problema: sin JWT_SECRET no entra nadie. */
async function sesionValida(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

// Modo mantenimiento, apagado por defecto: la tienda esta abierta.
//
// Para pausarla: poner MANTENIMIENTO=1 en las variables de entorno del worker
// y volver a desplegar.
const enMantenimiento = ['1', 'true', 'si'].includes(
  (process.env.MANTENIMIENTO ?? '').toLowerCase(),
);

// El panel, el login, las APIs y las fotos siguen abiertos aunque la tienda
// este pausada: asi podés seguir cargando productos mientras los clientes ven
// el aviso. /fotos tiene que quedar fuera o las imagenes devolverian el HTML
// del aviso en lugar del archivo.
const RUTAS_SIEMPRE_ABIERTAS = ['/admin', '/login', '/api', '/fotos', '/mantenimiento'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const isValid = await sesionValida(request.cookies.get('ldo_admin')?.value);

    if (!isValid) {
      // rewrite y no redirect: se muestra el formulario sin que la barra de
      // direcciones cambie a /login. Para quien entra, el panel es /admin y
      // punto.
      return NextResponse.rewrite(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  // Nadie deberia llegar a /login directamente: el panel es /admin.
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url));
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
