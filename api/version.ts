import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    version: '2.4.0',
    title: 'Paginación Infinita y Carga Continua de Videos',
    releaseDate: '2026-10-10',
    notes: [
      'Paginación multi-página: Navega por páginas 1, 2, 3, 4, 5+ de resultados',
      'Botón "Cargar más videos" para explorar cientos de videos sin límites',
      'Soporte completo de paginación en YouTube y contenido +18 / NSFW',
      'Transición suave y preservación de filtros y estado de búsqueda',
    ],
  });
}
