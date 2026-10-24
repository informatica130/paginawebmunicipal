// Diseño personalizable del sitio — módulo compartido.
// Lo usan el servidor (para generar los estilos de cada página) y el panel (para la vista
// previa en vivo), así ambos calculan exactamente lo mismo. Todo lo que llega del panel pasa
// por normalizar(): colores hexadecimales, números acotados, opciones de listas cerradas y
// direcciones de imágenes del propio sitio o https.

export const FUENTES = {
  'public-sans': { nombre: 'Public Sans (institucional)', familia: "'Public Sans'", google: '' },
  atkinson: { nombre: 'Atkinson Hyperlegible (alta legibilidad)', familia: "'Atkinson Hyperlegible Next'", google: 'Atkinson+Hyperlegible+Next:wght@400;500;600;700;800' },
  inter: { nombre: 'Inter (moderna)', familia: "'Inter'", google: 'Inter:wght@400;500;600;700;800' },
  'source-sans': { nombre: 'Source Sans 3 (neutra)', familia: "'Source Sans 3'", google: 'Source+Sans+3:wght@400;500;600;700;800' },
  'nunito-sans': { nombre: 'Nunito Sans (cercana)', familia: "'Nunito Sans'", google: 'Nunito+Sans:wght@400;600;700;800' },
  montserrat: { nombre: 'Montserrat (geométrica)', familia: "'Montserrat'", google: 'Montserrat:wght@500;600;700;800' },
  merriweather: { nombre: 'Merriweather (serif clásica)', familia: "'Merriweather'", google: 'Merriweather:wght@400;700;900' },
  'roboto-slab': { nombre: 'Roboto Slab (serif de bloque)', familia: "'Roboto Slab'", google: 'Roboto+Slab:wght@400;600;700;800' },
  sistema: { nombre: 'La del sistema (la más rápida)', familia: 'system-ui', google: '' },
};

export const PREDETERMINADO = {
  estilo: 'institucional',
  colores: { primario: '#0B4F7C', acento: '#F2A900', oscuro: '#062B45', fondo: '#FFFFFF', fondoAlterno: '#F3F6F9', texto: '#17212C', exito: '#1E7B4F', peligro: '#C62828' },
  tipografia: { cuerpo: 'public-sans', titulos: 'public-sans', tamano: 17, pesoTitulos: 800, espaciadoTitulos: -2, menuMayusculas: false },
  forma: { radio: 8, tarjetas: 'borde', botones: 'redondeados', densidad: 'normal', ancho: 1200 },
  cabecera: { estilo: 'blanca', fija: true, barraSuperior: true, botonTramites: true, logo: 'emblema', logoUrl: '', tamanoLogo: 54, subtitulo: 'Ilustre Municipalidad de', nombre: 'Melipeuco' },
  portada: { imagen: '', credito: 'Plaza de Melipeuco y volcán Llaima', titulo: 'Municipalidad de Melipeuco', bajada: '', alto: 'medio', alineacion: 'izquierda', velo: 80, franjaDatos: true, populares: true },
  pie: { estilo: 'oscuro', emergencias: true, boletin: true, escudo: true },
  animaciones: { activas: true, intensidad: 'normal', velocidad: 1, intro: 'primera', transiciones: true, aparicion: true, inclinacion: true, barraCarga: true },
  avanzado: { css: '' },
};

