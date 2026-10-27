// Plantillas de las vistas públicas.

import { html, crudo, esc, icono, attrsEnlace, avisoExterno, tarjetaNoticia, tarjetaEvento, paginacion, migas, compartir, video, telefonoHref, telefonoTexto, vacio } from './comun.js';
import { documento, encabezado, disenoDe, zona } from './layout.js';
import { centroTransparencia, buscarTransparencia } from './transparencia.js';
import { inventario, buscarArchivo, filaArchivo } from './archivo.js';
import { renderBloques, tarjetaContacto, listaDocumento, tarjetasPaginas, tarjetasAreas, tarjetaAutoridad, filaSesion, directorio, filaTramite, filaTramiteEnLinea } from './bloques.js';
import { fecha, recortar, lectura, hoyLocal } from '../../src/util.js';
import { resumenDe } from '../contenidos.js';
import { completarSecciones, fotosPortada } from '../../public/js/diseno.js';
import { PALETA, SITIO_TREKKING, emblema, logoAnimado, montes, contenidoTrekking } from './trekking.js';

// Antetítulo con el emblema (letra del logo) de la zona.
const antetitulo = (k, texto) => crudo(`<span class="antetitulo" style="--c:${PALETA[k].color}">${emblema(k)}${esc(texto)}</span>`);

// ------------------------------------------------------------------ Portada
export async function portada(ctx) {
  const s = ctx.ajustes;
  const secciones = completarSecciones(s.portada?.secciones).filter((x) => x.activo);
  const partes = [];
  for (const sec of secciones) {
    const r = await seccionPortada(ctx, sec);
    if (r) partes.push(r);
    // Bloques propios colocados después de esta sección (Extensiones → Bloques en zonas).
    const extra = zona(ctx, 'portada:' + sec.id);
    if (String(extra)) partes.push(extra);
  }
  return documento(ctx, { titulo: s.nombre, portada: true, cuerpo: html`${partes}`, clase: 'pagina-portada' });
}

// Carrusel de campañas (banners), en su sección o como protagonista de la portada «portal».
function carruselCampanas(ctx, slides, sizes = '(max-width: 1240px) 100vw, 1200px') {
  const cp = disenoDe(ctx.ajustes).campanas;
  return html`<div class="campanas" data-carrusel data-auto="${cp.autoplay ? cp.intervalo * 1000 : 0}" aria-roledescription="carrusel" aria-label="Campañas municipales">
          <div class="carrusel-pista">${slides.map((sl, i) => {
            const img = html`<picture>${sl.datos.imagenMovil ? html`<source media="(max-width: 640px)" srcset="${sl.datos.imagenMovil}">` : ''}${ctx.img.imagen(sl.imagen, { alt: sl.datos.textoAlt || sl.titulo, sizes, prioridad: i === 0 })}</picture>`;
            return html`<div class="carrusel-item" aria-roledescription="diapositiva" aria-label="${i + 1} de ${slides.length}">${sl.datos.enlace ? html`<a ${attrsEnlace(sl.datos.enlace)}>${img}${avisoExterno(sl.datos.enlace)}</a>` : img}</div>`;
          })}</div>
          ${slides.length > 1 ? html`<button type="button" class="carrusel-ant" aria-label="Campaña anterior">${crudo(icono('flechaIzq'))}</button><button type="button" class="carrusel-sig" aria-label="Campaña siguiente">${crudo(icono('flecha'))}</button><button type="button" class="carrusel-pausa" aria-label="Pausar el carrusel">${crudo(icono('pausa', { tam: 16 }))}</button><div class="carrusel-puntos" role="tablist"></div>` : ''}
        </div>`;
}

// Colores del mosaico de la portada «portal» (de las letras del logo, con buen contraste).
const MOSAICO = [['#E9A92B', '#17191B'], ['#0F3A5A', '#FFFFFF'], ['#1F6FA8', '#FFFFFF'], ['#0E7C86', '#FFFFFF'], ['#2F7D4A', '#FFFFFF'], ['#C9552B', '#FFFFFF'], ['#7A3E91', '#FFFFFF'], ['#3E3E9A', '#FFFFFF']];
const TEMAS_EXTRA = [['Transparencia', '/transparencia/', 'documento'], ['Concejo Municipal', '/concejo-municipal/', 'personas'], ['Horarios de buses', '/transportepublico/', 'bus'], ['OIRS', '/oirs/', 'chat'], ['Emergencias', '/contacto/#emergencias', 'telefono'], ['Juzgado', '/juzgado/', 'balanza']];

