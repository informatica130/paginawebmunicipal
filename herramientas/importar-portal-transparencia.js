// Importa la extracción del Portal de Transparencia (MU172) a contenido/portal-transparencia/portal.json
// para mostrar en el sitio las mismas secciones y tablas de Transparencia Activa, con la fecha de
// la extracción. Los enlaces a Google Drive NO se guardan: cada uno se reemplaza por el
// identificador propio del documento (el mismo de /transparencia/documentos/), que el sitio
// entrega sin mostrar Drive. Los enlaces al Portal, a la BCN y a otros sitios públicos se conservan.
//
// Uso: node herramientas/importar-portal-transparencia.js extraccion.json

import fs from 'node:fs';
import path from 'node:path';
import { idPublico } from './transparencia-drive.js';

const entrada = process.argv[2];
if (!entrada) { console.error('Uso: node herramientas/importar-portal-transparencia.js extraccion.json'); process.exit(1); }
const SALIDA = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'contenido', 'portal-transparencia', 'portal.json');
const d = JSON.parse(fs.readFileSync(entrada, 'utf8'));

const DRIVE = /https?:\/\/(?:drive|docs)\.google\.com\/[^\s"']*?(?:\/d\/|[?&]id=)([\w-]{20,})[^\s"']*/i;
let docs = 0, enlaces = 0, quitados = 0;
// Celda o enlace: texto, {d: idPublico} para documentos de Drive, {u: url} para el resto.
function valor(v) {
  if (typeof v !== 'string') return v ?? '';
  const t = v.trim();
  const m = DRIVE.exec(t);
  if (m && t === m[0]) { docs++; return { d: idPublico(m[1]) }; }
  // Carpetas y otros enlaces de Google: no se muestran; la celda remite a la tabla en el Portal.
  if (/^https?:\/\/\S+$/.test(t)) { if (/google\.com/.test(t)) { quitados++; return { v: 1 }; } enlaces++; return { u: t }; }
  return t.replace(new RegExp(DRIVE.source, 'gi'), () => { quitados++; return ''; });
}
let n = 0;
const slug = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
function nodo(x) {
  const id = `${slug(x.nombre) || 'item'}-${(++n).toString(36)}`;
  const base = { id, n: x.nombre, t: x.tipo };
  if (x.tipo === 'carpeta') return { ...base, h: (x.hijos || []).map(nodo) };
  if (x.tipo === 'tabla') {
    const cols = x.columnas || [];
    return { ...base, a: x.ultima_actualizacion || '', p: x.enlace_directo || '', m: x.mostrando || '', c: cols, f: (x.filas || []).map((r) => cols.map((k) => valor(r[k]))), nota: x.nota || '' };
  }
  if (x.tipo === 'contenido') return { ...base, a: x.ultima_actualizacion || '', p: x.enlace_directo || '', x: valor(x.texto || ''), e: (x.enlaces || []).map((e) => ({ texto: e.texto || e.url, ...(() => { const v = valor(e.url || ''); return typeof v === 'object' ? v : {}; })() })).filter((e) => e.d || e.u) };
  if (x.tipo === 'enlace_externo') { const v = valor(x.url || ''); return { ...base, ...(typeof v === 'object' ? v : {}) }; }
  return base;
}
const secciones = d.transparencia_activa.map((s) => {
  const m = /^(\d{1,2})\.\s*(.*)$/.exec(s.seccion);
  return { id: slug(m ? m[2] : s.seccion), num: m ? m[1] : '', n: m ? m[2] : s.seccion, h: s.items.map(nodo) };
});
const o = d.organismo || {}, c = d.contacto_y_oficinas || {}, f = d.formulario_solicitud_informacion || {};
const salida = {
  fecha: (d.meta?.fecha_extraccion || '').slice(0, 10), fuente: d.meta?.fuente || '',
  organismo: { nombre: o.nombre, codigo: o.codigo_portal, direccion: o.direccion, telefono: o.telefono },
  contacto: { correo: c.correo_contacto, telefonos: c.telefonos, oficinas: c.oficinas, tecnico: c.dificultades_tecnicas_correo },
  solicitud: { electronica: f.via_electronica?.url || '', presencial: f.via_presencial?.texto || '', formulario: (() => { const v = valor(f.via_presencial?.descargar_formulario?.url || ''); return typeof v === 'object' ? v : null; })() },
  secciones,
};
fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, JSON.stringify(salida));
console.log(`Portal de Transparencia (${salida.fecha}): ${secciones.length} secciones, ${n} elementos, ${docs} documentos (sin enlaces a Drive), ${enlaces} enlaces públicos, ${quitados} enlaces de Google quitados → ${Math.round(fs.statSync(SALIDA).size / 1024)} KB`);
