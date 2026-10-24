#!/usr/bin/env node
// Importador del sitio WordPress actual (https://municipalidadmelipeuco.cl) hacia el sitio nuevo.
//
// Lee por la API REST pública de WordPress: categorías, etiquetas, medios, noticias, páginas
// (Elementor, WPBakery y Gutenberg), eventos (Modern Events Calendar) y extrae además las
// transmisiones del Concejo y el directorio telefónico. Conserva slugs y fechas, de modo que
// las direcciones antiguas siguen funcionando (p. ej. /2026/10/21/bases-programa-mirar-a-tiempo/).
//
// Uso:
//   node herramientas/importar-wordpress.js                 importa a la base (DATA_DIR/sitio.db)
//   node herramientas/importar-wordpress.js --semilla       regenera contenido/semilla/wordpress.json.gz
//   node herramientas/importar-wordpress.js --medios        además descarga las imágenes y archivos
//   Opciones: --sitio URL  --cache CARPETA  --db ARCHIVO  --solo-medios  --reemplazar

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { limpiarHeredado, sanitizarHtml } from '../server/sanitizar.js';
import { textoPlano, slugify } from '../src/util.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const SITIO = String(opt('sitio', 'https://municipalidadmelipeuco.cl')).replace(/\/$/, '');
const CACHE = opt('cache', null);
const HOST_RE = new RegExp('https?://(www\\.)?' + new URL(SITIO).host.replace(/^www\./, '').replace(/\./g, '\\.'), 'gi');

const log = (...a) => console.log('·', ...a);
const decod = (s) => textoPlano(String(s || ''));

async function traer(url, { json = true, intentos = 4 } = {}) {
  const archivoCache = CACHE ? path.join(CACHE, url.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_').slice(0, 180) + (json ? '.json' : '.html')) : null;
  if (archivoCache && fs.existsSync(archivoCache)) { const t = fs.readFileSync(archivoCache, 'utf8'); return json ? JSON.parse(t) : t; }
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Importador-SitioMelipeuco/1.0' }, signal: AbortSignal.timeout(60000) });
      if (r.status === 404 || r.status === 400) return null; // 400: página fuera de rango en la API REST
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const t = await r.text();
      if (archivoCache) { fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(archivoCache, t); }
      return json ? JSON.parse(t) : t;
    } catch (e) {
      if (i === intentos) throw new Error(`No se pudo leer ${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

async function todos(tipo, extra = '') {
  const out = [];
  for (let p = 1; p < 100; p++) {
    const lote = await traer(`${SITIO}/wp-json/wp/v2/${tipo}?per_page=100&page=${p}${extra}`);
    if (!Array.isArray(lote) || !lote.length) break;
    out.push(...lote);
  }
  return out;
}

// URLs absolutas del sitio antiguo -> relativas (sirven igual en el sitio nuevo).
const relativizar = (h) => String(h || '').replace(HOST_RE, '').replace(/(href|src)="\/?"/g, '$1="/"');
const rutaDe = (link) => { try { return new URL(link).pathname; } catch { return null; } };

// ------------------------------------------------------------------ WPBakery -> HTML
function wpbakery(h) {
  let s = String(h || '').replace(/&#82(21|43|20|11);|[”″“]/g, '"');
  // [vc_raw_html] guarda el HTML en base64 + URL-encoding (p. ej. mapas de Google).
  s = s.replace(/\[vc_raw_html[^\]]*\]([\s\S]*?)\[\/vc_raw_html\]/g, (_, b) => {
    try { return decodeURIComponent(Buffer.from(b.replace(/<[^>]+>|\s/g, ''), 'base64').toString('latin1')); } catch { return ''; }
  });
  s = s.replace(/\[vc_custom_heading([^\]]*)\]/g, (_, a) => {
    const t = /text="([^"]*)"/.exec(a)?.[1] || '';
    const tag = /tag:(h\d)/.exec(a)?.[1] || 'h3';
    return t ? `<${tag}>${t.replace(/`{2}/g, '"')}</${tag}>` : '';
  });
  s = s.replace(/\[vc_single_image([^\]]*)\]/g, (_, a) => { const id = /image="(\d+)"/.exec(a)?.[1]; return id ? `<img data-wp-id="${id}" alt="">` : ''; });
  s = s.replace(/\[vc_message[^\]]*\]([\s\S]*?)\[\/vc_message\]/g, '<blockquote>$1</blockquote>');
  s = s.replace(/\[vc_btn([^\]]*)\]/g, (_, a) => { const t = /title="([^"]*)"/.exec(a)?.[1]; const l = /url:([^|"]+)/.exec(a)?.[1]; return t && l ? `<p><a href="${decodeURIComponent(l)}">${t}</a></p>` : ''; });
  s = s.replace(/\[\/?(vc_|rev_slider|mk_)[^\]]*\]/g, '\n');
  return s;
}

