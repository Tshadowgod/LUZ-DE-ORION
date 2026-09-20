export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // sharp necesita Node, no Edge
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// Las fotos que llegan del celular o de ChatGPT pesan 2-5 MB y vienen a 4000px.
// Para una tienda no sirve de nada: la tarjeta mas grande mide 1200px. Aca las
// dejamos en WebP a 1400px como maximo, que baja el peso entre 10 y 20 veces.
const MAX_LADO = 1400;
const CALIDAD = 80;

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_ENTRADA = 20 * 1024 * 1024; // el original puede ser pesado: lo comprimimos nosotros

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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
    }

    if (file.size > MAX_ENTRADA) {
      return NextResponse.json({ error: 'El archivo excede 20MB' }, { status: 400 });
    }

    const original = Buffer.from(await file.arrayBuffer());
    const esGif = file.type === 'image/gif';

    let cuerpo: Buffer = original;
    let contentType = file.type;
    let extension = file.type === 'image/jpeg' ? 'jpg' : file.type.replace('image/', '');

    try {
      const img = sharp(original, { animated: esGif, failOn: 'none' });
      // .rotate() sin argumentos aplica la orientacion EXIF: sin esto las fotos
      // de celular salen acostadas. En los GIF animados se omite.
      const procesada = esGif ? img : img.rotate();

      cuerpo = await procesada
        .resize({ width: MAX_LADO, height: MAX_LADO, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: CALIDAD })
        .toBuffer();

      contentType = 'image/webp';
      extension = 'webp';
    } catch (err) {
      // Si sharp no puede con el archivo, subimos el original antes que dejar
      // al admin sin poder cargar el producto.
      console.error('No se pudo comprimir, se sube el original:', err);
    }

    const blob = await put(`productos/${Date.now()}-${nombreLimpio(file.name)}.${extension}`, cuerpo, {
      access: 'public',
      contentType,
    });

    return NextResponse.json({
      url: blob.url,
      bytesOriginal: original.length,
      bytesFinal: cuerpo.length,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
