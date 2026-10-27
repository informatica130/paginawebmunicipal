// Piezas de interfaz reutilizadas por las plantillas públicas.

import { html, crudo, esc, fecha, recortar } from '../../src/util.js';
import { icono } from './iconos.js';
import { resumenDe } from '../contenidos.js';

export { html, crudo, esc, icono };

// ¿El enlace sale del sitio? (se abre en otra pestaña y se marca para lectores de pantalla)
export const esExterno = (url) => /^https?:\/\//i.test(url || '') && !/^https?:\/\/(www\.)?municipalidadmelipeuco\.cl/i.test(url);
export function attrsEnlace(url, nueva = false) {
  return crudo(`href="${esc(url || '#')}"${nueva || esExterno(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}`);
}
export const avisoExterno = (url, nueva) => (nueva || esExterno(url) ? html`<span class="sr">(abre en otra pestaña)</span>` : '');

// Imagen con srcset a partir de las variantes guardadas en la biblioteca de medios.
export function crearImagenes(db) {
  let cache = null;
  const variantes = (url) => {
    if (!cache) {
      cache = new Map();
      for (const f of db.all("SELECT url, variantes, ancho, alto, alt FROM medios WHERE variantes != '{}' OR ancho IS NOT NULL")) cache.set(f.url, { v: JSON.parse(f.variantes || '{}'), ancho: f.ancho, alto: f.alto, alt: f.alt });
    }
    return cache.get(url);
  };
  function imagen(url, { alt = '', clase = '', sizes = '(max-width: 700px) 100vw, 600px', prioridad = false, ancho, alto } = {}) {
    if (!url) return '';
    const m = variantes(url);
    let srcset = '';
    let src = url;
    if (m?.v && Object.keys(m.v).length) {
      const pares = Object.entries(m.v).map(([w, u]) => [Number(w), u]).filter(([w]) => w >= 300).sort((a, b) => a[0] - b[0]);
      if (m.ancho && !pares.some(([w]) => w === m.ancho)) pares.push([m.ancho, url]);
      srcset = pares.map(([w, u]) => `${u} ${w}w`).join(', ');
      // Para tarjetas basta una variante mediana; el navegador elige con srcset.
      src = (pares.find(([w]) => w >= 768) || pares.at(-1) || [0, url])[1];
    }
    const w = ancho || m?.ancho;
    const h = alto || m?.alto;
    return html`<img src="${src}"${srcset ? crudo(` srcset="${esc(srcset)}" sizes="${esc(sizes)}"`) : ''} alt="${alt ?? m?.alt ?? ''}"${clase ? crudo(` class="${esc(clase)}"`) : ''}${w && h ? crudo(` width="${Number(w)}" height="${Number(h)}"`) : ''} ${crudo(prioridad ? 'fetchpriority="high"' : 'loading="lazy"')} decoding="async">`;
  }
  return { imagen, invalidar: () => { cache = null; } };
}

export function tarjetaNoticia(ctx, c, { grande = false } = {}) {
  const url = ctx.repo.urlDe(c);
  const cat = ctx.categoriasDe(c.id)[0];
  return html`<article class="tarjeta-noticia${grande ? ' grande' : ''}">
    <a class="tn-img" href="${url}" tabindex="-1" aria-hidden="true">${c.imagen ? ctx.img.imagen(c.imagen, { alt: '', sizes: grande ? '(max-width: 900px) 100vw, 60vw' : '(max-width: 700px) 100vw, 380px' }) : crudo(`<span class="tn-sin">${icono('megafono', { tam: 40 })}</span>`)}</a>
    <div class="tn-cuerpo">
      ${cat ? html`<a class="etiqueta" href="/categoria/${cat.slug}/">${cat.nombre}</a>` : ''}
      <h3><a href="${url}">${c.titulo}</a></h3>
      ${(() => { const r = resumenDe(c, grande ? 220 : 140); return r ? html`<p class="tn-resumen">${r}</p>` : ''; })()}
      <time datetime="${c.publicado_en || ''}">${fecha(c.publicado_en, { largo: true })}</time>
    </div>
  </article>`;
}

export function tarjetaEvento(ctx, c) {
  const d = c.datos || {};
  const ini = d.inicio || '';
  const dt = new Date(ini.length === 10 ? ini + 'T12:00' : ini);
  const dia = isNaN(dt) ? '' : dt.toLocaleDateString('es-CL', { day: 'numeric', timeZone: 'America/Santiago' });
  const mes = isNaN(dt) ? '' : dt.toLocaleDateString('es-CL', { month: 'short', timeZone: 'America/Santiago' }).replace('.', '');
  const hora = ini.length > 10 && !d.todoElDia ? ini.slice(11, 16) : '';
  return html`<article class="tarjeta-evento">
    <div class="te-fecha" aria-hidden="true"><b>${dia}</b><span>${mes}</span></div>
    <div>
      <h3><a href="${ctx.repo.urlDe(c)}">${c.titulo}</a></h3>
      <p class="meta"><time datetime="${ini}">${fecha(ini, { largo: true, diaSemana: true })}${hora ? ` · ${hora} hrs.` : ''}</time>${d.lugar ? html` · ${crudo(icono('ubicacion', { tam: 14 }))} ${d.lugar}` : ''}</p>
    </div>
  </article>`;
}

