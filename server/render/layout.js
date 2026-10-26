// Documento HTML completo: cabecera institucional, menú, avisos, pie y metadatos (SEO,
// Open Graph, datos estructurados). Todas las páginas públicas pasan por aquí.

import { html, crudo, esc, icono, attrsEnlace, avisoExterno, telefonoHref, telefonoTexto } from './comun.js';
import { textoPlano, recortar } from '../../src/util.js';
import { plantillaIntro, SCRIPT_INTRO } from './intro.js';
import { escudoVivo } from './escudo.js';
import { normalizar, migrar, variablesCss, atributos, urlFuentes, logoCabecera } from '../../public/js/diseno.js';
import { MUNDOS, SITIO_TREKKING, zonaDe, estiloZona, emblema, montes, cortinaCordillera } from './trekking.js';

// Diseño personalizado desde el panel (Diseño del sitio), normalizado una vez por versión de ajustes.
// Sin diseño guardado se usa el predeterminado (Capital del Trekking); los colores antiguos de
// la semilla no cuentan como elección propia, los que se hayan cambiado sí.
const cacheDiseno = new WeakMap();
const COLORES_SEMILLA = ['#0B4F7C#F2A900#062B45', '#1F6FA8#E9A92B#121417', '#1F6FA8#E9A92B#0F3A5A'];
export function disenoDe(s) {
  if (!cacheDiseno.has(s)) {
    const c = s.colores || {};
    const propios = c.primario && !COLORES_SEMILLA.includes([c.primario, c.acento, c.oscuro].join('').toUpperCase());
    cacheDiseno.set(s, normalizar(migrar(s.diseno) || { colores: propios ? { primario: c.primario, acento: c.acento, oscuro: c.oscuro } : {} }));
  }
  return cacheDiseno.get(s);
}

// Emblema (letra del logo) de los enlaces del menú que llevan a uno de los nueve mundos.
const EMBLEMA_URL = new Map(MUNDOS.map((m, k) => [m.url, k]));

const NIVELES = { info: 'info', alerta: 'alerta', emergencia: 'alerta', exito: 'check' };

export function avisos(ctx, { portada = false } = {}) {
  const lista = ctx.repo.vigentes('aviso').filter((a) => portada || a.datos.enTodas);
  if (!lista.length) return '';
  return html`<div class="avisos" role="region" aria-label="Avisos importantes">${lista.map((a) => html`
    <div class="aviso aviso-${a.datos.nivel || 'info'}" data-aviso="${a.id}" ${crudo(a.datos.nivel === 'emergencia' ? 'role="alert"' : '')}>
      <div class="contenedor">
        ${crudo(icono(NIVELES[a.datos.nivel] || 'info', { tam: 22 }))}
        <div class="aviso-texto"><strong>${a.titulo}</strong>${a.cuerpo ? html` ${crudo(a.cuerpo.replace(/<\/?p>/g, ' '))}` : ''}</div>
        ${a.datos.enlace ? html`<a class="aviso-enlace" ${attrsEnlace(a.datos.enlace)}>Más información${avisoExterno(a.datos.enlace)}</a>` : ''}
        <button type="button" class="aviso-cerrar" data-cerrar-aviso aria-label="Ocultar este aviso">${crudo(icono('cerrar', { tam: 18 }))}</button>
      </div>
    </div>`)}</div>`;
}

function menuPrincipal(ctx) {
  const items = ctx.repo.menu('principal');
  const actual = ctx.ruta;
  const activo = (i) => i.url !== '/' && (actual === i.url || (i.url.length > 1 && actual.startsWith(i.url)) || (i.hijos || []).some((h) => h.url === actual));
  return html`<ul class="nav-lista">${items.map((i, n) => (i.hijos?.length
    ? html`<li class="nav-item tiene-sub${activo(i) ? ' activo' : ''}">
        <button type="button" class="nav-boton" aria-expanded="false" aria-controls="sub-${n}">${i.texto}${crudo(icono('abajo', { tam: 16 }))}</button>
        <div class="submenu" id="sub-${n}"><ul>
          ${i.hijos.map((h) => html`<li><a ${attrsEnlace(h.url, h.nueva)}${h.url === actual ? crudo(' aria-current="page"') : ''}${EMBLEMA_URL.has(h.url) ? crudo(' class="con-emblema"') : ''}>${EMBLEMA_URL.has(h.url) ? crudo(emblema(EMBLEMA_URL.get(h.url))) : ''}<b>${h.texto}</b>${h.descripcion ? html`<small>${h.descripcion}</small>` : ''}${avisoExterno(h.url, h.nueva)}</a></li>`)}
          <li class="submenu-todo"><a href="${i.url}">Ver todo en ${i.texto} ${crudo(icono('flecha', { tam: 14 }))}</a></li>
        </ul></div>
      </li>`
    : html`<li class="nav-item${activo(i) ? ' activo' : ''}"><a class="nav-enlace" ${attrsEnlace(i.url, i.nueva)}${i.url === actual ? crudo(' aria-current="page"') : ''}>${i.texto}${avisoExterno(i.url, i.nueva)}</a></li>`))}</ul>`;
}

