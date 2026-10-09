import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    version: '2.5.0',
    title: 'Corrección de Compatibilidad de Navegadores & Inicio Inmediato',
    releaseDate: '2026-10-10',
    notes: [
      'Eliminado error de coincidencia de patrones del portapapeles en navegadores',
      'Inicio 100% garantizado en Vercel sin bloqueos ni errores en el arranque',
      'Motor con fallback instantáneo de resultados recomendados',
      'Paginación fluida y carga continua de videos',
    ],
  });
}
