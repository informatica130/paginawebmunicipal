// Transparencia Activa en el sitio: las secciones y tablas del Portal de Transparencia del Estado
// (Municipalidad de Melipeuco, MU172) tal como estaban en la fecha de la extracción, con un aviso
// claro de esa fecha y de que la información más reciente está en el Portal.
// Datos: contenido/portal-transparencia/portal.json (herramientas/importar-portal-transparencia.js).
// Los documentos se abren desde el sitio (/transparencia/documentos/…), nunca desde Drive.

import fs from 'node:fs';
import { html, crudo, icono, migas, vacio } from './comun.js';
import { documento, encabezado } from './layout.js';
import { fecha } from '../../src/util.js';
import { inventario as inventarioDocs, urlDoc } from './archivo.js';

const RUTA = new URL('../../contenido/portal-transparencia/portal.json', import.meta.url);
export const BASE = '/transparencia/activa/';
export const PORTAL = 'https://www.portaltransparencia.cl/PortalPdT/directorio-de-organismos-regulados/?org=MU172';
const POR_PAGINA = 50;
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const miles = (n) => Number(n || 0).toLocaleString('es-CL');
const ICONOS = { 'actos-y-documentos-publicados-en-diario-oficial': 'documento', 'potestades-y-marco-normativo': 'balanza', 'personal-y-remuneraciones': 'usuario', 'adquisiciones-y-contrataciones': 'billete', 'transferencias-de-fondos-y-aportes-economicos-entregados': 'mano', 'actos-y-resoluciones-con-efectos-sobre-terceras-personas': 'licencia', 'tramites-ante-el-organismo': 'buscar', 'subsidios-y-beneficios': 'corazon', 'mecanismos-de-participacion-ciudadana': 'chat', 'informacion-presupuestaria': 'grafico', 'auditorias-al-ejercicio-presupuestario-y-aclaraciones': 'llave', 'participacion-en-otras-entidades': 'enlace', 'informe-anual-a-la-subdere': 'documento' };

