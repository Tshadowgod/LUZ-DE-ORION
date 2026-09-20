import { NextRequest, NextResponse } from 'next/server';
import { leerFoto } from '@/lib/fotos';

// Sirve las fotos guardadas en KV.
//
// El nombre de cada archivo lleva la fecha, asi que el contenido de una URL
// nunca cambia: se cachea un ano. Con eso Cloudflare las guarda en su CDN y
// las visitas repetidas ni siquiera llegan a KV, que tiene un limite diario
// de lecturas en el plan gratis.

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ruta: string[] }> },
) {
  const { ruta } = await params;
  const clave = ruta.join('/');

  const foto = await leerFoto(clave);
  if (!foto) {
    return new NextResponse('Foto no encontrada', { status: 404 });
  }

  return new NextResponse(foto.cuerpo, {
    headers: {
      'Content-Type': foto.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
