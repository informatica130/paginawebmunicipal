// Documentos de Transparencia: los documentos públicos del archivo de Transparencia de la
// Municipalidad, ordenados con la organización propia del sitio (materia, año, mes, área y
// clase de documento) y abiertos desde el propio sitio (/transparencia/documentos/ID/nombre.pdf).
// No se muestran ni enlazan carpetas, su orden interno ni Google Drive. La lista la genera
// herramientas/transparencia-drive.js al publicar en Vercel (no está en el repositorio).

import fs from 'node:fs';
import { html, crudo, icono, migas, vacio } from './comun.js';
import { documento, encabezado } from './layout.js';
import { fecha } from '../../src/util.js';

const RUTA = new URL('../../contenido/transparencia/documentos.json', import.meta.url);
export const BASE = '/transparencia/documentos/';
const POR_PAGINA = 50;
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Materias en el orden del sitio, con su descripción y su ícono.
export const MATERIAS = [
  ['presupuesto', 'Presupuesto y su ejecución', 'Presupuesto municipal, balances y estados financieros, informes trimestrales.', 'grafico'],
  ['actos', 'Actos y resoluciones', 'Decretos alcaldicios y resoluciones con efectos sobre terceros.', 'licencia'],
  ['compras', 'Compras y adquisiciones', 'Compras, contrataciones y adquisiciones menores.', 'billete'],
  ['remuneraciones', 'Personal y remuneraciones', 'Escalas de remuneraciones del personal municipal, de salud y de educación.', 'usuario'],
  ['honorarios', 'Personal a honorarios', 'Informes de las personas contratadas a honorarios.', 'personas'],
  ['normativa', 'Marco normativo y potestades', 'Ordenanzas, reglamentos y normas que rigen a la Municipalidad.', 'balanza'],
  ['estructura', 'Estructura orgánica y funciones', 'Organigrama y funciones de cada unidad.', 'carpeta'],
  ['autoridades', 'Autoridades de elección popular', 'Alcalde y concejo municipal.', 'escudo'],
  ['participacion', 'Participación ciudadana', 'COSOC, consultas, cuentas públicas y mecanismos de participación.', 'chat'],
  ['subsidios', 'Subsidios y beneficios', 'Programas sociales, becas y beneficios.', 'corazon'],
  ['organizaciones', 'Organizaciones comunitarias', 'Juntas de vecinos y organizaciones de la comuna.', 'casa'],
  ['subdere', 'Informes a la SUBDERE', 'Informes enviados a la Subsecretaría de Desarrollo Regional.', 'documento'],
  ['auditorias', 'Auditorías', 'Resultados de auditorías al ejercicio presupuestario.', 'llave'],
  ['entidades', 'Participación en otras entidades', 'Asociaciones, corporaciones y fundaciones en que participa la Municipalidad.', 'enlace'],
  ['diario-oficial', 'Actos publicados en el Diario Oficial', 'Actos de la Municipalidad publicados en el Diario Oficial.', 'documento'],
  ['otros', 'Otros antecedentes', 'Planes, programas y otros documentos de interés público.', 'libro'],
  ['historico', 'Registro histórico', 'Documentos de años anteriores.', 'calendario'],
];
const MAT = Object.fromEntries(MATERIAS.map(([id, nombre, texto, ico]) => [id, { id, nombre, texto, ico }]));
// No se destacan entre lo reciente (uno por persona): se ven en su materia y en el buscador.
const SIN_DESTACAR = new Set(['honorarios']);

const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const miles = (n) => Number(n).toLocaleString('es-CL');
const slug = (t) => norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'documento';
const EXT = { PDF: 'pdf', Planilla: 'xlsx', Documento: 'docx', Presentación: 'pptx', Imagen: 'jpg' };
export const urlDoc = (d) => `${BASE}${d.p}/${slug(d.n)}.${EXT[d.t] || 'pdf'}`;