async function seccionPortada(ctx, sec) {
  const s = ctx.ajustes;
  switch (sec.id) {
    case 'banners': {
      const dest = await ctx.tramites.destacados();
      const proxima = dest?.proximas?.[0];
      const urgencia = (s.emergencias || [])[0];
      const foto = (w) => `/img/plaza-melipeuco-${w}.webp`;
      const dp = disenoDe(s).portada;
      const franja = html`<div class="franja-datos"><div class="contenedor">
        <div class="dato">${crudo(icono('reloj', { tam: 22 }))}<span><b>Horario de atención</b>${s.horario}</span></div>
        <a class="dato" href="${telefonoHref(s.telefono)}">${crudo(icono('telefono', { tam: 22 }))}<span><b>Teléfono municipal</b>${s.telefono}</span></a>
        ${proxima ? html`<a class="dato" href="${proxima.url}" target="_blank" rel="noopener">${crudo(icono('calendario', { tam: 22 }))}<span><b>Próxima hora disponible</b>${proxima.name}: ${fecha(proxima.date, { diaSemana: true })}${proxima.time ? `, ${proxima.time} hrs.` : ''}</span></a>` : ''}
        ${s.clima?.activo ? html`<div class="dato" data-clima data-lat="${s.mapa?.lat || -38.85}" data-lng="${s.mapa?.lng || -71.69}">${crudo(icono('sol', { tam: 22 }))}<span><b>Tiempo en Melipeuco</b><span class="clima-cargando">Consultando…</span></span></div>` : ''}
        ${urgencia ? html`<a class="dato dato-emergencia" href="/contacto/#emergencias">${crudo(icono('alerta', { tam: 22 }))}<span><b>Emergencias</b>${urgencia.nombre} ${telefonoTexto(urgencia.telefono)}</span></a>` : ''}
      </div></div>`;
      const buscar = html`<form class="hero-buscar" action="/buscar/" method="get" role="search">
              <label for="q-portada">¿Qué necesita hacer?</label>
              <div class="campo-buscar">${crudo(icono('buscar', { tam: 22 }))}<input id="q-portada" name="q" type="search" placeholder="Ej.: licencia, patente, horario de buses" data-sugerencias aria-controls="sugerencias-portada" autocomplete="off"><button class="boton boton-acento" type="submit">Buscar</button></div>
              <div class="sugerencias" id="sugerencias-portada" role="listbox" hidden></div>
            </form>
            <p class="populares"><span>Lo más buscado:</span> <a href="/tramites/?q=licencia">Licencia de conducir</a> <a href="/transportepublico/">Horario de buses</a> <a href="/tramites/pagar-permiso-de-circulacion/">Permiso de circulación</a> <a href="/tramites/obtener-patente-comercial/">Patente comercial</a> <a href="/contacto/">Teléfonos</a></p>`;
      if (dp.composicion === 'portal') {
        // Portada «portal»: franja azul con las campañas como protagonistas y, al lado, el buscador y
        // los temas más consultados; abajo, un mosaico de accesos grandes con los colores del logo.
        const slides = ctx.repo.vigentes('slide');
        // Se dibujan hasta 8; cuántas se ven lo decide «Diseño del sitio» (así la vista previa cambia al instante).
        const accesos = ctx.repo.listar({ tipo: 'acceso', publico: true, orden: 'orden', limite: 8 }).items;
        const temas = [...contenidoTrekking(s).mundos.map((m, k) => ({ nombre: m.nombre, url: m.url, k })), ...TEMAS_EXTRA.map(([nombre, url, ico]) => ({ nombre, url, ico }))];
        const lista = fotosPortada(disenoDe(s));
        const turismo = s.turismo?.url || SITIO_TREKKING;
        const visual = slides.length ? carruselCampanas(ctx, slides, '(max-width: 900px) 100vw, 760px')
          : html`<div class="pt-fotos" data-hero-trekking><div class="tk-fotos">${lista.map((f, i) => html`<img${i === 0 ? crudo(' class="activa" fetchpriority="high"') : crudo(' loading="lazy"')} src="${f.src}" alt="" decoding="async">`)}</div></div>`;
        return html`<section class="hero hero-portal" aria-labelledby="hero-titulo">
          <h1 id="hero-titulo" class="sr" data-diseno="portada.titulo">${dp.titulo}</h1>
          <div class="pt-banda">
            <div class="contenedor pt-rejilla">
              <div class="pt-visual">${visual}</div>
              <div class="pt-panel">
                <a class="tk-logo-caja pt-logo" ${attrsEnlace(turismo)} aria-label="Melipeuco Capital del Trekking: visite el sitio de turismo${/^https?:/.test(turismo) ? ' (se abre en otra pestaña)' : ''}">${crudo(logoAnimado())}</a>
                <p class="pt-saludo" data-diseno="portada.bajada">${dp.bajada || `${s.lema}: trámites, servicios e información de Melipeuco.`}</p>
                ${buscar}
                <h2 class="pt-temas-titulo" data-diseno="portal.temasTitulo">${disenoDe(s).portal.temasTitulo}</h2>
                <ul class="pt-temas">${temas.map((t, i) => html`<li><a class="pt-tema" href="${t.url}" style="--i:${i}">${t.k !== undefined ? crudo(emblema(t.k)) : crudo(icono(t.ico || 'flecha', { tam: 16 }))}<span>${t.nombre}</span></a></li>`)}</ul>
              </div>
            </div>
            <div class="pt-montes" aria-hidden="true">${crudo(montes('var(--fondo)'))}</div>
          </div>
          ${accesos.length ? html`<ul class="contenedor pt-mosaico">${accesos.map((a, i) => html`<li style="--i:${i}"><a class="pt-tile" ${attrsEnlace(a.datos.enlace, a.datos.nuevaVentana)} style="--c:${MOSAICO[i % MOSAICO.length][0]};--t:${MOSAICO[i % MOSAICO.length][1]}"><span class="pt-tile-ico">${crudo(icono(a.datos.icono || 'estrella', { tam: 34 }))}</span><span class="pt-tile-txt">${a.titulo}</span>${avisoExterno(a.datos.enlace, a.datos.nuevaVentana)}</a></li>`)}</ul>` : ''}
        </section>
        ${franja}`;
      }
      if (dp.composicion === 'vitrina') {
        // Portada «vitrina»: a un lado el nombre, el logo vivo y el buscador; al otro, las fotos de
        // la Capital del Trekking en un marco redondeado, con un acceso flotante al sitio de turismo.
        const turismo = s.turismo?.url || SITIO_TREKKING;
        const lista = fotosPortada(disenoDe(s));
        const fotos = lista.map((f, i) => html`<img${i === 0 ? crudo(' class="activa" fetchpriority="high"') : crudo(' loading="lazy"')} src="${f.src}"${f.srcset ? html` srcset="${f.srcset}" sizes="(max-width: 900px) 100vw, 50vw"` : ''} width="1920" height="1280" alt="" decoding="async" data-diseno-img="portada.foto-${i}">`);
        return html`<section class="hero hero-vitrina" aria-labelledby="hero-titulo" data-hero-trekking>
          <div class="contenedor hv-rejilla">
            <div class="hv-texto">
              <h1 id="hero-titulo" class="hv-insignia"><img src="/img/emblema-azul.svg" alt="" width="22" height="18" class="hv-insignia-claro"><img src="/img/emblema-crema.svg" alt="" width="22" height="18" class="hv-insignia-oscuro"><span data-diseno="portada.titulo">${dp.titulo}</span></h1>
              <a class="tk-logo-caja hv-logo" ${attrsEnlace(turismo)} aria-label="Melipeuco Capital del Trekking: visite el sitio de turismo${/^https?:/.test(turismo) ? ' (se abre en otra pestaña)' : ''}">${crudo(logoAnimado())}</a>
              <p class="hero-lema" data-diseno="portada.bajada">${dp.bajada || `${s.lema}. Trámites, servicios e información de la comuna, a los pies del volcán Llaima.`}</p>
              ${buscar}
            </div>
            <div class="hv-visual">
              <div class="hv-marco">
                <div class="tk-fotos">${fotos}</div>
                ${lista.length > 1 ? html`<div class="tk-puntos" role="group" aria-label="Fotografías de la portada">${lista.map((_, i) => html`<button type="button"${i === 0 ? crudo(' class="activa" aria-pressed="true"') : crudo(' aria-pressed="false"')} aria-label="Foto ${i + 1}"></button>`)}</div>` : ''}
                <p class="hero-credito" data-diseno="portada.credito"${dp.credito ? '' : crudo(' hidden')}>${dp.credito}</p>
              </div>
              <a class="hv-flotante" ${attrsEnlace(turismo)}>${crudo(emblema(0))}<span><b>Capital del Trekking</b><small>Rutas, volcanes y lagunas</small></span>${crudo(icono('flecha', { tam: 18 }))}${avisoExterno(turismo)}</a>
            </div>
          </div>
        </section>
        ${franja}`;
      }
      if (dp.composicion === 'trekking') {
        // Portada «Melipeuco Capital del Trekking»: fotos que se funden con zoom lento, el logo de
        // las nueve letras que caen una a una, el buscador y la cordillera en capas (parallax).
        const turismo = s.turismo?.url || SITIO_TREKKING;
        const lista = fotosPortada(disenoDe(s));
        const fotos = lista.map((f, i) => html`<img${i === 0 ? crudo(' class="activa" fetchpriority="high"') : crudo(' loading="lazy"')} src="${f.src}"${f.srcset ? html` srcset="${f.srcset}" sizes="100vw"` : ''} width="1920" height="1280" alt="" decoding="async" data-diseno-img="portada.foto-${i}">`);
        return html`<section class="hero hero-trekking" aria-labelledby="hero-titulo" data-hero-trekking>
          <div class="tk-fotos" data-capa="0.35">${fotos}</div>
          <div class="tk-velo" aria-hidden="true"></div>
          <div class="contenedor tk-hero-contenido" data-capa-contenido>
            <h1 id="hero-titulo" class="tk-kicker"><span class="tk-kicker-linea" aria-hidden="true"></span><span data-diseno="portada.titulo">${dp.titulo}</span><span class="tk-kicker-linea" aria-hidden="true"></span></h1>
            <a class="tk-logo-caja" ${attrsEnlace(turismo)} aria-label="Melipeuco Capital del Trekking: visite el sitio de turismo${/^https?:/.test(turismo) ? ' (se abre en otra pestaña)' : ''}">${crudo(logoAnimado())}</a>
            <p class="hero-lema" data-diseno="portada.bajada">${dp.bajada || `${s.lema}. Trámites, servicios e información de la comuna, a los pies del volcán Llaima.`}</p>
            ${buscar}
          </div>
          ${lista.length > 1 ? html`<div class="tk-puntos" role="group" aria-label="Fotografías de la portada">${lista.map((_, i) => html`<button type="button"${i === 0 ? crudo(' class="activa" aria-pressed="true"') : crudo(' aria-pressed="false"')} aria-label="Foto ${i + 1}"></button>`)}</div>` : ''}
          <p class="hero-credito" data-diseno="portada.credito"${dp.credito ? '' : crudo(' hidden')}>${dp.credito}</p>
          <div class="tk-hero-montes">${crudo(montes('var(--fondo)'))}</div>
        </section>
        ${franja}`;
      }
      return html`<section class="hero" aria-labelledby="hero-titulo">
        <div class="contenedor hero-contenido">
          <div class="hero-texto">
            <h1 id="hero-titulo" data-diseno="portada.titulo">${dp.titulo}</h1>
            <p class="hero-lema" data-diseno="portada.bajada">${dp.bajada || `${s.lema}. Trámites, servicios e información para las vecinas y vecinos de la comuna.`}</p>
            ${buscar}
          </div>
          <figure class="hero-figura">
            ${dp.imagen ? html`<img class="hero-foto" src="${dp.imagen}" alt="" fetchpriority="high" decoding="async" data-diseno-img="portada.imagen">` : html`<img class="hero-foto" src="${foto(1536)}" srcset="${foto(640)} 640w, ${foto(1024)} 1024w, ${foto(1536)} 1536w" sizes="(max-width: 900px) 100vw, 60vw" width="1536" height="800" alt="" fetchpriority="high" decoding="async" data-diseno-img="portada.imagen">`}
            <figcaption class="hero-credito" data-diseno="portada.credito"${dp.credito ? '' : crudo(' hidden')}>${dp.credito}</figcaption>
          </figure>
        </div>
      </section>
      ${franja}`;
    }
    case 'cinta':
      // Cinta que desfila con las palabras del territorio y las nueve letras del logo.
      return html`<div class="tk-cinta" aria-hidden="true"><div class="tk-cinta-pista">${[0, 1].map(() => contenidoTrekking(s).cinta.map((t, i) => html`<span>${t}</span>${crudo(emblema(i % 9))}`))}</div></div>`;
    case 'mundos': {
      const MUNDOS = contenidoTrekking(s).mundos;
      // «Cada letra de Melipeuco es una puerta»: las nueve letras del logo llevan a nueve áreas del municipio.
      return html`<section class="tk-mundos" aria-labelledby="mundos-titulo" data-mundos style="--fc:${PALETA[0].color};--fz:${PALETA[0].oscuro}">
        <div class="tk-mundos-fondo" aria-hidden="true"></div>
        <div class="contenedor">
          <div class="tk-mundos-cabeza">
            <span class="antetitulo">Nueve letras, nueve mundos</span>
            <h2 id="mundos-titulo">${sec.titulo || crudo('Cada letra de <em class="tk-arcoiris">Melipeuco</em> es una puerta')}</h2>
            <p>Montañas, rostros, cascadas, araucarias, corazón, personas, animales, estrellas y el kultrún: el logo de la comuna lleva a cada área del municipio.</p>
          </div>
          <div class="tk-mundos-escena">
            <div class="tk-mundos-gigante" aria-hidden="true">${PALETA.map((_, k) => crudo(`<i data-k="${k}" style="--m:url(/img/trekking/emblema-${k}.svg)"${k ? '' : ' class="activa"'}></i>`))}</div>
            <div class="tk-mundos-info">${MUNDOS.map((m, k) => html`<div class="tk-mundo-info${k ? '' : ' activa'}" data-k="${k}"${k ? crudo(' aria-hidden="true"') : ''}>
              <span class="tk-mundo-paso">${String(k + 1).padStart(2, '0')} / 09 · ${PALETA[k].simbolo}</span>
              <h3>${m.nombre}</h3>
              <p>${m.texto}</p>
              <a href="${m.url}"${k ? crudo(' tabindex="-1"') : ''}>Entrar ${crudo(icono('flecha', { tam: 18 }))}</a>
            </div>`)}</div>
          </div>
          <ul class="tk-mundos-letras">${MUNDOS.map((m, k) => html`<li><a href="${m.url}" data-k="${k}" style="--c:${PALETA[k].color};--o:${PALETA[k].oscuro}"${k ? '' : crudo(' aria-current="true"')}>${crudo(emblema(k))}<span><b>${m.nombre}</b><small>${PALETA[k].simbolo}</small></span></a></li>`)}</ul>
        </div>
      </section>`;
    }
    case 'campanas': {
      const slides = ctx.repo.vigentes('slide');
      // En la portada «portal» las campañas ya están arriba.
      if (!slides.length || disenoDe(s).portada.composicion === 'portal') return '';
      return html`<section class="seccion seccion-campanas" aria-labelledby="campanas-titulo"><div class="contenedor">
        <div class="seccion-cabecera"><div><h2 id="campanas-titulo">${sec.titulo || 'Campañas municipales'}</h2></div></div>
        ${carruselCampanas(ctx, slides)}
      </div></section>`;
    }
    case 'accesos': {
      // En la portada «portal» los primeros ya están en el mosaico de arriba.
      const dzA = disenoDe(s);
      const accesos = ctx.repo.listar({ tipo: 'acceso', publico: true, orden: 'orden', limite: 24 }).items.slice(dzA.portada.composicion === 'portal' ? dzA.portal.mosaico : 0);
      if (!accesos.length) return '';
      return html`<section class="seccion accesos-seccion" id="accesos"><div class="contenedor">
        <div class="seccion-cabecera"><h2>${sec.titulo || 'Accesos rápidos'}</h2></div>
        <ul class="accesos">${accesos.map((a, i) => html`<li><a ${attrsEnlace(a.datos.enlace, a.datos.nuevaVentana)} style="--color:${a.datos.color || 'var(--primario)'};--c:${PALETA[i % 9].color}"><span class="acceso-ico">${crudo(icono(a.datos.icono || 'estrella', { tam: 30 }))}</span><span>${a.titulo}</span>${avisoExterno(a.datos.enlace, a.datos.nuevaVentana)}</a></li>`)}</ul>
      </div></section>`;
    }
    case 'tramites': {
      // Los elegidos en el panel (en su orden); si no hay, los destacados y, si tampoco, los primeros en línea.
      const todos = ctx.repo.listar({ tipo: 'tramite', publico: true, orden: 'orden', limite: 300 }).items;
      const cant = sec.cantidad || 6;
      const elegidos = (sec.ids || []).map((id) => todos.find((t) => t.id === id)).filter(Boolean);
      const destacados = todos.filter((t) => t.destacado);
      const fichas = elegidos.length ? elegidos : (destacados.length ? destacados : todos.filter((t) => t.datos.modalidad !== 'presencial')).slice(0, cant);
      const dest = await ctx.tramites.destacados();
      const proximas = dest?.proximas?.slice(0, 3) || [];
      const enl = ctx.tramites.enlaces;
      return html`<section class="seccion seccion-tramites"><div class="contenedor">
        <div class="seccion-cabecera"><div><h2>${sec.titulo || 'Trámites en línea'}</h2>${sec.texto ? html`<p>${sec.texto}</p>` : ''}</div><a class="ver-todo" href="/tramites/">Todos los trámites</a></div>
        <div class="tramites-portada">
          <div class="lista-tramites">${fichas.map((t) => filaTramite(ctx, t))}</div>
          <aside class="panel-tramites">
            ${proximas.length ? html`<div class="horas-disponibles" data-horas><h3>${crudo(icono('calendario', { tam: 20 }))} Próximas horas disponibles</h3><ul>${proximas.map((p) => html`<li><a href="${p.url}" target="_blank" rel="noopener"><b>${p.name}</b><span>${fecha(p.date, { largo: true, diaSemana: true })}${p.time ? ` · ${p.time} hrs.` : ''}</span><small>${p.free} cupos en los próximos 30 días</small></a></li>`)}</ul></div>` : ''}
            <div class="acciones-tramites">
              <a class="tarjeta-accion" href="/tramites/seguimiento/">${crudo(icono('buscar', { tam: 24 }))}<span><b>Ver el estado de mi trámite</b><small>Con su código de seguimiento y RUN</small></span></a>
              ${ctx.tramites.configurado ? html`<a class="tarjeta-accion" href="${enl.verificar()}" target="_blank" rel="noopener">${crudo(icono('check', { tam: 24 }))}<span><b>Verificar un documento</b><small>Resoluciones y certificados con código</small></span></a>
              <a class="tarjeta-accion" href="${enl.misTramites()}" target="_blank" rel="noopener">${crudo(icono('usuario', { tam: 24 }))}<span><b>Mis trámites con ClaveÚnica</b><small>Todas sus solicitudes en un lugar</small></span></a>` : ''}
              <a class="tarjeta-accion" href="/oirs/">${crudo(icono('chat', { tam: 24 }))}<span><b>Reclamos y sugerencias (OIRS)</b><small>Respuesta en un máximo de 10 días hábiles</small></span></a>
            </div>
          </aside>
        </div>
      </div></section>`;
    }
    case 'noticias': {
      const lista = ctx.repo.listar({ tipo: 'noticia', publico: true, limite: sec.cantidad || 7 }).items;
      if (!lista.length) return '';
      const destacada = lista.find((n) => n.destacado) || lista[0];
      const resto = lista.filter((n) => n !== destacada);
      // Una sola lista: la disposición (mosaico, grilla, revista, lista o carrusel) la decide
      // «Diseño del sitio → Noticias» con CSS, así la vista previa cambia al instante.
      return html`<section class="seccion seccion-noticias"><div class="contenedor">
        <div class="seccion-cabecera"><div><h2>${sec.titulo || 'Últimas noticias'}</h2></div><a class="ver-todo" href="/noticias/">Todas las noticias</a></div>
        <div class="noticias-portada np" data-np>${tarjetaNoticia(ctx, destacada, { grande: true })}<div class="grilla-noticias compacta">${resto.map((c) => tarjetaNoticia(ctx, c))}</div></div>
      </div></section>`;
    }
    case 'eventos': {
      const lista = ctx.repo.eventosProximos(sec.cantidad || 4);
      const s2 = ctx.ajustes;
      return html`<section class="seccion seccion-agenda"><div class="contenedor agenda-portada">
        <div>
          <div class="seccion-cabecera"><div><h2>${sec.titulo || 'Agenda comunal'}</h2></div><a class="ver-todo" href="/eventos/">Ver agenda</a></div>
          ${lista.length ? html`<div class="lista-eventos">${lista.map((c) => tarjetaEvento(ctx, c))}</div>` : vacio('No hay actividades programadas en este momento. Revise la agenda o síganos en redes sociales.', 'calendario')}
        </div>
        <aside class="lateral-portada">
          <div class="emergencias-portada"><h3>${crudo(icono('telefono', { tam: 20 }))} Emergencias</h3><ul>${(s2.emergencias || []).map((e) => html`<li><a href="${telefonoHref(e.telefono)}"><span>${e.nombre}</span><b>${telefonoTexto(e.telefono)}</b></a></li>`)}</ul></div>
        </aside>
      </div></section>`;
    }
    case 'areas': {
      const lista = ctx.repo.listar({ tipo: 'area', publico: true, orden: 'orden', limite: 300 }).items.filter((a) => ['direccion', 'alcaldia', 'juzgado', 'concejo'].includes(a.datos.tipoUnidad) || ['dep-salud', 'dep-educacion', 'dep-transito'].includes(a.datos.transitoDepartamento)).filter((a) => a.datos.enMenu !== false).slice(0, 16);
      if (!lista.length) return '';
      return html`<section class="seccion seccion-areas"><div class="contenedor">
        <div class="seccion-cabecera"><div><h2>${sec.titulo || 'Áreas municipales'}</h2></div><a class="ver-todo" href="/areas/">Todas las áreas</a></div>
        ${tarjetasAreas(ctx, lista)}
      </div></section>`;
    }
    case 'turismo': {
      // «Melipeuco Capital del Trekking»: fila deslizable de atractivos y cifras del territorio.
      const t = ctx.ajustes.turismo;
      if (!t?.url) return '';
      const { lugares, cifras } = contenidoTrekking(s);
      const COLORES_CIFRA = ['var(--cascada)', 'var(--persona)', 'var(--rostro)', '#7FC79A'];
      return html`<section class="tk-trekking" aria-labelledby="trekking-titulo" style="--z:${PALETA[0].color}">
        <div class="tk-trekking-montes">${crudo(montes('var(--tk-noche)'))}</div>
        <div class="contenedor tk-trekking-cabeza">
          <div>
            ${antetitulo(0, t.titulo || 'Melipeuco, Capital del Trekking')}
            <h2 id="trekking-titulo">${sec.titulo || crudo('44 rutas de trekking <em>entre volcanes, glaciares y araucarias</em>')}</h2>
            <p>${t.texto}</p>
          </div>
          <div class="tk-fila-acciones">
            <button class="tk-flecha" type="button" data-mover="-1" aria-label="Lugares anteriores">${crudo(icono('flechaIzq', { tam: 20 }))}</button>
            <button class="tk-flecha" type="button" data-mover="1" aria-label="Más lugares">${crudo(icono('flecha', { tam: 20 }))}</button>
            <a class="boton boton-acento" ${attrsEnlace(t.url)}>${crudo(icono('montana', { tam: 18 }))} Visite la Capital del Trekking${avisoExterno(t.url)}</a>
          </div>
        </div>
        <div class="tk-fila" tabindex="0" aria-label="Lugares para visitar en Melipeuco" data-fila>
          ${lugares.map((l) => html`<a class="tk-foto" ${attrsEnlace(l.url)} style="--c:${PALETA[Math.min(8, Math.max(0, Number(l.letra) || 0))].color}">
            ${l.imagen ? html`<img src="${l.imagen}" alt="" loading="lazy" decoding="async" width="720" height="960">` : ''}
            ${l.tipo ? html`<span class="tk-foto-etiqueta">${l.tipo}</span>` : ''}
            <span class="tk-foto-texto"><b>${l.nombre}</b>${l.texto ? html`<span><span>${l.texto}</span></span>` : ''}</span>${avisoExterno(l.url)}
          </a>`)}
        </div>
        <div class="tk-fila-barra" aria-hidden="true"><i></i></div>
        ${cifras.length ? html`<div class="contenedor tk-cifras">${cifras.map((c, i) => html`<div class="tk-cifra" style="--cc:${COLORES_CIFRA[i % 4]}"><b data-contar="${c.numero}" data-sufijo="${c.sufijo || ''}">${c.numero}${c.sufijo || ''}</b><span>${c.texto}</span></div>`)}</div>` : ''}
      </section>`;
    }
    case 'encuesta': {
      const e = ctx.repo.vigentes('encuesta')[0];
      return e ? html`<section class="seccion"><div class="contenedor angosto">${ctx.encuesta(e)}</div></section>` : '';
    }
    case 'video': {
      const v = ctx.ajustes.video;
      if (!v?.url) return '';
      const ultima = ctx.repo.listar({ tipo: 'sesion', publico: true, orden: 'sesion', limite: 4 }).items;
      return html`<section class="seccion seccion-video"><div class="contenedor video-portada">
        <div><h2>${v.titulo || 'Último video'}</h2>${video(v.url, v.titulo)}</div>
        ${ultima.length ? html`<aside><h3>Sesiones del Concejo</h3><ul class="lista-sesiones compacta">${ultima.map((s) => filaSesion(ctx, s))}</ul><a class="ver-todo" href="/concejo/sesiones/">Todas las sesiones</a></aside>` : ''}
      </div></section>`;
    }
    case 'boletin':
      return ctx.ajustes.boletin?.activo === false ? '' : html`<section class="seccion banda-boletin"><div class="contenedor">${ctx.formulario('suscripcion', { titulo: sec.titulo })}</div></section>`;
    default: return '';
  }
}