let cache = null, mtime = 0;
export function portal() {
  let st;
  try { st = fs.statSync(RUTA); } catch { return null; }
  if (cache && st.mtimeMs === mtime) return cache;
  const d = JSON.parse(fs.readFileSync(RUTA, 'utf8'));
  const nodos = new Map();
  const recorrer = (x, padre) => {
    x.padre = padre; nodos.set(x.id, x);
    x.tablas = 0; x.filas = 0; x.act = x.a || '';
    if (x.t === 'tabla') { x.tablas = 1; x.filas = (x.f || []).length; }
    for (const h of x.h || []) { recorrer(h, x.id); x.tablas += h.tablas; x.filas += h.filas; if (aIso(h.act) > aIso(x.act)) x.act = h.act; }
    x.busca = norm(x.n);
  };
  for (const s of d.secciones) { s.t = 'seccion'; recorrer(s, null); }
  cache = { ...d, nodos };
  mtime = st.mtimeMs;
  return cache;
}
// «15/10/2026» → «2026-10-15» (para comparar y mostrar).
const aIso = (a) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(a || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
const rutaDe = (p, x) => { const r = []; let n = x; while (n && r.length < 10) { r.unshift(n); n = p.nodos.get(n.padre); } return r; };

// Aviso de la fecha de la información (en todas las páginas de esta sección).
export function avisoFecha(p, enlace = PORTAL) {
  return html`<div class="pt-aviso-fecha" role="note">${crudo(icono('calendario', { tam: 20 }))}<p><b>Información actualizada al ${fecha(p.fecha, { largo: true })}.</b> La información más reciente se publica en el <a href="${enlace}" target="_blank" rel="noopener">Portal de Transparencia del Estado</a>.</p></div>`;
}

function tarjeta(x) {
  const ico = ICONOS[x.id] || (x.t === 'tabla' ? 'grafico' : x.t === 'contenido' ? 'info' : x.t === 'enlace_externo' ? 'enlace' : 'carpeta');
  const det = x.t === 'enlace_externo' ? 'Enlace externo' : x.t === 'contenido' ? 'Información' : x.t === 'tabla' ? `${x.filas ? miles(x.filas) + ' registros' : 'Sin registros publicados'}` : `${miles(x.tablas)} ${x.tablas === 1 ? 'tabla' : 'tablas'}${x.filas ? ` · ${miles(x.filas)} registros` : ''}`;
  const href = x.t === 'enlace_externo' && x.u ? x.u : `${BASE}${x.id}/`;
  return html`<li><a class="ar-carpeta" href="${href}"${x.t === 'enlace_externo' ? crudo(' target="_blank" rel="noopener"') : ''}>
    <span class="ar-ico">${x.num ? html`<b>${x.num}</b>` : crudo(icono(ico, { tam: 22 }))}</span>
    <span class="ar-txt"><b>${x.n}</b><small>${det}${x.act ? ` · actualizado ${x.act}` : ''}</small></span>
    <span class="ar-ir" aria-hidden="true">${crudo(icono(x.t === 'enlace_externo' ? 'enlace' : 'flecha', { tam: 16 }))}</span>
  </a></li>`;
}

// Celda de tabla: texto, documento (se abre desde el sitio), enlace público o «ver en el Portal».
function celda(v, x, docs) {
  if (v && typeof v === 'object') {
    if (v.d) {
      const doc = docs?.porId.get(v.d);
      return doc ? html`<a class="pt-doc" href="${urlDoc(doc)}" target="_blank" rel="noopener">${crudo(icono('documento', { tam: 15 }))} Ver documento</a>` : html`<a class="pt-doc pt-doc-portal" href="${x.p || PORTAL}" target="_blank" rel="noopener">Ver en el Portal</a>`;
    }
    if (v.u) return html`<a class="pt-doc" href="${v.u}" target="_blank" rel="noopener">${crudo(icono('enlace', { tam: 15 }))} Enlace</a>`;
    if (v.v) return html`<a class="pt-doc pt-doc-portal" href="${x.p || PORTAL}" target="_blank" rel="noopener">Ver en el Portal</a>`;
    return '';
  }
  return String(v ?? '');
}

export function paginaActiva(ctx, id = '', { q = '', pagina = 1 } = {}) {
  const p = portal();
  if (!p) return null;
  const x = id ? p.nodos.get(id) : null;
  if (id && !x) return null;
  const ruta = x ? rutaDe(p, x) : [];
  const titulo = x ? x.n : 'Transparencia Activa';
  const enlacePortal = x?.p || PORTAL;
  let cuerpo;
  if (!x) {
    cuerpo = html`<ul class="ar-carpetas pt-secciones">${p.secciones.map(tarjeta)}</ul>
      <section class="pt-ayuda">
        <div><h2>Solicitar información</h2><p>Si no encuentra lo que busca, puede pedirlo por Ley de Transparencia, en línea o en la oficina.</p>
          <p class="pt-botones"><a class="boton boton-primario" href="${p.solicitud.electronica || PORTAL}" target="_blank" rel="noopener">Hacer una solicitud en línea</a>${p.solicitud.formulario?.d && inventarioDocs()?.porId.get(p.solicitud.formulario.d) ? html`<a class="boton boton-secundario" href="${urlDoc(inventarioDocs().porId.get(p.solicitud.formulario.d))}" target="_blank" rel="noopener">Formulario para entregar en la oficina</a>` : ''}</p></div>
        <div><h2>Oficina de atención</h2>${(p.contacto.oficinas || []).map((o) => html`<p><b>${o.oficina}</b><br>${o.direccion}<br>${o.horario}</p>`)}<p>${p.contacto.correo ? html`<a href="mailto:${p.contacto.correo}">${p.contacto.correo}</a>` : ''}</p></div>
      </section>`;
  } else if (x.t === 'tabla') {
    const docs = inventarioDocs();
    const palabras = norm(q).split(/\s+/).filter((w) => w.length > 1);
    const filas = palabras.length ? (x.f || []).filter((r) => { const t = norm(r.map((c) => (typeof c === 'string' ? c : '')).join(' ')); return palabras.every((w) => t.includes(w)); }) : (x.f || []);
    const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA)), pg = Math.min(Math.max(1, pagina), paginas);
    const qs = (k) => `?${q ? 'q=' + encodeURIComponent(q) + '&' : ''}p=${k}`;
    cuerpo = html`<div class="pt-tabla-cab"><p class="meta">${x.a ? html`Última actualización en el Portal: <b>${x.a}</b> · ` : ''}${miles((x.f || []).length)} registros${x.m && /de (\d+)/.exec(x.m) && Number(/de (\d+)/.exec(x.m)[1]) > (x.f || []).length ? ` (el Portal informa ${/de (\d+)/.exec(x.m)[1]})` : ''}</p><a class="ver-todo" href="${enlacePortal}" target="_blank" rel="noopener">Ver esta tabla en el Portal</a></div>
      ${(x.f || []).length ? html`
        <form class="ar-buscar pt-buscar" method="get" action="${BASE}${x.id}/" role="search"><label for="pt-q" class="sr">Buscar en esta tabla</label>${crudo(icono('buscar', { tam: 20 }))}<input id="pt-q" name="q" type="search" value="${q}" placeholder="Buscar en esta tabla…" autocomplete="off"><button class="boton boton-primario" type="submit">Buscar</button></form>
        ${q ? html`<p class="resultado-conteo" role="status">${miles(filas.length)} ${filas.length === 1 ? 'registro' : 'registros'} para «${q}». <a href="${BASE}${x.id}/">Ver todos</a></p>` : ''}
        <div class="pt-tabla-caja" tabindex="0" role="region" aria-label="${x.n}"><table class="pt-tabla"><thead><tr>${x.c.map((c) => html`<th scope="col">${c}</th>`)}</tr></thead>
          <tbody>${filas.slice((pg - 1) * POR_PAGINA, pg * POR_PAGINA).map((r) => html`<tr>${r.map((v, i) => html`<td data-col="${x.c[i]}">${celda(v, x, docs)}</td>`)}</tr>`)}</tbody></table></div>
        ${paginas > 1 ? html`<nav class="paginacion" aria-label="Paginación">${pg > 1 ? html`<a href="${BASE}${x.id}/${qs(pg - 1)}" rel="prev">Anterior</a>` : ''}<span aria-current="page">Página ${pg} de ${paginas}</span>${pg < paginas ? html`<a href="${BASE}${x.id}/${qs(pg + 1)}" rel="next">Siguiente</a>` : ''}</nav>` : ''}`
      : vacio(x.nota && !/sin registros/i.test(x.nota) ? 'Esta tabla se consulta directamente en el Portal de Transparencia.' : 'No hay registros publicados en esta tabla.', 'documento')}`;
  } else if (x.t === 'contenido') {
    const docs = inventarioDocs();
    cuerpo = html`${x.a ? html`<p class="meta">Última actualización en el Portal: <b>${x.a}</b></p>` : ''}<div class="prosa"><p>${typeof x.x === 'string' ? x.x.replace(/^[^:]{3,140}:\s*Última actualización\s*:\s*\d{2}\/\d{2}\/\d{4}\s*/i, '') : ''}</p></div>
      ${(x.e || []).length ? html`<ul class="ar-lista">${x.e.map((e) => { const doc = e.d ? docs?.porId.get(e.d) : null; const href = doc ? urlDoc(doc) : e.u || enlacePortal; return html`<li class="ar-fila"><a class="ar-archivo" href="${href}" target="_blank" rel="noopener"><span class="ar-ico">${crudo(icono(e.d ? 'documento' : 'enlace', { tam: 20 }))}</span><span class="ar-txt"><b>${e.texto}</b></span><span class="ar-ir" aria-hidden="true">${crudo(icono('enlace', { tam: 16 }))}</span></a></li>`; })}</ul>` : ''}`;
  } else {
    cuerpo = (x.h || []).length ? html`<ul class="ar-carpetas">${x.h.map(tarjeta)}</ul>` : vacio('Esta sección no tiene contenido publicado.', 'documento');
  }
  return documento(ctx, {
    titulo: `${titulo} — Transparencia Activa`, descripcion: `${titulo}: Transparencia Activa de la Municipalidad de Melipeuco (Ley 20.285).`, noindex: x?.t === 'tabla',
    cuerpo: html`${encabezado({ titulo, bajada: !x ? 'Las materias que la Ley 20.285 obliga a publicar, con sus tablas y documentos, tal como aparecen en el Portal de Transparencia del Estado.' : x.t === 'seccion' && x.num ? `Sección ${x.num} de Transparencia Activa` : '', migas: migas([{ texto: 'Transparencia', url: '/transparencia/' }, { texto: 'Transparencia Activa', url: x ? BASE : '' }, ...ruta.slice(0, -1).map((r) => ({ texto: r.n, url: `${BASE}${r.id}/` })), ...(x ? [{ texto: x.n }] : [])]), ctx })}
      <div class="contenedor archivo-transparencia pt-activa">${avisoFecha(p, enlacePortal)}${cuerpo}</div>`,
  });
}