// Estilos prediseñados: cambian colores, tipografía, forma, cabecera y pie (no los textos ni las fotos).
export const ESTILOS = {
  institucional: { nombre: 'Institucional', descripcion: 'Azul y ámbar municipal, bordes finos.', valores: {} },
  bosque: { nombre: 'Bosque de araucarias', descripcion: 'Verde pehuén y tonos de madera.', valores: {
    colores: { primario: '#1F5A45', acento: '#D89A2B', oscuro: '#12352A', fondoAlterno: '#F2F5F1', exito: '#2F7D4F' },
    tipografia: { cuerpo: 'source-sans', titulos: 'source-sans', pesoTitulos: 700 },
    forma: { radio: 10, tarjetas: 'sombra' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'oscuro' } } },
  moderno: { nombre: 'Moderno', descripcion: 'Botones redondos, sombras suaves y cabecera de color.', valores: {
    colores: { primario: '#1D4ED8', acento: '#F59E0B', oscuro: '#0F172A', fondoAlterno: '#F1F5F9', texto: '#0F172A' },
    tipografia: { cuerpo: 'inter', titulos: 'inter', pesoTitulos: 800, espaciadoTitulos: -3 },
    forma: { radio: 14, tarjetas: 'sombra', botones: 'pildora' }, cabecera: { estilo: 'color' }, pie: { estilo: 'oscuro' } } },
  clasico: { nombre: 'Clásico', descripcion: 'Títulos con serifa, esquinas rectas, sobrio.', valores: {
    colores: { primario: '#7A1F2B', acento: '#C9A227', oscuro: '#2A1A1D', fondoAlterno: '#F7F4EF', texto: '#211A1B' },
    tipografia: { cuerpo: 'source-sans', titulos: 'merriweather', pesoTitulos: 700, espaciadoTitulos: 0 },
    forma: { radio: 2, tarjetas: 'borde', botones: 'rectos' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'oscuro' } } },
  claro: { nombre: 'Claro y amplio', descripcion: 'Mucho aire, pie claro, tarjetas planas.', valores: {
    colores: { primario: '#0E7490', acento: '#F2A900', oscuro: '#0B3B4A', fondoAlterno: '#F0F7F9' },
    tipografia: { cuerpo: 'nunito-sans', titulos: 'nunito-sans', pesoTitulos: 800 },
    forma: { radio: 12, tarjetas: 'plano', densidad: 'amplia' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'claro' } } },
  contraste: { nombre: 'Alto contraste', descripcion: 'Negro, blanco y amarillo; letra de alta legibilidad.', valores: {
    colores: { primario: '#000000', acento: '#FFD000', oscuro: '#000000', fondo: '#FFFFFF', fondoAlterno: '#F2F2F2', texto: '#000000', exito: '#006B2E', peligro: '#B00000' },
    tipografia: { cuerpo: 'atkinson', titulos: 'atkinson', tamano: 19, pesoTitulos: 800, espaciadoTitulos: 0 },
    forma: { radio: 4, tarjetas: 'borde', botones: 'redondeados' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'oscuro' },
    animaciones: { intensidad: 'sutil' } } },
};

// Opciones de las listas cerradas (lo que no esté aquí se descarta).
export const OPCIONES = {
  tarjetas: { borde: 'Con borde', sombra: 'Con sombra', plano: 'Planas (fondo gris)' },
  botones: { redondeados: 'Esquinas suaves', pildora: 'Redondos (píldora)', rectos: 'Rectos' },
  densidad: { compacta: 'Compacta', normal: 'Normal', amplia: 'Amplia' },
  cabeceraEstilo: { blanca: 'Blanca', color: 'Color principal', oscura: 'Oscura' },
  logo: { emblema: 'Emblema (sin texto) y nombre', escudo: 'Escudo completo', personalizado: 'Imagen propia' },
  alto: { bajo: 'Baja', medio: 'Media', alto: 'Alta', pantalla: 'Pantalla completa' },
  alineacion: { izquierda: 'A la izquierda', centro: 'Centrada' },
  pieEstilo: { oscuro: 'Oscuro', color: 'Color principal', claro: 'Claro' },
  intensidad: { sutil: 'Sutil', normal: 'Normal', expresiva: 'Expresiva' },
  intro: { primera: 'Primera visita de cada sesión', siempre: 'Cada vez que se abre la portada', nunca: 'Nunca' },
};

