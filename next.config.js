/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // El default de Next 14 es 1MB, y una foto de celular pesa 2-5MB: sin esto
    // la subida de imagenes del panel se rechaza ANTES de llegar a la accion,
    // y la validacion de 8MB de app/actions/media.ts nunca llega a ejecutarse.
    serverActions: { bodySizeLimit: '4mb' }
  }
};

module.exports = nextConfig;
