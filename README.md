# 🎬 X / Twitter Video Downloader (Modo Claro)

Una aplicación web moderna, ultrarrápida y en **modo claro** para descargar videos, GIFs animados y pistas de audio de Twitter y X en resoluciones desde SD hasta **1080p Full HD**, construida siguiendo estrictamente las directrices y auditorías de **React Doctor** (Health Score: **100 / 100**).

---

## ✨ Características Principales

- ☀️ **Modo Claro Minimalista:** Paleta limpia y luminosa con blanco `#ffffff`, slate suave `#f8fafc` y toques azul Twitter `#1D9BF0`.
- ✂️ **Recortador de Video y Creador de GIF Integrado:** Selecciona puntos de inicio y fin en el reproductor para descargar clips MP4 o generar GIFs animados de alta calidad con FFmpeg.
- ⚡ **Detección Inteligente del Portapapeles (Smart Auto-Paste):** Al volver a la pestaña de la app, detecta automáticamente si has copiado un enlace de X / Twitter y ofrece descargarlo con 1 clic.
- 📺 **Selector de Calidad Multi-Resolución:**
  - Full HD (1080p MP4)
  - HD (720p MP4)
  - SD (480p / 360p MP4)
  - Pista de solo audio (MP3/M4A)
- 🚀 **Descargas Directas sin CORS:** Endpoint de streaming proxy (`/api/download`) que entrega el archivo con encabezados `Content-Disposition: attachment` para descarga nativa inmediata en el navegador.
- 🖼️ **Descarga de Miniatura:** Botón para guardar la imagen de portada o fotograma de vista previa.
- 🕒 **Historial Local de Descargas:** Almacenamiento en `localStorage` con re-descarga y eliminación individual o total.
- 🩺 **React Doctor Score 100 / 100:** Sin problemas de accesibilidad, puras mutaciones de estado, transiciones CSS optimizadas y componentes modulares.

---

## 🛠️ Tecnologías

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express, tsx
- **Extracción de Medios:** yt-dlp + FixTweet API
- **Calidad de Código:** React Doctor (`100/100`), TypeScript estricto (`tsc --noEmit`)

---

## 🚀 Cómo Iniciar la Aplicación

1. Instalar dependencias (si aún no se han instalado):
   ```bash
   npm install
   ```

2. Ejecutar la aplicación en modo desarrollo (inicia Frontend en `http://localhost:5175` y Backend en `http://localhost:3005` concurrentemente):
   ```bash
   npm run dev
   ```

3. Abrir en el navegador:
   ```
   http://localhost:5175
   ```

---

## 🩺 Auditoría de Calidad con React Doctor

Para auditar el proyecto en cualquier momento:
```bash
npm run doctor
```
Resultado actual: **100 / 100 (Great - No issues found!)**

Comprobación de tipos de TypeScript:
```bash
npm run typecheck
```
Resultado actual: **0 errores de compilación**.
