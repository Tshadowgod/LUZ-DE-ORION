export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { leerConfigR2, faltantesR2, subirAR2 } from '@/lib/r2';

// Ojo: aca NO se comprime. En Cloudflare Workers no corre sharp (es un modulo
// nativo y Workers no ejecuta binarios), asi que las fotos se achican en el
// navegador antes de enviarlas. Ver src/lib/comprimir-imagen.ts.
//
// Sale mejor incluso: no se manda el archivo pesado por la red, y no gasta CPU
// del servidor.

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
// Ya viene comprimida del navegador; el margen es por si la compresion fallo
// y se mando el original.
const MAX_ENTRADA = 12 * 1024 * 1024;

// "WhatsApp Image 2026-09-15 at 12.12.31 PM.jpeg" -> "whatsapp-image-2026-09-15-at-12-12-31-pm"
function nombreLimpio(nombre: string) {
  const base = nombre.replace(/\.[^.]+$/, '');
  const slug = base
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'imagen';
}

export async function POST(request: NextRequest) {
  try {
    const config = leerConfigR2();
    if (!config) {
      const faltan = faltantesR2().join(', ');
      console.error('R2 sin configurar. Faltan:', faltan);
      return NextResponse.json(
        { error: `Almacenamiento sin configurar (faltan: ${faltan})` },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    if (file.size > MAX_ENTRADA) {
      return NextResponse.json({ error: 'La imagen es demasiado pesada' }, { status: 400 });
    }

    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.replace('image/', '');
    const clave = `productos/${Date.now()}-${nombreLimpio(file.name)}.${extension}`;
    const cuerpo = await file.arrayBuffer();

    const url = await subirAR2(clave, cuerpo, file.type, config);

    return NextResponse.json({ url, bytes: file.size });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
