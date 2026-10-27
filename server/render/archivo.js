// Archivo de Transparencia: todas las carpetas y archivos de la carpeta pública «LEY DE
// TRANSPARENCIA» de Google Drive, navegables y buscables desde el sitio. El inventario
// (contenido/transparencia/drive.json) lo genera herramientas/transparencia-drive.js y se
// actualiza solo todos los días con GitHub Actions; cada página ofrece además la carpeta
// «en vivo» de Drive, para ver lo subido hace minutos.

import fs from 'node:fs';
import { html, crudo, icono, migas, vacio } from './comun.js';
import { documento, encabezado } from './layout.js';
import { fecha } from '../../src/util.js';

const RUTA = new URL('../../contenido/transparencia/drive.json', import.meta.url);
const BASE = '/transparencia/archivo/';
const POR_PAGINA = 60;
let cache = null, cacheMtime = 0;

const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SIGLAS = /\b(subdere|pladeco|cosoc|daem|dideco|dom|secplan|jjvv|pmg|cesfam|sem|rut|uf|utm|fndr|pmu|pmb|fril|sii|ocde|cplt|sernam|senda|opd|ufro)\b/gi;
// Las carpetas vienen en mayúsculas y sin tildes: se recuperan las palabras más comunes.
const ACENTOS = Object.fromEntries('organica:orgánica eleccion:elección participacion:participación ejecucion:ejecución auditorias:auditorías historico:histórico historica:histórica gestion:gestión informacion:información direccion:dirección educacion:educación credito:crédito tecnico:técnico tecnica:técnica publico:público publica:pública publicos:públicos publicas:públicas municipal:municipal economico:económico academico:académico catastro:catastro region:región regimen:régimen administracion:administración licitacion:licitación licitaciones:licitaciones resolucion:resolución sesion:sesión sesiones:sesiones transito:tránsito tramites:trámites numero:número periodo:período ano:año anos:años'.split(' ').map((x) => x.split(':')));
const TILDES = new RegExp('\\b(' + Object.keys(ACENTOS).join('|') + ')\\b', 'gi');
// «01.- DOCUMENTOS DIARIO OFICIAL» → número «01» y nombre «Documentos diario oficial».
export function nombreBonito(n) {
  const m = /^\s*(\d{1,2})\s*[.-]+\s*-?\s*(.*)$/.exec(n);
  let t = (m ? m[2] : n).trim();
  if (t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{3}/.test(t)) t = t.toLowerCase().replace(/(^|[.:]\s+)(\p{L})/gu, (x, a, b) => a + b.toUpperCase()).replace(SIGLAS, (s) => s.toUpperCase());
  if (t !== (m ? m[2] : n).trim()) t = t.replace(TILDES, (w) => { const r = ACENTOS[w.toLowerCase()]; return r ? (w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r) : w; });
  return { numero: m ? m[1].padStart(2, '0') : '', nombre: t.replace(/\.(pdf|docx?|xlsx?|pptx?|csv|zip|rar)$/i, '') };
}

export function inventario() {
  let st;
  try { st = fs.statSync(RUTA); } catch { return null; }
  if (cache && st.mtimeMs === cacheMtime) return cache;
  const d = JSON.parse(fs.readFileSync(RUTA, 'utf8'));
  const carpetas = new Map(d.carpetas.map((c) => [c.id, { ...c, hijas: [], archivos: [], total: 0 }]));
  for (const c of carpetas.values()) if (c.padre && carpetas.has(c.padre)) carpetas.get(c.padre).hijas.push(c);
  for (const a of d.archivos) { a.busca = norm(a.nombre); carpetas.get(a.carpeta)?.archivos.push(a); }
  const contar = (c) => (c.total = c.archivos.length + c.hijas.reduce((s, h) => s + contar(h), 0));
  const raiz = carpetas.get(d.raiz);
  if (raiz) contar(raiz);
  for (const c of carpetas.values()) { c.hijas.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es', { numeric: true })); c.busca = norm(c.nombre); }
  cache = { ...d, raizId: d.raiz, carpetas, raiz, archivos: d.archivos };
  cacheMtime = st.mtimeMs;
  return cache;
}

const miles = (n) => Number(n).toLocaleString('es-CL');
const MES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];
const mesAnio = (f) => (f ? `${MES[Number(f.slice(5, 7)) - 1]} ${f.slice(0, 4)}` : '');
const rutaDe = (inv, c) => { const r = []; let x = c; while (x && x.id !== inv.raizId && r.length < 12) { r.unshift(x); x = inv.carpetas.get(x.padre); } return r; };
const ICONO = { PDF: 'documento', Planilla: 'grafico', Documento: 'documento', Presentación: 'video', Imagen: 'camara', Video: 'video', Audio: 'video', Comprimido: 'carpeta' };
const enDrive = (u) => crudo(`href="${u.replace(/"/g, '%22')}" target="_blank" rel="noopener"`);
const vivo = (c) => `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(c.id)}${/resourcekey=([\w-]+)/.exec(c.url)?.[1] ? '&resourcekey=' + /resourcekey=([\w-]+)/.exec(c.url)[1] : ''}#list`;

