// Fototeca de Melipeuco: los álbumes de fotos publicados en la página de Facebook de la
// Municipalidad (2013 a hoy), ordenados por categoría y año, con buscador y una página propia
// para cada álbum. Las fotos se sirven desde /img/facebook/; los datos vienen de
// contenido/facebook/albumes.json. Cada álbum indica también las áreas municipales con las que
// se relaciona, para mostrar sus fotos en el micrositio correspondiente.

import fs from 'node:fs';
import { html, crudo, icono, migas, vacio, compartir } from './comun.js';
import { documento, encabezado } from './layout.js';
import { fecha } from '../../src/util.js';
import { PALETA } from './trekking.js';

const RUTA = new URL('../../contenido/facebook/albumes.json', import.meta.url);
export const BASE = '/fotos/';
const POR_PAGINA = 24;
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

let base = null, baseMtime = 0, cache = null;
export function indice() {
  let st;
  try { st = fs.statSync(RUTA); } catch { return null; }
  if (!base || st.mtimeMs !== baseMtime) { base = JSON.parse(fs.readFileSync(RUTA, 'utf8')); baseMtime = st.mtimeMs; cache = null; }
  if (cache) return cache;
  const cats = new Map(base.categorias.map((c, i) => [c.id, { ...c, color: PALETA[i % PALETA.length].color, total: 0 }]));
  const porSlug = new Map(), porAnio = {};
  const albumes = base.albumes.filter((a) => a.fotos.length || a.descripcion);
  for (const a of albumes) {
    a.anio = Number(a.fecha.slice(0, 4));
    a.busca = norm(`${a.titulo} ${a.descripcion} ${cats.get(a.categoria)?.nombre || ''} ${a.anio}`);
    porSlug.set(a.slug, a);
    porAnio[a.anio] = (porAnio[a.anio] || 0) + 1;
    const c = cats.get(a.categoria); if (c) c.total++;
  }
  cache = { albumes, cats, porSlug, porAnio, anios: Object.keys(porAnio).sort().reverse(), fotos: albumes.reduce((n, a) => n + a.fotos.length, 0) };
  return cache;
}

export const urlAlbum = (a) => `${BASE}${a.slug}/`;
const parrafos = (t) => String(t || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);

function tarjetaAlbum(ctx, ix, a) {
  const c = ix.cats.get(a.categoria);
  return html`<a class="ft-tarjeta" href="${urlAlbum(a)}">
    <span class="ft-portada">${a.fotos[0] ? ctx.img.imagen(a.fotos[0], { alt: '', sizes: '(max-width: 600px) 50vw, 300px' }) : html`<span class="ft-sin-foto">${crudo(icono('camara', { tam: 34 }))}</span>`}
      ${a.fotos.length > 1 ? html`<span class="ft-n">${crudo(icono('camara', { tam: 14 }))} ${a.fotos.length}</span>` : ''}</span>
    <span class="ft-info"><span class="vd-cat" style="--c:${c?.color}">${c?.nombre || 'Fotos'}</span><b>${a.titulo}</b><small>${fecha(a.fecha, { largo: true })}</small></span>
  </a>`;
}

function filtrar(ix, f) {
  const q = norm(f.q).split(/\s+/).filter(Boolean);
  return ix.albumes.filter((a) => (!f.categoria || a.categoria === f.categoria) && (!f.anio || String(a.anio) === f.anio) && q.every((p) => a.busca.includes(p)));
}

