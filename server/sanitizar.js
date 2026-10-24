// Saneador de HTML por lista blanca (sin dependencias).
// Todo HTML que escriben las personas en el panel (o que viene del WordPress antiguo)
// pasa por aquí antes de guardarse: se eliminan scripts, manejadores de eventos,
// estilos, URLs peligrosas (javascript:, data: salvo imágenes) e iframes de dominios
// no autorizados. Las etiquetas no permitidas se quitan conservando su texto.

import { esc } from '../src/util.js';

const VACIAS = new Set(['br', 'hr', 'img', 'source', 'wbr', 'col']);
// Se descartan con todo su contenido.
const DESCARTAR = new Set(['script', 'style', 'template', 'noscript', 'textarea', 'title', 'head', 'object', 'embed', 'applet', 'frameset', 'frame', 'select', 'option', 'button', 'svg', 'math', 'form', 'input', 'link', 'meta', 'base']);

const GLOBALES = ['class', 'id', 'title', 'lang', 'dir', 'role', 'aria-label', 'aria-hidden', 'aria-describedby'];
const PERMITIDAS = {
  p: [], br: [], hr: [], h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  strong: [], b: [], em: [], i: [], u: [], s: [], del: [], ins: [], sub: [], sup: [], small: [], mark: [],
  blockquote: ['cite'], q: ['cite'], cite: [], abbr: [], time: ['datetime'], code: [], pre: [], kbd: [],
  ul: [], ol: ['start', 'reversed', 'type'], li: ['value'], dl: [], dt: [], dd: [],
  a: ['href', 'target', 'rel', 'download', 'hreflang'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'srcset', 'sizes'],
  figure: [], figcaption: [], picture: [], source: ['src', 'srcset', 'type', 'media', 'sizes'],
  table: [], caption: [], thead: [], tbody: [], tfoot: [], tr: [], colgroup: ['span'], col: ['span'],
  th: ['colspan', 'rowspan', 'scope', 'headers'], td: ['colspan', 'rowspan', 'headers'],
  div: [], span: [], section: [], article: [], aside: [], header: [], footer: [], nav: [], main: [],
  details: ['open'], summary: [],
  iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy'],
  video: ['src', 'controls', 'poster', 'width', 'height', 'preload', 'muted', 'playsinline', 'loop'],
  audio: ['src', 'controls', 'preload'],
  center: [], font: [], u_: [],
};
// Se reemplazan por otra etiqueta equivalente.
const RENOMBRAR = { center: 'div', font: 'span', b: 'strong', i: 'em', h1: 'h2' };

// Proveedores de video y mapas que pueden incrustarse.
export const IFRAMES_PERMITIDOS = [
  /^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//,
  /^https:\/\/player\.vimeo\.com\/video\//,
  /^https:\/\/(www\.)?google\.com\/maps\/embed/,
  /^https:\/\/maps\.google\.com\/maps\?/,
  /^https:\/\/www\.facebook\.com\/plugins\/(video|post)\.php/,
  /^https:\/\/docs\.google\.com\/(forms|document|presentation|spreadsheets)\//,
  /^https:\/\/drive\.google\.com\/file\//,
  /^https:\/\/calendar\.google\.com\/calendar\/embed/,
  /^https:\/\/(www\.)?openstreetmap\.org\/export\/embed/,
];
let iframesExtra = [];
export function permitirIframes(origenes = []) {
  iframesExtra = origenes.filter(Boolean).map((o) => o.replace(/\/?$/, '/'));
}

const RE_TOKEN = /<!--[\s\S]*?(?:-->|$)|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\?[^>]*>|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|<|[^<]+/g;
const RE_ATTR = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
function decodificar(v) {
  return v.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}

