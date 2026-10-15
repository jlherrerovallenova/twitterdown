import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    version: '3.0.0',
    title: 'Descargador de Videos Ultra Rápido y Optimizado',
    releaseDate: '2026-10-15',
    notes: [
      'Modo exclusivo de descargas de alta velocidad para Twitter / X',
      'Eliminadas dependencias y sobrecarga para una carga instantánea',
      'Extracción optimizada de videos hasta 1080p FHD y pistas de audio MP3',
      'Previsualización fluida y recorte de clips con descarga directa',
    ],
  });
}
