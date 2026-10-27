// Videoteca de Melipeuco: los videos de los canales de YouTube de la Municipalidad (el canal
// oficial actual y el archivo histórico de Canal 3 / Canal 12 Melivisión), ordenados por
// categoría, año, canal y tipo, con buscador, página propia para cada video y listas.
//
// El índice viene de contenido/videos/indice.json (herramientas/importar-videos.js). Los videos
// nuevos se agregan solos: cada 30 minutos se lee el RSS público de cada canal (sin claves) y lo
// que no esté en el índice se incorpora con una categoría asignada por su título.

import fs from 'node:fs';
import { html, crudo, icono, migas, vacio, compartir } from './comun.js';
import { documento, encabezado } from './layout.js';
import { fecha } from '../../src/util.js';
import { PALETA } from './trekking.js';

const RUTA = new URL('../../contenido/videos/indice.json', import.meta.url);
export const BASE = '/videos/';
const POR_PAGINA = 24;
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const miles = (n) => Number(n || 0).toLocaleString('es-CL');
export const mini = (id, calidad = 'mqdefault') => `https://i.ytimg.com/vi/${id}/${calidad}.jpg`;
const TIPOS = { video: 'Videos', short: 'Shorts', transmision_en_vivo: 'Transmisiones en vivo' };
const ORDENES = { recientes: 'Más recientes', antiguos: 'Más antiguos', vistos: 'Más vistos', largos: 'Más largos' };

// Categoría de un video nuevo a partir de su título (los del índice ya traen la suya).
const REGLAS = [
  [/concejo|sesion (ordinaria|extraordinaria)/, 'concejo-municipal'], [/cuenta publica/, 'cuenta-publica'], [/baqueano/, 'fiesta-del-baqueano'], [/aniversario/, 'aniversario-melipeuco'],
  [/fiestas? patrias|dieciocho|18 de septiembre|desfile|glorias navales|21 de mayo/, 'fiestas-patrias'], [/radio/, 'radio'], [/salud|cesfam|vacuna|posta/, 'salud'],
  [/escuela|liceo|educaci|jardin|estudiantes/, 'educacion'], [/recicla|medio ambiente|ambiental|residuos/, 'medio-ambiente'], [/navidad|teleton|solidari/, 'navidad-teleton'],
  [/emergencia|seguridad|bomberos|carabineros|incendio|nevazon|volcan llaima alerta/, 'seguridad-emergencias'], [/mapuche|we tripantu|intercultural|machi|nguillatun/, 'cultura-mapuche'],
  [/deport|campeonato|trekking|carrera|futbol|cicl/, 'deportes'], [/obra|pavimen|construcci|inaugura|camino|puente/, 'obras-infraestructura'],
  [/turismo|laguna|conguillio|parque nacional|sendero/, 'turismo-naturaleza'], [/fiesta de la|feria|costumbr|esquila|lana|mosqueta|san juan|trilla/, 'fiestas-costumbristas'],
  [/musica|concierto|orquesta|show|teatro|danza/, 'musica-espectaculos'], [/agricol|productiv|emprend|prodesal|campesin/, 'desarrollo-productivo'],
  [/alcalde|autoridad|ministr|delegad|gobernador|senador|diputad/, 'institucional-autoridades'], [/social|adulto mayor|vivienda|habitabilidad|subsidio/, 'social-comunidad'],
];
export const categorizar = (titulo) => (REGLAS.find(([r]) => r.test(norm(titulo))) || [null, 'noticias'])[1];

// ------------------------------------------------------------------ Datos
let base = null, baseMtime = 0, nuevos = [], ultimaRevision = 0, revisando = null, cache = null;
function cargarBase() {
  let st;
  try { st = fs.statSync(RUTA); } catch { return null; }
  if (!base || st.mtimeMs !== baseMtime) { base = JSON.parse(fs.readFileSync(RUTA, 'utf8')); baseMtime = st.mtimeMs; cache = null; }
  return base;
}