// ------------------------------------------------------------------ Noticias
export function listadoNoticias(ctx, { titulo, bajada = '', base, items, pagina, paginas, total, migasItems, filtros = '' }) {
  const cats = ctx.repo.taxonomias('categoria').filter((c) => c.total > 0);
  return documento(ctx, {
    titulo: pagina > 1 ? `${titulo} — página ${pagina}` : titulo, descripcion: bajada || `${titulo}: noticias de la Municipalidad de Melipeuco.`,
    cuerpo: html`${encabezado({ titulo, bajada, migas: migas(migasItems), ctx })}
      <div class="contenedor con-lateral">
        <div>
          ${filtros}
          ${items.length ? html`<div class="grilla-noticias">${items.map((c) => tarjetaNoticia(ctx, c))}</div>` : vacio('No encontramos noticias con esos criterios.', 'buscar')}
          ${paginacion(base, pagina, paginas)}
        </div>
        <aside class="lateral">
          <form class="lateral-bloque" action="/noticias/" method="get" role="search"><label for="q-noticias"><b>Buscar noticias</b></label><div class="campo-buscar chico"><input id="q-noticias" name="q" type="search" placeholder="Palabra clave"><button class="boton boton-primario" aria-label="Buscar">${crudo(icono('buscar', { tam: 18 }))}</button></div></form>
          <nav class="lateral-bloque" aria-label="Categorías"><h2>Categorías</h2><ul class="lista-categorias">${cats.map((c) => html`<li><a href="/categoria/${c.slug}/">${c.nombre}<span>${c.total}</span></a></li>`)}</ul></nav>
          <div class="lateral-bloque"><h2>Archivo</h2><ul class="lista-categorias">${ctx.db.all("SELECT substr(publicado_en,1,4) a, count(*) n FROM contenidos WHERE tipo='noticia' AND estado='publicado' GROUP BY a ORDER BY a DESC").map((r) => html`<li><a href="/${r.a}/">${r.a}<span>${r.n}</span></a></li>`)}</ul></div>
          <p><a class="boton boton-secundario ancho" href="/feed/">${crudo(icono('rss', { tam: 16 }))} Suscribirse por RSS</a></p>
        </aside>
      </div>`,
  });
}

