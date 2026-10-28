// Página pública de un micrositio de unidad (Medio Ambiente, Deportes, Cultura…): portada con el
// color, el patrón y el ícono de la unidad, barra de navegación propia que sigue la lectura y los
// módulos en el orden elegido en el panel. El esquema de los módulos está en public/js/micrositios.js.

import { html, crudo, esc, icono, attrsEnlace, avisoExterno, tarjetaNoticia, tarjetaEvento, video, migas, telefonoHref, vacio } from './comun.js';
import { documento } from './layout.js';
import { inventario, urlDoc } from './archivo.js';
import { filaTramite, filaTramiteEnLinea, renderBloques, tarjetaAutoridad } from './bloques.js';
import { franjaVideos } from './videos.js';
import { franjaFotos } from './fotos.js';
import fs from 'node:fs';

// Programas y calendario del CESFAM (de sus publicaciones), para el micrositio de Salud.
const RUTA_CESFAM = new URL('../../contenido/facebook/cesfam.json', import.meta.url);
let cesfam = null, cesfamMtime = 0;
function datosCesfam() {
  try { const st = fs.statSync(RUTA_CESFAM); if (!cesfam || st.mtimeMs !== cesfamMtime) { cesfam = JSON.parse(fs.readFileSync(RUTA_CESFAM, 'utf8')); cesfamMtime = st.mtimeMs; } } catch { return null; }
  return cesfam;
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function seccionesCesfam(ctx) {
  const d = datosCesfam();
  if (!d) return [];
  const programas = d.programas.filter((x) => x.publicaciones);
  const enlace = (x) => (ctx.db.get("SELECT 1 FROM taxonomias WHERE tipo = 'etiqueta' AND slug = ?", x.etiqueta) ? `/etiqueta/${x.etiqueta}/` : `/buscar/?q=${encodeURIComponent(x.nombre)}`);
  const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' }).slice(5);
  const cal = [...d.calendario.filter((c) => c.fecha >= hoy), ...d.calendario.filter((c) => c.fecha < hoy)];
  return [
    programas.length ? { m: { tipo: 'tarjetas', ancla: 'Programas del CESFAM', id: 'cesfam-programas' }, r: html`${cab({ titulo: 'Programas y actividades del CESFAM', intro: 'Lo que el equipo de salud hace en la comuna, según sus publicaciones. Entre a cada programa para ver sus noticias.' })}
      <div class="ms-tarjetas col-4">${programas.map((x, i) => html`<a class="ms-tarjeta" style="--i:${i}" href="${enlace(x)}"><span class="ms-ico">${crudo(icono(x.icono, { tam: 26 }))}</span><small class="ms-etiqueta">${x.publicaciones} ${x.publicaciones === 1 ? 'publicación' : 'publicaciones'}</small><h3>${x.nombre}</h3><p>${x.texto}</p><span class="ms-ir">${crudo(icono('flecha', { tam: 18 }))}</span></a>`)}</div>` } : null,
    { m: { tipo: 'calendario-salud', ancla: 'Calendario', id: 'cesfam-calendario' }, r: html`${cab({ titulo: 'Calendario de la salud', intro: 'Fechas que el CESFAM conmemora cada año con actividades, stands y talleres. La primera es la más próxima.' })}
      <ol class="ms-calendario-salud">${cal.map((c, i) => html`<li${i === 0 ? crudo(' class="proximo"') : ''}><a href="/buscar/?q=${encodeURIComponent(c.buscar)}"><b>${Number(c.fecha.slice(3))}<small>${MESES[Number(c.fecha.slice(0, 2)) - 1].slice(0, 3)}</small></b><span>${c.nombre}${i === 0 ? html`<em>Próxima</em>` : ''}</span></a></li>`)}</ol>` },
  ].filter(Boolean);
}
import { ORGANIGRAMA_MELIPEUCO } from '../../src/organigrama-melipeuco.js';
import { patronUrl, tamanoPatron } from '../../public/js/diseno.js';
import { fecha, hoyLocal, textoPlano, recortar } from '../../src/util.js';

// Mapas que se pueden insertar (los mismos dominios que permite la política de seguridad).
const MAPAS = /^https:\/\/(www\.google\.com\/maps\/|maps\.google\.com\/|www\.openstreetmap\.org\/export\/embed)/;
const cab = (m, extra = '') => (m.titulo || m.intro || extra ? html`<div class="ms-cab"><div>${m.titulo ? html`<h2>${m.titulo}</h2>` : ''}${m.intro ? html`<p>${m.intro}</p>` : ''}</div>${extra}</div>` : '');
const parrafos = (t) => String(t || '').split(/\n{2,}/).filter(Boolean).map((p) => html`<p>${p}</p>`);
const ancla = (m) => 'm-' + m.id;
const normal = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const repoVisible = (ctx, c) => (ctx.repo.visible ? ctx.repo.visible(c) : c.estado === 'publicado');

// La unidad y todas sus oficinas (según el organigrama).
function descendientes(id) {
  const r = new Set([id]);
  for (let n = 0; n < 6; n++) for (const u of ORGANIGRAMA_MELIPEUCO) if (r.has(u.parentId)) r.add(u.id);
  return r;
}

async function modulo(ctx, s, m) {
  switch (m.tipo) {
    case 'contenido': {
      const f = m.filtro.trim(), n = m.cantidad || 6;
      if (m.fuente === 'autoridades') {
        const lista = ctx.repo.listar({ tipo: 'autoridad', publico: true, orden: 'orden', limite: 50 }).items.filter((a) => !f || f.split(/[,\s]+/).includes(a.datos.cargo));
        return lista.length ? html`${cab(m)}<div class="autoridades">${lista.map((a) => tarjetaAutoridad(ctx, a))}</div>` : '';
      }
      if (m.fuente === 'fotos') { const v = franjaFotos(ctx, m.titulo || 'Fotos', { area: f || s.slug, cantidad: n }); return String(v) ? html`${m.intro ? html`<p class="ms-intro-suelta">${m.intro}</p>` : ''}${v}` : ''; }
      if (m.fuente === 'videos') { const v = franjaVideos(m.titulo || 'Videos', { categoria: f, cantidad: n, enlace: f ? `/videos/?categoria=${encodeURIComponent(f)}` : '/videos/' }); return String(v) ? html`${m.intro ? html`<p class="ms-intro-suelta">${m.intro}</p>` : ''}${v}` : ''; }
      const b = { id: 'c' + m.id, tipo: m.fuente, titulo: '', cantidad: n, grupo: f, tipoLugar: f, formulario: f || 'contacto' };
      const r = (await renderBloques(ctx, [b])).map(String).join('');
      return r.trim() ? html`${cab(m)}${crudo(r)}` : '';
    }
    case 'tramites': {
      const deps = m.dependencia ? descendientes(m.dependencia) : new Set();
      const areas = deps.size ? ctx.db.all("SELECT id FROM contenidos WHERE tipo = 'area' AND json_extract(datos, '$.transitoDepartamento') IN (" + [...deps].map(() => '?').join(',') + ')', ...deps).map((x) => x.id) : [];
      const etiqueta = m.etiqueta ? ctx.db.get("SELECT id FROM taxonomias WHERE tipo = 'etiqueta' AND slug = ?", m.etiqueta)?.id : null;
      const vistos = new Set(), locales = [];
      for (const q of [...areas.map((area) => ({ area })), ...(etiqueta ? [{ taxonomia: etiqueta }] : [])]) {
        for (const t of ctx.repo.listar({ tipo: 'tramite', publico: true, orden: 'orden', limite: 50, ...q }).items) if (!vistos.has(t.id)) { vistos.add(t.id); locales.push(t); }
      }
      let enLinea = [];
      if (deps.size) {
        const cat = await ctx.tramites.catalogo().catch(() => null);
        if (cat) { const vinc = new Set(locales.map((t) => t.datos.transitoTramite).filter(Boolean)); enLinea = cat.tramites.filter((t) => deps.has(t.departamentoId) && !vinc.has(t.id)); }
      }
      const n = m.cantidad || 12;
      const todos = [...locales.slice(0, n).map((t) => filaTramite(ctx, t)), ...enLinea.slice(0, Math.max(0, n - locales.length)).map((t) => filaTramiteEnLinea(t))];
      if (!todos.length && !m.vacio) return '';
      return html`${cab(m, html`<a class="ver-todo" href="/tramites/">Todos los trámites</a>`)}${todos.length ? html`<div class="lista-tramites ms-tramites">${todos}</div>` : html`<div class="ms-vacio">${crudo(icono('licencia', { tam: 28 }))}<p>${m.vacio}</p></div>`}`;
    }
    case 'texto': {
      const img = m.imagen ? html`<figure class="ms-texto-img">${ctx.img.imagen(m.imagen, { alt: '', sizes: '(max-width: 900px) 100vw, 520px' })}</figure>` : '';
      return html`<div class="ms-texto${m.imagen ? ' con-img lado-' + m.lado : ''}"><div>${cab(m)}<div class="prosa">${crudo(m.html)}</div>
        ${m.destacado ? html`<blockquote class="ms-frase">${m.destacado}</blockquote>` : ''}
        ${m.botones.length ? html`<div class="botonera">${m.botones.filter((b) => b.url).map((b, i) => html`<a class="boton ${i ? 'boton-secundario' : 'boton-primario'}" ${attrsEnlace(b.url)}>${b.texto}${avisoExterno(b.url)}</a>`)}</div>` : ''}</div>${img}</div>`;
    }
    case 'pestanas': {
      if (!m.items.length) return '';
      return html`${cab(m)}<div class="ms-pestanas" data-ms-pestanas>
        <div class="ms-pestanas-lista" role="tablist" aria-label="${m.titulo || 'Temas'}">${m.items.map((t, i) => html`<button type="button" role="tab" id="${ancla(m)}-t${i}" aria-controls="${ancla(m)}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t.icono ? crudo(icono(t.icono, { tam: 22 })) : ''}<span>${t.titulo}</span></button>`)}</div>
        ${m.items.map((t, i) => html`<div class="ms-panel" role="tabpanel" id="${ancla(m)}-p${i}" aria-labelledby="${ancla(m)}-t${i}"${i ? crudo(' hidden') : ''} tabindex="0">
          <div class="ms-panel-texto"><h3>${t.titulo}</h3><div class="prosa">${crudo(t.html)}</div>
            ${t.puntos.length ? html`<ul class="ms-puntos">${t.puntos.map((p) => html`<li>${crudo(icono('check', { tam: 18 }))}<span>${p}</span></li>`)}</ul>` : ''}
            ${t.enlace ? html`<a class="boton boton-primario" ${attrsEnlace(t.enlace)}>Saber más${avisoExterno(t.enlace)}</a>` : ''}</div>
          ${t.imagen ? html`<figure class="ms-panel-img">${ctx.img.imagen(t.imagen, { alt: '', sizes: '(max-width: 900px) 100vw, 480px' })}</figure>` : html`<div class="ms-panel-ico" aria-hidden="true">${crudo(icono(t.icono || s.tema.icono || 'hoja', { tam: 96 }))}</div>`}
        </div>`)}
      </div>`;
    }
    case 'tarjetas':
      if (!m.items.length) return '';
      return html`${cab(m)}<div class="ms-tarjetas col-${m.columnas}">${m.items.map((t, i) => {
        const dentro = html`<span class="ms-ico">${crudo(icono(t.icono || 'estrella', { tam: 26 }))}</span>${t.etiqueta ? html`<small class="ms-etiqueta">${t.etiqueta}</small>` : ''}<h3>${t.titulo}</h3>${t.texto ? html`<p>${t.texto}</p>` : ''}${t.url ? html`<span class="ms-ir">${crudo(icono('flecha', { tam: 18 }))}</span>` : ''}`;
        return t.url ? html`<a class="ms-tarjeta" style="--i:${i}" ${attrsEnlace(t.url)}>${dentro}${avisoExterno(t.url)}</a>` : html`<div class="ms-tarjeta" style="--i:${i}">${dentro}</div>`;
      })}</div>`;
    case 'cifras':
      if (!m.items.length) return '';
      return html`${cab(m)}<div class="ms-cifras">${m.items.map((c, i) => html`<div class="ms-cifra" style="--i:${i}">${c.icono ? crudo(icono(c.icono, { tam: 26 })) : ''}<b>${c.valor}${c.unidad ? html`<small> ${c.unidad}</small>` : ''}</b><span>${c.etiqueta}</span>${c.nota ? html`<em>${c.nota}</em>` : ''}</div>`)}</div>${m.fuente ? html`<p class="ms-fuente">Fuente: ${m.fuente}</p>` : ''}`;
    case 'pasos':
      if (!m.items.length) return '';
      return html`${cab(m)}<ol class="ms-pasos">${m.items.map((p, i) => html`<li style="--i:${i}"><span class="ms-paso-n">${i + 1}</span>${p.icono ? html`<span class="ms-paso-ico">${crudo(icono(p.icono, { tam: 22 }))}</span>` : ''}<h3>${p.titulo}</h3>${p.texto ? html`<p>${p.texto}</p>` : ''}</li>`)}</ol>`;
    case 'documentos': {
      const inv = inventario();
      // Documento propio, del archivo de Transparencia (por su código) o, si aún no existe, «En preparación».
      const docs = m.items.filter((d) => d.titulo).map((d) => {
        const t = d.doc && inv?.porId.get(d.doc);
        const enlace = d.url || (t ? urlDoc(t) : d.doc ? `/transparencia/documentos/?q=${encodeURIComponent(d.titulo)}` : '');
        return { ...d, enlace, anio: d.anio || (t?.a ? String(t.a) : ''), tipo: d.tipo || t?.c || 'Documento' };
      });
      const fila = (d) => {
        const dentro = html`<span class="ms-doc-ico">${crudo(icono('documento', { tam: 22 }))}</span><span class="ms-doc-txt"><b>${d.titulo}</b>${d.descripcion ? html`<small>${d.descripcion}</small>` : ''}</span><span class="ms-doc-meta">${d.tipo}${d.anio ? html` · ${d.anio}` : ''}</span>`;
        return d.enlace ? html`<li><a ${attrsEnlace(d.enlace)}>${dentro}${crudo(icono('descarga', { tam: 18 }))}${avisoExterno(d.enlace)}</a></li>` : html`<li class="ms-doc-pendiente"><div>${dentro}<span class="ms-pronto">En preparación</span></div></li>`;
      };
      return html`${cab(m)}${docs.length ? html`<ul class="ms-docs">${docs.map(fila)}</ul>`
        : html`<div class="ms-vacio">${crudo(icono('carpeta', { tam: 28 }))}<p>${m.vacio}</p></div>`}`;
    }
    case 'calendario': {
      const hoy = hoyLocal();
      const propios = m.items.filter((a) => a.titulo && (!a.fecha || a.fecha >= hoy)).sort((a, b) => (a.fecha || '9').localeCompare(b.fecha || '9'));
      const cat = m.categoria ? ctx.db.get("SELECT id FROM taxonomias WHERE tipo = 'categoria' AND slug = ?", m.categoria) : null;
      const agenda = cat ? ctx.repo.eventosProximos(30).filter((e) => ctx.categoriasDe(e.id).some((c) => c.id === cat.id)).slice(0, 6) : [];
      if (!propios.length && !agenda.length) return html`${cab(m)}<div class="ms-vacio">${crudo(icono('calendario', { tam: 28 }))}<p>${m.vacio}</p></div>`;
      const dia = (f) => { const d = new Date(f + 'T12:00:00'); return { n: d.getDate(), mes: d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '') }; };
      return html`${cab(m)}<ul class="ms-agenda">${propios.map((a) => { const d = a.fecha ? dia(a.fecha) : null; return html`<li>
          <span class="ms-fecha">${d ? html`<b>${d.n}</b><small>${d.mes}</small>` : html`<small>Por confirmar</small>`}</span>
          <div>${a.tipo ? html`<small class="ms-etiqueta">${a.tipo}</small>` : ''}<h3>${a.titulo}</h3><p class="ms-agenda-meta">${a.fecha ? fecha(a.fecha, { largo: true, diaSemana: true }) : ''}${a.hora ? html` · ${a.hora}` : ''}${a.lugar ? html` · ${a.lugar}` : ''}</p>${a.texto ? html`<p>${a.texto}</p>` : ''}${a.url ? html`<a class="ver-todo" ${attrsEnlace(a.url)}>Más información${avisoExterno(a.url)}</a>` : ''}</div></li>`; })}</ul>
        ${agenda.length ? html`<div class="lista-eventos">${agenda.map((e) => tarjetaEvento(ctx, e))}</div>` : ''}`;
    }
    case 'tabla': {
      const filas = String(m.filas || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split('|').map((c) => c.trim()));
      if (!filas.length) return '';
      return html`${cab(m)}<div class="ms-tabla-caja"><table class="ms-tabla">${m.columnas.length ? html`<thead><tr>${m.columnas.map((c) => html`<th scope="col">${c}</th>`)}</tr></thead>` : ''}<tbody>${filas.map((f) => html`<tr>${f.map((c, i) => (i === 0 ? html`<th scope="row" data-col="${m.columnas[0] || ''}">${c}</th>` : html`<td data-col="${m.columnas[i] || ''}">${c}</td>`))}</tr>`)}</tbody></table></div>${m.nota ? html`<p class="ms-fuente">${m.nota}</p>` : ''}`;
    }
    case 'directorio':
      if (!m.items.length) return '';
      return html`${cab(m)}<div class="ms-directorio">${m.items.map((x) => html`<article class="ms-inst">${x.sigla ? html`<span class="ms-sigla">${x.sigla}</span>` : ''}<h3>${x.nombre}</h3>${x.texto ? html`<p>${x.texto}</p>` : ''}
        <p class="ms-inst-contacto">${x.url ? html`<a ${attrsEnlace(x.url)}>${crudo(icono('enlace', { tam: 16 }))} Sitio web${avisoExterno(x.url)}</a>` : ''}${x.telefono ? html`<a href="${telefonoHref(x.telefono)}">${crudo(icono('telefono', { tam: 16 }))} ${x.telefono}</a>` : ''}${x.email ? html`<a href="mailto:${x.email}">${crudo(icono('correo', { tam: 16 }))} ${x.email}</a>` : ''}</p></article>`)}</div>`;
    case 'mapa':
      return html`${cab(m)}${MAPAS.test(m.url) ? html`<div class="ms-mapa"><iframe title="${m.titulo || 'Mapa'}" src="${m.url}" loading="lazy" style="height:${Math.min(900, Math.max(260, m.alto || 460))}px" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : html`<div class="ms-vacio">${crudo(icono('mapa', { tam: 28 }))}<p>${m.vacio}</p></div>`}
        ${m.leyenda.length ? html`<ul class="ms-leyenda">${m.leyenda.map((l) => html`<li><i style="background:${l.color}"></i>${l.texto}</li>`)}</ul>` : ''}`;
    case 'hitos':
      if (!m.items.length) return '';
      return html`${cab(m)}<ol class="ms-hitos">${m.items.map((x) => html`<li class="ms-hito-${x.estado}"><span class="ms-hito-marca" aria-hidden="true">${x.estado === 'hecho' ? crudo(icono('check', { tam: 16 })) : ''}</span><div><small>${x.periodo}</small><h3>${x.titulo}</h3>${x.texto ? html`<p>${x.texto}</p>` : ''}<span class="ms-hito-estado">${{ hecho: 'Cumplido', curso: 'En curso', pendiente: 'Pendiente' }[x.estado]}</span></div></li>`)}</ol>`;
    case 'faq':
      if (!m.items.length) return '';
      return html`${cab(m)}<div class="ms-faq">${m.items.map((x) => html`<details><summary>${x.pregunta}</summary><div class="prosa">${parrafos(x.respuesta)}</div></details>`)}</div>`;
    case 'noticias': {
      const cat = m.categoria ? ctx.db.get("SELECT id, slug FROM taxonomias WHERE tipo = 'categoria' AND slug = ?", m.categoria) : null;
      let lista = cat ? ctx.repo.listar({ tipo: 'noticia', publico: true, categoria: cat.id, limite: m.cantidad || 6 }).items : [];
      if (lista.length < (m.cantidad || 6) && m.palabras) {
        const vistos = new Set(lista.map((n) => n.id));
        for (const p of m.palabras.split(',').map((x) => x.trim()).filter(Boolean)) {
          // Sólo las que nombran el tema en el título o el resumen (la búsqueda general es más amplia).
          const np = normal(p);
          for (const n of ctx.repo.buscar(p, { tipo: 'noticia', limite: 30 }).items) {
            if (vistos.has(n.id) || n.tipo !== 'noticia') continue;
            const c = ctx.repo.obtener(n.id);
            if (c && repoVisible(ctx, c) && normal(`${c.titulo} ${c.resumen || ''}`).includes(np)) { vistos.add(n.id); lista.push(c); }
          }
        }
        lista = lista.sort((a, b) => String(b.publicado_en || '').localeCompare(String(a.publicado_en || ''))).slice(0, m.cantidad || 6);
      }
      if (!lista.length) return '';
      return html`${cab(m, html`<a class="ver-todo" href="${cat ? `/categoria/${cat.slug}/` : '/noticias/'}">Todas las noticias</a>`)}<div class="grilla-noticias ms-noticias">${lista.map((c) => tarjetaNoticia(ctx, c))}</div>`;
    }
    case 'galeria':
      if (!m.imagenes.length) return '';
      return html`${cab(m)}<div class="galeria ms-galeria" data-galeria>${m.imagenes.filter((i) => i.src).map((i) => html`<a href="${i.src}" class="galeria-item" data-lightbox aria-label="Ampliar imagen${i.alt ? ': ' + i.alt : ''}">${ctx.img.imagen(i.src, { alt: i.alt, sizes: '(max-width: 600px) 50vw, 320px' })}</a>`)}</div>`;
    case 'llamado':
      return html`<div class="ms-llamado">${crudo(icono(m.icono || s.tema.icono || 'megafono', { tam: 40, clase: 'ms-llamado-ico' }))}<div><h2>${m.titulo}</h2>${m.texto ? html`<p>${m.texto}</p>` : ''}</div>
        <div class="botonera">${m.url ? html`<a class="boton boton-acento" ${attrsEnlace(m.url)}>${m.boton || 'Participar'}${avisoExterno(m.url)}</a>` : ''}${m.url2 ? html`<a class="boton ms-boton-claro" ${attrsEnlace(m.url2)}>${m.boton2 || 'Más información'}${avisoExterno(m.url2)}</a>` : ''}</div></div>`;
    case 'enlaces':
      if (!m.items.length) return '';
      return html`${cab(m)}<div class="ms-enlaces">${m.items.filter((x) => x.url).map((x) => html`<a class="ms-enlace" ${attrsEnlace(x.url)}>${crudo(icono(x.icono || 'enlace', { tam: 24 }))}<span><b>${x.texto}</b>${x.descripcion ? html`<small>${x.descripcion}</small>` : ''}</span>${crudo(icono(/^https?:/.test(x.url) ? 'externo' : 'flecha', { tam: 16 }))}${avisoExterno(x.url)}</a>`)}</div>`;
    case 'video':
      return m.url ? html`${cab(m)}<div class="ms-video">${video(m.url, m.titulo || 'Video')}</div>` : '';
    default: return '';
  }
}

// Colores y patrones del micrositio como variables (las usa public/css/sitio.css).
function estiloTema(t) {
  const p = t.patron === 'ninguno' ? '' : t.patron;
  return [`--ms-c:${t.color}`, `--ms-o:${t.oscuro}`, `--ms-a:${t.acento}`,
    p ? `--ms-patron:${patronUrl(p, { color: '#FFFFFF', opacidad: .1 })}` : '', p ? `--ms-patron-claro:${patronUrl(p, { color: t.color, opacidad: .09 })}` : '', p ? `--ms-patron-tam:${tamanoPatron(p, 140)}` : ''].filter(Boolean).join(';');
}

export async function paginaMicrositio(ctx, s) {
  const t = s.tema, po = s.portada, k = s.contacto;
  const modulos = s.modulos.filter((m) => m.visible !== false);
  // Los fondos «automáticos» se alternan para separar las secciones; un llamado siempre va oscuro.
  let alterno = false;
  const hechos = await Promise.all(modulos.map((m) => modulo(ctx, s, m).catch((e) => { console.error('Micrositio', s.slug, m.tipo, e.message); return ''; })));
  const partes = modulos.map((m, i) => {
    const r = hechos[i];
    if (!r || !String(r).trim()) return null;
    const fondo = m.tipo === 'llamado' ? 'llamado' : m.fondo === 'auto' ? ((alterno = !alterno) ? 'claro' : 'suave') : m.fondo;
    return { m, fondo, r };
  }).filter(Boolean);
  if (s.slug === 'salud' || s.organigrama === 'dep-salud') for (const x of seccionesCesfam(ctx)) partes.push({ ...x, fondo: (alterno = !alterno) ? 'claro' : 'suave' });
  // Álbumes de fotos relacionados con el área (de la fototeca), al final de las secciones.
  const fotos = s.modulos.some((m) => m.fuente === 'fotos') ? '' : franjaFotos(ctx, 'Actividades en fotos', { area: s.slug, cantidad: 4 });
  if (String(fotos).trim()) partes.push({ m: { tipo: 'fotos', ancla: 'Fotos', id: 'fotos' }, fondo: (alterno = !alterno) ? 'claro' : 'suave', r: fotos });
  const nav = partes.filter((x) => x.m.ancla);
  const foto = po && t.imagen ? ctx.img.imagen(t.imagen, { alt: '', sizes: t.portada === 'dividida' ? '(max-width: 900px) 100vw, 50vw' : '100vw', prioridad: true }) : '';
  const cuerpo = html`<div class="ms" style="${estiloTema(t)}">
    <section class="ms-hero ms-hero-${t.portada}${foto ? ' con-foto' : ''}" aria-labelledby="ms-titulo">
      ${foto && t.portada === 'foto' ? html`<div class="ms-hero-fondo">${foto}</div>` : ''}
      <div class="ms-hero-dibujo" aria-hidden="true">${crudo(icono(t.icono || 'hoja', { tam: 420 }))}</div>
      <div class="contenedor ms-hero-rejilla">
        <div class="ms-hero-texto">
          ${migas([{ texto: s.nombre }])}
          <p class="ms-antetitulo">${crudo(icono(t.icono || 'hoja', { tam: 18 }))}<span>${po.antetitulo || s.unidad || 'Municipalidad de Melipeuco'}</span></p>
          <h1 id="ms-titulo">${po.titulo || s.nombre}</h1>
          ${po.bajada ? html`<p class="ms-bajada">${po.bajada}</p>` : ''}
          ${po.botones.length ? html`<div class="botonera">${po.botones.filter((b) => b.url).map((b, i) => html`<a class="boton ${i ? 'ms-boton-claro' : 'boton-acento'}" ${attrsEnlace(b.url)}>${b.texto}${avisoExterno(b.url)}</a>`)}</div>` : ''}
        </div>
        ${foto && t.portada === 'dividida' ? html`<figure class="ms-hero-figura">${foto}</figure>` : ''}
      </div>
      ${po.cifras.length ? html`<div class="contenedor"><ul class="ms-hero-cifras">${po.cifras.map((c) => html`<li><b>${c.valor}</b><span>${c.etiqueta}</span></li>`)}</ul></div>` : ''}
      <svg class="ms-hero-onda" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48c180 26 360 34 540 20S900 8 1080 14s270 30 360 40v26H0z"/></svg>
    </section>
    ${nav.length > 1 ? html`<nav class="ms-nav" aria-label="Secciones de ${s.nombre}" data-ms-nav><div class="contenedor"><ul>${nav.map((x) => html`<li><a href="#${ancla(x.m)}">${x.m.ancla}</a></li>`)}</ul></div></nav>` : ''}
    ${partes.map(({ m, fondo, r }) => html`<section class="ms-modulo ms-mod-${m.tipo} ms-fondo-${fondo}" id="${ancla(m)}"><div class="contenedor">${r}</div></section>`)}
    ${k.responsable || k.telefono || k.email || k.direccion ? html`<section class="ms-modulo ms-mod-contacto ms-fondo-claro" id="contacto-unidad"><div class="contenedor"><div class="ms-contacto-caja">
      <div><p class="ms-antetitulo">${crudo(icono('usuario', { tam: 18 }))}<span>Contacto</span></p><h2>${s.unidad || s.nombre}</h2>${k.responsable ? html`<p class="ms-responsable"><b>${k.responsable}</b>${k.cargo ? html`<br><small>${k.cargo}</small>` : ''}</p>` : ''}</div>
      <ul class="ms-datos">
        ${k.telefono ? html`<li>${crudo(icono('telefono', { tam: 20 }))}<a href="${telefonoHref(k.telefono)}">${k.telefono}</a></li>` : ''}
        ${k.email ? html`<li>${crudo(icono('correo', { tam: 20 }))}<a href="mailto:${k.email}">${k.email}</a></li>` : ''}
        ${k.direccion ? html`<li>${crudo(icono('ubicacion', { tam: 20 }))}<span>${k.direccion}</span></li>` : ''}
        ${k.horario ? html`<li>${crudo(icono('reloj', { tam: 20 }))}<span>${k.horario}</span></li>` : ''}
        ${k.redes.filter((r) => r.url).map((r) => html`<li>${crudo(icono('enlace', { tam: 20 }))}<a ${attrsEnlace(r.url)}>${r.texto || r.url}${avisoExterno(r.url)}</a></li>`)}
      </ul></div>
      ${s.actualizado ? html`<p class="ms-actualizado">${crudo(icono('calendario', { tam: 16 }))} Información actualizada al ${fecha(s.actualizado, { largo: true })}.</p>` : ''}
    </div></section>` : ''}
  </div>`;
  return documento(ctx, { titulo: s.nombre, descripcion: s.descripcion || po.bajada, cuerpo, imagen: t.imagen, clase: 'pagina-micrositio', noindex: !s.publicado, canonical: `/${s.slug}/` });
}

// Para el buscador del sitio: el micrositio y sus módulos con título.
const cacheTexto = new WeakMap();
export function textoMicrositio(s) {
  if (cacheTexto.has(s)) return cacheTexto.get(s);
  const t = textoDe(s);
  cacheTexto.set(s, t);
  return t;
}
function textoDe(s) {
  const partes = [s.nombre, s.unidad, s.descripcion, s.portada.titulo, s.portada.bajada];
  for (const m of s.modulos) partes.push(m.titulo, m.intro, textoPlano(m.html || ''), ...(m.items || []).map((x) => [x.titulo, x.texto, x.nombre, x.pregunta, x.etiqueta].filter(Boolean).join(' ')));
  return recortar(partes.filter(Boolean).join(' '), 20000);
}