export function paginaFotos(ctx, filtros = {}, pagina = 1) {
  const ix = indice();
  if (!ix) return null;
  const f = { q: String(filtros.q || '').slice(0, 100), categoria: ix.cats.has(filtros.categoria) ? filtros.categoria : '', anio: ix.porAnio[filtros.anio] ? filtros.anio : '' };
  const cat = f.categoria ? ix.cats.get(f.categoria) : null;
  const r = filtrar(ix, f);
  const paginas = Math.max(1, Math.ceil(r.length / POR_PAGINA)), p = Math.min(Math.max(1, pagina), paginas);
  const qs = (n) => '?' + Object.entries({ ...f, p: n > 1 ? n : '' }).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const op = (lista, v) => lista.map(([k, t]) => html`<option value="${k}"${String(k) === String(v) ? crudo(' selected') : ''}>${t}</option>`);
  const titulo = cat ? cat.nombre : 'Fotos de Melipeuco';
  const cats = [...ix.cats.values()].filter((c) => c.total);
  return documento(ctx, {
    titulo: `${titulo} — Fotos`, descripcion: 'Álbumes de fotos de la Municipalidad de Melipeuco: aniversarios, Fiesta del Baqueano, fiestas costumbristas, educación, deporte, cultura y gestión municipal desde 2013.',
    canonical: cat ? `${BASE}?categoria=${cat.id}` : BASE,
    cuerpo: html`${encabezado({ titulo, bajada: `${ix.albumes.length} álbumes y ${ix.fotos} fotos de las actividades de la comuna desde ${ix.anios.at(-1)}.`, migas: migas([{ texto: 'Noticias', url: '/noticias/' }, { texto: 'Fotos', url: cat ? BASE : '' }, ...(cat ? [{ texto: cat.nombre }] : [])]), ctx })}
      <div class="contenedor videoteca fototeca">
        <nav class="pestanas-noticias" aria-label="Noticias, fotos y videos"><a href="/noticias/">${crudo(icono('megafono', { tam: 18 }))} Noticias</a><a href="${BASE}" aria-current="page">${crudo(icono('camara', { tam: 18 }))} Fotos</a><a href="/videos/">${crudo(icono('video', { tam: 18 }))} Videos</a></nav>
        <form class="ar-filtros vd-filtros" method="get" action="${BASE}" role="search">
          <div class="ar-buscar"><label for="ft-q" class="sr">Buscar álbumes</label>${crudo(icono('buscar', { tam: 20 }))}<input id="ft-q" name="q" type="search" value="${f.q}" placeholder="Buscar fotos: baqueano, cueca, desfile, 2014…" autocomplete="off"><button class="boton boton-primario" type="submit">Buscar</button></div>
          <div class="ar-selectores">
            <label><span>Categoría</span><select name="categoria" data-auto-enviar><option value="">Todas</option>${op(cats.map((c) => [c.id, `${c.nombre} (${c.total})`]), f.categoria)}</select></label>
            <label><span>Año</span><select name="anio" data-auto-enviar><option value="">Todos</option>${op(ix.anios.map((a) => [a, `${a} (${ix.porAnio[a]})`]), f.anio)}</select></label>
            ${f.q || f.categoria || f.anio ? html`<a class="ver-todo" href="${BASE}">Quitar filtros</a>` : ''}
          </div>
        </form>
        <nav class="vd-categorias" aria-label="Categorías de fotos">${cats.map((c) => html`<a class="vd-chip" href="${BASE}?categoria=${c.id}" style="--c:${c.color}"${c.id === f.categoria ? crudo(' aria-current="page"') : ''}>${c.nombre}<small>${c.total}</small></a>`)}</nav>
        <p class="resultado-conteo" role="status">${r.length} ${r.length === 1 ? 'álbum' : 'álbumes'}${f.q ? html` para «${f.q}»` : ''}.</p>
        ${r.length ? html`<div class="ft-grilla">${r.slice((p - 1) * POR_PAGINA, p * POR_PAGINA).map((a) => tarjetaAlbum(ctx, ix, a))}</div>
          ${paginas > 1 ? html`<nav class="paginacion" aria-label="Paginación">${p > 1 ? html`<a href="${BASE}${qs(p - 1)}" rel="prev">Anterior</a>` : ''}<span aria-current="page">Página ${p} de ${paginas}</span>${p < paginas ? html`<a href="${BASE}${qs(p + 1)}" rel="next">Siguiente</a>` : ''}</nav>` : ''}`
        : vacio('No encontramos álbumes con esos filtros. Pruebe con otra palabra o quite algún filtro.', 'buscar')}
        <section class="vd-fila"><div class="vd-fila-cab"><h2>Por año</h2></div><div class="chips ar-anios">${ix.anios.map((a) => html`<a class="chip" href="${BASE}?anio=${a}">${a} <small>${ix.porAnio[a]}</small></a>`)}</div></section>
      </div>`,
  });
}

