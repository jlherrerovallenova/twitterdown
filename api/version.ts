import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    version: '2.3.0',
    title: 'Buscador Pro 100% Compatible con Vercel Serverless & Novedades',
    releaseDate: '2026-10-10',
    notes: [
      'Motor de búsqueda nativo en TypeScript compatible al 100% con Vercel Serverless',
      'Resultados instantáneos para cualquier búsqueda y etiqueta (#tags)',
      'Soporte completo de contenido +18 / NSFW con SafeSearch toggle',
      'Reproductor modal integrado con visor HD y descarga rápida',
    ],
  });
}
