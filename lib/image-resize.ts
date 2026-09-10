/** Redimensiona una foto en el navegador antes de subirla. Sin dependencias.
 *  Solo se usa en el editor 360 del admin — las fotos ya existentes de la
 *  tienda no pasan por aqui y no se tocan. */

export type ResizedImage = { blob: Blob; width: number; height: number };

async function loadBitmap(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  }

  // Fallback para navegadores sin createImageBitmap (Safari viejo).
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen'));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url)
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export async function resizeForSpin(file: File, maxSide: number, quality = 0.8): Promise<ResizedImage> {
  const { source, width, height, close } = await loadBitmap(file);

  try {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no permitió procesar la imagen');
    ctx.drawImage(source, 0, 0, outW, outH);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (blob) return { blob, width: outW, height: outH };

    // Algunos navegadores devuelven null para webp: caemos a jpeg.
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!jpeg) throw new Error('El navegador no pudo convertir la imagen');
    return { blob: jpeg, width: outW, height: outH };
  } finally {
    close();
  }
}