let cache = null, cacheMtime = 0;
export function inventario() {
  let st;
  try { st = fs.statSync(RUTA); } catch { return null; }
  if (cache && st.mtimeMs === cacheMtime) return cache;
  const d = JSON.parse(fs.readFileSync(RUTA, 'utf8'));
  const porId = new Map();
  const materias = {};
  for (const x of d.documentos) {
    x.busca = norm(`${x.n} ${MAT[x.m]?.nombre || ''} ${x.ar || ''} ${x.c || ''} ${x.a || ''} ${x.me ? MESES[x.me - 1] : ''}`);
    porId.set(x.p, x);
    const m = (materias[x.m] ||= { total: 0, ultimo: '', anios: {} });
    m.total++; if ((x.f || '') > m.ultimo) m.ultimo = x.f; if (x.a) m.anios[x.a] = (m.anios[x.a] || 0) + 1;
  }
  const anios = [...new Set(d.documentos.map((x) => x.a).filter(Boolean))].sort((a, b) => b - a);
  cache = { ...d, porId, materias, anios, total: d.documentos.length };
  cacheMtime = st.mtimeMs;
  return cache;
}

export function filtrar(inv, { q = '', materia = '', anio = '', area = '', clase = '' } = {}, limite = Infinity) {
  const p = norm(q).split(/\s+/).filter((x) => x.length > 1);
  const r = [];
  for (const d of inv.documentos) {
    if (materia && d.m !== materia) continue;
    if (anio && String(d.a) !== String(anio)) continue;
    if (area && d.ar !== area) continue;
    if (clase && d.c !== clase) continue;
    if (p.length && !p.every((x) => d.busca.includes(x))) continue;
    r.push(d); if (r.length >= limite) break;
  }
  return r;
}
export const buscarArchivo = (inv, q, { limite = 40 } = {}) => (inv ? filtrar(inv, { q }, limite) : []);
export function destacados(inv, n) { const r = []; for (const d of inv.documentos) { if (!SIN_DESTACAR.has(d.m)) r.push(d); if (r.length >= n) break; } return r; }

const CLASE_ICO = { PDF: 'ar-pdf', Planilla: 'ar-xls', Documento: 'ar-doc' };
export function filaArchivo(d, { conMateria = true } = {}) {
  const det = [conMateria ? MAT[d.m]?.nombre : '', d.ar, d.c, d.f ? fecha(d.f, { largo: true }) : ''].filter(Boolean).join(' · ');
  return html`<li class="ar-fila"><a class="ar-archivo" href="${urlDoc(d)}" target="_blank" rel="noopener">
    <span class="ar-ico ${CLASE_ICO[d.t] || ''}">${crudo(icono(d.t === 'Planilla' ? 'grafico' : 'documento', { tam: 20 }))}<small>${d.t === 'Planilla' ? 'XLS' : d.t === 'Documento' ? 'DOC' : d.t === 'PDF' ? 'PDF' : ''}</small></span>
    <span class="ar-txt"><b>${d.n}</b><small>${det}</small></span>
    <span class="ar-ir" aria-hidden="true">${crudo(icono('descarga', { tam: 16 }))}</span><span class="sr"> (abre el documento en otra pestaña)</span>
  </a></li>`;
}

function tarjetaMateria(inv, m) {
  const x = inv.materias[m.id];
  return html`<li><a class="ar-carpeta" href="${BASE}?materia=${m.id}">
    <span class="ar-ico">${crudo(icono(m.ico, { tam: 22 }))}</span>
    <span class="ar-txt"><b>${m.nombre}</b><small>${miles(x.total)} ${x.total === 1 ? 'documento' : 'documentos'}${x.ultimo ? html` · último: ${fecha(x.ultimo, { largo: true })}` : ''}</small></span>
    <span class="ar-ir" aria-hidden="true">${crudo(icono('flecha', { tam: 16 }))}</span>
  </a></li>`;
}

// Lista agrupada por año y mes.
function agrupada(docs) {
  const grupos = [];
  for (const d of docs) {
    const k = `${d.a || 's/f'}|${d.me || 0}`;
    if (!grupos.length || grupos.at(-1).k !== k) grupos.push({ k, a: d.a, me: d.me, docs: [] });
    grupos.at(-1).docs.push(d);
  }
  return grupos.map((g) => html`<section class="ar-grupo"><h3 class="ar-mes">${g.me ? MESES[g.me - 1] + ' ' : ''}${g.a || 'Sin fecha'}</h3><ul class="ar-lista">${g.docs.map((d) => filaArchivo(d))}</ul></section>`);
}

