# 🎬 OmniVideo PRO & Downloader (Buscador & Descargador 4K)

Una plataforma web potente, ultrarrápida y profesional para **buscar videos por palabras clave o etiquetas (#tags)** y **descargar videos, GIFs animados y pistas de audio** en resoluciones desde SD hasta **1080p Full HD y 4K**, con cero configuraciones complejas.

---

## 🌟 Nuevas Características del Buscador Pro de Videos

- 🔍 **Buscador Universal por Palabras Clave o Etiquetas:**
  - Búsqueda en tiempo real por cualquier término, frase, hashtag (`#AI`, `#Gaming`, `#Futbol`, `#Tech`) o creador.
  - **Sugerencias de búsqueda instantáneas** en directo mientras escribes.
  - **Nube de etiquetas virales interactivas**: Haz clic en cualquier hashtag para lanzar una nueva búsqueda al instante.
- 🎯 **Categorías de Descubrimiento Rápido:**
  - 🔥 Tendencias & Viral
  - 🤖 Inteligencia Artificial & DeepSeek
  - 🎮 Gaming, Streams & eSports
  - 🎵 Música & Videoclips
  - ⚽ Deportes, Fútbol & Goles
  - 🎬 Cine, Películas & Trailers
  - 💻 Programación & Tech
  - 😂 Memes, Humor & TikToks
- 🎛️ **Filtros Avanzados y Ordenación Inteligente:**
  - Filtro por plataforma: Todas las fuentes, YouTube, X / Twitter, etc.
  - Filtro por duración: Cortos (< 2 min), Medios (2-10 min), Largos (> 10 min).
  - Ordenación: Más relevantes, Más vistos / populares, Menor duración, Mayor duración.
  - Selector de vista: **Vista en Cuadrícula (Grid)** o **Vista en Lista (List)**.
- ⏯️ **Reproductor Interactivo In-App:**
  - Reproduce videos inmediatamente en una ventana modal de alta fidelidad sin salir de la plataforma.
- ⬇️ **Suite de Descarga Multi-Calidad en 1 Clic:**
  - 1080p Full HD MP4
  - 720p HD MP4
  - 480p SD MP4
  - Pista de audio MP3 (320kbps)
- ✂️ **Recortador de Video y Creador de GIF Integrado:**
  - Selecciona puntos de inicio y fin en el timeline para descargar clips MP4 o generar GIFs animados de alta calidad.
- ⭐ **Gestor de Videos Favoritos / Guardados:**
  - Guarda tus videos preferidos con 1 clic en tu biblioteca local persistente para verlos o descargarlos cuando quieras.
- ⚡ **Pestaña de Descarga Directa por URL:**
  - Detección inteligente del portapapeles (Smart Auto-Paste) para enlaces de Twitter / X y otras plataformas.

---

## 🛠️ Tecnologías

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Vite
- **Backend:** Node.js, Express, tsx
- **Motor de Búsqueda & Extracción:** yt-dlp + Motor de agregación con caché en memoria + FixTweet API
- **Procesamiento Multimedia:** FFmpeg integrado para recortes y generación de GIFs
- **Calidad de Código:** TypeScript estricto (`tsc --noEmit`), React 18 Best Practices

---

## 🚀 Cómo Iniciar la Aplicación

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Ejecutar la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

3. Abrir en el navegador:
   ```
   http://localhost:5175
   ```