export function filaArchivo(a, inv, { conCarpeta = false } = {}) {
  // Los nombres de archivo se muestran tal cual (muchos son nombres de personas), sin la extensión.
  const n = { nombre: a.nombre.replace(/\.(pdf|docx?|xlsx?|pptx?|csv|zip|rar|jpe?g|png)$/i, '').replace(/_/g, ' ') }, c = conCarpeta ? inv.carpetas.get(a.carpeta) : null;
  return html`<li class="ar-fila"><a class="ar-archivo" ${enDrive(a.url)}>
    <span class="ar-ico ar-${a.tipo === 'PDF' ? 'pdf' : a.tipo === 'Planilla' ? 'xls' : a.tipo === 'Documento' ? 'doc' : 'otro'}">${crudo(icono(ICONO[a.tipo] || 'documento', { tam: 20 }))}<small>${a.tipo === 'Planilla' ? 'XLS' : a.tipo === 'Documento' ? 'DOC' : a.tipo === 'PDF' ? 'PDF' : ''}</small></span>
    <span class="ar-txt"><b>${n.nombre}</b><small>${c ? html`${rutaDe(inv, c).map((x) => nombreBonito(x.nombre).nombre).join(' › ')} · ` : ''}${a.fecha ? fecha(a.fecha, { largo: true }) : ''}</small></span>
    <span class="ar-ir" aria-hidden="true">${crudo(icono('enlace', { tam: 16 }))}</span><span class="sr"> (abre en Google Drive, en otra pestaña)</span>
  </a></li>`;
}

function tarjetaCarpeta(c) {
  const n = nombreBonito(c.nombre);
  return html`<li><a class="ar-carpeta" href="${BASE}${c.id}/">
    <span class="ar-ico ar-dir">${n.numero ? html`<b>${n.numero}</b>` : crudo(icono('carpeta', { tam: 22 }))}</span>
    <span class="ar-txt"><b>${n.nombre}</b><small>${miles(c.total)} ${c.total === 1 ? 'archivo' : 'archivos'}${c.actualizado ? html` · al día a ${mesAnio(c.actualizado)}` : ''}</small></span>
    <span class="ar-ir" aria-hidden="true">${crudo(icono('flecha', { tam: 16 }))}</span>
  </a></li>`;
}

export function buscarArchivo(inv, q, { limite = 40, carpeta = null } = {}) {
  const p = norm(q).split(/\s+/).filter((x) => x.length > 1);
  if (!inv || !p.length) return [];
  const dentro = (a) => { if (!carpeta) return true; let c = a.carpeta; while (c) { if (c === carpeta) return true; c = inv.carpetas.get(c)?.padre; } return false; };
  const r = [];
  for (const a of inv.archivos) {
    if (!dentro(a)) continue;
    // También cuenta el nombre de las carpetas donde está (p. ej. «remuneraciones 2025 salud»).
    let ruta = a.busca, c = inv.carpetas.get(a.carpeta), k = 0;
    while (c && k++ < 8) { ruta += ' ' + c.busca; c = inv.carpetas.get(c.padre); }
    if (p.every((x) => ruta.includes(x))) { r.push(a); if (r.length >= limite) break; }
  }
  return r;
}

// Lo más reciente para destacar, sin los informes de honorarios (uno por persona): esos se ven
// en su carpeta y en el buscador.
function destacados(inv, n) {
  const fuera = new Set([...inv.carpetas.values()].filter((c) => /honorario/i.test(c.nombre)).map((c) => c.id));
  const excluida = (id) => { let c = id, k = 0; while (c && k++ < 12) { if (fuera.has(c)) return true; c = inv.carpetas.get(c)?.padre; } return false; };
  const r = [];
  for (const a of inv.archivos) { if (!excluida(a.carpeta)) r.push(a); if (r.length >= n) break; }
  return r;
}