export function paginaArchivo(ctx, filtros = {}, pagina = 1) {
  const inv = inventario();
  const f = { q: String(filtros.q || '').slice(0, 120), materia: MAT[filtros.materia] ? filtros.materia : '', anio: /^\d{4}$/.test(filtros.anio || '') ? filtros.anio : '', area: ['Municipal', 'Salud', 'Educación', 'Cementerio'].includes(filtros.area) ? filtros.area : '', clase: String(filtros.clase || '').slice(0, 40) };
  const hayFiltro = Object.values(f).some(Boolean);
  const m = f.materia ? MAT[f.materia] : null;
  const titulo = m ? m.nombre : 'Documentos de Transparencia';
  const cuerpoVacio = !inv;
  const docs = inv && hayFiltro ? filtrar(inv, f) : [];
  // Ordenados por año y mes del documento (y luego por fecha de publicación).
  docs.sort((a, b) => (b.a || 0) - (a.a || 0) || (b.me || 0) - (a.me || 0) || (b.f || '').localeCompare(a.f || ''));
  const paginas = Math.max(1, Math.ceil(docs.length / POR_PAGINA)), p = Math.min(Math.max(1, pagina), paginas);
  const opciones = (lista, v) => lista.map(([k, t]) => html`<option value="${k}"${String(k) === String(v) ? crudo(' selected') : ''}>${t}</option>`);
  const clases = inv ? [...new Set(inv.documentos.filter((d) => !f.materia || d.m === f.materia).map((d) => d.c).filter(Boolean))].sort() : [];
  const qs = (n) => '?' + Object.entries({ ...f, p: n > 1 ? n : '' }).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return documento(ctx, {
    titulo: `${titulo} — Transparencia`, descripcion: m ? m.texto : 'Documentos públicos de Transparencia Activa de la Municipalidad de Melipeuco, ordenados por materia, año y área.', canonical: m ? `${BASE}?materia=${m.id}` : BASE,
    cuerpo: html`${encabezado({ titulo, bajada: m ? m.texto : inv ? `${miles(inv.total)} documentos públicos de la Municipalidad, ordenados por materia, año y área.` : 'Documentos públicos de Transparencia Activa de la Municipalidad.', migas: migas([{ texto: 'Transparencia', url: '/transparencia/' }, { texto: 'Documentos', url: m ? BASE : '' }, ...(m ? [{ texto: m.nombre }] : [])]), ctx })}
      <div class="contenedor archivo-transparencia">
        ${cuerpoVacio ? vacio('La lista de documentos se está actualizando. Mientras tanto puede revisarlos en el Portal de Transparencia del Estado.', 'documento') : html`
        <form class="ar-filtros" method="get" action="${BASE}" role="search">
          <div class="ar-buscar"><label for="ar-q" class="sr">Buscar documentos</label>${crudo(icono('buscar', { tam: 20 }))}<input id="ar-q" name="q" type="search" value="${f.q}" placeholder="Buscar: decreto, balance, escala de remuneraciones, 2026…" autocomplete="off"><button class="boton boton-primario" type="submit">Buscar</button></div>
          <div class="ar-selectores">
            <label><span>Materia</span><select name="materia" data-auto-enviar><option value="">Todas</option>${opciones(MATERIAS.filter(([id]) => inv.materias[id]).map(([id, n]) => [id, n]), f.materia)}</select></label>
            <label><span>Año</span><select name="anio" data-auto-enviar><option value="">Todos</option>${opciones(inv.anios.map((a) => [a, a]), f.anio)}</select></label>
            <label><span>Área</span><select name="area" data-auto-enviar><option value="">Todas</option>${opciones([['Municipal', 'Municipal'], ['Salud', 'Salud'], ['Educación', 'Educación'], ['Cementerio', 'Cementerio']], f.area)}</select></label>
            ${clases.length ? html`<label><span>Tipo</span><select name="clase" data-auto-enviar><option value="">Todos</option>${opciones(clases.map((c) => [c, c]), f.clase)}</select></label>` : ''}
            ${hayFiltro ? html`<a class="ver-todo" href="${BASE}">Quitar filtros</a>` : ''}
          </div>
        </form>
        ${hayFiltro ? html`
          <p class="resultado-conteo" role="status">${miles(docs.length)} ${docs.length === 1 ? 'documento' : 'documentos'}${f.q ? html` para «${f.q}»` : ''}.</p>
          ${m && !f.anio && !f.q ? html`<div class="chips ar-anios">${Object.keys(inv.materias[m.id].anios).sort((a, b) => b - a).map((a) => html`<a class="chip" href="${BASE}?materia=${m.id}&anio=${a}">${a} <small>${inv.materias[m.id].anios[a]}</small></a>`)}</div>` : ''}
          ${docs.length ? html`${agrupada(docs.slice((p - 1) * POR_PAGINA, p * POR_PAGINA))}
            ${paginas > 1 ? html`<nav class="paginacion" aria-label="Paginación">${p > 1 ? html`<a href="${BASE}${qs(p - 1)}" rel="prev">Anterior</a>` : ''}<span aria-current="page">Página ${p} de ${paginas}</span>${p < paginas ? html`<a href="${BASE}${qs(p + 1)}" rel="next">Siguiente</a>` : ''}</nav>` : ''}`
          : vacio('No encontramos documentos con esos filtros. Pruebe con otra palabra o quite algún filtro.', 'buscar')}` : html`
          <h2 class="ar-sub">Materias</h2>
          <ul class="ar-carpetas">${MATERIAS.filter(([id]) => inv.materias[id]).map(([id]) => tarjetaMateria(inv, MAT[id]))}</ul>
          <h2 class="ar-sub">Publicado recientemente</h2>
          <ul class="ar-lista">${destacados(inv, 12).map((d) => filaArchivo(d))}</ul>
          <h2 class="ar-sub">Por año</h2>
          <div class="chips ar-anios">${inv.anios.map((a) => html`<a class="chip" href="${BASE}?anio=${a}">${a}</a>`)}</div>`}
        <p class="meta actualizado">Lista actualizada el ${fecha(inv.generado, { largo: true, hora: true })}. Fuente: archivo oficial de Transparencia de la Municipalidad de Melipeuco.</p>`}
      </div>`,
  });
}