function barraSuperior(ctx) {
  const s = ctx.ajustes;
  return html`<div class="barra-superior">
    <div class="contenedor">
      <ul class="transparencia" aria-label="Transparencia y acceso a la información">
        ${ctx.repo.menu('superior').map((i) => html`<li><a ${attrsEnlace(i.url, i.nueva)}>${crudo(icono(i.icono || 'documento', { tam: 16 }))}<span>${i.texto}</span>${avisoExterno(i.url, i.nueva)}</a></li>`)}
      </ul>
      <div class="herramientas">
        <a class="sos" href="/contacto/#emergencias">${crudo(icono('telefono', { tam: 15 }))} Emergencias</a>
        <div class="accesibilidad-botones" role="group" aria-label="Opciones de lectura">
          <button type="button" data-texto="-1" aria-label="Achicar el texto">A−</button>
          <button type="button" data-texto="1" aria-label="Agrandar el texto">A+</button>
          <button type="button" data-contraste aria-pressed="false" aria-label="Alto contraste">${crudo(icono('contraste', { tam: 16 }))}</button>
          <button type="button" data-tema aria-label="Cambiar a modo oscuro">${crudo(icono('luna', { tam: 16 }))}</button>
        </div>
      </div>
    </div>
  </div>`;
}

function cabecera(ctx) {
  const s = ctx.ajustes;
  const dz = disenoDe(s), logo = logoCabecera(dz);
  return html`<header class="cabecera" id="cabecera">
    ${barraSuperior(ctx)}
    <div class="cabecera-principal">
      <div class="contenedor">
        <a class="marca" href="/" aria-label="${s.nombre}: ir al inicio">
          ${crudo(escudoVivo({ clase: 'marca-viva', titulo: '' }).replace(' role="img" aria-label=""', ' aria-hidden="true"').replace('<title></title>', ''))}
          <img class="marca-emblema logo-claro" src="${logo.src}" alt="" data-diseno-logo="claro">
          <img class="marca-emblema logo-oscuro" src="${logo.oscuro}" alt="" data-diseno-logo="oscuro">
          <span class="marca-texto"${logo.conTexto ? '' : crudo(' hidden')}><small data-diseno="cabecera.subtitulo">${dz.cabecera.subtitulo}</small><b data-diseno="cabecera.nombre">${dz.cabecera.nombre}</b></span>
        </a>
        <nav class="nav" id="nav" aria-label="Menú principal">${menuPrincipal(ctx)}</nav>
        <div class="cabecera-acciones">
          <button type="button" class="boton-icono" data-abrir-buscador aria-label="Buscar en el sitio" aria-controls="buscador">${crudo(icono('buscar', { tam: 22 }))}</button>
          <div class="acc-menu">
            <button type="button" class="boton-icono" data-acc-abrir aria-expanded="false" aria-controls="acc-panel" aria-label="Opciones de lectura: tamaño del texto, contraste y modo oscuro">${crudo(icono('accesibilidad', { tam: 22 }))}</button>
            <div class="acc-panel" id="acc-panel" role="group" aria-label="Opciones de lectura" hidden>
              <p>Lectura</p>
              <div class="acc-fila"><button type="button" data-texto="-1" aria-label="Achicar el texto">A−</button><button type="button" data-texto="1" aria-label="Agrandar el texto">A+</button></div>
              <button type="button" class="acc-opcion" data-contraste aria-pressed="false">${crudo(icono('contraste', { tam: 18 }))} Alto contraste</button>
              <button type="button" class="acc-opcion" data-tema aria-label="Cambiar a modo oscuro">${crudo(icono('luna', { tam: 18 }))} Modo oscuro</button>
              <a class="acc-sos" href="/contacto/#emergencias">${crudo(icono('telefono', { tam: 16 }))} Teléfonos de emergencia</a>
            </div>
          </div>
          ${ctx.tramites.configurado ? html`<a class="boton boton-acento boton-tramites" href="/tramites/">${crudo(icono('licencia', { tam: 18 }))}<span>Trámites en línea</span></a>` : html`<a class="boton boton-acento boton-tramites" href="/tramites/">${crudo(icono('licencia', { tam: 18 }))}<span>Trámites</span></a>`}
          <button type="button" class="boton-icono boton-menu" data-menu aria-expanded="false" aria-controls="nav" aria-label="Abrir menú">${crudo(icono('menu', { tam: 24 }))}</button>
        </div>
      </div>
    </div>
    <div class="buscador" id="buscador" hidden>
      <div class="contenedor">
        <form action="/buscar/" method="get" role="search" class="buscador-form">
          <label for="q-global" class="sr">Buscar en el sitio</label>
          ${crudo(icono('buscar', { tam: 22 }))}
          <input id="q-global" name="q" type="search" placeholder="¿Qué necesita? Ej.: licencia, patente, horario de buses…" autocomplete="off" data-sugerencias aria-controls="sugerencias-global" aria-autocomplete="list">
          <button type="submit" class="boton">Buscar</button>
          <button type="button" class="boton-icono" data-cerrar-buscador aria-label="Cerrar buscador">${crudo(icono('cerrar', { tam: 20 }))}</button>
        </form>
        <div class="sugerencias" id="sugerencias-global" role="listbox" hidden></div>
      </div>
    </div>
  </header>`;
}

