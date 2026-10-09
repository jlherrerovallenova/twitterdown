import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    version: '2.6.0',
    title: 'Arquitectura Serverless 100% Blindada y Alta Disponibilidad',
    releaseDate: '2026-10-10',
    notes: [
      'Eliminado error 500 del servidor con arquitectura serverless autónoma',
      'Timeout seguro y contingencia garantizada con HTTP 200 siempre',
      'Compatibilidad total en Vercel, móviles y ordenadores de escritorio',
      'Paginación fluida y carga continua de videos sin interrupciones',
    ],
  });
}