// Bloque para el Centro de Transparencia.
export function resumenArchivo() {
  const inv = inventario();
  if (!inv) return '';
  return html`<section class="ar-resumen" aria-labelledby="ar-res-t">
    <div class="ct-cabeza"><div><h2 id="ar-res-t">Documentos de Transparencia</h2><p>${miles(inv.total)} documentos públicos de la Municipalidad, ordenados por materia, año y área, y actualizados todos los días.</p></div><a class="boton boton-secundario" href="${BASE}">${crudo(icono('carpeta', { tam: 18 }))} Ver todos los documentos</a></div>
    <form class="ar-buscar" method="get" action="${BASE}" role="search"><label for="ar-q2" class="sr">Buscar documentos</label>${crudo(icono('buscar', { tam: 20 }))}<input id="ar-q2" name="q" type="search" placeholder="Buscar un documento: decreto, balance, remuneraciones…" autocomplete="off"><button class="boton boton-primario" type="submit">Buscar</button></form>
    <ul class="ar-carpetas">${MATERIAS.filter(([id]) => inv.materias[id]).slice(0, 9).map(([id]) => tarjetaMateria(inv, MAT[id]))}</ul>
    <h3 class="ar-sub">Publicado recientemente</h3>
    <ul class="ar-lista">${destacados(inv, 6).map((d) => filaArchivo(d))}</ul>
  </section>`;
}

// Total de documentos de una materia (para enlazarla desde el Centro de Transparencia).
export function totalMateria(id) { const inv = inventario(); return inv?.materias[id]?.total || 0; }