function pie(ctx) {
  const s = ctx.ajustes;
  const r = s.redes || {};
  const anio = new Date().getFullYear();
  const redes = [['facebook', r.facebook, 'Facebook'], ['instagram', r.instagram, 'Instagram'], ['youtube', r.youtube, 'YouTube'], ['x', r.x, 'X (Twitter)']].filter((x) => x[1]);
  const lista = (clave) => ctx.repo.menu(clave).map((i) => html`<li><a ${attrsEnlace(i.url, i.nueva)}>${i.texto}${avisoExterno(i.url, i.nueva)}</a></li>`);
  const turismo = s.turismo?.url || SITIO_TREKKING;
  return html`<footer class="pie" id="pie">
    <div class="pie-montes" aria-hidden="true">${crudo(montes('var(--pie-fondo)', 'tk-montes'))}</div>
    <div class="pie-emergencias" id="emergencias-pie">
      <div class="contenedor">
        <strong>${crudo(icono('telefono', { tam: 18 }))} Teléfonos de emergencia</strong>
        <ul>${(s.emergencias || []).map((e) => html`<li><a href="${telefonoHref(e.telefono)}"><span>${e.nombre}</span> <b>${telefonoTexto(e.telefono)}</b></a></li>`)}</ul>
      </div>
    </div>
    <div class="contenedor pie-columnas">
      <section class="pie-marca">
        ${crudo(escudoVivo({ completo: true, clase: 'pie-escudo' }))}
        <h2 class="sr">${s.nombre}</h2>
        <address>
          <p>${crudo(icono('ubicacion', { tam: 16 }))} <a ${attrsEnlace(s.mapa?.enlace || '#')}>${s.direccion}</a></p>
          <p>${crudo(icono('telefono', { tam: 16 }))} <a href="${telefonoHref(s.telefono)}">${s.telefono}</a> (sólo consultas)</p>
          ${s.whatsapp ? html`<p>${crudo(icono('whatsapp', { tam: 16 }))} <a href="https://api.whatsapp.com/send?phone=${s.whatsapp.replace(/[^\d]/g, '')}" target="_blank" rel="noopener noreferrer">${s.whatsapp}</a> (sólo consultas)</p>` : ''}
          <p>${crudo(icono('correo', { tam: 16 }))} <a href="mailto:${s.email}">${s.email}</a></p>
          <p>${crudo(icono('reloj', { tam: 16 }))} ${s.horario}</p>
        </address>
      </section>
      <section><h2>Servicios municipales</h2><ul>${lista('pie_servicios')}</ul></section>
      <section><h2>Enlaces de interés</h2><ul>${lista('pie_interes')}</ul></section>
      <section>
        <h2>Síganos</h2>
        <ul class="redes">${redes.map(([ic, url, nombre]) => html`<li><a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${nombre}">${crudo(icono(ic, { tam: 20 }))}</a></li>`)}</ul>
        ${s.boletin?.activo !== false ? html`<form class="pie-boletin" action="/boletin/" method="post">
          <label for="boletin-pie">Reciba las noticias en su correo</label>
          <div><input id="boletin-pie" type="email" name="email" required placeholder="su@correo.cl" autocomplete="email"><button class="boton boton-acento" type="submit">Suscribirme</button></div>
          ${crudo(ctx.campoAntispam())}
        </form>` : ''}
        <p class="pie-rss"><a href="/feed/">${crudo(icono('rss', { tam: 16 }))} Noticias por RSS</a></p>
      </section>
    </div>
    <div class="contenedor pie-trekking"><a ${attrsEnlace(turismo)}><img class="pie-trekking-claro" src="/img/trekking/logo-color-claro.svg" alt="Melipeuco Capital del Trekking" width="1036" height="265" loading="lazy"><img class="pie-trekking-oscuro" src="/img/trekking/logo-color.svg" alt="" width="1036" height="265" loading="lazy">${avisoExterno(turismo)}</a></div>
    <div class="pie-legal">
      <div class="contenedor">
        <p>${(s.pie?.texto || '© {anio} ' + s.nombre).replace('{anio}', anio)}</p>
        <ul>${lista('pie_sitio')}</ul>
      </div>
    </div>
  </footer>`;
}

export function documento(ctx, { titulo, descripcion = '', cuerpo, imagen = '', tipoOg = 'website', jsonLd = null, clase = '', noindex = false, canonical = null, sinAvisos = false, portada = false, editar = null, cabeceraExtra = '' }) {
  const s = ctx.ajustes;
  const tituloCompleto = portada ? `${s.nombre} — Sitio web oficial «${s.lema}»` : `${titulo} | ${s.nombreCorto || s.nombre}`;
  const desc = recortar(textoPlano(descripcion || s.descripcion), 160);
  const base = ctx.cfg.PUBLIC_URL.replace(/\/$/, '');
  const canon = base + (canonical || ctx.ruta);
  const img = imagen ? (imagen.startsWith('http') ? imagen : base + imagen) : base + '/img/icon-512.png';
  const dz = disenoDe(s), fuentes = urlFuentes(dz);
  const attrs = Object.entries({ ...atributos(dz), style: estiloZona(zonaDe(ctx.ruta)) }).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
  const bricolage = [dz.tipografia.cuerpo, dz.tipografia.titulos].includes('bricolage');
  const ld = [{ '@context': 'https://schema.org', '@type': 'GovernmentOrganization', name: s.nombre, url: base + '/', logo: base + '/img/icon-512.png', telephone: s.telefono, email: s.email, address: { '@type': 'PostalAddress', streetAddress: 'Pedro Aguirre Cerda 14', addressLocality: 'Melipeuco', addressRegion: 'La Araucanía', addressCountry: 'CL' }, sameAs: Object.values(s.redes || {}).filter(Boolean) }];
  if (jsonLd) ld.push(...[jsonLd].flat());
  return '<!doctype html>\n' + html`<html lang="es-CL" ${crudo(attrs)}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${tituloCompleto}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canon}">