export function fichaAlbum(ctx, slug) {
  const ix = indice();
  const a = ix?.porSlug.get(slug);
  if (!a) return null;
  const c = ix.cats.get(a.categoria);
  const misma = ix.albumes.filter((x) => x.categoria === a.categoria && x !== a);
  const relacionados = [...misma.filter((x) => x.anio === a.anio), ...misma.filter((x) => x.anio !== a.anio)].slice(0, 8);
  const url = ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + urlAlbum(a);
  const ld = { '@context': 'https://schema.org', '@type': 'ImageGallery', name: a.titulo, datePublished: a.fecha, image: a.fotos.map((s) => ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + s) };
  return documento(ctx, {
    titulo: `${a.titulo} — Fotos`, descripcion: (a.descripcion || `${c?.nombre || 'Fotos'} · ${fecha(a.fecha, { largo: true })} · Municipalidad de Melipeuco`).slice(0, 160), imagen: a.fotos[0], jsonLd: ld,
    cuerpo: html`<div class="contenedor ft-ficha">
      ${migas([{ texto: 'Noticias', url: '/noticias/' }, { texto: 'Fotos', url: BASE }, ...(c ? [{ texto: c.nombre, url: `${BASE}?categoria=${c.id}` }] : []), { texto: a.titulo }])}
      <article>
        <h1 class="vd-titulo">${a.titulo}</h1>
        <p class="insignias">
          ${c ? html`<a class="vd-cat" href="${BASE}?categoria=${c.id}" style="--c:${c.color}">${c.nombre}</a>` : ''}
          <span class="insignia">${crudo(icono('calendario', { tam: 14 }))} ${fecha(a.fecha, { largo: true })}</span>
          ${a.fotos.length ? html`<span class="insignia">${crudo(icono('camara', { tam: 14 }))} ${a.fotos.length} ${a.fotos.length === 1 ? 'foto' : 'fotos'}</span>` : ''}
        </p>
        ${a.descripcion ? html`<div class="prosa">${parrafos(a.descripcion).map((p) => html`<p>${p}</p>`)}</div>` : ''}
        ${a.fotos.length ? html`<div class="galeria ft-galeria" data-galeria>${a.fotos.map((s, i) => html`<a href="${s}" class="galeria-item" data-lightbox>${ctx.img.imagen(s, { alt: `${a.titulo} (foto ${i + 1})`, sizes: '(max-width: 700px) 100vw, 420px', prioridad: i === 0 })}</a>`)}</div>` : ''}
        <p class="meta">Selección de fotos publicadas en la página de Facebook de la Municipalidad.</p>
        ${compartir(url, a.titulo)}
      </article>
      ${relacionados.length ? html`<section class="vd-fila"><div class="vd-fila-cab"><h2>Más de ${c?.nombre || 'esta categoría'}</h2><a class="ver-todo" href="${BASE}?categoria=${a.categoria}">Ver todos</a></div><div class="ft-grilla">${relacionados.map((x) => tarjetaAlbum(ctx, ix, x))}</div></section>` : ''}
    </div>`,
  });
}

// Fotos de un área municipal (para su micrositio) o de una categoría.
export function franjaFotos(ctx, titulo, { area = '', categoria = '', cantidad = 4 } = {}) {
  const ix = indice();
  if (!ix) return '';
  const lista = ix.albumes.filter((a) => a.fotos.length && (!area || (a.areas || []).includes(area)) && (!categoria || a.categoria === categoria)).slice(0, cantidad);
  const enlace = categoria ? `${BASE}?categoria=${categoria}` : BASE;
  return lista.length ? html`<section class="vd-franja ft-franja"><div class="vd-fila-cab"><h2>${titulo}</h2><a class="ver-todo" href="${enlace}">Ver todas las fotos</a></div><div class="ft-grilla ft-compacta">${lista.map((a) => tarjetaAlbum(ctx, ix, a))}</div></section>` : '';
}

export function buscarAlbumes(q, n = 8) {
  const ix = indice();
  const p = norm(q).split(/\s+/).filter(Boolean);
  return ix && p.length ? ix.albumes.filter((a) => p.every((x) => a.busca.includes(x))).slice(0, n) : [];
}
export const tarjeta = tarjetaAlbum;
export const urlsFotos = () => { const ix = indice(); return ix ? ix.albumes.map((a) => ({ u: urlAlbum(a), m: a.fecha })) : []; };
