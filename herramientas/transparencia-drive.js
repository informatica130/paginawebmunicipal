// Inventario del archivo de Transparencia (carpeta pública «LEY DE TRANSPARENCIA» de Google Drive).
//
// Recorre la carpeta y todas sus subcarpetas con la vista pública de Drive (no necesita claves:
// la carpeta está compartida como «cualquier persona con el enlace») y guarda en
// contenido/transparencia/drive.json cada carpeta y archivo: nombre, tipo, fecha y enlace.
// El sitio usa ese inventario para el Archivo de Transparencia y el buscador.
//
// Uso:  node herramientas/transparencia-drive.js [--carpeta ID --clave RESOURCEKEY] [--salida ruta]
// Se ejecuta todos los días con GitHub Actions (.github/workflows/transparencia.yml): si algo
// cambió en Drive, el inventario se actualiza solo y el sitio se vuelve a publicar.

import fs from 'node:fs';
import path from 'node:path';

const RAIZ = { id: '0B3x5Y4Op-eQ-dnM2ZkdlSThBcGs', clave: '0-B-q3rGminKFLV1-nYVaF4A', nombre: 'LEY DE TRANSPARENCIA' };
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SALIDA = arg('salida', path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'contenido', 'transparencia', 'drive.json'));
const PARALELO = 4, MAX_CARPETAS = 6000;

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&nbsp;': ' ' };
const texto = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, c) => ENT[m] ?? (c[0] === '#' ? String.fromCodePoint(c[1] === 'x' ? parseInt(c.slice(2), 16) : Number(c.slice(1))) : m)).trim();

// Fechas de la vista pública: «8/19/16» (mes/día/año), «Oct 27» (este año) o «2:16 PM» (hoy).
const MESES = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function fecha(s, hoy = new Date()) {
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  const dos = (n) => String(n).padStart(2, '0');
  if (m) { const a = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]); return `${a}-${dos(m[1])}-${dos(m[2])}`; }
  m = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(s);
  if (m && MESES[m[1]]) return `${hoy.getFullYear()}-${dos(MESES[m[1]])}-${dos(m[2])}`;
  if (/\d{1,2}:\d{2}/.test(s)) return hoy.toISOString().slice(0, 10);
  return '';
}

// Tipos de archivo legibles a partir del tipo MIME del ícono.
const TIPOS = [[/pdf/, 'PDF'], [/spreadsheet|excel|ms-excel|csv/, 'Planilla'], [/wordprocessing|msword|document/, 'Documento'], [/presentation|powerpoint/, 'Presentación'], [/image/, 'Imagen'], [/video/, 'Video'], [/audio/, 'Audio'], [/zip|rar|compressed/, 'Comprimido']];
const tipoDe = (mime) => (TIPOS.find(([r]) => r.test(mime)) || [null, 'Archivo'])[1];

