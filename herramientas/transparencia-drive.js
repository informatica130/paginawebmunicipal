// Documentos de Transparencia a partir de la carpeta pública de Google Drive de la Municipalidad.
//
// Recorre la carpeta y sus subcarpetas con la vista pública de Drive (sólo lectura: no modifica
// nada) y genera la lista de documentos para el sitio. Por privacidad:
//  · La carpeta se indica con la variable de entorno TRANSPARENCIA_DRIVE («ID» o «ID:CLAVE»), que
//    se guarda en Vercel y nunca en el código.
//  · El resultado (contenido/transparencia/documentos.json) no se sube al repositorio
//    (.gitignore): se genera al publicar en Vercel y vive sólo en el servidor.
//  · No se guardan carpetas, sus nombres ni su orden: cada documento queda clasificado con la
//    organización propia del sitio (materia, año, mes, área y clase de documento) y se ofrece
//    por /transparencia/documentos/…, sin enlaces a Drive.
//
// Uso: TRANSPARENCIA_DRIVE=ID:CLAVE node herramientas/transparencia-drive.js [--salida ruta]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
export const SALIDA = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'contenido', 'transparencia', 'documentos.json');
const PARALELO = 4, MAX_CARPETAS = 6000;

export function raizDesdeEntorno(v = process.env.TRANSPARENCIA_DRIVE || '') {
  const [id, clave = ''] = String(v).trim().split(':');
  return /^[\w-]{10,}$/.test(id || '') ? { id, clave } : null;
}

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&nbsp;': ' ' };
const texto = (s) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, c) => ENT[m] ?? (c[0] === '#' ? String.fromCodePoint(c[1] === 'x' ? parseInt(c.slice(2), 16) : Number(c.slice(1))) : m)).trim();
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Fechas de la vista pública: «8/19/16» (mes/día/año), «Oct 27» (este año) o «2:16 PM» (hoy).
const MESES_EN = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function fecha(s, hoy = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  let m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (m) { const a = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]); return `${a}-${dos(m[1])}-${dos(m[2])}`; }
  m = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(s);
  if (m && MESES_EN[m[1]]) return `${hoy.getFullYear()}-${dos(MESES_EN[m[1]])}-${dos(m[2])}`;
  if (/\d{1,2}:\d{2}/.test(s)) return hoy.toISOString().slice(0, 10);
  return '';
}

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
    items.push({ id, nombre, tipo: carpeta ? 'carpeta' : tipoDe(mime), clave, fecha: fecha(texto(f)) });
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
    return null;
  }
}

// ------------------------------------------------------------------ Clasificación propia
export const MATERIAS = {
  'diario-oficial': 'Actos publicados en el Diario Oficial', normativa: 'Marco normativo y potestades', estructura: 'Estructura orgánica y funciones',
  autoridades: 'Autoridades de elección popular', remuneraciones: 'Personal y remuneraciones', honorarios: 'Personal a honorarios', compras: 'Compras y adquisiciones',
  actos: 'Actos y resoluciones', subsidios: 'Subsidios y beneficios', participacion: 'Participación ciudadana', presupuesto: 'Presupuesto y su ejecución',
  auditorias: 'Auditorías', entidades: 'Participación en otras entidades', subdere: 'Informes a la SUBDERE', organizaciones: 'Organizaciones comunitarias',
  otros: 'Otros antecedentes', historico: 'Registro histórico',
};
const REGLAS = [[/diario oficial/, 'diario-oficial'], [/potestad|marco normativo/, 'normativa'], [/estructura organica/, 'estructura'], [/eleccion popular/, 'autoridades'],
  [/honorario/, 'honorarios'], [/remuneracion/, 'remuneraciones'], [/adquisicion|compras/, 'compras'], [/actos y resoluciones/, 'actos'], [/subsidio/, 'subsidios'],
  [/participacion ciudadana/, 'participacion'], [/presupuesto/, 'presupuesto'], [/auditoria/, 'auditorias'], [/otras entidades/, 'entidades'], [/subdere/, 'subdere'],
  [/junta de vecinos|organizaciones/, 'organizaciones'], [/registro historico/, 'historico']];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const CLASES = [[/\bdecreto/, 'Decreto'], [/\bresolucion/, 'Resolución'], [/\bordenanza/, 'Ordenanza'], [/\breglamento/, 'Reglamento'], [/\bbalance/, 'Balance'], [/\bacta\b|\bactas\b/, 'Acta'],
  [/\bconvenio/, 'Convenio'], [/\bcontrato/, 'Contrato'], [/\bbases\b|\blicitacion/, 'Licitación'], [/\bescala/, 'Escala de remuneraciones'], [/\bplanilla/, 'Planilla'], [/\bcertificado/, 'Certificado'],
  [/\binforme|\breporte/, 'Informe'], [/\bplan\b|\bpladeco/, 'Plan'], [/\bcuenta publica/, 'Cuenta pública'], [/\bpresupuesto/, 'Presupuesto'], [/\bsubvencion/, 'Subvención'], [/\bprograma/, 'Programa']];

