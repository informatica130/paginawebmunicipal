// Bloques de contenido: cada página, noticia o trámite puede armarse con estos bloques
// desde el panel (texto, galería, botones, tarjetas, acordeón, video, mapa, noticias,
// trámites en vivo de la Plataforma, contactos, documentos, formularios, etc.).

import { html, crudo, esc, icono, attrsEnlace, avisoExterno, tarjetaNoticia, tarjetaEvento, video, telefonoHref, telefonoTexto, vacio } from './comun.js';
import { fecha } from '../../src/util.js';
import { resumenDe } from '../contenidos.js';

export async function renderBloques(ctx, bloques, { contenido = null } = {}) {
  const out = [];
  for (const b of bloques || []) {
    try {
      const r = await bloque(ctx, b, contenido);
      if (r) out.push(html`<div class="bloque bloque-${b.tipo}" id="${b.id}">${r}</div>`);
    } catch (e) {
      console.error('Bloque', b.tipo, e.message);
    }
  }
  return out;
}

const titulo = (t, n = 2) => (t ? crudo(`<h${n} class="bloque-titulo">${esc(t)}</h${n}>`) : '');

async function bloque(ctx, b, contenido) {
  switch (b.tipo) {
    case 'texto': return html`<div class="prosa">${crudo(b.html)}</div>`;
    case 'cita': return html`<blockquote class="cita"><p>${b.texto}</p>${b.autor ? html`<cite>${b.autor}</cite>` : ''}</blockquote>`;
    case 'columnas': return html`<div class="columnas c${b.columnas.length}">${b.columnas.map((c) => html`<div class="prosa">${crudo(c.html)}</div>`)}</div>`;
    case 'separador': return b.estilo === 'espacio' ? html`<div class="espacio"></div>` : html`<hr>`;
    case 'imagen': {
      const img = ctx.img.imagen(b.src, { alt: b.alt, sizes: b.ancho === 'completo' ? '100vw' : '(max-width: 900px) 100vw, 860px' });
      return html`<figure class="figura figura-${b.ancho}">${b.enlace ? html`<a ${attrsEnlace(b.enlace)}>${img}</a>` : img}${b.pie ? html`<figcaption>${b.pie}</figcaption>` : ''}</figure>`;
    }
    case 'galeria':
      if (!b.imagenes?.length) return '';
      if (b.estilo === 'carrusel') {
        return html`${titulo(b.titulo)}<div class="carrusel" data-carrusel aria-roledescription="carrusel" aria-label="${b.titulo || 'Galería de imágenes'}">
          <div class="carrusel-pista">${b.imagenes.map((i, n) => html`<figure class="carrusel-item" aria-roledescription="diapositiva" aria-label="${n + 1} de ${b.imagenes.length}">${ctx.img.imagen(i.src, { alt: i.alt, sizes: '(max-width: 900px) 100vw, 900px' })}</figure>`)}</div>
          <button type="button" class="carrusel-ant" aria-label="Anterior">${crudo(icono('flechaIzq'))}</button><button type="button" class="carrusel-sig" aria-label="Siguiente">${crudo(icono('flecha'))}</button>
        </div>`;
      }
      return html`${titulo(b.titulo)}<div class="galeria" data-galeria>${b.imagenes.map((i) => html`<a href="${i.src}" class="galeria-item" data-lightbox aria-label="Ampliar imagen${i.alt ? ': ' + i.alt : ''}">${ctx.img.imagen(i.src, { alt: i.alt, sizes: '(max-width: 600px) 50vw, 300px' })}</a>`)}</div>`;
    case 'botones':
      return html`${titulo(b.titulo)}<div class="botonera">${b.botones.map((x) => html`<a class="boton boton-${x.estilo}" ${attrsEnlace(x.url)}>${x.icono ? crudo(icono(x.icono, { tam: 18 })) : ''}${x.texto}${avisoExterno(x.url)}</a>`)}</div>`;
    case 'tarjetas':
      return html`${titulo(b.titulo)}${b.introduccion ? html`<p class="introduccion">${b.introduccion}</p>` : ''}<div class="tarjetas col-${b.columnas}">${b.tarjetas.map((t) => {
        const interior = html`${t.imagen ? ctx.img.imagen(t.imagen, { alt: '', clase: 'tarjeta-img' }) : t.icono ? html`<span class="tarjeta-ico">${crudo(icono(t.icono, { tam: 26 }))}</span>` : ''}<h3>${t.titulo}</h3>${t.texto ? html`<p>${t.texto}</p>` : ''}${t.lista?.length ? html`<ul>${t.lista.map((l) => html`<li>${l}</li>`)}</ul>` : ''}`;
        return t.url ? html`<a class="tarjeta" ${attrsEnlace(t.url)}>${interior}${avisoExterno(t.url)}</a>` : html`<div class="tarjeta">${interior}</div>`;
      })}</div>`;
    case 'acordeon':
      return html`${titulo(b.titulo)}<div class="acordeon">${b.items.map((i) => html`<details><summary>${i.titulo}</summary><div class="prosa">${crudo(i.html)}</div></details>`)}</div>`;
    case 'video': return html`${titulo(b.titulo)}${video(b.url, b.titulo || 'Video')}`;
    case 'mapa': {
      const d = 0.006 * Math.pow(2, 15 - b.zoom);
      const bbox = [b.lng - d, b.lat - d / 1.6, b.lng + d, b.lat + d / 1.6].map((n) => n.toFixed(5)).join(',');
      return html`${titulo(b.titulo)}<div class="mapa"><iframe title="Mapa${b.titulo ? ': ' + b.titulo : ''}" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&amp;layer=mapnik&amp;marker=${b.lat},${b.lng}"></iframe></div>
        <p class="mapa-pie">${b.direccion ? html`${crudo(icono('ubicacion', { tam: 16 }))} ${b.direccion} · ` : ''}<a href="https://www.google.com/maps/dir/?api=1&amp;destination=${b.lat},${b.lng}" target="_blank" rel="noopener noreferrer">Cómo llegar</a></p>`;
    }
    case 'noticias': {
      const cat = b.categoria ? ctx.db.get("SELECT id, nombre, slug FROM taxonomias WHERE tipo = 'categoria' AND slug = ?", b.categoria) : null;
      if (b.categoria && !cat) return '';
      const lista = ctx.repo.listar({ tipo: 'noticia', publico: true, categoria: cat?.id, limite: b.cantidad }).items;
      if (!lista.length) return '';
      return html`<div class="bloque-cabecera">${titulo(b.titulo || 'Noticias')}<a class="ver-todo" href="${cat ? `/categoria/${cat.slug}/` : '/noticias/'}">Ver todas ${crudo(icono('flecha', { tam: 16 }))}</a></div>
        <div class="grilla-noticias">${lista.map((c) => tarjetaNoticia(ctx, c))}</div>`;
    }
    case 'eventos': {
      const lista = ctx.repo.eventosProximos(b.cantidad);
      return html`<div class="bloque-cabecera">${titulo(b.titulo || 'Próximos eventos')}<a class="ver-todo" href="/eventos/">Agenda completa ${crudo(icono('flecha', { tam: 16 }))}</a></div>
        ${lista.length ? html`<div class="lista-eventos">${lista.map((c) => tarjetaEvento(ctx, c))}</div>` : vacio('No hay eventos programados por ahora. Revise la agenda completa o las noticias.', 'calendario')}`;
    }
    case 'tramites': return bloqueTramites(ctx, b);
    case 'tramite_en_linea': return bloqueTramiteEnLinea(ctx, b);
    case 'contactos': return html`${titulo(b.titulo)}${tarjetaContacto(b)}`;
    case 'documentos': {
      const col = b.coleccion ? ctx.db.get("SELECT id FROM taxonomias WHERE tipo = 'coleccion' AND slug = ?", b.coleccion) : null;
      const docs = col ? ctx.repo.listar({ tipo: 'documento', publico: true, taxonomia: col.id, orden: 'documento', limite: b.cantidad }).items : [];
      const items = [...(b.archivos || []).map((a) => ({ titulo: a.titulo || a.url.split('/').pop(), url: a.url })), ...docs.map((d) => ({ titulo: d.titulo, url: d.datos.archivo, fecha: d.datos.fechaDoc, ficha: ctx.repo.urlDe(d) }))];
      if (!items.length) return html`${titulo(b.titulo)}${vacio('Pronto publicaremos aquí los documentos de esta sección.', 'carpeta')}`;
      return html`${titulo(b.titulo)}<ul class="lista-documentos">${items.map((d) => listaDocumento(d))}</ul>`;
    }
    case 'aviso': return html`<div class="caja caja-${b.nivel}" ${crudo(b.nivel === 'emergencia' ? 'role="note"' : '')}>${crudo(icono(b.nivel === 'exito' ? 'check' : b.nivel === 'info' ? 'info' : 'alerta', { tam: 22 }))}<div>${b.titulo ? html`<strong>${b.titulo}</strong>` : ''}<div class="prosa">${crudo(b.html)}</div></div></div>`;
    case 'html_aislado':
      if (!contenido) return '';
      return html`<iframe class="aislado" src="/embed/bloque/${contenido.id}/${b.id}" title="${b.titulo || contenido.titulo}" loading="${crudo(contenido.bloques[0]?.id === b.id ? 'eager' : 'lazy')}" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-forms allow-downloads" data-aislado style="height:${b.alto || 900}px"></iframe>`;
    case 'formulario': return ctx.formulario(b.formulario, { titulo: b.titulo, areaId: b.area });
    case 'encuesta': {
      const e = b.encuesta ? ctx.repo.obtener(b.encuesta) : null;
      return e && ctx.repo.visible(e) ? ctx.encuesta(e) : '';
    }
    case 'hijas': {
      if (!contenido) return '';
      const hijas = ctx.repo.hijas(contenido.id);
      return hijas.length ? html`${titulo(b.titulo)}${tarjetasPaginas(ctx, hijas)}` : '';
    }
    case 'directorio': return html`${titulo(b.titulo)}${directorio(ctx, b.grupo)}`;
    case 'autoridades': {
      const lista = ctx.repo.listar({ tipo: 'autoridad', publico: true, orden: 'orden', limite: 50 }).items;
      const filtradas = contenido?.slug === 'concejo-municipal' ? lista.filter((a) => a.datos.cargo === 'concejal' || a.datos.cargo === 'alcalde') : contenido?.slug === 'alcaldia-y-concejo-municipal' ? lista.filter((a) => a.datos.cargo === 'alcalde') : lista;
      return filtradas.length ? html`${titulo(b.titulo)}<div class="autoridades">${filtradas.map((a) => tarjetaAutoridad(ctx, a))}</div>` : '';
    }
    case 'sesiones': {
      const lista = ctx.repo.listar({ tipo: 'sesion', publico: true, orden: 'sesion', limite: b.cantidad }).items;
      return lista.length ? html`${titulo(b.titulo)}<ul class="lista-sesiones">${lista.map((s) => filaSesion(ctx, s))}</ul>` : '';
    }
    case 'lugares': {
      const lista = ctx.repo.listar({ tipo: 'lugar', publico: true, orden: 'titulo', limite: 60 }).items.filter((l) => !b.tipoLugar || l.datos.tipoLugar === b.tipoLugar);
      return lista.length ? html`${titulo(b.titulo)}<div class="tarjetas col-3">${lista.map((l) => html`<a class="tarjeta" href="${ctx.repo.urlDe(l)}">${l.imagen ? ctx.img.imagen(l.imagen, { alt: '', clase: 'tarjeta-img' }) : ''}<h3>${l.titulo}</h3><p>${resumenDe(l, 120)}</p></a>`)}</div>` : '';
    }
    case 'areas': {
      const lista = ctx.repo.listar({ tipo: 'area', publico: true, padre: b.padre || 0, orden: 'orden', limite: 100 }).items.filter((a) => a.datos.enMenu !== false);
      return lista.length ? html`${titulo(b.titulo)}${tarjetasAreas(ctx, lista)}` : '';
    }
    default: return '';
  }
}