// ------------------------------------------------------------------ Páginas
export function paginaArchivo(ctx, { id = '', q = '', pagina = 1 } = {}) {
  const inv = inventario();
  if (!inv?.raiz) return null;
  const c = id ? inv.carpetas.get(id) : inv.raiz;
  if (!c) return null;
  const esRaiz = c.id === inv.raizId;
  const ruta = rutaDe(inv, c);
  const titulo = esRaiz ? 'Archivo de Transparencia' : nombreBonito(c.nombre).nombre;
  const resultados = q ? buscarArchivo(inv, q, { limite: 300, carpeta: esRaiz ? null : c.id }) : null;
  const archivos = resultados || [...c.archivos].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
  const paginas = Math.max(1, Math.ceil(archivos.length / POR_PAGINA)), p = Math.min(Math.max(1, pagina), paginas);
  const recientes = esRaiz && !q ? destacados(inv, 12) : [];
  const accion = esRaiz ? BASE : `${BASE}${c.id}/`;
  return documento(ctx, {
    titulo: `${titulo} — Transparencia`, descripcion: `Documentos de Transparencia Activa de la Municipalidad de Melipeuco${esRaiz ? '' : ': ' + titulo}.`, canonical: accion,
    cuerpo: html`${encabezado({ titulo, bajada: esRaiz ? `${miles(inv.raiz.total)} documentos publicados por la Municipalidad, ordenados por materia. Se actualiza todos los días desde el archivo oficial de Transparencia.` : `${miles(c.total)} ${c.total === 1 ? 'documento' : 'documentos'} en esta carpeta.`, migas: migas([{ texto: 'Transparencia', url: '/transparencia/' }, { texto: 'Archivo', url: esRaiz ? '' : BASE }, ...ruta.slice(0, -1).map((x) => ({ texto: nombreBonito(x.nombre).nombre, url: `${BASE}${x.id}/` })), ...(esRaiz ? [] : [{ texto: titulo }])]), ctx })}
      <div class="contenedor archivo-transparencia">
        <form class="ar-buscar" method="get" action="${accion}" role="search">
          <label for="ar-q" class="sr">Buscar documentos</label>${crudo(icono('buscar', { tam: 20 }))}
          <input id="ar-q" name="q" type="search" value="${q}" placeholder="${esRaiz ? 'Buscar en todo el archivo: decreto, remuneraciones 2025, presupuesto…' : 'Buscar en esta carpeta…'}" autocomplete="off">
          <button class="boton boton-primario" type="submit">Buscar</button>
        </form>
        ${q ? html`<p class="resultado-conteo" role="status">${archivos.length >= 300 ? 'Más de 300' : archivos.length} ${archivos.length === 1 ? 'documento' : 'documentos'} para «${q}»${esRaiz ? '' : ' en esta carpeta'}. <a href="${accion}">Ver todo</a></p>` : ''}
        ${!q && c.hijas.length ? html`<section><h2 class="ar-sub">${esRaiz ? 'Materias' : 'Carpetas'}</h2><ul class="ar-carpetas">${c.hijas.filter((h) => h.total).map(tarjetaCarpeta)}</ul></section>` : ''}
        ${recientes.length ? html`<section><h2 class="ar-sub">Publicado recientemente</h2><ul class="ar-lista">${recientes.map((a) => filaArchivo(a, inv, { conCarpeta: true }))}</ul></section>` : ''}
        ${archivos.length && !(esRaiz && !q) ? html`<section><h2 class="ar-sub">${q ? 'Resultados' : 'Documentos'}</h2><ul class="ar-lista">${archivos.slice((p - 1) * POR_PAGINA, p * POR_PAGINA).map((a) => filaArchivo(a, inv, { conCarpeta: !!q }))}</ul>
          ${paginas > 1 ? html`<nav class="paginacion" aria-label="Paginación">${Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (n === p ? html`<span aria-current="page">${n}</span>` : html`<a href="${accion}?${q ? 'q=' + encodeURIComponent(q) + '&' : ''}p=${n}">${n}</a>`))}</nav>` : ''}</section>` : ''}
        ${q && !archivos.length ? vacio('No encontramos documentos con esas palabras. Pruebe con otra palabra o revise la ortografía.', 'buscar') : ''}
        <details class="ar-vivo"><summary>${crudo(icono('carpeta', { tam: 18 }))} Ver ${esRaiz ? 'el archivo' : 'esta carpeta'} en vivo en Google Drive</summary>
          <p class="muted chico">Muestra lo subido hace minutos, antes de la actualización diaria del sitio.</p>
          <iframe title="Carpeta de Google Drive: ${titulo}" data-src="${vivo(c)}" loading="lazy"></iframe>
          <a class="ver-todo" ${enDrive(c.url)}>Abrir en Google Drive</a>
        </details>
        <p class="meta actualizado">Inventario actualizado el ${fecha(inv.generado, { largo: true, hora: true })}. Fuente: archivo oficial de Transparencia de la Municipalidad de Melipeuco.</p>
      </div>`,
  });
}

// Bloque para el Centro de Transparencia: materias del archivo y lo más reciente.
export function resumenArchivo() {
  const inv = inventario();
  if (!inv?.raiz) return '';
  return html`<section class="ar-resumen" aria-labelledby="ar-res-t">
    <div class="ct-cabeza"><div><h2 id="ar-res-t">Archivo de documentos</h2><p>${miles(inv.raiz.total)} documentos de Transparencia Activa publicados por la Municipalidad, ordenados por materia y actualizados todos los días.</p></div><a class="boton boton-secundario" href="${BASE}">${crudo(icono('carpeta', { tam: 18 }))} Explorar el archivo</a></div>
    <form class="ar-buscar" method="get" action="${BASE}" role="search"><label for="ar-q2" class="sr">Buscar documentos</label>${crudo(icono('buscar', { tam: 20 }))}<input id="ar-q2" name="q" type="search" placeholder="Buscar un documento: decreto, remuneraciones, presupuesto…" autocomplete="off"><button class="boton boton-primario" type="submit">Buscar</button></form>
    <ul class="ar-carpetas">${inv.raiz.hijas.filter((h) => h.total).map(tarjetaCarpeta)}</ul>
    <h3 class="ar-sub">Publicado recientemente</h3>
    <ul class="ar-lista">${destacados(inv, 6).map((a) => filaArchivo(a, inv, { conCarpeta: true }))}</ul>
  </section>`;
}