export async function noticia(ctx, c) {
  const url = ctx.repo.urlDe(c);
  const cats = ctx.categoriasDe(c.id);
  const tags = ctx.repo.taxonomiasDe(c.id).filter((t) => t.tipo === 'etiqueta');
  const relacionadas = cats[0] ? ctx.repo.listar({ tipo: 'noticia', publico: true, categoria: cats[0].id, limite: 4 }).items.filter((x) => x.id !== c.id).slice(0, 3) : [];
  const ant = ctx.db.get("SELECT id, slug, titulo, publicado_en, creado FROM contenidos WHERE tipo='noticia' AND estado='publicado' AND publicado_en < ? ORDER BY publicado_en DESC LIMIT 1", c.publicado_en);
  const sig = ctx.db.get("SELECT id, slug, titulo, publicado_en, creado FROM contenidos WHERE tipo='noticia' AND estado='publicado' AND publicado_en > ? AND publicado_en <= ? ORDER BY publicado_en ASC LIMIT 1", c.publicado_en, new Date().toISOString());
  const d = c.datos || {};
  const absoluta = ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + url;
  return documento(ctx, {
    titulo: c.seo?.titulo || c.titulo, descripcion: c.seo?.descripcion || resumenDe(c, 160), imagen: c.seo?.imagen || c.imagen, tipoOg: 'article', editar: c.id, noindex: c.seo?.noindex,
    jsonLd: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: c.titulo, datePublished: c.publicado_en, dateModified: c.modificado, image: c.imagen ? [ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + c.imagen] : undefined, author: { '@type': 'Organization', name: ctx.ajustes.nombre }, publisher: { '@type': 'Organization', name: ctx.ajustes.nombre, logo: { '@type': 'ImageObject', url: ctx.cfg.PUBLIC_URL + 'img/icon-512.png' } }, mainEntityOfPage: absoluta },
    cuerpo: html`<article class="articulo">
      <header class="articulo-cabecera contenedor angosto">
        ${migas([{ texto: 'Noticias', url: '/noticias/' }, ...(cats[0] ? [{ texto: cats[0].nombre, url: `/categoria/${cats[0].slug}/` }] : []), { texto: c.titulo }])}
        ${cats.length ? html`<p class="etiquetas">${cats.map((x) => html`<a class="etiqueta" href="/categoria/${x.slug}/">${x.nombre}</a>`)}</p>` : ''}
        <h1>${c.titulo}</h1>
        ${c.resumen ? html`<p class="bajada">${c.resumen}</p>` : ''}
        <p class="meta"><time datetime="${c.publicado_en}">${fecha(c.publicado_en, { largo: true, diaSemana: true })}</time> · ${lectura(c.cuerpo)} min de lectura</p>
      </header>
      ${c.imagen ? html`<figure class="articulo-imagen contenedor">${ctx.img.imagen(c.imagen, { alt: '', sizes: '(max-width: 1100px) 100vw, 1100px', prioridad: true })}</figure>` : ''}
      <div class="contenedor angosto">
        <div class="prosa">${crudo(c.cuerpo)}</div>
        ${d.video ? video(d.video, c.titulo) : ''}
        ${d.galeria?.length ? html`<div class="galeria" data-galeria>${d.galeria.map((i) => html`<a href="${i.src}" class="galeria-item" data-lightbox>${ctx.img.imagen(i.src, { alt: i.alt, sizes: '300px' })}</a>`)}</div>` : ''}
        ${await renderBloques(ctx, c.bloques, { contenido: c })}
        ${d.fuente ? html`<p class="meta">Fuente: ${d.fuente}</p>` : ''}
        ${tags.length ? html`<p class="etiquetas">${crudo(icono('filtro', { tam: 14 }))} ${tags.map((t) => html`<a class="etiqueta etiqueta-suave" href="/etiqueta/${t.slug}/">${t.nombre}</a>`)}</p>` : ''}
        ${compartir(absoluta, c.titulo)}
        <nav class="anterior-siguiente" aria-label="Otras noticias">
          ${ant ? html`<a href="${ctx.repo.urlDe({ ...ant, tipo: 'noticia' })}" rel="prev"><small>${crudo(icono('flechaIzq', { tam: 14 }))} Anterior</small>${ant.titulo}</a>` : html`<span></span>`}
          ${sig ? html`<a href="${ctx.repo.urlDe({ ...sig, tipo: 'noticia' })}" rel="next" class="sig"><small>Siguiente ${crudo(icono('flecha', { tam: 14 }))}</small>${sig.titulo}</a>` : ''}
        </nav>
      </div>
      ${relacionadas.length ? html`<section class="seccion relacionadas"><div class="contenedor"><h2>Noticias relacionadas</h2><div class="grilla-noticias">${relacionadas.map((x) => tarjetaNoticia(ctx, x))}</div></div></section>` : ''}
    </article>`,
  });
}

// ------------------------------------------------------------------ Páginas
export async function pagina(ctx, c) {
  const plantilla = c.plantilla || 'normal';
  const ruta = [];
  let p = c.padre_id ? ctx.repo.obtener(c.padre_id) : null;
  while (p && ruta.length < 6) { ruta.unshift({ texto: p.titulo, url: ctx.repo.urlDe(p) }); p = p.padre_id ? ctx.repo.obtener(p.padre_id) : null; }
  const hermanas = c.padre_id ? ctx.repo.hijas(c.padre_id) : [];
  const hijas = ctx.repo.hijas(c.id);
  const cuerpo = html`${c.cuerpo ? html`<div class="prosa">${crudo(c.cuerpo)}</div>` : ''}${await renderBloques(ctx, c.bloques, { contenido: c })}${c.datos?.mostrarHijas && hijas.length ? tarjetasPaginas(ctx, hijas) : ''}`;
  const comunes = { titulo: c.seo?.titulo || c.titulo, descripcion: c.seo?.descripcion || resumenDe(c, 160), imagen: c.seo?.imagen || c.imagen, editar: c.id, noindex: c.seo?.noindex };
  if (plantilla === 'aterrizaje') {
    return documento(ctx, { ...comunes, clase: 'plantilla-aterrizaje', cuerpo: html`<h1 class="sr">${c.titulo}</h1><div class="aterrizaje">${cuerpo}</div>` });
  }
  const lateral = plantilla === 'normal' && (hermanas.length > 1 || hijas.length);
  return documento(ctx, {
    ...comunes,
    cuerpo: html`${encabezado({ titulo: c.titulo, bajada: c.datos?.subtitulo || c.resumen, migas: migas([...ruta, { texto: c.titulo }]), ctx })}
      <div class="contenedor ${lateral ? 'con-lateral' : plantilla === 'ancho' ? '' : 'angosto'}">
        <div class="contenido-pagina">${cuerpo}${compartir(ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + ctx.repo.urlDe(c), c.titulo)}<p class="meta actualizado">Última actualización: ${fecha(c.modificado, { largo: true })}</p></div>
        ${lateral ? html`<aside class="lateral"><nav class="lateral-bloque" aria-label="En esta sección"><h2>En esta sección</h2><ul class="lista-categorias">${(hijas.length ? hijas : hermanas).map((h) => html`<li><a href="${ctx.repo.urlDe(h)}"${h.id === c.id ? crudo(' aria-current="page"') : ''}>${h.titulo}</a></li>`)}</ul></nav></aside>` : ''}
      </div>`,
  });
}

// ------------------------------------------------------------------ Trámites
export async function catalogoTramites(ctx, { q = '', area = '', modalidad = '' }) {
  const fichas = ctx.repo.listar({ tipo: 'tramite', publico: true, orden: 'orden', limite: 500 }).items;
  const cat = await ctx.tramites.catalogo();
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nq = norm(q);
  const coincide = (t) => !nq || nq.split(/\s+/).every((p) => norm(t).includes(p));
  const areas = new Map(ctx.repo.listar({ tipo: 'area', publico: true, limite: 500 }).items.map((a) => [a.id, a]));
  const areaDeTransito = new Map([...areas.values()].map((a) => [a.datos.transitoDepartamento, a]));
  // Las fichas del sitio y los trámites en línea de la Plataforma se agrupan por área.
  const vinculados = new Set(fichas.map((t) => t.datos.transitoTramite).filter(Boolean));
  const grupos = new Map();
  const agregar = (areaObj, item) => {
    const raiz = raizArea(areaObj, areas);
    const clave = raiz?.id || 0;
    if (!grupos.has(clave)) grupos.set(clave, { area: raiz, items: [] });
    grupos.get(clave).items.push(item);
  };
  for (const t of fichas) {
    if (!coincide(`${t.titulo} ${t.resumen} ${t.datos.claves || ''}`)) continue;
    if (modalidad && (modalidad === 'en_linea' ? t.datos.modalidad === 'presencial' : t.datos.modalidad !== modalidad)) continue;
    if (area && String(raizArea(areas.get(t.area_id), areas)?.id) !== area) continue;
    agregar(areas.get(t.area_id), filaTramite(ctx, t));
  }
  for (const t of cat?.tramites || []) {
    if (vinculados.has(t.id) || !coincide(`${t.nombre} ${t.descripcion} ${t.categoria}`)) continue;
    if (modalidad === 'presencial') continue;
    const a = areaDeTransito.get(t.departamentoId);
    if (area && String(raizArea(a, areas)?.id) !== area) continue;
    agregar(a, filaTramiteEnLinea(t));
  }
  const listaGrupos = [...grupos.values()].sort((a, b) => (a.area?.orden ?? 999) - (b.area?.orden ?? 999));
  const raices = [...new Set([...fichas.map((t) => raizArea(areas.get(t.area_id), areas)).filter(Boolean)])];
  const total = listaGrupos.reduce((n, g) => n + g.items.length, 0);
  return documento(ctx, {
    titulo: 'Trámites y servicios', descripcion: 'Catálogo de trámites de la Municipalidad de Melipeuco: requisitos, costos, horarios y trámites en línea con reserva de hora y seguimiento.',
    cuerpo: html`${encabezado({ titulo: 'Trámites y servicios', bajada: 'Encuentre qué necesita, dónde hacerlo y si puede hacerlo en línea, sin filas.', migas: migas([{ texto: 'Trámites' }]), ctx })}
      <div class="contenedor">
        <form class="filtros" method="get" action="/tramites/" role="search">
          <div class="campo"><label for="q-tramites">Buscar trámite</label><input id="q-tramites" name="q" type="search" value="${q}" placeholder="Ej.: licencia, patente, maquinaria"></div>
          <div class="campo"><label for="f-area">Área</label><select id="f-area" name="area"><option value="">Todas las áreas</option>${raices.map((a) => html`<option value="${a.id}"${String(a.id) === area ? crudo(' selected') : ''}>${a.datos.nombreCorto || a.titulo}</option>`)}</select></div>
          <div class="campo"><label for="f-modalidad">Modalidad</label><select id="f-modalidad" name="modalidad"><option value="">Todas</option><option value="en_linea"${modalidad === 'en_linea' ? crudo(' selected') : ''}>Se puede hacer en línea</option><option value="presencial"${modalidad === 'presencial' ? crudo(' selected') : ''}>Sólo presencial</option></select></div>
          <button class="boton boton-primario">${crudo(icono('filtro', { tam: 16 }))} Filtrar</button>
        </form>
        <div class="tramites-catalogo">
          <div>
            <p class="resultado-conteo" role="status">${total} ${total === 1 ? 'trámite' : 'trámites'}${q ? html` para «${q}»` : ''}${!cat && ctx.tramites.configurado ? ' · La Plataforma de Trámites no respondió; se muestran las fichas del sitio.' : ''}</p>
            ${listaGrupos.length ? listaGrupos.map((g) => html`<section class="grupo-tramites"><h2>${g.area ? (g.area.datos.nombreCorto || g.area.titulo) : 'Otros trámites'}</h2><div class="lista-tramites">${g.items}</div></section>`) : vacio('No encontramos trámites con esos criterios. Pruebe con otra palabra o escríbanos a la OIRS.', 'buscar')}
          </div>
          <aside class="lateral">
            <div class="lateral-bloque destacado"><h2>${crudo(icono('buscar', { tam: 18 }))} ¿Ya hizo su trámite?</h2><p>Consulte su estado con el código de seguimiento.</p><a class="boton boton-primario ancho" href="/tramites/seguimiento/">Ver el estado</a></div>
            ${ctx.tramites.configurado ? html`<div class="lateral-bloque"><h2>Plataforma de Trámites</h2><p>Ingrese con ClaveÚnica para ver todas sus solicitudes, reservas y documentos.</p><a class="boton boton-secundario ancho" href="${ctx.tramites.enlaces.portal()}" target="_blank" rel="noopener">Ir a la plataforma</a></div>` : ''}
            <div class="lateral-bloque"><h2>¿No encuentra su trámite?</h2><p>Escríbanos y le orientamos.</p><a class="boton boton-secundario ancho" href="/oirs/?tipo=consulta">Hacer una consulta</a></div>
          </aside>
        </div>
      </div>`,
  });
}

function raizArea(a, areas) {
  let x = a, n = 0;
  while (x && n++ < 10) {
    if (['direccion', 'alcaldia', 'juzgado', 'concejo'].includes(x.datos.tipoUnidad) || ['dep-salud', 'dep-educacion', 'dep-transito'].includes(x.datos.transitoDepartamento) || !x.padre_id) return x;
    x = areas.get(x.padre_id);
  }
  return x || null;
}