export function indice() {
  const b = cargarBase();
  if (!b) return null;
  if (cache) return cache;
  const existentes = new Set(b.videos.map((v) => v.id));
  const todos = [...nuevos.filter((v) => !existentes.has(v.id)), ...b.videos];
  todos.sort((x, y) => (y.f || '').localeCompare(x.f || ''));
  const cats = new Map(b.categorias.map((c, i) => [c.id, { ...c, color: PALETA[i % PALETA.length].color, total: 0, vistas: 0 }]));
  const porId = new Map();
  const anios = {};
  for (const v of todos) {
    v.anio = Number((v.fe || v.f || '').slice(0, 4)) || null;
    v.busca = norm(`${v.t} ${v.d} ${cats.get(v.c)?.nombre || ''} ${(v.cs || []).map((c) => cats.get(c)?.nombre || '').join(' ')} ${v.anio || ''}`);
    porId.set(v.id, v);
    const c = cats.get(v.c); if (c) { c.total++; c.vistas += v.v || 0; }
    if (v.anio) anios[v.anio] = (anios[v.anio] || 0) + 1;
  }
  const listas = new Map(b.listas.map((l) => [l.id, l]));
  cache = { ...b, videos: todos, porId, cats, listas, anios: Object.keys(anios).map(Number).sort((a, c) => c - a), porAnio: anios, canalesPorHandle: new Map(b.canales.map((c) => [c.handle, c])) };
  return cache;
}

// Videos nuevos desde el RSS público de cada canal (se espera sólo si nunca se revisó).
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const dec = (s) => String(s || '').replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENT[m]);
async function revisarCanales() {
  const b = cargarBase();
  if (!b) return;
  const encontrados = [];
  await Promise.all(b.canales.filter((c) => c.id).map(async (c) => {
    try {
      const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(c.id)}`, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) return;
      const xml = await r.text();
      for (const e of xml.split('<entry>').slice(1)) {
        const id = /<yt:videoId>([\w-]{11})</.exec(e)?.[1];
        if (!id) continue;
        const titulo = dec(/<title>([^<]*)</.exec(e)?.[1] || '').replace(/\s*[-–|]\s*Municipalidad de Melipeuco\s*$/i, '').trim();
        const desc = dec(/<media:description>([\s\S]*?)<\/media:description>/.exec(e)?.[1] || '').split('\n').filter((l) => !/visita nuestra|facebook|instagram/i.test(l)).join('\n').trim().slice(0, 900);
        const vistas = Number(/<media:statistics views="(\d+)"/.exec(e)?.[1] || 0);
        const corto = /\/shorts\//.test(/<link rel="alternate" href="([^"]+)"/.exec(e)?.[1] || '');
        const m = /(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre),? (?:de |del )?(20\d\d)/i.exec(titulo);
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const fe = m ? `${m[3]}-${String(meses.indexOf(m[2].toLowerCase()) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
        encontrados.push({ id, t: titulo, d: desc, c: categorizar(titulo), cs: [], e: c.handle === '@CANAL3MELIPEUCO' ? 'archivo-historico-canal3' : 'canal-oficial-actual', ch: c.handle, tp: corto ? 'short' : 'video', f: /<published>([^<]+)</.exec(e)?.[1] || '', fe, s: 0, v: vistas, fm: corto ? 'v' : 'h', l: [], nuevo: true });
      }
    } catch { /* sin conexión: se usa lo que hay */ }
  }));
  if (encontrados.length) { nuevos = encontrados; cache = null; }
}
export async function prepararVideos() {
  if (Date.now() - ultimaRevision < 30 * 60e3) return;
  if (!revisando) revisando = revisarCanales().finally(() => { ultimaRevision = Date.now(); revisando = null; });
  if (!ultimaRevision) await Promise.race([revisando, new Promise((r) => setTimeout(r, 2500))]);
}