${noindex ? crudo('<meta name="robots" content="noindex">') : ''}
<meta property="og:type" content="${tipoOg}">
<meta property="og:site_name" content="${s.nombre}">
<meta property="og:title" content="${portada ? s.nombre : titulo}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${img}">
<meta property="og:locale" content="es_CL">
<meta name="twitter:card" content="${imagen ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="${dz.colores.primario}">
<link rel="icon" href="/img/favicon.png">
<link rel="apple-touch-icon" href="/img/icon-192.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="Noticias de ${s.nombreCorto}" href="/feed/">
${[dz.tipografia.cuerpo, dz.tipografia.titulos].includes('public-sans') ? crudo('<link rel="preload" href="/fuentes/public-sans-latin.woff2" as="font" type="font/woff2" crossorigin>') : ''}
${bricolage ? crudo('<link rel="preload" href="/fuentes/bricolage-latin.woff2" as="font" type="font/woff2" crossorigin>') : ''}
${fuentes ? html`<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${fuentes}" id="diseno-fuentes">` : ''}
<link rel="icon" type="image/svg+xml" href="/img/emblema-azul.svg">
<link rel="stylesheet" href="/css/sitio.css?v=${ctx.version}">
<style id="diseno-vars">${crudo(variablesCss(dz))}</style>
${dz.animaciones.activas && dz.animaciones.cordillera && dz.animaciones.transicionEstilo === 'vista' ? crudo('<style>@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }</style>') : ''}
${dz.avanzado.css ? html`<style id="diseno-propio">${crudo(dz.avanzado.css)}</style>` : ''}
<script nonce="${ctx.nonce}">(function(){try{var d=document.documentElement,t=localStorage.getItem('mlp-tema'),f=localStorage.getItem('mlp-texto'),k=localStorage.getItem('mlp-contraste');if(t)d.dataset.tema=t;if(f)d.style.setProperty('--escala',f);if(k==='1')d.dataset.contraste='alto';if(sessionStorage.getItem('mlp-cortina')&&d.getAttribute('data-anim-cordillera')==='si'&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))d.classList.add('tk-entrando')}catch(e){}})();</script>
<script type="application/ld+json" nonce="${ctx.nonce}">${crudo(JSON.stringify(ld).replace(/</g, '\\u003c'))}</script>
${crudo(cabeceraExtra)}
${s.analitica?.codigo ? crudo(String(s.analitica.codigo).replace(/<script/g, `<script nonce="${ctx.nonce}"`)) : ''}
</head>
<body class="${clase}${portada ? ' es-portada' : ''}">
${portada ? html`${crudo(plantillaIntro(dz.animaciones.introEstilo === 'logo3d' ? (['vitrina', 'trekking'].includes(dz.portada.composicion) || (dz.portada.composicion === 'portal' && dz.portal.logoTrekking) ? 'logo3d' : 'escudo3d') : dz.animaciones.introEstilo))}<script nonce="${ctx.nonce}">${crudo(SCRIPT_INTRO)}</script>` : ''}
${dz.animaciones.activas && dz.animaciones.cordillera ? crudo(cortinaCordillera()) : ''}
<a class="saltar" href="#contenido">Saltar al contenido</a>
<div class="tk-progreso" aria-hidden="true"></div>
${ctx.usuario ? html`<div class="barra-admin"><div class="contenedor"><span>${crudo(icono('usuario', { tam: 16 }))} ${ctx.usuario.nombre}</span><a href="/admin/">Panel de administración</a>${editar ? html`<a href="/admin/#/editar/${editar}">${crudo(icono('herramienta', { tam: 16 }))} Editar esta página</a>` : ''}</div></div>` : ''}
${cabecera(ctx)}
${sinAvisos ? '' : avisos(ctx, { portada })}
<main id="contenido" tabindex="-1">
${cuerpo}
</main>
${pie(ctx)}
<button type="button" class="arriba" data-arriba aria-label="Volver arriba">${crudo(icono('flecha', { tam: 20, clase: 'arriba-ico' }))}</button>
<script src="/js/sitio.js?v=${ctx.version}" defer></script>
<script src="/js/movimiento.js?v=${ctx.version}" defer></script>
${portada ? html`<script src="/js/logo-vivo.js?v=${ctx.version}" defer></script>` : ''}
<script src="/js/transiciones.js?v=${ctx.version}" defer></script>
<script src="/js/escudo-vivo.js?v=${ctx.version}" defer></script>
${dz.animaciones.activas && dz.animaciones.precarga && !ctx.usuario ? html`<script type="speculationrules" nonce="${ctx.nonce}">${crudo(REGLAS_PRECARGA)}</script>` : ''}
</body>
</html>`;
}

// Las páginas del sitio se descargan por adelantado al pasar el cursor sobre un enlace (sólo el
// HTML, sin ejecutarlas), así la página siguiente aparece casi al instante.
const REGLAS_PRECARGA = JSON.stringify({ prefetch: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: ['/admin/*', '/api/*', '/buscar/*', '/feed*', '/medios/*', '/wp-content/*', '/*.*', '/*\\?*'] } }, { not: { selector_matches: '[target=_blank], [download], [rel~=nofollow]' } }] }, eagerness: 'moderate' }] });

// Encabezado de página interior (título, bajada, migas).
// Toma el color y el emblema de la zona de la página (una de las nueve letras del logo).
export function encabezado({ titulo, bajada = '', migas = '', imagen = '', ctx, extra = '' }) {
  return html`<section class="encabezado${imagen ? ' con-imagen' : ''}">
    ${imagen ? html`<div class="encabezado-fondo">${ctx.img.imagen(imagen, { alt: '', sizes: '100vw', prioridad: true })}</div>` : ''}
    ${crudo(emblema(zonaDe(ctx.ruta), 'encabezado-emblema'))}
    <div class="contenedor">
      ${migas}
      <h1>${titulo}</h1>
      ${bajada ? html`<p class="bajada">${bajada}</p>` : ''}
      ${extra}
    </div>
  </section>`;
}