// Para el buscador del sitio: secciones y tablas cuyo nombre coincide.
export function buscarActiva(palabras) {
  const p = portal();
  if (!p || !palabras.length) return [];
  const r = [];
  for (const x of p.nodos.values()) {
    if (x.t === 'enlace_externo' || !palabras.every((w) => (x.busca + ' ' + norm(p.nodos.get(x.padre)?.n || '')).includes(w))) continue;
    r.push({ tipo: 'Transparencia Activa', clave: 'documento', titulo: x.n, url: `${BASE}${x.id}/`, fragmento: rutaDe(p, x).slice(0, -1).map((y) => y.n).join(' › ') || 'Sección de Transparencia Activa' });
    if (r.length >= 3) break;
  }
  return r;
}

// Bloque para el Centro de Transparencia.
export function resumenActiva() {
  const p = portal();
  if (!p) return '';
  return html`<section class="ar-resumen" aria-labelledby="pt-res-t">
    <div class="ct-cabeza"><div><h2 id="pt-res-t">Transparencia Activa en el sitio</h2><p>Las ${p.secciones.length} secciones del Portal de Transparencia con sus tablas y documentos.</p></div><a class="boton boton-secundario" href="${BASE}">${crudo(icono('documento', { tam: 18 }))} Ver Transparencia Activa</a></div>
    ${avisoFecha(p)}
    <ul class="ar-carpetas pt-secciones">${p.secciones.slice(0, 15).map(tarjeta)}</ul>
  </section>`;
}
// Sección que corresponde a una materia del Centro de Transparencia (por su número de la ley).
export function seccionPorNombre(re) { const p = portal(); return p?.secciones.find((s) => re.test(norm(s.n))) || null; }