// ------------------------------------------------------------------ Elementor -> bloques
const CATEGORIA_POR_PAGINA = { transito: 'departamento-de-transito-y-transporte-publico', medioambiente: 'medio-ambiente', boxveterinario: 'box-veterinario', 'deporte-2': 'deporte', desarrollolocal: 'desarrollo-local', obras: 'obras' };

function widgetsElementor(h) {
  const re = /<div class="elementor-element[^"]*elementor-widget[^"]*"[^>]*?data-widget_type="([^"]+)"[^>]*>\s*(?:<div class="elementor-widget-container">)?/g;
  const encontrados = [];
  let m;
  while ((m = re.exec(h))) encontrados.push({ tipo: m[1], ini: m.index + m[0].length, abre: m[0], inicioEtiqueta: m.index });
  return encontrados.map((w, i) => {
    let c = h.slice(w.ini, i + 1 < encontrados.length ? encontrados[i + 1].inicioEtiqueta : h.length);
    for (let k = 0; k < 200; k++) {
      const antes = c;
      c = c.replace(/\s*(<\/div>|<\/section>|<section[^>]*elementor[^>]*>|<div[^>]*class="elementor-[^"]*"[^>]*>)\s*$/, '');
      if (c === antes) break;
    }
    return { tipo: w.tipo, html: c, abre: w.abre };
  });
}

function elementorABloques(h, { slug, fondos = {} }) {
  const bloques = [];
  const id = () => 'b' + Math.random().toString(36).slice(2, 10);
  const pushTexto = (html) => {
    const limpio = limpiarHeredado(relativizar(html));
    if (!textoPlano(limpio) && !/<(img|iframe|table)/.test(limpio)) return;
    const ult = bloques.at(-1);
    if (ult?.tipo === 'texto') ult.html += '\n' + limpio; else bloques.push({ id: id(), tipo: 'texto', html: limpio });
  };
  for (const w of widgetsElementor(h)) {
    const tipo = w.tipo.split('.')[0];
    if (tipo === 'html') {
      const crudo = relativizar(w.html).trim();
      if (!crudo) continue;
      bloques.push({ id: id(), tipo: 'html_aislado', html: crudo, titulo: '' });
    } else if (tipo === 'heading' || tipo === 'animated-headline') {
      const t = decod(w.html);
      if (t) pushTexto(`<h2>${t.replace(/[<>&]/g, '')}</h2>`);
    } else if (tipo === 'text-editor' || tipo === 'icon-list' || tipo === 'flip-box') {
      pushTexto(w.html);
    } else if (tipo === 'button') {
      const a = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(w.html);
      if (!a) continue;
      const b = { texto: decod(a[2]), url: relativizar(a[1]).replace(/&#038;/g, '&'), estilo: 'primario' };
      const ult = bloques.at(-1);
      if (ult?.tipo === 'botones') ult.botones.push(b); else bloques.push({ id: id(), tipo: 'botones', botones: [b] });
    } else if (tipo === 'image') {
      const img = /<img[^>]*src="([^"]+)"[^>]*>/.exec(w.html);
      const alt = /alt="([^"]*)"/.exec(img?.[0] || '')?.[1] || '';
      const enlace = /<a[^>]*href="([^"]+)"/.exec(w.html)?.[1] || '';
      if (img) bloques.push({ id: id(), tipo: 'imagen', src: relativizar(img[1]), alt: decod(alt), enlace: relativizar(enlace), ancho: 'normal', pie: decod(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/.exec(w.html)?.[1] || '') });
    } else if (tipo === 'slides') {
      const imagenes = [];
      for (const s of w.html.matchAll(/elementor-repeater-item-([0-9a-f]+) swiper-slide[\s\S]*?(?:<a class="swiper-slide-inner" href="([^"]*)")?/g)) {
        const src = fondos[s[1]];
        if (src) imagenes.push({ src: relativizar(src), alt: '' });
      }
      if (imagenes.length) bloques.push({ id: id(), tipo: 'galeria', estilo: 'carrusel', imagenes, titulo: '' });
    } else if (tipo === 'posts') {
      bloques.push({ id: id(), tipo: 'noticias', titulo: 'Últimas noticias', categoria: CATEGORIA_POR_PAGINA[slug] || '', cantidad: 3 });
    } else if (tipo === 'video') {
      const ajustes = /data-settings="([^"]+)"/.exec(w.abre + w.html)?.[1] || '';
      const url = /youtube_url&quot;:&quot;([^&]+)/.exec(ajustes)?.[1]?.replace(/\\\//g, '/') || /src="(https:\/\/www\.youtube[^"]+)"/.exec(w.html)?.[1];
      if (url) bloques.push({ id: id(), tipo: 'video', url: decod(url), titulo: '' });
    } else if (tipo === 'google_maps') {
      const src = /<iframe[^>]*src="([^"]+)"/.exec(w.html)?.[1];
      if (src) pushTexto(`<iframe src="${src.replace(/&amp;/g, '&')}" width="100%" height="400"></iframe>`);
    } else if (tipo === 'shortcode') {
      if (/mec-|modern-events/.test(w.html)) bloques.push({ id: id(), tipo: 'eventos', titulo: 'Próximos eventos', cantidad: 6 });
      else pushTexto(w.html);
    } else if (tipo !== 'lottie') {
      pushTexto(w.html);
    }
  }
  return bloques;
}