export function leerCarpeta(html) {
  const items = [];
  for (const bloque of html.split('<div class="flip-entry" id="entry-').slice(1)) {
    const id = /^([\w-]+)"/.exec(bloque)?.[1];
    const url = texto(/<a href="([^"]+)"/.exec(bloque)?.[1] || '');
    const nombre = texto(/<div class="flip-entry-title">([\s\S]*?)<\/div>/.exec(bloque)?.[1] || '');
    if (!id || !url || !nombre) continue;
    const carpeta = /\/folders\//.test(url);
    const mime = /\/type\/([^"]+)"/.exec(bloque)?.[1] || '';
    const clave = /[?&]resourcekey=([\w-]+)/.exec(url)?.[1] || '';
    const f = /<div class="flip-entry-last-modified"><div>([^<]*)<\/div>/.exec(bloque)?.[1] || '';
    items.push({ id, nombre, tipo: carpeta ? 'carpeta' : tipoDe(mime), mime: carpeta ? '' : mime, url: url.replace(/[?&]usp=drive_web/, (m) => (m[0] === '?' ? '?' : '')).replace('?&', '?').replace(/\?$/, ''), clave, fecha: fecha(texto(f)) });
  }
  return items;
}

async function traer(id, clave, intento = 0) {
  const u = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(id)}${clave ? '&resourcekey=' + encodeURIComponent(clave) : ''}`;
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return leerCarpeta(await r.text());
  } catch (e) {
    if (intento < 3) { await new Promise((ok) => setTimeout(ok, 1500 * (intento + 1))); return traer(id, clave, intento + 1); }
    console.warn(`No se pudo leer la carpeta ${id}: ${e.message}`);
    return null;
  }
}

export async function recorrer(raiz = RAIZ, { aviso = () => {} } = {}) {
  const carpetas = { [raiz.id]: { id: raiz.id, nombre: raiz.nombre, padre: null, url: `https://drive.google.com/drive/folders/${raiz.id}${raiz.clave ? '?resourcekey=' + raiz.clave : ''}`, fecha: '' } };
  const archivos = [];
  const cola = [{ id: raiz.id, clave: raiz.clave }];
  let fallidas = 0;
  const trabajar = async () => {
    while (cola.length) {
      const { id, clave } = cola.shift();
      const items = await traer(id, clave);
      if (!items) { fallidas++; continue; }
      for (const it of items) {
        if (it.tipo === 'carpeta') {
          if (carpetas[it.id] || Object.keys(carpetas).length >= MAX_CARPETAS) continue;
          carpetas[it.id] = { id: it.id, nombre: it.nombre, padre: id, url: it.url, fecha: it.fecha };
          cola.push({ id: it.id, clave: it.clave });
        } else archivos.push({ id: it.id, nombre: it.nombre, tipo: it.tipo, carpeta: id, url: it.url, fecha: it.fecha });
      }
      aviso(Object.keys(carpetas).length, archivos.length, cola.length);
    }
  };
  await Promise.all(Array.from({ length: PARALELO }, trabajar));
  // Fecha de cada carpeta: la del archivo más reciente que contiene (en cualquier nivel).
  const reciente = {};
  for (const a of archivos) { let c = a.carpeta; while (c) { if (!reciente[c] || a.fecha > reciente[c]) reciente[c] = a.fecha; c = carpetas[c]?.padre; } }
  for (const c of Object.values(carpetas)) c.actualizado = reciente[c.id] || c.fecha || '';
  archivos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || a.nombre.localeCompare(b.nombre, 'es'));
  return { raiz: raiz.id, generado: new Date().toISOString(), fallidas, carpetas: Object.values(carpetas), archivos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raiz = arg('carpeta') ? { id: arg('carpeta'), clave: arg('clave', ''), nombre: arg('nombre', 'Transparencia') } : RAIZ;
  const t0 = Date.now();
  const datos = await recorrer(raiz, { aviso: (c, a, q) => { if (process.stdout.isTTY) process.stdout.write(`\r${c} carpetas · ${a} archivos · ${q} por revisar   `); } });
  if (datos.fallidas > 20 || !datos.archivos.length) { console.error(`\nDemasiadas carpetas sin leer (${datos.fallidas}); no se reemplaza el inventario.`); process.exit(1); }
  // Sólo se escribe si cambió algo (así no hay publicaciones vacías).
  const sinFecha = (d) => JSON.stringify({ ...d, generado: '' });
  let previo = null; try { previo = JSON.parse(fs.readFileSync(SALIDA, 'utf8')); } catch {}
  if (previo && sinFecha(previo) === sinFecha(datos)) { console.log(`\nSin cambios (${datos.carpetas.length} carpetas, ${datos.archivos.length} archivos).`); process.exit(0); }
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(datos));
  console.log(`\nInventario actualizado: ${datos.carpetas.length} carpetas, ${datos.archivos.length} archivos, ${datos.fallidas} sin leer, en ${Math.round((Date.now() - t0) / 1000)} s.`);
}