export async function fichaTramite(ctx, t) {
  const d = t.datos;
  const area = t.area_id ? ctx.repo.obtener(t.area_id) : null;
  const enl = ctx.tramites.enlaces;
  let enLinea = null;
  if (d.transitoTramite && ctx.tramites.configurado) {
    const cat = await ctx.tramites.catalogo();
    enLinea = cat?.tramites.find((x) => x.id === d.transitoTramite) || { id: d.transitoTramite, url: enl.tramite(d.transitoTramite), conHora: true };
  }
  const urlPrincipal = enLinea?.url || d.urlEnLinea;
  const lista = (titulo, items, ico, ordenada = false) => (items?.length ? html`<section class="ficha-seccion"><h2>${crudo(icono(ico, { tam: 22 }))} ${titulo}</h2>${crudo(ordenada ? '<ol class="pasos">' : '<ul class="lista-check">')}${items.map((x) => html`<li>${x}</li>`)}${crudo(ordenada ? '</ol>' : '</ul>')}</section>` : '');
  const relacionados = area ? ctx.repo.listar({ tipo: 'tramite', publico: true, area: area.id, limite: 6, orden: 'orden' }).items.filter((x) => x.id !== t.id) : [];
  return documento(ctx, {
    titulo: t.seo?.titulo || t.titulo, descripcion: t.seo?.descripcion || resumenDe(t, 160), editar: t.id,
    jsonLd: { '@context': 'https://schema.org', '@type': 'GovernmentService', name: t.titulo, description: resumenDe(t, 300), provider: { '@type': 'GovernmentOrganization', name: ctx.ajustes.nombre }, areaServed: 'Melipeuco' },
    cuerpo: html`${encabezado({ titulo: t.titulo, bajada: t.resumen, migas: migas([{ texto: 'Trámites', url: '/tramites/' }, ...(area ? [{ texto: area.datos.nombreCorto || area.titulo, url: ctx.repo.urlDe(area) }] : []), { texto: t.titulo }]), ctx,
      extra: html`<p class="insignias"><span class="insignia insignia-${d.modalidad}">${{ presencial: 'Presencial', en_linea: 'En línea', mixto: 'En línea y presencial' }[d.modalidad]}</span>${d.costo ? html`<span class="insignia">${crudo(icono('billete', { tam: 14 }))} ${d.costo}</span>` : ''}${enLinea?.conHora ? html`<span class="insignia">${crudo(icono('calendario', { tam: 14 }))} Con reserva de hora</span>` : ''}</p>` })}
      <div class="contenedor con-lateral ficha">
        <div>
          ${urlPrincipal ? html`<div class="caja caja-accion">${crudo(icono('licencia', { tam: 28 }))}<div><strong>${d.modalidad === 'presencial' ? 'Prepare su trámite' : 'Puede hacerlo en línea'}</strong><p>${enLinea ? 'Reserve su hora y adjunte sus documentos en la Plataforma Municipal de Trámites. Recibirá un código para seguir su solicitud.' : 'Siga el enlace para realizarlo en línea.'}</p>${enLinea?.conHora ? html`<p class="proxima-hora" data-disponibilidad="${enLinea.id}" data-base="${ctx.cfg.TRAMITES_URL}" aria-live="polite"></p>` : ''}</div><a class="boton boton-acento" ${attrsEnlace(urlPrincipal)}>${d.textoBoton || 'Iniciar trámite en línea'}${avisoExterno(urlPrincipal)}</a></div>` : ''}
          ${d.dirigidoA ? html`<section class="ficha-seccion"><h2>${crudo(icono('personas', { tam: 22 }))} ¿Quiénes pueden hacerlo?</h2><p>${d.dirigidoA}</p></section>` : ''}
          ${lista('Requisitos', d.requisitos, 'check')}
          ${lista('Documentos que debe presentar', d.documentos, 'documento')}
          ${lista('Paso a paso', d.pasos, 'lista', true)}
          ${t.cuerpo ? html`<div class="prosa">${crudo(t.cuerpo)}</div>` : ''}
          ${d.formularios?.length ? html`<section class="ficha-seccion"><h2>${crudo(icono('descarga', { tam: 22 }))} Formularios y enlaces</h2><ul class="lista-documentos">${d.formularios.map((f) => listaDocumento({ titulo: f.titulo, url: f.url }))}</ul></section>` : ''}
          ${d.preguntas?.length ? html`<section class="ficha-seccion"><h2>${crudo(icono('chat', { tam: 22 }))} Preguntas frecuentes</h2><div class="acordeon">${d.preguntas.map((p) => html`<details><summary>${p.pregunta}</summary><p>${p.respuesta}</p></details>`)}</div></section>` : ''}
          ${d.normativa ? html`<section class="ficha-seccion"><h2>${crudo(icono('balanza', { tam: 22 }))} Normativa e información importante</h2><p>${d.normativa}</p></section>` : ''}
          ${await renderBloques(ctx, t.bloques, { contenido: t })}
          ${compartir(ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + ctx.repo.urlDe(t), t.titulo)}
        </div>
        <aside class="lateral">
          <div class="lateral-bloque ficha-resumen"><h2>Resumen</h2><dl>
            ${d.costo ? html`<dt>${crudo(icono('billete', { tam: 16 }))} Costo</dt><dd>${d.costo}</dd>` : ''}
            ${d.plazo ? html`<dt>${crudo(icono('reloj', { tam: 16 }))} Plazo</dt><dd>${d.plazo}</dd>` : ''}
            ${d.lugar ? html`<dt>${crudo(icono('ubicacion', { tam: 16 }))} Dónde</dt><dd>${d.lugar}</dd>` : ''}
            ${d.horario ? html`<dt>${crudo(icono('calendario', { tam: 16 }))} Horario</dt><dd>${d.horario}</dd>` : ''}
            ${area ? html`<dt>${crudo(icono('escudo', { tam: 16 }))} Área</dt><dd><a href="${ctx.repo.urlDe(area)}">${area.titulo}</a></dd>` : ''}
          </dl></div>
          ${d.telefono || d.email ? html`<div class="lateral-bloque"><h2>Contacto</h2>${tarjetaContacto({ telefono: d.telefono, email: d.email })}</div>` : ''}
          ${enLinea ? html`<div class="lateral-bloque"><h2>¿Ya lo inició?</h2><a class="boton boton-secundario ancho" href="/tramites/seguimiento/">Ver el estado de mi trámite</a></div>` : ''}
          ${relacionados.length ? html`<nav class="lateral-bloque" aria-label="Trámites relacionados"><h2>Trámites relacionados</h2><ul class="lista-categorias">${relacionados.map((r) => html`<li><a href="${ctx.repo.urlDe(r)}">${r.titulo}</a></li>`)}</ul></nav>` : ''}
        </aside>
      </div>`,
  });
}

export function seguimiento(ctx, { codigo = '', rut = '' } = {}) {
  const t = ctx.tramites;
  return documento(ctx, {
    titulo: 'Ver el estado de mi trámite', descripcion: 'Consulte el estado de su trámite municipal o de su mensaje OIRS con su código de seguimiento.',
    cuerpo: html`${encabezado({ titulo: 'Ver el estado de mi trámite', bajada: 'Ingrese el código que recibió al iniciar su trámite.', migas: migas([{ texto: 'Trámites', url: '/tramites/' }, { texto: 'Seguimiento' }]), ctx })}
      <div class="contenedor angosto">
        <div class="tarjetas col-2">
          <form class="tarjeta formulario" method="get" action="/tramites/seguimiento/ir/">
            <h2>${crudo(icono('licencia', { tam: 22 }))} Trámites municipales</h2>
            <p>Códigos que empiezan con <b class="mono">MLP-</b>, de la Plataforma Municipal de Trámites (licencias, reservas de hora, solicitudes).</p>
            <div class="campo"><label for="s-codigo">Código de seguimiento</label><input id="s-codigo" name="codigo" required value="${codigo}" placeholder="MLP-XXXXXX" autocapitalize="characters" class="mono"></div>
            <div class="campo"><label for="s-rut">RUN de quien hizo el trámite</label><input id="s-rut" name="rut" value="${rut}" placeholder="12.345.678-9" inputmode="text"></div>
            <button class="boton boton-primario"${t.configurado ? '' : crudo(' disabled')}>Consultar</button>
            ${t.configurado ? '' : html`<p class="meta">La consulta en línea estará disponible cuando se conecte la Plataforma de Trámites.</p>`}
          </form>
          <form class="tarjeta formulario" method="get" action="/oirs/seguimiento/">
            <h2>${crudo(icono('chat', { tam: 22 }))} Mensajes OIRS</h2>
            <p>Códigos que empiezan con <b class="mono">OIRS-</b>, de consultas, reclamos y sugerencias enviados por este sitio.</p>
            <div class="campo"><label for="o-codigo">Código OIRS</label><input id="o-codigo" name="codigo" required placeholder="OIRS-XXXXXX" autocapitalize="characters" class="mono"></div>
            <div class="campo"><label for="o-email">Correo con que lo envió</label><input id="o-email" name="email" type="email" required autocomplete="email"></div>
            <button class="boton boton-primario">Consultar</button>
          </form>
        </div>
        ${t.configurado ? html`<p class="centrado"><a href="${t.enlaces.verificar()}" target="_blank" rel="noopener">${crudo(icono('check', { tam: 16 }))} ¿Recibió una resolución o certificado? Verifique su autenticidad aquí</a></p>` : ''}
      </div>`,
  });
}