// Nombre visible: sin extensión, guiones bajos ni «(2)», y con tildes en palabras comunes si
// venía en mayúsculas.
export function nombreVisible(n) {
  let t = n.replace(/\.(pdf|docx?|xlsx?|pptx?|csv|zip|rar|jpe?g|png)$/i, '').replace(/_/g, ' ').replace(/\s*\(\d+\)\s*$/, '').replace(/\s+/g, ' ').trim();
  if (t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{4}/.test(t) && t.split(' ').length > 3) t = t.charAt(0) + t.slice(1).toLowerCase();
  return t;
}

export function clasificar(archivo, ruta) {
  // ruta: nombres de las carpetas desde la materia hasta el archivo (sólo para clasificar; no se guarda).
  const todo = norm([...ruta, archivo.nombre].join(' / '));
  const materia = (REGLAS.find(([r]) => r.test(norm(ruta[0] || ''))) || [null, 'otros'])[1];
  // Año: el que aparece en el nombre o en la clasificación, siempre que sea creíble (no un número
  // de decreto); si no, el de publicación.
  const publicado = Number((archivo.fecha || '').slice(0, 4)) || new Date().getFullYear();
  const creible = (t) => [...t.matchAll(/\b(20[0-3]\d)\b/g)].map((m) => Number(m[1])).filter((y) => y >= 2008 && y <= publicado + 1);
  const anio = creible(norm(archivo.nombre)).at(-1) || creible(norm(ruta.join(' '))).at(-1) || publicado || null;
  const mesN = MESES.findIndex((m) => new RegExp('\\b' + m + '\\b').test(norm(archivo.nombre)));
  const mesR = mesN >= 0 ? mesN : MESES.findIndex((m) => new RegExp('\\b' + m + '\\b').test(todo));
  const area = /\bsalud\b|cesfam|posta/.test(todo) ? 'Salud' : /educacion|daem|escuela|liceo|jardin infantil/.test(todo) ? 'Educación' : /cementerio/.test(todo) ? 'Cementerio' : /municipal/.test(todo) ? 'Municipal' : '';
  const clase = (CLASES.find(([r]) => r.test(norm(archivo.nombre))) || CLASES.find(([r]) => r.test(norm(ruta.at(-1) || ''))) || [null, ''])[1];
  return { m: materia, a: anio, me: mesR >= 0 ? mesR + 1 : null, ar: area, c: clase };
}

// Identificador público propio: no revela el de Drive.
export const idPublico = (driveId) => crypto.createHash('sha256').update('mlp-transparencia:' + driveId).digest('base64url').slice(0, 12);

export async function generar(raiz, { aviso = () => {} } = {}) {
  const documentos = [];
  const cola = [{ id: raiz.id, clave: raiz.clave, ruta: [] }];
  const vistas = new Set([raiz.id]);
  let fallidas = 0;
  const trabajar = async () => {
    while (cola.length) {
      const { id, clave, ruta } = cola.shift();
      const items = await traer(id, clave);
      if (!items) { fallidas++; continue; }
      for (const it of items) {
        if (it.tipo === 'carpeta') {
          if (vistas.has(it.id) || vistas.size >= MAX_CARPETAS) continue;
          vistas.add(it.id);
          cola.push({ id: it.id, clave: it.clave, ruta: [...ruta, it.nombre] });
        } else {
          documentos.push({ p: idPublico(it.id), i: it.id, k: it.clave, n: nombreVisible(it.nombre), t: it.tipo, f: it.fecha, ...clasificar(it, ruta) });
        }
      }
      aviso(vistas.size, documentos.length, cola.length);
    }
  };
  await Promise.all(Array.from({ length: PARALELO }, trabajar));
  const vistosP = new Set();
  const unicos = documentos.filter((d) => (vistosP.has(d.p) ? false : vistosP.add(d.p)));
  unicos.sort((a, b) => (b.f || '').localeCompare(a.f || '') || a.n.localeCompare(b.n, 'es', { numeric: true }));
  return { generado: new Date().toISOString(), fallidas, documentos: unicos };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raiz = raizDesdeEntorno();
  if (!raiz) { console.log('TRANSPARENCIA_DRIVE no está definida: se omite la lista de documentos de Transparencia.'); process.exit(0); }
  const salida = arg('salida', SALIDA);
  const t0 = Date.now();
  const datos = await generar(raiz, { aviso: (c, a, q) => { if (process.stdout.isTTY) process.stdout.write(`\r${c} carpetas · ${a} documentos · ${q} por revisar   `); } });
  if (datos.fallidas > 20 || !datos.documentos.length) { console.error(`\nNo se pudo leer bien la carpeta (${datos.fallidas} sin leer); se conserva la lista anterior.`); process.exit(0); }
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, JSON.stringify(datos));
  console.log(`\nDocumentos de Transparencia: ${datos.documentos.length} (${datos.fallidas} carpetas sin leer) en ${Math.round((Date.now() - t0) / 1000)} s.`);
}