// ------------------------------------------------------------------ Eventos (MEC)
const MESES = { jan: 1, ene: 1, feb: 2, mar: 3, apr: 4, abr: 4, may: 5, jun: 6, jul: 7, aug: 8, ago: 8, sep: 9, oct: 10, nov: 11, dec: 12, dic: 12 };
function fechaMec(html) {
  const t = textoPlano(html.slice(html.indexOf('mec-single-event-date'), html.indexOf('mec-single-event-date') + 3000)).replace(/\s+/g, ' ');
  const f = /([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})/.exec(t);
  if (!f) return null;
  const mes = MESES[f[1].toLowerCase()];
  const fecha = `${f[3]}-${String(mes).padStart(2, '0')}-${String(f[2]).padStart(2, '0')}`;
  const horas = [...t.matchAll(/(\d{1,2}):(\d{2}) ?(am|pm)/gi)].map((h) => {
    let hh = Number(h[1]) % 12; if (/pm/i.test(h[3])) hh += 12;
    return `${String(hh).padStart(2, '0')}:${h[2]}`;
  });
  const iLugar = html.indexOf('>', html.indexOf('mec-single-event-location')) + 1;
  const lugar = textoPlano(html.slice(iLugar, iLugar + 1500)).replace(/\s+/g, ' ').replace(/^.*?(Location|Ubicación)\s*/i, '').replace(/\s*(Website|Sitio web).*$/i, '').trim();
  return { inicio: horas[0] ? `${fecha}T${horas[0]}` : fecha, fin: horas[1] ? `${fecha}T${horas[1]}` : '', todoElDia: !horas[0], lugar: lugar.split(/\s{2,}| {1}(?=Calle|Av)/)[0].slice(0, 120), direccion: '' };
}

// ------------------------------------------------------------------ Paquete
const DESCARTAR = new Set(['detalles-del-ticket', 'recibo-del-ticket', 'event-organizers', 'booking-details', 'submit-event', 'event-types', 'user-profile', 'booking', 'events', 'event-sites-locations', 'performers', 'reset-password-page', 'register-page', 'submit-listing', 'pagina-de-ejemplo', 'pagina-ejemplo', 'elementor-8', 'pagina-de-inicio-v2', 'bienvenido-2', 'pagina-principal', 'inicio', 'horarios-de-atencion', 'portalnoticias', 'eventos', 'actividades', 'contacto']);
const REDIRECCIONES = { '/actividades/': '/eventos/', '/portalnoticias/': '/noticias/', '/descargas/': '/documentos/', '/pagina-de-inicio-v2/': '/', '/bienvenido-2/': '/', '/inicio/': '/', '/pagina-principal/': '/', '/horarios-de-atencion/': '/contacto/', '/departamentos/': '/areas/', '/permisodecirculacion/': '/tramites/', '/events/': '/eventos/' };