// ------------------------------------------------------------------ Eventos
export function agenda(ctx, { mes, pasados = false, pagina = 1 }) {
  const hoy = hoyLocal();
  const [a, m] = (mes || hoy.slice(0, 7)).split('-').map(Number);
  const ini = `${a}-${String(m).padStart(2, '0')}-01`;
  const sigMes = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
  const antMes = m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
  const delMes = ctx.repo.eventosEntre(ini, sigMes + '-01');
  const porDia = new Map();
  for (const e of delMes) { const d = (e.datos.inicio || '').slice(0, 10); if (!porDia.has(d)) porDia.set(d, []); porDia.get(d).push(e); }
  const primerDia = (new Date(a, m - 1, 1).getDay() + 6) % 7;
  const diasMes = new Date(a, m, 0).getDate();
  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(html`<td></td>`);
  for (let d = 1; d <= diasMes; d++) {
    const iso = `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const evs = porDia.get(iso) || [];
    celdas.push(html`<td class="${iso === hoy ? 'hoy' : ''}${evs.length ? ' con-eventos' : ''}"><span class="dia">${d}</span>${evs.slice(0, 3).map((e) => html`<a href="${ctx.repo.urlDe(e)}">${recortar(e.titulo, 34)}</a>`)}${evs.length > 3 ? html`<small>+${evs.length - 3} más</small>` : ''}</td>`);
  }
  const filas = [];
  for (let i = 0; i < celdas.length; i += 7) filas.push(html`<tr>${celdas.slice(i, i + 7)}</tr>`);
  const proximos = ctx.repo.eventosProximos(30);
  const nombreMes = new Date(a, m - 1, 15).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const anteriores = pasados ? ctx.repo.listar({ tipo: 'evento', publico: true, orden: 'eventoDesc', limite: 20, pagina }) : null;
  return documento(ctx, {
    titulo: 'Agenda comunal', descripcion: 'Actividades, ferias, ceremonias, deportes y cultura en Melipeuco.',
    cuerpo: html`${encabezado({ titulo: 'Agenda comunal', bajada: 'Actividades municipales y comunitarias en Melipeuco.', migas: migas([{ texto: 'Agenda' }]), ctx, extra: html`<p><a class="boton boton-secundario" href="/eventos.ics">${crudo(icono('calendario', { tam: 16 }))} Agregar la agenda a mi calendario</a></p>` })}
      <div class="contenedor con-lateral">
        <div>
          <section class="calendario" aria-labelledby="cal-titulo">
            <div class="calendario-cabecera"><a href="/eventos/?mes=${antMes}" aria-label="Mes anterior">${crudo(icono('flechaIzq'))}</a><h2 id="cal-titulo">${nombreMes}</h2><a href="/eventos/?mes=${sigMes}" aria-label="Mes siguiente">${crudo(icono('flecha'))}</a></div>
            <div class="tabla-desplazable"><table><thead><tr>${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => html`<th scope="col">${d}</th>`)}</tr></thead><tbody>${filas}</tbody></table></div>
          </section>
          ${anteriores ? html`<h2>Eventos anteriores</h2><div class="lista-eventos">${anteriores.items.map((e) => tarjetaEvento(ctx, e))}</div>${paginacion('/eventos/', anteriores.pagina, anteriores.paginas, '?pasados=1')}` : ''}
        </div>
        <aside class="lateral">
          <div class="lateral-bloque"><h2>Próximos eventos</h2>${proximos.length ? html`<div class="lista-eventos compacta">${proximos.map((e) => tarjetaEvento(ctx, e))}</div>` : html`<p>No hay eventos programados.</p>`}</div>
          <p><a href="/eventos/?pasados=1">Ver eventos anteriores</a></p>
        </aside>
      </div>`,
  });
}

export async function evento(ctx, c) {
  const d = c.datos;
  const absoluta = ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + ctx.repo.urlDe(c);
  return documento(ctx, {
    titulo: c.titulo, descripcion: resumenDe(c, 160) || `${fecha(d.inicio, { largo: true })} · ${d.lugar || 'Melipeuco'}`, imagen: c.imagen, editar: c.id,
    jsonLd: { '@context': 'https://schema.org', '@type': 'Event', name: c.titulo, startDate: d.inicio, endDate: d.fin || undefined, eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'Place', name: d.lugar || 'Melipeuco', address: d.direccion || 'Melipeuco, La Araucanía' }, organizer: { '@type': 'Organization', name: d.organizador || ctx.ajustes.nombre }, image: c.imagen ? [ctx.cfg.PUBLIC_URL.replace(/\/$/, '') + c.imagen] : undefined },
    cuerpo: html`${encabezado({ titulo: c.titulo, bajada: c.resumen, migas: migas([{ texto: 'Agenda', url: '/eventos/' }, { texto: c.titulo }]), ctx })}
      <div class="contenedor con-lateral">
        <div>
          ${c.imagen ? html`<figure class="figura">${ctx.img.imagen(c.imagen, { alt: '', sizes: '(max-width: 900px) 100vw, 760px' })}</figure>` : ''}
          <div class="prosa">${crudo(c.cuerpo)}</div>
          ${await renderBloques(ctx, c.bloques, { contenido: c })}
          ${d.lat && d.lng ? (await renderBloques(ctx, [{ id: 'mapa-evento', tipo: 'mapa', lat: d.lat, lng: d.lng, zoom: 16, titulo: 'Ubicación', direccion: d.direccion || d.lugar }]))[0] : ''}
          ${compartir(absoluta, c.titulo)}
        </div>
        <aside class="lateral"><div class="lateral-bloque ficha-resumen"><h2>Detalles</h2><dl>
          <dt>${crudo(icono('calendario', { tam: 16 }))} Cuándo</dt><dd>${fecha(d.inicio, { largo: true, diaSemana: true })}${d.inicio?.length > 10 && !d.todoElDia ? html`<br>${d.inicio.slice(11, 16)}${d.fin ? ' a ' + d.fin.slice(11, 16) : ''} hrs.` : ''}${d.fin && d.fin.slice(0, 10) !== d.inicio.slice(0, 10) ? html`<br>hasta el ${fecha(d.fin, { largo: true })}` : ''}</dd>
          ${d.lugar ? html`<dt>${crudo(icono('ubicacion', { tam: 16 }))} Dónde</dt><dd>${d.lugar}${d.direccion ? html`<br>${d.direccion}` : ''}</dd>` : ''}
          ${d.organizador ? html`<dt>${crudo(icono('personas', { tam: 16 }))} Organiza</dt><dd>${d.organizador}</dd>` : ''}
          <dt>${crudo(icono('billete', { tam: 16 }))} Valor</dt><dd>${d.precio || 'Gratuito'}</dd>
        </dl>
        ${d.inscripcion ? html`<a class="boton boton-acento ancho" ${attrsEnlace(d.inscripcion)}>Inscribirme${avisoExterno(d.inscripcion)}</a>` : ''}
        <a class="boton boton-secundario ancho" href="${ctx.repo.urlDe(c)}ics/">${crudo(icono('calendario', { tam: 16 }))} Agregar a mi calendario</a></div></aside>
      </div>`,
  });
}

// ------------------------------------------------------------------ Documentos
export function listadoDocumentos(ctx, { q = '', coleccion = '', pagina = 1 }) {
  const cols = ctx.repo.taxonomias('coleccion');
  const col = cols.find((c) => c.slug === coleccion);
  const r = ctx.repo.listar({ tipo: 'documento', publico: true, q, taxonomia: col?.id, orden: 'documento', limite: 30, pagina });
  return documento(ctx, {
    titulo: col ? col.nombre : 'Documentos y descargas', descripcion: 'Ordenanzas, reglamentos, actas, presupuesto, cuenta pública, bases y formularios de la Municipalidad de Melipeuco.',
    cuerpo: html`${encabezado({ titulo: col ? col.nombre : 'Documentos y descargas', bajada: col?.descripcion || 'Ordenanzas, reglamentos, actas, presupuesto, cuenta pública, bases y formularios.', migas: migas([{ texto: 'Documentos', url: '/documentos/' }, ...(col ? [{ texto: col.nombre }] : [])]), ctx })}
      <div class="contenedor con-lateral">
        <div>
          <form class="filtros" method="get" action="/documentos/" role="search"><div class="campo"><label for="q-docs">Buscar documento</label><input id="q-docs" type="search" name="q" value="${q}"></div>${col ? html`<input type="hidden" name="coleccion" value="${col.slug}">` : ''}<button class="boton boton-primario">Buscar</button></form>
          ${r.items.length ? html`<ul class="lista-documentos">${r.items.map((d) => listaDocumento({ titulo: d.titulo, url: d.datos.archivo, fecha: d.datos.fechaDoc || d.publicado_en, ficha: ctx.repo.urlDe(d) }))}</ul>` : vacio('Aún no hay documentos publicados en esta sección. Para información oficial también puede revisar el Portal de Transparencia.', 'carpeta')}
          ${paginacion('/documentos/', r.pagina, r.paginas, coleccion ? `?coleccion=${coleccion}` : '')}
        </div>
        <aside class="lateral"><nav class="lateral-bloque" aria-label="Colecciones"><h2>Colecciones</h2><ul class="lista-categorias"><li><a href="/documentos/"${!col ? crudo(' aria-current="page"') : ''}>Todos</a></li>${cols.map((c) => html`<li><a href="/documentos/?coleccion=${c.slug}"${c.slug === coleccion ? crudo(' aria-current="page"') : ''}>${c.nombre}<span>${c.total}</span></a></li>`)}</ul></nav>
          <div class="lateral-bloque"><h2>Transparencia Activa</h2><p>La información de la Ley 20.285 se publica en el Portal de Transparencia.</p><a class="boton boton-secundario ancho" href="https://www.portaltransparencia.cl/PortalPdT/directorio-de-organismos-regulados/?org=MU172" target="_blank" rel="noopener noreferrer">Ir al portal</a></div></aside>
      </div>`,
  });
}

export async function fichaGenerica(ctx, c, { migasPadre = [], lateral = '', antes = '', despues = '' } = {}) {
  return documento(ctx, {
    titulo: c.seo?.titulo || c.titulo, descripcion: c.seo?.descripcion || resumenDe(c, 160), imagen: c.imagen, editar: c.id, noindex: c.seo?.noindex,
    cuerpo: html`${encabezado({ titulo: c.titulo, bajada: c.resumen, migas: migas([...migasPadre, { texto: c.titulo }]), ctx })}
      <div class="contenedor ${lateral ? 'con-lateral' : 'angosto'}">
        <div>${antes}${c.cuerpo ? html`<div class="prosa">${crudo(c.cuerpo)}</div>` : ''}${await renderBloques(ctx, c.bloques, { contenido: c })}${despues}</div>
        ${lateral ? html`<aside class="lateral">${lateral}</aside>` : ''}
      </div>`,
  });
}

export async function fichaDocumento(ctx, c) {
  const d = c.datos;
  const cols = ctx.repo.taxonomiasDe(c.id).filter((t) => t.tipo === 'coleccion');
  return fichaGenerica(ctx, c, {
    migasPadre: [{ texto: 'Documentos', url: '/documentos/' }, ...cols.slice(0, 1).map((x) => ({ texto: x.nombre, url: `/documentos/?coleccion=${x.slug}` }))],
    antes: html`<div class="caja caja-info">${crudo(icono('documento', { tam: 26 }))}<div><strong>${c.titulo}</strong><p>${d.numero ? `N° ${d.numero} · ` : ''}${d.fechaDoc ? fecha(d.fechaDoc, { largo: true }) : ''}${d.vigente === false ? ' · No vigente' : ''}</p></div>${d.archivo ? html`<a class="boton boton-primario" href="${d.archivo}" download>${crudo(icono('descarga', { tam: 18 }))} Descargar</a>` : ''}</div>
      ${/\.pdf$/i.test(d.archivo || '') ? html`<iframe class="visor-pdf" src="${d.archivo}" title="Vista previa de ${c.titulo}" loading="lazy"></iframe>` : ''}`,
  });
}

// ------------------------------------------------------------------ Áreas
export function listadoAreas(ctx) {
  const todas = ctx.repo.listar({ tipo: 'area', publico: true, orden: 'orden', limite: 500 }).items.filter((a) => a.datos.enMenu !== false);
  const hijos = new Map();
  for (const a of todas) { const k = a.padre_id || 0; if (!hijos.has(k)) hijos.set(k, []); hijos.get(k).push(a); }
  const arbol = (padre, nivel) => {
    const l = hijos.get(padre) || [];
    if (!l.length) return '';
    return html`<ul class="arbol nivel-${nivel}">${l.map((a) => html`<li><a href="${ctx.repo.urlDe(a)}" style="--color:${a.datos.color || 'var(--primario)'}">${nivel === 0 ? crudo(icono(a.datos.icono || 'escudo', { tam: 18 })) : ''}${a.titulo}</a>${arbol(a.id, nivel + 1)}</li>`)}</ul>`;
  };
  return documento(ctx, {
    titulo: 'Áreas municipales', descripcion: 'Direcciones, departamentos y oficinas de la Municipalidad de Melipeuco con sus funciones, trámites y contactos.',
    cuerpo: html`${encabezado({ titulo: 'Áreas municipales', bajada: 'Conozca cómo se organiza la Municipalidad, qué hace cada área y cómo contactarla.', migas: migas([{ texto: 'Municipio', url: '/municipio/' }, { texto: 'Áreas municipales' }]), ctx })}
      <div class="contenedor">
        <div class="filtro-rapido"><label for="filtro-areas">Filtrar áreas</label><input id="filtro-areas" type="search" data-filtrar=".arbol li" placeholder="Ej.: tránsito, vivienda, salud"></div>
        <div class="arbol-areas">${arbol(0, 0)}</div>
        <p class="meta">Estructura según el Reglamento de Organización Interna N° 12 de 29-04-2025. <a href="/organigrama/">Ver organigrama</a>.</p>
      </div>`,
  });
}

export async function fichaArea(ctx, a) {
  const d = a.datos;
  const hijas = ctx.repo.listar({ tipo: 'area', publico: true, padre: a.id, orden: 'orden', limite: 100 }).items;
  const padre = a.padre_id ? ctx.repo.obtener(a.padre_id) : null;
  const bloquesAuto = [];
  bloquesAuto.push({ id: 'area-tramites', tipo: 'tramites', titulo: 'Trámites y servicios', area: a.id, transitoDepartamento: d.transitoDepartamento, cantidad: 30 });
  if (d.categoriaNoticias) bloquesAuto.push({ id: 'area-noticias', tipo: 'noticias', titulo: 'Noticias', categoria: d.categoriaNoticias, cantidad: 6 });
  return documento(ctx, {
    titulo: a.titulo, descripcion: resumenDe(a, 160), editar: a.id,
    cuerpo: html`${encabezado({ titulo: a.titulo, bajada: d.nombreCorto && d.nombreCorto !== a.titulo ? d.nombreCorto : '', migas: migas([{ texto: 'Áreas municipales', url: '/areas/' }, ...(padre ? [{ texto: padre.datos.nombreCorto || padre.titulo, url: ctx.repo.urlDe(padre) }] : []), { texto: d.nombreCorto || a.titulo }]), ctx })}
      <div class="contenedor con-lateral">
        <div>
          ${a.cuerpo ? html`<div class="prosa">${crudo(a.cuerpo)}</div>` : ''}
          ${d.funciones?.length ? html`<section class="ficha-seccion"><h2>${crudo(icono('lista', { tam: 22 }))} Funciones</h2><ul class="lista-check">${d.funciones.map((f) => html`<li>${f}</li>`)}</ul>${d.norma ? html`<p class="meta">${d.norma}</p>` : ''}</section>` : ''}
          ${await renderBloques(ctx, a.bloques, { contenido: a })}
          ${await renderBloques(ctx, bloquesAuto)}
          ${hijas.length ? html`<section class="ficha-seccion"><h2>Unidades que la integran</h2>${tarjetasAreas(ctx, hijas)}</section>` : ''}
        </div>
        <aside class="lateral">
          ${d.responsable ? html`<div class="lateral-bloque responsable">${d.fotoResponsable ? ctx.img.imagen(d.fotoResponsable, { alt: `Fotografía de ${d.responsable}`, sizes: '120px' }) : ''}<p class="meta">${d.cargoResponsable || 'Jefatura'}</p><p><b>${d.responsable}</b></p></div>` : ''}
          <div class="lateral-bloque"><h2>Contacto</h2>${tarjetaContacto({ telefono: d.telefono, email: d.email, direccion: d.direccion, horario: d.horario }) || html`<p>Mesón de atención: <a href="${telefonoHref(ctx.ajustes.telefono)}">${ctx.ajustes.telefono}</a></p>`}</div>
          <div class="lateral-bloque"><h2>¿Necesita algo de esta área?</h2><a class="boton boton-secundario ancho" href="/oirs/?area=${a.id}">Enviar una consulta</a></div>
        </aside>
      </div>`,
  });
}

// ------------------------------------------------------------------ Concejo
export function listadoSesiones(ctx, { pagina = 1, anio = '' }) {
  const r = ctx.repo.listar({ tipo: 'sesion', publico: true, orden: 'sesion', limite: 25, pagina });
  return documento(ctx, {
    titulo: 'Sesiones del Concejo Municipal', descripcion: 'Sesiones ordinarias y extraordinarias del Concejo Municipal de Melipeuco: tablas, actas y transmisiones.',
    cuerpo: html`${encabezado({ titulo: 'Sesiones del Concejo Municipal', bajada: 'Tablas, acuerdos, actas y transmisiones de cada sesión.', migas: migas([{ texto: 'Concejo Municipal', url: '/concejo-municipal/' }, { texto: 'Sesiones' }]), ctx })}
      <div class="contenedor angosto">
        ${r.items.length ? html`<ul class="lista-sesiones">${r.items.map((s) => filaSesion(ctx, s))}</ul>` : vacio('Aún no hay sesiones publicadas.', 'balanza')}
        ${paginacion('/concejo/sesiones/', r.pagina, r.paginas)}
      </div>`,
  });
}

export async function fichaSesion(ctx, s) {
  const d = s.datos;
  return fichaGenerica(ctx, s, {
    migasPadre: [{ texto: 'Concejo Municipal', url: '/concejo-municipal/' }, { texto: 'Sesiones', url: '/concejo/sesiones/' }],
    antes: html`<p class="insignias"><span class="insignia">${crudo(icono('calendario', { tam: 14 }))} ${fecha(d.fecha, { largo: true, diaSemana: true })}${d.fecha?.length > 10 ? ` · ${d.fecha.slice(11, 16)} hrs.` : ''}</span><span class="insignia">${{ ordinaria: 'Sesión ordinaria', extraordinaria: 'Sesión extraordinaria', especial: 'Sesión especial' }[d.tipoSesion]}</span>${d.numero ? html`<span class="insignia">N° ${d.numero}</span>` : ''}${d.lugar ? html`<span class="insignia">${crudo(icono('ubicacion', { tam: 14 }))} ${d.lugar}</span>` : ''}</p>
      ${d.video ? video(d.video, s.titulo) : ''}
      ${d.tabla?.length ? html`<section class="ficha-seccion"><h2>Tabla</h2><ol class="pasos">${d.tabla.map((x) => html`<li>${x}</li>`)}</ol></section>` : ''}
      ${d.acuerdos?.length ? html`<section class="ficha-seccion"><h2>Acuerdos</h2><ul class="lista-check">${d.acuerdos.map((x) => html`<li>${x}</li>`)}</ul></section>` : ''}
      ${d.acta ? html`<ul class="lista-documentos">${listaDocumento({ titulo: 'Acta de la sesión', url: d.acta })}</ul>` : ''}`,
  });
}

export async function fichaAutoridad(ctx, a) {
  return fichaGenerica(ctx, a, { migasPadre: [{ texto: a.datos.cargo === 'concejal' ? 'Concejo Municipal' : 'Alcaldía', url: a.datos.cargo === 'concejal' ? '/concejo-municipal/' : '/alcaldia-y-concejo-municipal/' }], antes: html`<div class="autoridades">${tarjetaAutoridad(ctx, a)}</div>${a.datos.comisiones?.length ? html`<section class="ficha-seccion"><h2>Comisiones</h2><ul class="lista-check">${a.datos.comisiones.map((x) => html`<li>${x}</li>`)}</ul></section>` : ''}`, despues: a.datos.audiencias ? html`<p><a class="boton boton-primario" ${attrsEnlace(a.datos.audiencias)}>Solicitar audiencia (Ley del Lobby)${avisoExterno(a.datos.audiencias)}</a></p>` : '' });
}

// ------------------------------------------------------------------ Contacto, OIRS, búsqueda y otras
export function contacto(ctx, { mensaje = '' } = {}) {
  const s = ctx.ajustes;
  return documento(ctx, {
    titulo: 'Contacto y directorio telefónico', descripcion: 'Teléfonos municipales, correos institucionales, emergencias, horarios de atención y formulario de contacto de la Municipalidad de Melipeuco.',
    cuerpo: html`${encabezado({ titulo: 'Contacto y directorio', bajada: s.horario, migas: migas([{ texto: 'Contacto' }]), ctx })}
      <div class="contenedor con-lateral">
        <div>
          ${mensaje}
          <section class="ficha-seccion" id="emergencias"><h2>${crudo(icono('alerta', { tam: 22 }))} Emergencias</h2>${directorio(ctx, 'emergencia') || html`<ul>${(s.emergencias || []).map((e) => html`<li><a href="${telefonoHref(e.telefono)}">${e.nombre}: ${telefonoTexto(e.telefono)}</a></li>`)}</ul>`}</section>
          <section class="ficha-seccion"><h2>${crudo(icono('telefono', { tam: 22 }))} Teléfonos y correos municipales</h2>
            <div class="filtro-rapido"><label for="filtro-dir">Buscar en el directorio</label><input id="filtro-dir" type="search" data-filtrar=".directorio-fila" placeholder="Ej.: tránsito, vivienda, juzgado"></div>
            ${directorio(ctx, 'municipal')}</section>
          <section class="ficha-seccion"><h2>${crudo(icono('salud', { tam: 22 }))} Salud</h2>${directorio(ctx, 'salud')}</section>
          <section class="ficha-seccion"><h2>${crudo(icono('escuela', { tam: 22 }))} Educación</h2>${directorio(ctx, 'educacion')}</section>
          ${directorio(ctx, 'servicios') ? html`<section class="ficha-seccion"><h2>Servicios públicos</h2>${directorio(ctx, 'servicios')}</section>` : ''}
          <p class="meta">Si algún número no responde, avísenos a <a href="mailto:informatica@munimelipeuco.cl">informatica@munimelipeuco.cl</a>.</p>
          <section class="ficha-seccion" id="escribanos">${ctx.formulario('contacto', { titulo: 'Escríbanos' })}</section>
        </div>
        <aside class="lateral">
          <div class="lateral-bloque"><h2>Municipalidad de Melipeuco</h2>${tarjetaContacto({ telefono: s.telefono, whatsapp: s.whatsapp, email: s.email, direccion: s.direccion, mapa: s.mapa?.enlace, horario: s.horario })}</div>
          <div class="mapa chico"><iframe title="Mapa: Municipalidad de Melipeuco" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${s.mapa.lng - 0.006},${s.mapa.lat - 0.004},${s.mapa.lng + 0.006},${s.mapa.lat + 0.004}&amp;layer=mapnik&amp;marker=${s.mapa.lat},${s.mapa.lng}"></iframe></div>
        </aside>
      </div>`,
  });
}

export function oirs(ctx, { tipo = 'consulta', area = '', mensaje = '' } = {}) {
  const plazo = ctx.ajustes.oirs?.plazoDias || 10;
  return documento(ctx, {
    titulo: 'OIRS: consultas, reclamos y sugerencias', descripcion: 'Oficina de Informaciones, Reclamos y Sugerencias de la Municipalidad de Melipeuco: envíe su mensaje y reciba un código de seguimiento.',
    cuerpo: html`${encabezado({ titulo: 'Consultas, reclamos y sugerencias', bajada: `Oficina de Informaciones, Reclamos y Sugerencias (OIRS). Respondemos en un máximo de ${plazo} días hábiles.`, migas: migas([{ texto: 'Trámites', url: '/tramites/' }, { texto: 'OIRS' }]), ctx })}
      <div class="contenedor con-lateral">
        <div>${mensaje}${ctx.formulario('oirs', { tipo, areaId: area })}</div>
        <aside class="lateral">
          <div class="lateral-bloque"><h2>¿Ya envió un mensaje?</h2><form method="get" action="/oirs/seguimiento/" class="formulario"><div class="campo"><label for="ls-cod">Código</label><input id="ls-cod" name="codigo" class="mono" placeholder="OIRS-XXXXXX" required></div><div class="campo"><label for="ls-mail">Su correo</label><input id="ls-mail" name="email" type="email" required></div><button class="boton boton-secundario ancho">Ver respuesta</button></form></div>
          <div class="lateral-bloque"><h2>Otras vías</h2><p>Presencial en Oficina de Partes (primer piso), de lunes a viernes de 08:30 a 13:30 hrs., o al teléfono <a href="${telefonoHref(ctx.ajustes.telefono)}">${ctx.ajustes.telefono}</a>.</p><p>Para pedir información pública use la <a href="https://www.portaltransparencia.cl/PortalPdT/ingreso-sai-v2?idOrg=608" target="_blank" rel="noopener noreferrer">Ley de Transparencia</a>.</p></div>
        </aside>
      </div>`,
  });
}

export function resultadoMensaje(ctx, m, { recien = false } = {}) {
  const estados = { nuevo: 'Recibido', en_proceso: 'En proceso', respondido: 'Respondido', cerrado: 'Cerrado' };
  return documento(ctx, {
    titulo: recien ? 'Mensaje recibido' : 'Estado de su mensaje', noindex: true,
    cuerpo: html`${encabezado({ titulo: recien ? '¡Recibimos su mensaje!' : 'Estado de su mensaje', migas: migas([{ texto: 'OIRS', url: '/oirs/' }, { texto: m.codigo }]), ctx })}
      <div class="contenedor angosto">
        <div class="caja caja-exito">${crudo(icono('check', { tam: 26 }))}<div><strong>Código de seguimiento: <span class="mono">${m.codigo}</span></strong><p>${recien ? 'Guárdelo para consultar la respuesta. También se lo enviamos por correo si lo indicó.' : ''}</p></div></div>
        <dl class="ficha-resumen"><dt>Tipo</dt><dd>${ctx.ajustes.oirs?.tipos?.[m.tipo] || m.tipo}</dd><dt>Asunto</dt><dd>${m.asunto}</dd><dt>Enviado</dt><dd>${fecha(m.creado, { largo: true, hora: true })}</dd><dt>Estado</dt><dd><span class="insignia">${estados[m.estado] || m.estado}</span></dd>${m.externo ? html`<dt>Plataforma de Trámites</dt><dd class="mono">${m.externo}</dd>` : ''}</dl>
        ${m.respuesta ? html`<section class="ficha-seccion"><h2>Respuesta</h2><div class="prosa"><p>${crudo(esc(m.respuesta).replace(/\n/g, '<br>'))}</p></div><p class="meta">${fecha(m.respondido_en, { largo: true, hora: true })}</p></section>` : ''}
        <p><a class="boton boton-secundario" href="/">Volver al inicio</a></p>
      </div>`,
  });
}

export function busqueda(ctx, { q, tipo = '', pagina = 1, resultados, tramitesEnLinea = [] }) {
  const etiquetas = { pagina: 'Página', noticia: 'Noticia', tramite: 'Trámite', evento: 'Evento', documento: 'Documento', area: 'Área municipal', autoridad: 'Autoridad', sesion: 'Sesión del Concejo', lugar: 'Turismo', encuesta: 'Encuesta' };
  const resaltar = (s) => crudo(esc(s || '').replace(/\[\[/g, '<mark>').replace(/\]\]/g, '</mark>'));
  const paginas = Math.max(1, Math.ceil(resultados.total / 20));
  return documento(ctx, {
    titulo: q ? `Resultados para «${q}»` : 'Buscar en el sitio', noindex: true,
    cuerpo: html`${encabezado({ titulo: 'Buscar en el sitio', migas: migas([{ texto: 'Buscar' }]), ctx })}
      <div class="contenedor angosto">
        <form action="/buscar/" method="get" role="search" class="buscar-grande"><label for="q-busqueda" class="sr">Buscar</label><div class="campo-buscar">${crudo(icono('buscar', { tam: 22 }))}<input id="q-busqueda" type="search" name="q" value="${q}" placeholder="Escriba lo que busca" autofocus data-sugerencias aria-controls="sug-busqueda"><button class="boton boton-primario">Buscar</button></div><div class="sugerencias" id="sug-busqueda" role="listbox" hidden></div>
          <div class="chips">${[['', 'Todo'], ['tramite', 'Trámites'], ['noticia', 'Noticias'], ['pagina', 'Páginas'], ['evento', 'Eventos'], ['documento', 'Documentos'], ['area', 'Áreas']].map(([k, v]) => html`<a href="/buscar/?q=${encodeURIComponent(q)}${k ? '&tipo=' + k : ''}" class="chip"${tipo === k ? crudo(' aria-current="true"') : ''}>${v}</a>`)}</div>
        </form>
        ${q ? html`<p class="resultado-conteo" role="status">${resultados.total + tramitesEnLinea.length} resultados para «${q}»</p>` : ''}
        ${(() => { const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); const p = norm(q).split(/\s+/).filter((x) => x.length > 2); const t = p.length && ctx.ext ? buscarTransparencia(ctx.ext.leer(), p, norm) : []; return t.length ? html`<section class="ficha-seccion"><h2>Transparencia</h2><ul class="ct-materias ct-compacta">${t.map((m) => html`<li><a class="ct-materia" href="${m.url}"${m.externo ? crudo(' target="_blank" rel="noopener"') : ''}><span class="ct-ico">${crudo(icono('documento', { tam: 20 }))}</span><span class="ct-txt"><b>${m.titulo}</b><small>${m.fragmento}</small></span></a></li>`)}</ul></section>` : ''; })()}
        ${(() => { const inv = q ? inventario() : null; const d = inv ? buscarArchivo(inv, q, { limite: 8 }) : []; return d.length ? html`<section class="ficha-seccion"><h2>Documentos de Transparencia</h2><ul class="ar-lista">${d.map((x) => filaArchivo(x))}</ul><a class="ver-todo" href="/transparencia/documentos/?q=${encodeURIComponent(q)}">Ver todos los documentos para «${q}»</a></section>` : ''; })()}
        ${tramitesEnLinea.length ? html`<section class="ficha-seccion"><h2>Trámites en línea</h2><div class="lista-tramites">${tramitesEnLinea.map((t) => filaTramiteEnLinea(t))}</div></section>` : ''}
        ${resultados.items.length ? html`<ol class="resultados">${resultados.items.map((r) => html`<li><span class="etiqueta">${etiquetas[r.tipo] || r.tipo}</span><h2><a href="${ctx.repo.urlDe(r)}">${r.titulo}</a></h2><p>${resaltar(r.fragmento)}</p>${r.tipo === 'noticia' ? html`<p class="meta">${fecha(r.publicado_en, { largo: true })}</p>` : ''}</li>`)}</ol>` : q && !tramitesEnLinea.length ? vacio('No encontramos resultados. Pruebe con otras palabras, revise el catálogo de trámites o escríbanos a la OIRS.', 'buscar') : ''}
        ${paginacion('/buscar/', pagina, paginas, `?q=${encodeURIComponent(q)}${tipo ? '&tipo=' + tipo : ''}`)}
      </div>`,
  });
}

export function transparencia(ctx) {
  const enlaces = ctx.repo.menu('superior');
  return documento(ctx, {
    titulo: 'Transparencia', descripcion: 'Transparencia activa y pasiva, Ley del Lobby, declaraciones de patrimonio e intereses y documentos municipales.',
    cuerpo: html`${encabezado({ titulo: 'Transparencia y probidad', bajada: 'Acceso a la información pública de la Municipalidad de Melipeuco (Ley 20.285), Ley del Lobby (Ley 20.730) y probidad (Ley 20.880).', migas: migas([{ texto: 'Transparencia' }]), ctx })}
      <div class="contenedor">
        <div class="tarjetas col-3">${enlaces.map((e) => html`<a class="tarjeta" ${attrsEnlace(e.url, e.nueva)}><span class="tarjeta-ico">${crudo(icono(e.icono || 'documento', { tam: 26 }))}</span><h3>${e.texto}</h3>${avisoExterno(e.url, e.nueva)}</a>`)}
          <a class="tarjeta" href="/documentos/"><span class="tarjeta-ico">${crudo(icono('carpeta', { tam: 26 }))}</span><h3>Documentos municipales</h3><p>Ordenanzas, reglamentos, presupuesto y cuenta pública.</p></a>
          <a class="tarjeta" href="/concejo/sesiones/"><span class="tarjeta-ico">${crudo(icono('balanza', { tam: 26 }))}</span><h3>Sesiones del Concejo</h3><p>Tablas, actas y transmisiones.</p></a>
          <a class="tarjeta" href="/listado-de-prestadores-de-servicio-melipeuco/"><span class="tarjeta-ico">${crudo(icono('personas', { tam: 26 }))}</span><h3>Prestadores de servicios</h3><p>Listado de prestadores de servicio de Melipeuco.</p></a>
          <a class="tarjeta" href="/oirs/"><span class="tarjeta-ico">${crudo(icono('chat', { tam: 26 }))}</span><h3>OIRS</h3><p>Consultas, reclamos y sugerencias.</p></a>
        </div>
        ${centroTransparencia(ctx.ext ? ctx.ext.leer() : {})}
      </div>`,
  });
}

export function mapaDelSitio(ctx) {
  const menu = ctx.repo.menu('principal');
  const paginas = ctx.repo.listar({ tipo: 'pagina', publico: true, orden: 'titulo', limite: 500 }).items;
  return documento(ctx, {
    titulo: 'Mapa del sitio',
    cuerpo: html`${encabezado({ titulo: 'Mapa del sitio', migas: migas([{ texto: 'Mapa del sitio' }]), ctx })}
      <div class="contenedor"><div class="mapa-sitio">
        ${menu.map((i) => html`<section><h2><a ${attrsEnlace(i.url, i.nueva)}>${i.texto}</a></h2>${i.hijos?.length ? html`<ul>${i.hijos.map((h) => html`<li><a ${attrsEnlace(h.url, h.nueva)}>${h.texto}</a></li>`)}</ul>` : ''}</section>`)}
        <section><h2>Todas las páginas</h2><ul>${paginas.map((p) => html`<li><a href="${ctx.repo.urlDe(p)}">${p.titulo}</a></li>`)}</ul></section>
      </div></div>`,
  });
}

export function accesibilidad(ctx) {
  return documento(ctx, {
    titulo: 'Accesibilidad',
    cuerpo: html`${encabezado({ titulo: 'Declaración de accesibilidad', migas: migas([{ texto: 'Accesibilidad' }]), ctx })}
      <div class="contenedor angosto prosa">
        <p>La Municipalidad de Melipeuco trabaja para que su sitio web pueda ser usado por todas las personas, de acuerdo con la Ley 21.180 de Transformación Digital del Estado, la Norma Técnica de Accesibilidad y las pautas WCAG 2.2 nivel AA.</p>
        <h2>Lo que puede hacer en este sitio</h2>
        <ul><li>Agrandar o achicar el texto con los botones <b>A+</b> y <b>A−</b> de la barra superior (se recuerda en su equipo).</li><li>Activar el <b>alto contraste</b> y el <b>modo oscuro</b>.</li><li>Navegar con el teclado: use <kbd>Tab</kbd> y el enlace «Saltar al contenido».</li><li>Usar lectores de pantalla: las imágenes tienen descripciones y los enlaces que abren otra pestaña lo indican.</li><li>Leer con la tipografía Atkinson Hyperlegible, diseñada para personas con baja visión.</li></ul>
        <h2>Contenido heredado</h2><p>Algunas páginas del sitio anterior se conservan en su formato original mientras se actualizan. Si encuentra una barrera, avísenos.</p>
        <h2>¿Encontró un problema?</h2><p>Escríbanos a <a href="mailto:informatica@munimelipeuco.cl">informatica@munimelipeuco.cl</a> o use el <a href="/oirs/?tipo=reclamo">formulario OIRS</a>. Responderemos en un máximo de 10 días hábiles.</p>
      </div>`,
  });
}

export function noEncontrado(ctx, sugerencias = []) {
  return documento(ctx, {
    titulo: 'Página no encontrada', noindex: true,
    cuerpo: html`<section class="error-404 contenedor angosto">
      <p class="error-codigo" aria-hidden="true">404</p>
      <h1>No encontramos esta página</h1>
      <p>Puede que la dirección haya cambiado o que el contenido ya no esté disponible.</p>
      <form action="/buscar/" method="get" role="search" class="buscar-grande"><label for="q-404" class="sr">Buscar</label><div class="campo-buscar">${crudo(icono('buscar', { tam: 22 }))}<input id="q-404" type="search" name="q" placeholder="Busque lo que necesita"><button class="boton boton-primario">Buscar</button></div></form>
      ${sugerencias.length ? html`<h2>¿Quiso decir…?</h2><ul class="lista-categorias">${sugerencias.map((s) => html`<li><a href="${ctx.repo.urlDe(s)}">${s.titulo}</a></li>`)}</ul>` : ''}
      <p><a class="boton boton-primario" href="/">Ir al inicio</a> <a class="boton boton-secundario" href="/tramites/">Ver trámites</a> <a class="boton boton-secundario" href="/contacto/">Contacto</a></p>
    </section>`,
  });
}

export function mantenimiento(ctx) {
  return `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(ctx.ajustes.nombre)}</title><link rel="stylesheet" href="/css/sitio.css?v=${ctx.version}"></head><body class="mantenimiento"><main class="contenedor angosto centrado"><img src="/img/escudo-azul.svg" alt="" width="160" height="150" style="width:160px;height:auto"><h1>${esc(ctx.ajustes.nombre)}</h1><p>${esc(ctx.ajustes.mantenimiento?.mensaje || 'Sitio en mantenimiento.')}</p><p>Teléfono: <a href="tel:+56233848813">${esc(ctx.ajustes.telefono)}</a></p></main></body></html>`;
}