export function paginacion(base, pagina, paginas, extra = '') {
  if (paginas <= 1) return '';
  const url = (n) => `${base}${n > 1 ? `page/${n}/` : ''}${extra}`;
  const nums = [];
  for (let n = 1; n <= paginas; n++) {
    if (n === 1 || n === paginas || Math.abs(n - pagina) <= 2) nums.push(n);
    else if (nums.at(-1) !== '…') nums.push('…');
  }
  return html`<nav class="paginacion" aria-label="Paginación">
    ${pagina > 1 ? html`<a href="${url(pagina - 1)}" rel="prev">${crudo(icono('flechaIzq', { tam: 16 }))} Anterior</a>` : ''}
    ${nums.map((n) => (n === '…' ? html`<span>…</span>` : n === pagina ? html`<span aria-current="page">${n}</span>` : html`<a href="${url(n)}">${n}</a>`))}
    ${pagina < paginas ? html`<a href="${url(pagina + 1)}" rel="next">Siguiente ${crudo(icono('flecha', { tam: 16 }))}</a>` : ''}
  </nav>`;
}

export function migas(items) {
  if (!items?.length) return '';
  return html`<nav class="migas" aria-label="Ruta de navegación"><ol>
    <li><a href="/">Inicio</a></li>
    ${items.map((m, i) => (i === items.length - 1 || !m.url ? html`<li aria-current="page">${recortar(m.texto, 70)}</li>` : html`<li><a href="${m.url}">${m.texto}</a></li>`))}
  </ol></nav>`;
}

export function compartir(url, titulo) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(titulo);
  return html`<div class="compartir" data-compartir data-url="${url}" data-titulo="${titulo}">
    <span>Compartir:</span>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${crudo(u)}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook">${crudo(icono('facebook', { tam: 18 }))}</a>
    <a href="https://api.whatsapp.com/send?text=${crudo(t + '%20' + u)}" target="_blank" rel="noopener noreferrer" aria-label="Compartir por WhatsApp">${crudo(icono('whatsapp', { tam: 18 }))}</a>
    <a href="https://twitter.com/intent/tweet?url=${crudo(u)}&amp;text=${crudo(t)}" target="_blank" rel="noopener noreferrer" aria-label="Compartir en X">${crudo(icono('x', { tam: 18 }))}</a>
    <button type="button" data-copiar="${url}" aria-label="Copiar enlace">${crudo(icono('enlace', { tam: 18 }))}</button>
    <button type="button" data-imprimir aria-label="Imprimir">${crudo(icono('imprimir', { tam: 18 }))}</button>
  </div>`;
}

export function telefonoHref(t) {
  const d = String(t || '').replace(/[^\d+]/g, '');
  if (!d) return '';
  if (d.startsWith('+')) return 'tel:' + d;
  if (d.length === 9 && /^(2|9|4|5)/.test(d)) return 'tel:+56' + d;
  return 'tel:' + d;
}
export function telefonoTexto(t) {
  const d = String(t || '').replace(/[^\d]/g, '').replace(/^56(?=\d{9}$)/, '');
  if (/^2\d{8}$/.test(d)) return `${d[0]} ${d.slice(1, 5)} ${d.slice(5)}`;
  if (/^9\d{8}$/.test(d)) return `+56 9 ${d.slice(1, 5)} ${d.slice(5)}`;
  if (/^4\d{8}$/.test(d)) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return String(t || '');
}

export function vacio(texto, iconoNombre = 'info') {
  return html`<div class="vacio">${crudo(icono(iconoNombre, { tam: 32 }))}<p>${texto}</p></div>`;
}

export function youtubeId(url) {
  return /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url || '')?.[1] || null;
}

// Video incrustado liviano: muestra la miniatura y carga el reproductor al pulsar.
export function video(url, titulo = 'Video') {
  const yt = youtubeId(url);
  if (yt) {
    return html`<div class="video" data-youtube="${yt}"><button type="button" class="video-play" aria-label="Reproducir: ${titulo}">
      <img src="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="" loading="lazy"><span>${crudo(icono('play', { tam: 34 }))}</span></button>
      <noscript><a href="https://www.youtube.com/watch?v=${yt}">Ver en YouTube</a></noscript></div>`;
  }
  const vimeo = /vimeo\.com\/(\d+)/.exec(url || '')?.[1];
  if (vimeo) return html`<div class="video"><iframe src="https://player.vimeo.com/video/${vimeo}" title="${titulo}" allow="fullscreen; picture-in-picture" loading="lazy"></iframe></div>`;
  if (/facebook\.com/.test(url || '')) return html`<div class="video"><iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false" title="${titulo}" allow="fullscreen" loading="lazy"></iframe></div>`;
  if (/\.(mp4|webm)$/i.test(url || '')) return html`<video class="video" src="${url}" controls preload="metadata"></video>`;
  return url ? html`<p><a ${attrsEnlace(url)}>${titulo}</a></p>` : '';
}