export function tarjetaContacto(d) {
  const filas = [];
  if (d.telefono) filas.push(html`<a class="contacto-boton" href="${telefonoHref(d.telefono)}">${crudo(icono('telefono', { tam: 20 }))}<span><small>Teléfono</small>${telefonoTexto(d.telefono)}</span></a>`);
  if (d.whatsapp) filas.push(html`<a class="contacto-boton" href="https://api.whatsapp.com/send?phone=${String(d.whatsapp).replace(/[^\d]/g, '')}" target="_blank" rel="noopener noreferrer">${crudo(icono('whatsapp', { tam: 20 }))}<span><small>WhatsApp</small>${d.whatsapp}</span></a>`);
  if (d.email) filas.push(html`<a class="contacto-boton" href="mailto:${d.email}">${crudo(icono('correo', { tam: 20 }))}<span><small>Correo</small>${d.email}</span></a>`);
  if (d.direccion) filas.push(html`<a class="contacto-boton" href="${d.mapa || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.direccion + ', Melipeuco')}`}" target="_blank" rel="noopener noreferrer">${crudo(icono('ubicacion', { tam: 20 }))}<span><small>¿Cómo llegar?</small>${d.direccion}</span></a>`);
  if (d.horario) filas.push(html`<div class="contacto-boton">${crudo(icono('reloj', { tam: 20 }))}<span><small>Horario</small>${d.horario}</span></div>`);
  return filas.length ? html`<div class="contactos">${filas}</div>` : '';
}