export function filtrarVideos(ix, { q = '', categoria = '', anio = '', canal = '', tipo = '', orden = 'recientes' } = {}, limite = Infinity) {
  const p = norm(q).split(/\s+/).filter((x) => x.length > 1);
  let r = ix.videos.filter((v) => (!categoria || v.c === categoria || (v.cs || []).includes(categoria)) && (!anio || String(v.anio) === String(anio)) && (!canal || v.e === canal) && (!tipo || v.tp === tipo) && (!p.length || p.every((x) => v.busca.includes(x))));
  if (orden === 'antiguos') r = [...r].reverse();
  else if (orden === 'vistos') r = [...r].sort((a, b) => (b.v || 0) - (a.v || 0));
  else if (orden === 'largos') r = [...r].sort((a, b) => (b.s || 0) - (a.s || 0));
  return r.slice(0, limite);
}
export const buscarVideos = (q, limite = 6) => { const ix = indice(); return ix ? filtrarVideos(ix, { q }, limite) : []; };

// ------------------------------------------------------------------ Piezas
const duracion = (s) => { if (!s) return ''; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
const fechaDe = (v) => fecha((v.fe || v.f || '').slice(0, 10), { largo: true });
export const urlVideo = (v) => `${BASE}${v.id}/`;

export function tarjetaVideo(ix, v, { grande = false } = {}) {
  const c = ix.cats.get(v.c);
  return html`<a class="vd-tarjeta${grande ? ' vd-grande' : ''}${v.fm === 'v' ? ' vd-vertical' : ''}" href="${urlVideo(v)}" style="--c:${c?.color || 'var(--azul)'}">
    <span class="vd-mini"><img src="${mini(v.id, grande ? 'hqdefault' : 'mqdefault')}" alt="" loading="lazy" decoding="async" data-mini="${v.id}">
      <span class="vd-play" aria-hidden="true">${crudo(icono('play', { tam: grande ? 30 : 22 }))}</span>
      ${v.s ? html`<span class="vd-dur">${duracion(v.s)}</span>` : ''}
      ${v.tp === 'transmision_en_vivo' ? html`<span class="vd-marca vd-vivo">Transmisión</span>` : v.tp === 'short' ? html`<span class="vd-marca">Short</span>` : v.e === 'archivo-historico-canal3' ? html`<span class="vd-marca vd-archivo">Archivo Canal 3</span>` : v.nuevo ? html`<span class="vd-marca vd-nuevo">Nuevo</span>` : ''}
    </span>
    <span class="vd-info"><span class="vd-cat">${c?.nombre || 'Video'}</span><b>${v.t}</b><small>${fechaDe(v)}${v.v ? html` · ${miles(v.v)} ${v.v === 1 ? 'vista' : 'vistas'}` : ''}</small></span>
  </a>`;
}
const fila = (ix, titulo, lista, enlace = '', extra = '') => (lista.length ? html`<section class="vd-fila"><div class="vd-fila-cab"><h2>${titulo}</h2>${extra}${enlace ? html`<a class="ver-todo" href="${enlace}">Ver todos</a>` : ''}</div><div class="vd-carril">${lista.map((v) => tarjetaVideo(ix, v))}</div></section>` : '');

function formulario(ix, f) {
  const op = (lista, v) => lista.map(([k, t]) => html`<option value="${k}"${String(k) === String(v) ? crudo(' selected') : ''}>${t}</option>`);
  return html`<form class="ar-filtros vd-filtros" method="get" action="${BASE}" role="search">
    <div class="ar-buscar"><label for="vd-q" class="sr">Buscar videos</label>${crudo(icono('buscar', { tam: 20 }))}<input id="vd-q" name="q" type="search" value="${f.q}" placeholder="Buscar videos: concejo, aniversario, baqueano, 2016…" autocomplete="off"><button class="boton boton-primario" type="submit">Buscar</button></div>
    <div class="ar-selectores">
      <label><span>Categoría</span><select name="categoria" data-auto-enviar><option value="">Todas</option>${op([...ix.cats.values()].filter((c) => c.total).sort((a, b) => b.total - a.total).map((c) => [c.id, `${c.nombre} (${c.total})`]), f.categoria)}</select></label>
      <label><span>Año</span><select name="anio" data-auto-enviar><option value="">Todos</option>${op(ix.anios.map((a) => [a, `${a} (${ix.porAnio[a]})`]), f.anio)}</select></label>
      <label><span>Canal</span><select name="canal" data-auto-enviar><option value="">Todos</option>${op([['canal-oficial-actual', 'Canal oficial (2021 a hoy)'], ['archivo-historico-canal3', 'Archivo Canal 3 (2010–2017)']], f.canal)}</select></label>
      <label><span>Tipo</span><select name="tipo" data-auto-enviar><option value="">Todos</option>${op(Object.entries(TIPOS), f.tipo)}</select></label>
      <label><span>Ordenar</span><select name="orden" data-auto-enviar>${op(Object.entries(ORDENES), f.orden)}</select></label>
      ${Object.entries(f).some(([k, v]) => v && !(k === 'orden' && v === 'recientes')) ? html`<a class="ver-todo" href="${BASE}">Quitar filtros</a>` : ''}
    </div>
  </form>`;
}

// ------------------------------------------------------------------ Páginas
export function paginaVideos(ctx, filtros = {}, pagina = 1) {
  const ix = indice();
  if (!ix) return null;
  const f = { q: String(filtros.q || '').slice(0, 100), categoria: ix.cats.has(filtros.categoria) ? filtros.categoria : '', anio: /^\d{4}$/.test(filtros.anio || '') ? filtros.anio : '', canal: ['canal-oficial-actual', 'archivo-historico-canal3'].includes(filtros.canal) ? filtros.canal : '', tipo: TIPOS[filtros.tipo] ? filtros.tipo : '', orden: ORDENES[filtros.orden] ? filtros.orden : 'recientes' };
  const hayFiltro = f.q || f.categoria || f.anio || f.canal || f.tipo || f.orden !== 'recientes';
  const cat = f.categoria ? ix.cats.get(f.categoria) : null;
  const titulo = cat ? cat.nombre : 'Videos de Melipeuco';
  let cuerpo;
  if (hayFiltro) {
    const r = filtrarVideos(ix, f);
    const paginas = Math.max(1, Math.ceil(r.length / POR_PAGINA)), p = Math.min(Math.max(1, pagina), paginas);
    const qs = (n) => '?' + Object.entries({ ...f, orden: f.orden === 'recientes' ? '' : f.orden, p: n > 1 ? n : '' }).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    cuerpo = html`<p class="resultado-conteo" role="status">${miles(r.length)} ${r.length === 1 ? 'video' : 'videos'}${f.q ? html` para «${f.q}»` : ''}.</p>
      ${r.length ? html`<div class="vd-grilla">${r.slice((p - 1) * POR_PAGINA, p * POR_PAGINA).map((v) => tarjetaVideo(ix, v))}</div>
        ${paginas > 1 ? html`<nav class="paginacion" aria-label="Paginación">${p > 1 ? html`<a href="${BASE}${qs(p - 1)}" rel="prev">Anterior</a>` : ''}<span aria-current="page">Página ${p} de ${paginas}</span>${p < paginas ? html`<a href="${BASE}${qs(p + 1)}" rel="next">Siguiente</a>` : ''}</nav>` : ''}`
      : vacio('No encontramos videos con esos filtros. Pruebe con otra palabra o quite algún filtro.', 'buscar')}`;
  } else {
    const [primero, ...resto] = ix.videos.filter((v) => v.tp !== 'short');
    const cats = [...ix.cats.values()].filter((c) => c.total).sort((a, b) => b.total - a.total);
    cuerpo = html`
      <section class="vd-destacado">
        <div class="vd-destacado-video">${reproductor(primero)}</div>
        <div class="vd-destacado-info"><span class="vd-cat" style="--c:${ix.cats.get(primero.c)?.color}">${ix.cats.get(primero.c)?.nombre}</span><h2><a href="${urlVideo(primero)}">${primero.t}</a></h2><p class="meta">${fechaDe(primero)}${primero.s ? ` · ${duracion(primero.s)}` : ''}</p>
          <ul class="vd-siguientes">${resto.slice(0, 4).map((v) => html`<li><a href="${urlVideo(v)}"><img src="${mini(v.id, 'default')}" alt="" loading="lazy"><span><b>${v.t}</b><small>${fechaDe(v)}</small></span></a></li>`)}</ul></div>
      </section>
      <nav class="vd-categorias" aria-label="Categorías de videos">${cats.map((c) => html`<a class="vd-chip" href="${BASE}?categoria=${c.id}" style="--c:${c.color}">${c.nombre}<small>${c.total}</small></a>`)}</nav>
      ${fila(ix, 'Sesiones del Concejo Municipal', ix.videos.filter((v) => v.c === 'concejo-municipal').slice(0, 10), `${BASE}?categoria=concejo-municipal`)}
      ${fila(ix, 'Lo último', resto.filter((v) => v.c !== 'concejo-municipal').slice(0, 10), `${BASE}?orden=recientes&tipo=video`)}
      ${fila(ix, 'Los más vistos', filtrarVideos(ix, { orden: 'vistos' }, 10), `${BASE}?orden=vistos`)}
      ${fila(ix, 'Shorts', ix.videos.filter((v) => v.tp === 'short').slice(0, 10), `${BASE}?tipo=short`)}
      ${fila(ix, 'Archivo histórico Canal 3 / Canal 12 Melivisión (2010–2017)', filtrarVideos(ix, { canal: 'archivo-historico-canal3', orden: 'vistos' }, 10), `${BASE}?canal=archivo-historico-canal3`)}
      <section class="vd-fila"><div class="vd-fila-cab"><h2>Listas de reproducción</h2></div><div class="vd-listas">${ix.listas.size ? [...ix.listas.values()].filter((l) => l.videos.length > 1).sort((a, b) => b.videos.length - a.videos.length).map((l) => html`<a class="vd-lista" href="${BASE}lista/${l.id}/"><span class="vd-mini"><img src="${mini(l.mini)}" alt="" loading="lazy"><span class="vd-lista-n">${l.videos.length} videos</span></span><b>${l.t}</b></a>`) : ''}</div></section>
      <section class="vd-fila"><div class="vd-fila-cab"><h2>Por año</h2></div><div class="chips ar-anios">${ix.anios.map((a) => html`<a class="chip" href="${BASE}?anio=${a}">${a} <small>${ix.porAnio[a]}</small></a>`)}</div></section>
      <section class="vd-canales">${ix.canales.filter((c) => c.handle !== '@municipalidaddemelipeuco8051').map((c) => html`<a class="vd-canal" href="${c.url}" target="_blank" rel="noopener">${c.avatar ? html`<img src="${c.avatar.replace(/=s\d+-/, '=s96-')}" alt="" loading="lazy">` : ''}<span><b>${c.nombre}</b><small>${c.historico && c.historico !== c.nombre ? c.historico + ' · ' : ''}${miles(c.suscriptores)} suscriptores</small></span><span class="boton boton-secundario">Ver en YouTube</span></a>`)}</section>`;
  }
  return documento(ctx, {
    titulo: `${titulo} — Videos`, descripcion: cat ? cat.descripcion : 'Videos de la Municipalidad de Melipeuco: sesiones del Concejo, aniversarios, fiestas, obras, turismo y el archivo histórico de Canal 3.', canonical: cat ? `${BASE}?categoria=${cat.id}` : BASE,
    cuerpo: html`${encabezado({ titulo, bajada: cat ? cat.descripcion : `${miles(ix.videos.length)} videos de la Municipalidad y del archivo histórico de Canal 3 Melipeuco: sesiones del Concejo, fiestas, obras, turismo y mucho más.`, migas: migas([{ texto: 'Noticias', url: '/noticias/' }, { texto: 'Videos', url: cat ? BASE : '' }, ...(cat ? [{ texto: cat.nombre }] : [])]), ctx })}
      <div class="contenedor videoteca">${formulario(ix, f)}${cuerpo}</div>`,
  });
}

function reproductor(v) {
  return html`<div class="video vd-reproductor${v.fm === 'v' ? ' vd-vertical' : ''}" data-youtube="${v.id}"><button type="button" class="video-play" aria-label="Reproducir: ${v.t}">
    <img src="${mini(v.id, 'hqdefault')}" alt="" data-mini="${v.id}" data-calidad="maxresdefault"><span>${crudo(icono('play', { tam: 34 }))}</span></button>
    <noscript><a href="https://www.youtube.com/watch?v=${v.id}">Ver en YouTube</a></noscript></div>`;
}

const parrafos = (t) => String(t || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
export function fichaVideo(ctx, id) {
  const ix = indice();
  const v = ix?.porId.get(id);
  if (!v) return null;
  const c = ix.cats.get(v.c);
  const enListas = (v.l || []).map((l) => ix.listas.get(l)).filter(Boolean);
  const misma = ix.videos.filter((x) => x.c === v.c);
  const i = misma.indexOf(v);
  const relacionados = [...misma.slice(i + 1, i + 7), ...misma.slice(Math.max(0, i - 3), i)].filter((x) => x !== v).slice(0, 8);
  const url = ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + urlVideo(v);
  const canal = ix.canalesPorHandle.get(v.ch);
  const iso = (v.f || '').length > 10 ? v.f : `${v.f}T12:00:00Z`;
  const ld = { '@context': 'https://schema.org', '@type': 'VideoObject', name: v.t, description: (v.d || v.t).slice(0, 300), thumbnailUrl: [mini(v.id, 'hqdefault'), mini(v.id, 'maxresdefault')], uploadDate: iso, ...(v.s ? { duration: `PT${Math.floor(v.s / 60)}M${v.s % 60}S` } : {}), embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`, ...(v.v ? { interactionStatistic: { '@type': 'InteractionCounter', interactionType: { '@type': 'WatchAction' }, userInteractionCount: v.v } } : {}) };
  return documento(ctx, {
    titulo: v.t, descripcion: (v.d || `${c?.nombre || 'Video'} · ${fechaDe(v)} · Municipalidad de Melipeuco`).slice(0, 160), imagen: mini(v.id, 'hqdefault'), tipoOg: 'video.other', jsonLd: ld,
    cuerpo: html`<div class="contenedor vd-ficha">
      ${migas([{ texto: 'Noticias', url: '/noticias/' }, { texto: 'Videos', url: BASE }, ...(c ? [{ texto: c.nombre, url: `${BASE}?categoria=${c.id}` }] : []), { texto: v.t }])}
      <div class="vd-ficha-rejilla">
        <article>
          ${reproductor(v)}
          <h1 class="vd-titulo">${v.t}</h1>
          <p class="insignias">
            ${c ? html`<a class="vd-cat" href="${BASE}?categoria=${c.id}" style="--c:${c.color}">${c.nombre}</a>` : ''}
            <span class="insignia">${crudo(icono('calendario', { tam: 14 }))} ${v.fe ? `Grabado el ${fecha(v.fe, { largo: true })}` : `Publicado el ${fechaDe(v)}`}</span>
            ${v.s ? html`<span class="insignia">${crudo(icono('reloj', { tam: 14 }))} ${duracion(v.s)}</span>` : ''}
            ${v.v ? html`<span class="insignia">${crudo(icono('grafico', { tam: 14 }))} ${miles(v.v)} ${v.v === 1 ? 'vista' : 'vistas'}</span>` : ''}
            ${(v.cs || []).map((x) => ix.cats.get(x)).filter(Boolean).map((x) => html`<a class="insignia" href="${BASE}?categoria=${x.id}">${x.nombre}</a>`)}
          </p>
          ${v.d ? html`<div class="prosa vd-descripcion">${parrafos(v.d).map((p) => html`<p>${p.split('\n').map((l, k) => html`${k ? crudo('<br>') : ''}${l}`)}</p>`)}</div>` : ''}
          <p class="vd-acciones"><a class="boton boton-secundario" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">${crudo(icono('video', { tam: 18 }))} Ver en YouTube</a>${canal ? html` <a class="ver-todo" href="${canal.url}" target="_blank" rel="noopener">Canal: ${canal.nombre}</a>` : ''}</p>
          ${enListas.length ? html`<p class="meta">En las listas: ${enListas.map((l, k) => html`${k ? ', ' : ''}<a href="${BASE}lista/${l.id}/">${l.t}</a>`)}</p>` : ''}
          ${compartir(url, v.t)}
        </article>
        <aside class="vd-relacionados"><h2>Más de ${c?.nombre || 'esta categoría'}</h2><div class="vd-lista-lateral">${relacionados.map((x) => tarjetaVideo(ix, x))}</div>${c ? html`<a class="ver-todo" href="${BASE}?categoria=${c.id}">Todos los videos de ${c.nombre}</a>` : ''}</aside>
      </div>
    </div>`,
  });
}

export function paginaLista(ctx, id) {
  const ix = indice();
  const l = ix?.listas.get(id);
  if (!l) return null;
  const vids = l.videos.map((x) => ix.porId.get(x)).filter(Boolean);
  return documento(ctx, {
    titulo: `${l.t} — Videos`, descripcion: `Lista de reproducción: ${l.t}. Videos de la Municipalidad de Melipeuco.`,
    cuerpo: html`${encabezado({ titulo: l.t, bajada: `Lista de reproducción · ${vids.length} ${vids.length === 1 ? 'video' : 'videos'}`, migas: migas([{ texto: 'Noticias', url: '/noticias/' }, { texto: 'Videos', url: BASE }, { texto: l.t }]), ctx })}
      <div class="contenedor videoteca">${vids.length ? html`<div class="vd-grilla">${vids.map((v) => tarjetaVideo(ix, v))}</div>` : vacio('Esta lista no tiene videos disponibles.', 'video')}</div>`,
  });
}

// Bloques para otras páginas.
export function seccionVideosPortada(titulo = 'Videos de Melipeuco') {
  const ix = indice();
  if (!ix) return '';
  // El más reciente y, a su lado, lo último de otras categorías (para que no sean sólo sesiones).
  const largos = ix.videos.filter((v) => v.tp !== 'short');
  const ult = [largos[0], ...largos.slice(1).filter((v) => v.c !== largos[0]?.c).slice(0, 3)].filter(Boolean);
  const cats = [...ix.cats.values()].filter((c) => c.total).sort((a, b) => b.total - a.total).slice(0, 8);
  return html`<section class="seccion seccion-videoteca"><div class="contenedor">
    <div class="seccion-cabecera"><div><h2>${titulo}</h2><p>Sesiones del Concejo, fiestas, obras y el archivo histórico de Canal 3.</p></div><a class="ver-todo" href="${BASE}">Todos los videos</a></div>
    <div class="vd-grilla vd-portada">${ult.map((v, i) => tarjetaVideo(ix, v, { grande: i === 0 }))}</div>
    <nav class="vd-categorias" aria-label="Categorías de videos">${cats.map((c) => html`<a class="vd-chip" href="${BASE}?categoria=${c.id}" style="--c:${c.color}">${c.nombre}<small>${c.total}</small></a>`)}</nav>
  </div></section>`;
}
export function franjaVideos(titulo, { categoria = '', excluir = '', cantidad = 4, enlace = BASE } = {}) {
  const ix = indice();
  if (!ix) return '';
  const lista = ix.videos.filter((v) => v.tp !== 'short' && (!categoria || v.c === categoria) && (!excluir || v.c !== excluir)).slice(0, cantidad);
  return lista.length ? html`<section class="vd-franja"><div class="vd-fila-cab"><h2>${titulo}</h2><a class="ver-todo" href="${enlace}">Ver todos</a></div><div class="vd-grilla vd-compacta">${lista.map((v) => tarjetaVideo(ix, v))}</div></section>` : '';
}
// Video del Concejo grabado en una fecha (para la ficha de cada sesión).
export function videoDeSesion(fechaIso) {
  const ix = indice();
  const dia = String(fechaIso || '').slice(0, 10);
  return ix && dia ? ix.videos.find((v) => v.c === 'concejo-municipal' && v.fe === dia) || null : null;
}
export const reproductorVideo = reproductor;
export const urlsVideos = () => { const ix = indice(); return ix ? ix.videos.map((v) => ({ u: urlVideo(v), m: v.f })) : []; };
