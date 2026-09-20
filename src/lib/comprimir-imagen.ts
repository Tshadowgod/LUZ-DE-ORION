// Comprime la foto en el navegador antes de subirla.
//
// Reemplaza a sharp, que no corre en Cloudflare Workers por ser un modulo
// nativo. Ademas evita mandar 3 MB por la red desde el celular: se sube ya
// achicada, que en una conexion de datos se nota bastante.
//
// Usa createImageBitmap con imageOrientation 'from-image', que aplica la
// orientacion EXIF: sin eso las fotos de celular salen acostadas.

const MAX_LADO = 1400;
const CALIDAD = 0.8;

export type ResultadoCompresion = {
  archivo: File;
  bytesOriginal: number;
  bytesFinal: number;
};

/**
 * Devuelve la imagen comprimida en WebP. Si el navegador no puede procesarla
 * (formato raro, canvas bloqueado), devuelve el archivo original sin tocar:
 * mejor subir algo pesado que no poder cargar el producto.
 */
export async function comprimirImagen(file: File): Promise<ResultadoCompresion> {
  const original = file.size;

  // Los GIF pueden ser animados y el canvas se quedaria solo con el primer
  // cuadro, asi que se dejan como estan.
  if (file.type === 'image/gif') {
    return { archivo: file, bytesOriginal: original, bytesFinal: original };
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.max(1, Math.round(bitmap.width * escala));
    const alto = Math.max(1, Math.round(bitmap.height * escala));

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('sin contexto 2d');

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', CALIDAD),
    );
    if (!blob) throw new Error('el navegador no genero el WebP');

    // Si comprimir no ayudo (imagenes ya chicas), nos quedamos con la original.
    if (blob.size >= original) {
      return { archivo: file, bytesOriginal: original, bytesFinal: original };
    }

    const nombre = file.name.replace(/\.[^.]+$/, '') + '.webp';
    const archivo = new File([blob], nombre, { type: 'image/webp' });

    return { archivo, bytesOriginal: original, bytesFinal: archivo.size };
  } catch (err) {
    console.error('No se pudo comprimir en el navegador, se sube el original:', err);
    return { archivo: file, bytesOriginal: original, bytesFinal: original };
  }
}