export function listaDocumento(d) {
  const ext = (String(d.url || '').split('?')[0].split('.').pop() || '').toLowerCase();
  const tipo = { pdf: 'PDF', doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel', ppt: 'PowerPoint', pptx: 'PowerPoint', zip: 'ZIP', jpg: 'Imagen', jpeg: 'Imagen', png: 'Imagen', webp: 'Imagen' }[ext] || 'Archivo';
  return html`<li><a ${attrsEnlace(d.ficha || d.url)}>${crudo(icono('documento', { tam: 22 }))}<span><b>${d.titulo}</b><small>${tipo}${d.fecha ? ' · ' + fecha(d.fecha, { largo: true }) : ''}</small></span></a>${d.url ? html`<a class="descargar" href="${d.url}" download aria-label="Descargar ${d.titulo}">${crudo(icono('descarga', { tam: 18 }))}</a>` : ''}</li>`;
}

export function tarjetasPaginas(ctx, lista) {
  return html`<div class="tarjetas col-3">${lista.map((p) => html`<a class="tarjeta" href="${ctx.repo.urlDe(p)}">${p.imagen ? ctx.img.imagen(p.imagen, { alt: '', clase: 'tarjeta-img' }) : ''}<h3>${p.titulo}</h3><p>${resumenDe(p, 130)}</p></a>`)}</div>`;
}

export function tarjetasAreas(ctx, lista) {
  return html`<div class="tarjetas-areas">${lista.map((a) => html`<a class="tarjeta-area" href="${ctx.repo.urlDe(a)}" style="--color:${a.datos.color || 'var(--primario)'}">
    <span class="ta-ico">${crudo(icono(a.datos.icono || 'escudo', { tam: 24 }))}</span><span><b>${a.datos.nombreCorto || a.titulo}</b><small>${a.datos.nombreCorto && a.datos.nombreCorto !== a.titulo ? a.titulo : resumenDe(a, 80)}</small></span></a>`)}</div>`;
}

export function tarjetaAutoridad(ctx, a) {
  const d = a.datos;
  return html`<article class="autoridad">
    ${a.imagen ? ctx.img.imagen(a.imagen, { alt: `Fotografía de ${a.titulo}`, clase: 'autoridad-foto', sizes: '240px' }) : html`<span class="autoridad-foto sin-foto">${crudo(icono('usuario', { tam: 48 }))}</span>`}
    <div>
      <p class="autoridad-cargo">${d.cargoTexto || { alcalde: 'Alcalde(sa)', concejal: 'Concejal(a)' }[d.cargo] || ''}</p>
      <h3><a href="${ctx.repo.urlDe(a)}">${a.titulo}</a></h3>
      ${d.periodo ? html`<p class="meta">Período ${d.periodo}</p>` : ''}
      <p class="autoridad-contacto">${d.email ? html`<a href="mailto:${d.email}">${crudo(icono('correo', { tam: 16 }))} ${d.email}</a>` : ''}${d.telefono ? html`<a href="${telefonoHref(d.telefono)}">${crudo(icono('telefono', { tam: 16 }))} ${telefonoTexto(d.telefono)}</a>` : ''}</p>
    </div>
  </article>`;
}

export function filaSesion(ctx, s) {
  const d = s.datos;
  return html`<li class="sesion">
    <div class="sesion-fecha"><time datetime="${d.fecha}">${fecha(d.fecha, { largo: true })}</time><span class="etiqueta etiqueta-${d.tipoSesion}">${{ ordinaria: 'Ordinaria', extraordinaria: 'Extraordinaria', especial: 'Especial' }[d.tipoSesion] || ''}</span></div>
    <a class="sesion-titulo" href="${ctx.repo.urlDe(s)}">${s.titulo}</a>
    <div class="sesion-acciones">${d.video ? html`<a href="${d.video}" target="_blank" rel="noopener noreferrer">${crudo(icono('video', { tam: 16 }))} Ver transmisión</a>` : ''}${d.acta ? html`<a href="${d.acta}">${crudo(icono('documento', { tam: 16 }))} Acta</a>` : ''}</div>
  </li>`;
}

export function directorio(ctx, grupo) {
  const lista = ctx.repo.listar({ tipo: 'contacto', publico: true, orden: 'orden', limite: 300 }).items.filter((c) => !grupo || c.datos.grupo === grupo);
  if (!lista.length) return '';
  return html`<div class="directorio">${lista.map((c) => html`<div class="directorio-fila" data-filtrable="${c.titulo} ${c.datos.email || ''}">
    <span class="directorio-nombre">${c.titulo}${c.datos.ubicacion ? html`<small>${c.datos.ubicacion}</small>` : ''}</span>
    <span class="directorio-datos">
      ${c.datos.telefono ? html`<a href="${telefonoHref(c.datos.telefono)}">${crudo(icono('telefono', { tam: 16 }))} ${telefonoTexto(c.datos.telefono)}${c.datos.anexo ? ` (anexo ${c.datos.anexo})` : ''}</a><button type="button" class="copiar" data-copiar="${c.datos.telefono}" aria-label="Copiar el número de ${c.titulo}">${crudo(icono('copiar', { tam: 15 }))}</button>` : ''}
      ${c.datos.email ? html`<a href="mailto:${c.datos.email}">${crudo(icono('correo', { tam: 16 }))} ${c.datos.email}</a>` : ''}
    </span>
  </div>`)}</div>`;
}

// ---- Trámites de la Plataforma Municipal (en vivo)
async function bloqueTramites(ctx, b) {
  const locales = ctx.repo.listar({ tipo: 'tramite', publico: true, orden: 'orden', limite: b.cantidad, area: b.area || undefined, taxonomia: b.etiqueta ? ctx.db.get("SELECT id FROM taxonomias WHERE tipo = 'etiqueta' AND slug = ?", b.etiqueta)?.id || -1 : undefined }).items;
  let enLinea = [];
  if (b.transitoDepartamento) {
    const cat = await ctx.tramites.catalogo();
    if (cat) {
      const deps = new Set([b.transitoDepartamento, ...cat.departamentos.filter((d) => d.parentId === b.transitoDepartamento).map((d) => d.id)]);
      enLinea = cat.tramites.filter((t) => deps.has(t.departamentoId)).slice(0, b.cantidad);
    }
  }
  const vinculados = new Set(locales.map((t) => t.datos.transitoTramite).filter(Boolean));
  enLinea = enLinea.filter((t) => !vinculados.has(t.id));
  if (!locales.length && !enLinea.length) return '';
  return html`${titulo(b.titulo)}<div class="lista-tramites">${locales.map((t) => filaTramite(ctx, t))}${enLinea.map((t) => filaTramiteEnLinea(t))}</div>`;
}

export function filaTramite(ctx, t) {
  const m = t.datos.modalidad;
  return html`<a class="fila-tramite" href="${ctx.repo.urlDe(t)}">
    <span class="ft-ico">${crudo(icono(m === 'presencial' ? 'documento' : 'licencia', { tam: 22 }))}</span>
    <span class="ft-texto"><b>${t.titulo}</b><small>${resumenDe(t, 120)}</small></span>
    <span class="insignia insignia-${m}">${{ presencial: 'Presencial', en_linea: 'En línea', mixto: 'En línea y presencial' }[m] || ''}</span>
  </a>`;
}

export function filaTramiteEnLinea(t) {
  return html`<a class="fila-tramite" href="${t.url}" target="_blank" rel="noopener">
    <span class="ft-ico">${crudo(icono(t.conHora ? 'calendario' : 'licencia', { tam: 22 }))}</span>
    <span class="ft-texto"><b>${t.nombre}</b><small>${t.descripcion}</small></span>
    <span class="insignia insignia-en_linea">${t.conHora ? 'Reserva de hora' : 'En línea'}</span><span class="sr">(abre la Plataforma de Trámites)</span>
  </a>`;
}

async function bloqueTramiteEnLinea(ctx, b) {
  const t = ctx.tramites;
  if (!t.configurado) return '';
  const atributo = b.vista === 'seguimiento' ? crudo('data-melipeuco-vista="seguimiento"') : b.vista === 'catalogo' ? crudo(`data-melipeuco-dependencia="${esc(b.dependencia || '')}"`) : crudo(`data-melipeuco-tramite="${esc(b.tramite)}"`);
  return html`${titulo(b.titulo)}<div class="widget-tramite" ${atributo} data-color="${ctx.ajustes.colores?.primario || '#0b5a8c'}">
    <p><a class="boton boton-primario" href="${b.vista === 'seguimiento' ? t.enlaces.seguimiento() : b.vista === 'catalogo' ? t.enlaces.catalogo(b.dependencia) : t.enlaces.tramite(b.tramite)}">Abrir en la Plataforma de Trámites</a></p>
  </div><script src="${t.enlaces.widget()}" defer></script>`;
}
