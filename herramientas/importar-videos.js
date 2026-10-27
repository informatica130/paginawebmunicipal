// Importa el índice de videos de YouTube de Melipeuco (JSON generado desde los canales) a
// contenido/videos/indice.json, en un formato compacto para el sitio: sólo lo que se muestra o
// sirve para buscar y filtrar. Los videos nuevos que se publiquen después los agrega el sitio solo,
// leyendo el RSS público de cada canal (server/render/videos.js).
//
// Uso: node herramientas/importar-videos.js ruta/al/melipeuco_youtube_indice.json

import fs from 'node:fs';
import path from 'node:path';

const entrada = process.argv[2];
if (!entrada) { console.error('Uso: node herramientas/importar-videos.js indice.json'); process.exit(1); }
const SALIDA = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'contenido', 'videos', 'indice.json');
const d = JSON.parse(fs.readFileSync(entrada, 'utf8'));

// Descripción sin las líneas de redes sociales que se repiten en todos los videos.
const RELLENO = /visita nuestra p[aá]gina|nuestro facebook|nuestro instagram|s[ií]guenos en|suscr[ií]bete|^https?:\/\/\S+$/i;
function limpiarDescripcion(t) {
  return String(t || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !RELLENO.test(l)).join('\n').replace(/\n{3,}/g, '\n\n').slice(0, 900);
}
const dos = (n) => String(n).padStart(2, '0');
const fechaEvento = (x) => (x && x.anio && x.mes && x.dia ? `${x.anio}-${dos(x.mes)}-${dos(x.dia)}` : '');

const videos = d.videos.map((v) => ({
  id: v.id, t: (v.titulo_limpio || v.titulo || '').trim(), d: limpiarDescripcion(v.descripcion), c: v.categoria_principal || 'otros',
  cs: (v.categorias || []).filter((x) => x !== v.categoria_principal), e: v.etapa, ch: v.canal?.handle || '', tp: v.tipo, f: v.fecha_publicacion_utc || v.fecha_publicacion,
  fe: fechaEvento(v.fecha_evento_en_titulo), s: v.duracion_segundos || 0, v: v.visualizaciones || 0, fm: v.formato === 'vertical' ? 'v' : 'h', l: v.listas || [],
}));
const firma = new Set();
const listas = d.listas.filter((l) => l.videos?.length).filter((l) => { const k = l.titulo.toLowerCase() + '|' + l.videos.join(','); return firma.has(k) ? false : firma.add(k); }).map((l) => ({
  id: l.id, t: l.titulo, ch: l.canal_handle, c: l.categoria_principal, videos: l.videos, mini: /\/vi\/([\w-]{11})\//.exec(l.miniatura || '')?.[1] || l.videos[0],
}));
const salida = {
  generado: d.meta?.generado || new Date().toISOString(),
  categorias: d.categorias.map((c) => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion })),
  etapas: d.etapas.map((e) => ({ id: e.id, nombre: e.nombre, canal: e.canal })),
  canales: d.canales.map((c) => ({ handle: c.handle, id: c.channel_id, nombre: c.nombre_actual, historico: c.nombre_historico || '', rol: c.rol || '', url: c.url, avatar: c.avatar || '', suscriptores: c.suscriptores || 0 })),
  listas, videos,
};
fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, JSON.stringify(salida));
console.log(`Videos: ${videos.length} · listas: ${listas.length} · categorías: ${salida.categorias.length} → ${path.relative(process.cwd(), SALIDA)} (${Math.round(fs.statSync(SALIDA).size / 1024)} KB)`);