export function urlPermitida(valor, { imagen = false } = {}) {
  const v = decodificar(String(valor || '')).replace(/[\u0000- \u007f-\u009f]/g, '').trim();
  if (!v) return null;
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (imagen && /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null; // javascript:, vbscript:, data: y otros
  if (v.startsWith('//')) return 'https:' + v;
  return v; // relativa
}

function filtrarAtributos(tag, crudo) {
  const permitidos = new Set([...(PERMITIDAS[tag] || []), ...GLOBALES]);
  const out = [];
  let m;
  RE_ATTR.lastIndex = 0;
  const vistos = new Set();
  while ((m = RE_ATTR.exec(crudo))) {
    const nombre = m[1].toLowerCase();
    if (vistos.has(nombre)) continue;
    vistos.add(nombre);
    if (!permitidos.has(nombre) && !(nombre.startsWith('data-') && /^data-[a-z0-9-]+$/.test(nombre) && tag !== 'iframe')) continue;
    let valor = m[2] ?? m[3] ?? m[4] ?? '';
    if (nombre === 'href' || nombre === 'src' || nombre === 'cite' || nombre === 'poster') {
      valor = urlPermitida(valor, { imagen: tag === 'img' || tag === 'source' || nombre === 'poster' });
      if (valor == null) continue;
      out.push([nombre, valor]);
      continue;
    }
    if (nombre === 'srcset') {
      const partes = decodificar(valor).split(',').map((p) => p.trim()).filter((p) => {
        const u = p.split(/\s+/)[0];
        return urlPermitida(u, { imagen: true }) != null;
      });
      if (partes.length) out.push([nombre, partes.join(', ')]);
      continue;
    }
    if (nombre === 'target') { if (valor === '_blank') out.push([nombre, '_blank']); continue; }
    if (nombre === 'class') {
      const clases = decodificar(valor).split(/\s+/).filter((c) => /^[a-zA-Z][\w-]{0,40}$/.test(c) && !/^(elementor|e-|wp-image-\d|attachment-)/.test(c)).slice(0, 8);
      if (clases.length) out.push([nombre, clases.join(' ')]);
      continue;
    }
    if (nombre === 'id') { const id = decodificar(valor).replace(/[^\w-]/g, '').slice(0, 60); if (id) out.push(['id', id]); continue; }
    if (['width', 'height', 'colspan', 'rowspan', 'span', 'start', 'value'].includes(nombre)) {
      const n = String(valor).replace(/[^\d%]/g, '').slice(0, 6);
      if (n) out.push([nombre, n]);
      continue;
    }
    out.push([nombre, decodificar(valor).slice(0, 2000)]);
  }
  if (tag === 'a') {
    const href = out.find((a) => a[0] === 'href');
    if (out.some((a) => a[0] === 'target') || (href && /^https?:/i.test(href[1]))) {
      const rel = out.find((a) => a[0] === 'rel');
      if (rel) rel[1] = 'noopener noreferrer'; else out.push(['rel', 'noopener noreferrer']);
    }
  }
  if (tag === 'img' && !out.some((a) => a[0] === 'loading')) out.push(['loading', 'lazy']);
  if (tag === 'img' && !out.some((a) => a[0] === 'alt')) out.push(['alt', '']);
  return out;
}

function iframeValido(attrs) {
  const src = attrs.find((a) => a[0] === 'src')?.[1] || '';
  return IFRAMES_PERMITIDOS.some((re) => re.test(src)) || iframesExtra.some((o) => src.startsWith(o));
}

export function sanitizarHtml(entrada, { maxLargo = 2_000_000 } = {}) {
  const fuente = String(entrada ?? '').slice(0, maxLargo);
  let out = '';
  const pila = [];
  let descartando = null;
  let prof = 0;
  RE_TOKEN.lastIndex = 0;
  let m;
  while ((m = RE_TOKEN.exec(fuente))) {
    const tok = m[0];
    if (descartando) {
      if (m[1] && m[1].toLowerCase() === descartando) {
        if (tok[1] === '/') { if (--prof === 0) descartando = null; } else prof++;
      }
      continue;
    }
    if (tok[0] !== '<' || tok === '<') {
      out += tok === '<' ? '&lt;' : tok.replace(/>/g, '&gt;').replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;');
      continue;
    }
    if (!m[1]) continue; // comentarios, doctype, CDATA
    let tag = m[1].toLowerCase();
    const cierre = tok[1] === '/';
    if (DESCARTAR.has(tag)) {
      if (!cierre && !/\/>$/.test(tok)) { descartando = tag; prof = 1; }
      continue;
    }
    if (!PERMITIDAS[tag]) continue; // se quita la etiqueta, se conserva el texto
    tag = RENOMBRAR[tag] || tag;
    if (cierre) {
      const i = pila.lastIndexOf(tag);
      if (i === -1) continue;
      while (pila.length > i) out += `</${pila.pop()}>`;
      continue;
    }
    const attrs = filtrarAtributos(m[1].toLowerCase() === 'font' ? 'span' : tag, m[2] || '');
    if (tag === 'iframe') {
      if (!iframeValido(attrs)) { descartando = 'iframe'; prof = 1; continue; }
      if (!attrs.some((a) => a[0] === 'loading')) attrs.push(['loading', 'lazy']);
      if (!attrs.some((a) => a[0] === 'title')) attrs.push(['title', 'Contenido incrustado']);
    }
    out += '<' + tag + attrs.map(([k, v]) => ` ${k}="${esc(v)}"`).join('') + '>';
    if (!VACIAS.has(tag)) pila.push(tag);
  }
  while (pila.length) out += `</${pila.pop()}>`;
  return out;
}

// Limpieza adicional del HTML heredado de WordPress/Elementor/Gutenberg: quita
// envoltorios vacíos, párrafos en blanco y comentarios de bloques.
export function limpiarHeredado(h) {
  let s = sanitizarHtml(h);
  s = s.replace(/<p[^>]*>(\s|&nbsp;| |<br>)*<\/p>/g, '');
  for (let i = 0; i < 6; i++) s = s.replace(/<(div|span|section)>(\s*)<\/\1>/g, '$2');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}