// ------------------------------------------------------------------ Normalización
const esObjeto = (v) => v && typeof v === 'object' && !Array.isArray(v);
const color = (v, d) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toUpperCase() : d);
const numero = (v, d, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : d; };
const opcion = (v, lista, d) => (Object.prototype.hasOwnProperty.call(lista, v) ? v : d);
const bool = (v, d) => (typeof v === 'boolean' ? v : d);
const texto = (v, d, n = 160) => (typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, n) : d);
const imagen = (v) => { const s = String(v || '').trim(); return /^\/(?!\/)[\w\-./%]+$/.test(s) || /^https:\/\/[^\s"'<>()]+$/.test(s) ? s.slice(0, 500) : ''; };

export function fusionar(base, cambios) {
  const o = { ...base };
  for (const [k, v] of Object.entries(cambios || {})) o[k] = esObjeto(v) && esObjeto(base[k]) ? fusionar(base[k], v) : v;
  return o;
}

export function aplicarEstilo(cfg, id) {
  const e = ESTILOS[id];
  if (!e) return cfg;
  const limpio = fusionar(PREDETERMINADO, {});
  const base = { colores: limpio.colores, tipografia: limpio.tipografia, forma: limpio.forma, cabecera: { estilo: limpio.cabecera.estilo }, pie: { estilo: limpio.pie.estilo }, animaciones: { intensidad: limpio.animaciones.intensidad } };
  return normalizar(fusionar(fusionar(cfg, base), { ...e.valores, estilo: id }));
}

export function normalizar(entrada, { permitirCss = true, previo = null } = {}) {
  const e = fusionar(PREDETERMINADO, esObjeto(entrada) ? entrada : {});
  const P = PREDETERMINADO, c = e.colores, t = e.tipografia, f = e.forma, ca = e.cabecera, po = e.portada, pi = e.pie, an = e.animaciones;
  return {
    estilo: opcion(e.estilo, { ...ESTILOS, personalizado: 1 }, 'personalizado'),
    colores: Object.fromEntries(Object.keys(P.colores).map((k) => [k, color(c[k], P.colores[k])])),
    tipografia: {
      cuerpo: opcion(t.cuerpo, FUENTES, P.tipografia.cuerpo), titulos: opcion(t.titulos, FUENTES, P.tipografia.titulos),
      tamano: numero(t.tamano, 17, 15, 21), pesoTitulos: numero(t.pesoTitulos, 800, 500, 900), espaciadoTitulos: numero(t.espaciadoTitulos, -2, -5, 5),
      menuMayusculas: bool(t.menuMayusculas, false),
    },
    forma: {
      radio: numero(f.radio, 8, 0, 24), tarjetas: opcion(f.tarjetas, OPCIONES.tarjetas, 'borde'), botones: opcion(f.botones, OPCIONES.botones, 'redondeados'),
      densidad: opcion(f.densidad, OPCIONES.densidad, 'normal'), ancho: numero(f.ancho, 1200, 1040, 1440),
    },
    cabecera: {
      estilo: opcion(ca.estilo, OPCIONES.cabeceraEstilo, 'blanca'), fija: bool(ca.fija, true), barraSuperior: bool(ca.barraSuperior, true), botonTramites: bool(ca.botonTramites, true),
      logo: opcion(ca.logo, OPCIONES.logo, 'emblema'), logoUrl: imagen(ca.logoUrl), tamanoLogo: numero(ca.tamanoLogo, 54, 36, 96),
      subtitulo: texto(ca.subtitulo, P.cabecera.subtitulo, 60), nombre: texto(ca.nombre, P.cabecera.nombre, 60),
    },
    portada: {
      imagen: imagen(po.imagen), credito: texto(po.credito, P.portada.credito, 120), titulo: texto(po.titulo, P.portada.titulo, 90), bajada: texto(po.bajada, '', 240),
      alto: opcion(po.alto, OPCIONES.alto, 'medio'), alineacion: opcion(po.alineacion, OPCIONES.alineacion, 'izquierda'), velo: numero(po.velo, 80, 0, 100),
      franjaDatos: bool(po.franjaDatos, true), populares: bool(po.populares, true),
    },
    pie: { estilo: opcion(pi.estilo, OPCIONES.pieEstilo, 'oscuro'), emergencias: bool(pi.emergencias, true), boletin: bool(pi.boletin, true), escudo: bool(pi.escudo, true) },
    animaciones: {
      activas: bool(an.activas, true), intensidad: opcion(an.intensidad, OPCIONES.intensidad, 'normal'), velocidad: numero(an.velocidad, 1, .5, 2),
      intro: opcion(an.intro, OPCIONES.intro, 'primera'), transiciones: bool(an.transiciones, true), aparicion: bool(an.aparicion, true),
      inclinacion: bool(an.inclinacion, true), barraCarga: bool(an.barraCarga, true),
    },
    // El CSS propio sólo lo puede cambiar el Super Administrador; si no, se conserva el anterior.
    avanzado: { css: permitirCss ? String(e.avanzado?.css || '').replace(/<\/?style/gi, '').slice(0, 20000) : String(previo?.avanzado?.css || '') },
  };
}

// ------------------------------------------------------------------ Salida
// Luminancia relativa para elegir texto claro u oscuro sobre un color.
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const tintaSobre = (hex) => (luminancia(hex) > 0.4 ? '#141414' : '#FFFFFF');

const ESCALA = { compacta: .72, normal: 1, amplia: 1.32 };
const ALTO = { bajo: 'clamp(320px, 42vh, 420px)', medio: 'clamp(420px, 58vh, 560px)', alto: 'clamp(520px, 76vh, 760px)', pantalla: 'calc(100svh - 116px)' };
const BOTON = { redondeados: null, pildora: '999px', rectos: '2px' };

export function variablesCss(cfg) {
  const c = cfg.colores, t = cfg.tipografia, f = cfg.forma;
  const v = {
    '--azul': c.primario, '--ambar': c.acento, '--azul-profundo': c.oscuro, '--fondo': c.fondo, '--superficie': c.fondo, '--fondo-2': c.fondoAlterno,
    '--texto': c.texto, '--verde': c.exito, '--rojo': c.peligro, '--ambar-tinta': tintaSobre(c.acento), '--sobre-azul': tintaSobre(c.primario),
    '--fuente': `${FUENTES[t.cuerpo].familia}, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
    '--fuente-titulo': `${FUENTES[t.titulos].familia}, ${FUENTES[t.cuerpo].familia}, system-ui, sans-serif`,
    '--tam-base': t.tamano, '--peso-titulo': t.pesoTitulos, '--espaciado-titulo': `${t.espaciadoTitulos / 100}em`,
    '--r': `${f.radio}px`, '--r-control': `${Math.round(f.radio * 0.75)}px`, '--r-boton': BOTON[f.botones] || `${Math.round(f.radio * 0.75)}px`,
    '--esp': ESCALA[f.densidad], '--ancho': `${f.ancho}px`,
    '--logo': `${cfg.cabecera.tamanoLogo}px`, '--hero-alto': ALTO[cfg.portada.alto], '--velo': cfg.portada.velo / 100,
    '--anim-vel': cfg.animaciones.velocidad,
  };
  return ':root{' + Object.entries(v).map(([k, x]) => `${k}:${x}`).join(';') + '}';
}

export function atributos(cfg) {
  const a = cfg.animaciones;
  return {
    'data-cabecera': cfg.cabecera.estilo, 'data-cabecera-fija': cfg.cabecera.fija ? 'si' : 'no',
    'data-barra-superior': cfg.cabecera.barraSuperior ? 'si' : 'no', 'data-boton-tramites': cfg.cabecera.botonTramites ? 'si' : 'no',
    'data-menu-mayusculas': cfg.tipografia.menuMayusculas ? 'si' : 'no',
    'data-tarjetas': cfg.forma.tarjetas, 'data-botones': cfg.forma.botones, 'data-densidad': cfg.forma.densidad,
    'data-hero-alinear': cfg.portada.alineacion, 'data-franja': cfg.portada.franjaDatos ? 'si' : 'no', 'data-populares': cfg.portada.populares ? 'si' : 'no',
    'data-pie': cfg.pie.estilo, 'data-pie-emergencias': cfg.pie.emergencias ? 'si' : 'no', 'data-pie-boletin': cfg.pie.boletin ? 'si' : 'no', 'data-pie-escudo': cfg.pie.escudo ? 'si' : 'no',
    'data-anim': a.activas ? a.intensidad : 'no', 'data-intro': a.activas ? a.intro : 'nunca',
    'data-anim-transiciones': a.activas && a.transiciones ? 'si' : 'no', 'data-anim-aparicion': a.activas && a.aparicion ? 'si' : 'no',
    'data-anim-inclinacion': a.activas && a.inclinacion ? 'si' : 'no', 'data-anim-carga': a.activas && a.barraCarga ? 'si' : 'no',
  };
}

export function urlFuentes(cfg) {
  const fam = [...new Set([cfg.tipografia.cuerpo, cfg.tipografia.titulos])].map((k) => FUENTES[k].google).filter(Boolean);
  return fam.length ? `https://fonts.googleapis.com/css2?${fam.map((x) => 'family=' + x).join('&')}&display=swap` : '';
}

// Logo de la cabecera según la elección (y su versión para modo oscuro).
export function logoCabecera(cfg) {
  const ca = cfg.cabecera;
  if (ca.logo === 'personalizado' && ca.logoUrl) return { src: ca.logoUrl, oscuro: ca.logoUrl, conTexto: false };
  if (ca.logo === 'escudo') return { src: '/img/escudo-azul.svg', oscuro: '/img/escudo-crema.svg', conTexto: false };
  return { src: '/img/emblema-azul.svg', oscuro: '/img/emblema-crema.svg', conTexto: true };
}