export async function construirPaquete() {
  log('Leyendo', SITIO);
  const [cats, tags, medios, posts, pages] = await Promise.all([todos('categories'), todos('tags'), todos('media', '&_fields=id,date,slug,title,source_url,mime_type,media_details.width,media_details.height,media_details.sizes,alt_text,caption'), todos('posts'), todos('pages')]);
  log(`${cats.length} categorías, ${tags.length} etiquetas, ${medios.length} medios, ${posts.length} noticias, ${pages.length} páginas`);
  let eventos = [];
  let catsEventos = [];
  try { eventos = await todos('mec-events'); catsEventos = await todos('mec_category'); } catch { /* sin plugin de eventos */ }

  const paquete = { version: 1, origen: SITIO, generado: new Date().toISOString(), taxonomias: [], medios: [], contenidos: [], redirecciones: [], directorio: [], sesiones: [] };

  const catPorId = new Map(cats.map((c) => [c.id, c]));
  for (const c of cats) paquete.taxonomias.push({ tipo: 'categoria', slug: c.slug, nombre: decod(c.name), descripcion: decod(c.description), padre_slug: c.parent ? catPorId.get(c.parent)?.slug : null, wp_id: c.id });
  for (const t of tags) paquete.taxonomias.push({ tipo: 'etiqueta', slug: t.slug, nombre: decod(t.name), wp_id: t.id });
  for (const c of catsEventos) if (!cats.some((x) => x.slug === c.slug)) paquete.taxonomias.push({ tipo: 'categoria', slug: c.slug, nombre: decod(c.name), wp_id: null });

  const medioPorId = new Map();
  for (const m of medios) {
    const url = relativizar(m.source_url);
    const tam = m.media_details?.sizes || {};
    const variantes = {};
    for (const [k, v] of Object.entries(tam)) if (v?.source_url && v.width) variantes[v.width] = relativizar(v.source_url);
    const item = { url, nombre: path.basename(url), mime: m.mime_type, ancho: m.media_details?.width || null, alto: m.media_details?.height || null, alt: decod(m.alt_text), titulo: decod(m.title?.rendered), variantes, wp_id: m.id, creado: new Date(m.date).toISOString() };
    paquete.medios.push(item);
    medioPorId.set(m.id, item);
  }
  const imagenDe = (id) => medioPorId.get(id)?.url || '';

  for (const p of posts) {
    paquete.contenidos.push({
      tipo: 'noticia', slug: decodeURIComponent(p.slug), titulo: decod(p.title.rendered), resumen: decod(p.excerpt?.rendered).replace(/\s*\[…\]|\s*\[&hellip;\]|\s*…$/, '').slice(0, 400),
      cuerpo: limpiarHeredado(relativizar(p.content.rendered)), estado: p.status === 'publish' ? 'publicado' : 'borrador',
      publicado_en: new Date(p.date_gmt + 'Z').toISOString(), creado: new Date(p.date_gmt + 'Z').toISOString(), modificado: new Date(p.modified_gmt + 'Z').toISOString(),
      imagen: imagenDe(p.featured_media), destacado: !!p.sticky,
      taxonomias: [...p.categories.map((id) => ({ tipo: 'categoria', slug: catPorId.get(id)?.slug })), ...p.tags.map((id) => ({ tipo: 'etiqueta', slug: tags.find((t) => t.id === id)?.slug }))].filter((t) => t.slug && t.slug !== 'sin-categoria'),
      url_antigua: rutaDe(p.link), wp_id: p.id, datos: {},
    });
  }

  const paginaPorId = new Map(pages.map((p) => [p.id, p]));
  for (const p of pages) {
    const slug = decodeURIComponent(p.slug);
    if (DESCARTAR.has(slug) || p.status !== 'publish') continue;
    let html = p.content.rendered || '';
    if (!textoPlano(html).trim() && !/<img|<iframe/.test(html)) continue; // marcadores vacíos del menú
    let bloques = [];
    let cuerpo = '';
    if (/data-elementor-type/.test(html)) {
      const fondos = {};
      if (/slides\.default/.test(html)) {
        const css = await traer(`${SITIO}/wp-content/uploads/elementor/css/post-${p.id}.css`, { json: false }).catch(() => '');
        for (const m of String(css || '').matchAll(/repeater-item-([0-9a-f]+) \.swiper-slide-bg\{[^}]*url\(([^)]+)\)/g)) fondos[m[1]] = m[2].replace(/["']/g, '');
      }
      bloques = elementorABloques(html, { slug, fondos });
    } else {
      if (/\[vc_/.test(html)) html = wpbakery(html).replace(/<img data-wp-id="(\d+)" alt="">/g, (_, id) => imagenDe(Number(id)) ? `<img src="${imagenDe(Number(id))}" alt="">` : '');
      cuerpo = limpiarHeredado(relativizar(html));
    }
    const padre = p.parent ? paginaPorId.get(p.parent) : null;
    paquete.contenidos.push({
      tipo: 'pagina', slug, titulo: decod(p.title.rendered), resumen: decod(p.excerpt?.rendered).slice(0, 300), cuerpo, bloques,
      estado: 'publicado', publicado_en: new Date(p.date_gmt + 'Z').toISOString(), creado: new Date(p.date_gmt + 'Z').toISOString(), modificado: new Date(p.modified_gmt + 'Z').toISOString(),
      imagen: imagenDe(p.featured_media), padre_slug: padre ? decodeURIComponent(padre.slug) : null, orden: p.menu_order || 0,
      plantilla: bloques.some((b) => b.tipo === 'html_aislado') ? 'aterrizaje' : 'normal', url_antigua: rutaDe(p.link), wp_id: p.id, datos: {},
    });

    // Transmisiones del Concejo (galería de YouTube) -> sesiones con video
    if (slug === 'concejosmunicipales') {
      for (const m of html.matchAll(/data-videoid="([\w-]{11})"[\s\S]*?epyt-gallery-title">([\s\S]*?)<\/div>/g)) {
        paquete.sesiones.push({ video: `https://www.youtube.com/watch?v=${m[1]}`, titulo: decod(m[2]).replace(/\s*-\s*Municipalidad de Melipeuco\s*$/i, '').trim() });
      }
    }
  }

  // Directorio telefónico y correos institucionales (página «Agenda de contactos»)
  const contacto = pages.find((p) => p.slug === 'contacto');
  if (contacto) {
    const h = contacto.content.rendered;
    const secciones = h.split(/<h2[^>]*>/).slice(1);
    for (const s of secciones) {
      const titulo = decod(s.slice(0, s.indexOf('</h2>')));
      const grupo = /educa/i.test(titulo) ? 'educacion' : /emergen/i.test(titulo) ? 'emergencia' : /salud/i.test(titulo) ? 'salud' : /correo/i.test(titulo) ? 'correos' : 'municipal';
      for (const r of s.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>/g)) {
        const nombre = decod(r[1]).replace(/^\*\s*/, '');
        if (grupo === 'correos') {
          const email = /mailto:([^"]+)/.exec(r[2])?.[1];
          if (email) paquete.directorio.push({ nombre, email: email.toLowerCase(), grupo: 'municipal' });
        } else {
          const tel = decod(r[2]).replace(/[^\d]/g, '');
          if (tel) paquete.directorio.push({ nombre, telefono: tel, grupo });
        }
      }
    }
  }

  // Eventos
  for (const e of eventos) {
    const html = await traer(e.link, { json: false }).catch(() => null);
    const f = html ? fechaMec(html) : null;
    if (!f) continue;
    const desc = html ? (/<div class="mec-single-event-description[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/.exec(html)?.[1] || '') : '';
    paquete.contenidos.push({
      tipo: 'evento', slug: decodeURIComponent(e.slug), titulo: decod(e.title.rendered), resumen: '', cuerpo: limpiarHeredado(relativizar(desc)), estado: 'publicado',
      publicado_en: new Date(e.date_gmt + 'Z').toISOString(), creado: new Date(e.date_gmt + 'Z').toISOString(), modificado: new Date(e.modified_gmt + 'Z').toISOString(),
      imagen: imagenDe(Number(e.featured_media)), datos: f, url_antigua: rutaDe(e.link), wp_id: Number(e.id),
      taxonomias: (e.mec_category || []).map((id) => ({ tipo: 'categoria', slug: catsEventos.find((c) => c.id === id)?.slug })).filter((t) => t.slug),
    });
  }
  log(`${paquete.contenidos.filter((c) => c.tipo === 'evento').length} eventos, ${paquete.sesiones.length} transmisiones del Concejo, ${paquete.directorio.length} contactos`);

  for (const [o, d] of Object.entries(REDIRECCIONES)) paquete.redirecciones.push({ origen: o, destino: d });
  return paquete;
}

// ------------------------------------------------------------------ Descarga de medios
export async function descargarMedios(paquete, destino, { concurrencia = 4 } = {}) {
  const urls = new Set();
  const agregar = (u) => { if (u && u.startsWith('/wp-content/uploads/')) urls.add(u.split('?')[0]); };
  for (const c of paquete.contenidos) {
    agregar(c.imagen);
    const texto = c.cuerpo + JSON.stringify(c.bloques || []) + JSON.stringify(c.datos || {});
    for (const m of texto.matchAll(/\/wp-content\/uploads\/[^"'\s)\\<>]+/g)) agregar(m[0]);
  }
  for (const m of paquete.medios) { if (/^image\//.test(m.mime) && Object.keys(m.variantes).length) for (const v of Object.values(m.variantes)) agregar(v); if (!/^image\//.test(m.mime)) agregar(m.url); }
  const lista = [...urls];
  log(`Descargando ${lista.length} archivos a ${destino} …`);
  let hechos = 0, errores = 0, i = 0;
  async function trabajador() {
    while (i < lista.length) {
      const u = lista[i++];
      const archivo = path.join(destino, decodeURIComponent(u.replace(/^\/wp-content\/uploads\//, '')));
      if (!archivo.startsWith(destino)) continue;
      if (fs.existsSync(archivo)) { hechos++; continue; }
      try {
        const r = await fetch(SITIO + u, { signal: AbortSignal.timeout(120000) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        fs.mkdirSync(path.dirname(archivo), { recursive: true });
        fs.writeFileSync(archivo + '.parcial', Buffer.from(await r.arrayBuffer()));
        fs.renameSync(archivo + '.parcial', archivo);
        hechos++;
      } catch (e) {
        errores++;
        if (errores < 20) console.warn('  ✗', u, e.message);
      }
      if ((hechos + errores) % 100 === 0) log(`  ${hechos + errores}/${lista.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrencia }, trabajador));
  log(`Medios: ${hechos} listos, ${errores} con error.`);
}

// ------------------------------------------------------------------ Principal
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { cargarEnv } = await import('../server/config.js');
  const cfg = cargarEnv();
  if (opt('solo-medios')) {
    const p = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(RAIZ, 'contenido/semilla/wordpress.json.gz'))));
    await descargarMedios(p, path.join(cfg.DATA_DIR, 'uploads', 'wp'));
    process.exit(0);
  }
  const paquete = await construirPaquete();
  if (opt('semilla')) {
    const salida = path.join(RAIZ, 'contenido/semilla/wordpress.json.gz');
    fs.mkdirSync(path.dirname(salida), { recursive: true });
    fs.writeFileSync(salida, zlib.gzipSync(JSON.stringify(paquete), { level: 9 }));
    log('Semilla escrita en', path.relative(RAIZ, salida), `(${(fs.statSync(salida).size / 1024).toFixed(0)} KB)`);
  }
  if (!opt('semilla') || opt('db')) {
    const { Db } = await import('../server/db.js');
    const { crearRepositorio } = await import('../server/contenidos.js');
    const { cargarPaquete } = await import('../server/semilla.js');
    const db = new Db(opt('db', path.join(cfg.DATA_DIR, 'sitio.db')));
    const repo = crearRepositorio(db);
    const r = cargarPaquete(db, repo, paquete, { reemplazar: !!opt('reemplazar') });
    log(`Importado: ${r.creados} creados, ${r.actualizados} actualizados, ${r.omitidos} sin cambios.`);
    db.cerrar();
  }
  if (opt('medios')) await descargarMedios(paquete, path.join(cfg.DATA_DIR, 'uploads', 'wp'));
}
