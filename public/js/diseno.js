// Diseño personalizable del sitio — módulo compartido.
// Lo usan el servidor (para generar los estilos de cada página) y el panel (para la vista
// previa en vivo), así ambos calculan exactamente lo mismo. Todo lo que llega del panel pasa
// por normalizar(): colores hexadecimales, números acotados, opciones de listas cerradas y
// direcciones de imágenes del propio sitio o https.

export const FUENTES = {
  'public-sans': { nombre: 'Public Sans (institucional)', familia: "'Public Sans'", google: '' },
  bricolage: { nombre: 'Bricolage Grotesque (Capital del Trekking)', familia: "'Bricolage Grotesque'", google: '' },
  atkinson: { nombre: 'Atkinson Hyperlegible (alta legibilidad)', familia: "'Atkinson Hyperlegible Next'", google: 'Atkinson+Hyperlegible+Next:wght@400;500;600;700;800' },
  inter: { nombre: 'Inter (moderna)', familia: "'Inter'", google: 'Inter:wght@400;500;600;700;800' },
  'source-sans': { nombre: 'Source Sans 3 (neutra)', familia: "'Source Sans 3'", google: 'Source+Sans+3:wght@400;500;600;700;800' },
  'nunito-sans': { nombre: 'Nunito Sans (cercana)', familia: "'Nunito Sans'", google: 'Nunito+Sans:wght@400;600;700;800' },
  montserrat: { nombre: 'Montserrat (geométrica)', familia: "'Montserrat'", google: 'Montserrat:wght@500;600;700;800' },
  merriweather: { nombre: 'Merriweather (serif clásica)', familia: "'Merriweather'", google: 'Merriweather:wght@400;700;900' },
  'roboto-slab': { nombre: 'Roboto Slab (serif de bloque)', familia: "'Roboto Slab'", google: 'Roboto+Slab:wght@400;600;700;800' },
  sistema: { nombre: 'La del sistema (la más rápida)', familia: 'system-ui', google: '' },
};

// El diseño predeterminado es el de «Melipeuco Capital del Trekking»: los colores de las nueve
// letras del logo, papel crema, noche, títulos en Bricolage Grotesque y la portada con el logo animado.
export const PREDETERMINADO = {
  estilo: 'trekking',
  colores: { primario: '#1F6FA8', acento: '#E9A92B', oscuro: '#121417', fondo: '#F7F3EC', fondoAlterno: '#EDE6D9', texto: '#17191B', exito: '#2F7D4A', peligro: '#C62828' },
  tipografia: { cuerpo: 'public-sans', titulos: 'bricolage', tamano: 16, pesoTitulos: 800, espaciadoTitulos: -3, menuMayusculas: false },
  forma: { radio: 14, tarjetas: 'sombra', botones: 'redondeados', densidad: 'normal', ancho: 1200, sombras: 'suaves', escala: 100 },
  cabecera: { estilo: 'blanca', fija: true, barraSuperior: false, botonTramites: false, logo: 'emblema', logoUrl: '', tamanoLogo: 54, subtitulo: 'Ilustre Municipalidad de', nombre: 'Melipeuco' },
  portada: { composicion: 'vitrina', fotoLado: 'derecha', imagen: '', credito: 'Volcán Llaima desde los senderos de Melipeuco', titulo: 'Municipalidad de Melipeuco', bajada: '', alto: 'alto', alineacion: 'izquierda', velo: 80, franjaDatos: true, populares: false,
    // Portada «Capital del Trekking»
    logoAnimacion: 'vivo', logoReposo: true, logoGestos: true, tamanoLogo: 100, kicker: true, buscador: true, cordillera: true, puntos: true,
    fotos: ['', '', '', ''], intervalo: 7, kenBurns: true },
  // Identidad «Capital del Trekking» en todo el sitio
  identidad: { zonas: true, encabezado: 'claro', emblemaEncabezado: true, titulosPalabra: true, progreso: true, lineaCabecera: false, cordilleras: true, accesosColor: true, cinta: 42 },
  pie: { estilo: 'oscuro', emergencias: true, boletin: true, escudo: true, marcaGrande: true },
  animaciones: { activas: true, intensidad: 'normal', velocidad: 1, intro: 'primera', transiciones: true, aparicion: true, inclinacion: false, barraCarga: true, cordillera: false },
  avanzado: { css: '' },
};

// Valores del diseño institucional anterior (blanco, azul y ámbar, sólo líneas).
const INSTITUCIONAL = {
  colores: { primario: '#0B4F7C', acento: '#F2A900', oscuro: '#0D1B2A', fondo: '#FFFFFF', fondoAlterno: '#F4F5F7', texto: '#121A23', exito: '#1E7B4F', peligro: '#C62828' },
  tipografia: { cuerpo: 'public-sans', titulos: 'public-sans', pesoTitulos: 800, espaciadoTitulos: -2 },
  forma: { radio: 10, tarjetas: 'linea', botones: 'redondeados' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'oscuro' },
};

// Estilos prediseñados: cambian colores, tipografía, forma, cabecera y pie (no los textos ni las fotos).
export const ESTILOS = {
  trekking: { nombre: 'Capital del Trekking', descripcion: 'Papel crema, los nueve colores del logo, sombras suaves y la portada vitrina con el logo vivo.', valores: { portada: { composicion: 'vitrina' } } },
  glaciar: { nombre: 'Glaciar y lagunas', descripcion: 'Turquesa de las lagunas andinas, fondo nevado y la portada del trekking.', valores: {
    colores: { primario: '#0E7C86', acento: '#E9A92B', oscuro: '#0A2A33', fondo: '#F3F8F9', fondoAlterno: '#E2EEF0', texto: '#0F2228', exito: '#2F7D4A', peligro: '#C62828' },
    tipografia: { cuerpo: 'public-sans', titulos: 'bricolage', pesoTitulos: 800, espaciadoTitulos: -3 },
    forma: { radio: 20, tarjetas: 'sombra', botones: 'pildora' }, cabecera: { estilo: 'blanca', barraSuperior: false, botonTramites: false }, pie: { estilo: 'oscuro' }, portada: { composicion: 'vitrina' } } },
  araucaria: { nombre: 'Pehuén y terracota', descripcion: 'Verde pehuén, terracota y papel crema, con la portada del trekking.', valores: {
    colores: { primario: '#2F7D4A', acento: '#E2683C', oscuro: '#132A1C', fondo: '#F5F2EA', fondoAlterno: '#E8E2D2', texto: '#17191B', exito: '#2F7D4A', peligro: '#C62828' },
    tipografia: { cuerpo: 'public-sans', titulos: 'bricolage', pesoTitulos: 800, espaciadoTitulos: -3 },
    forma: { radio: 16, tarjetas: 'sombra', botones: 'pildora' }, cabecera: { estilo: 'blanca', barraSuperior: false, botonTramites: false }, pie: { estilo: 'oscuro' }, portada: { composicion: 'vitrina' } } },
  institucional: { nombre: 'Institucional', descripcion: 'Minimalista: blanco, tinta y azul municipal, sólo líneas finas.', valores: { ...INSTITUCIONAL, cabecera: { estilo: 'blanca', barraSuperior: true, botonTramites: true }, portada: { composicion: 'dividida', populares: true } } },
  bosque: { nombre: 'Bosque de araucarias', descripcion: 'Verde pehuén y tonos de madera.', valores: {
    colores: { ...INSTITUCIONAL.colores, primario: '#1F5A45', acento: '#D89A2B', oscuro: '#12352A', fondoAlterno: '#F2F5F1', exito: '#2F7D4F' },
    tipografia: { cuerpo: 'source-sans', titulos: 'source-sans', pesoTitulos: 700 },
    forma: { radio: 10, tarjetas: 'sombra' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'oscuro' } } },
  moderno: { nombre: 'Moderno', descripcion: 'Botones redondos, sombras suaves y cabecera de color.', valores: {
    colores: { ...INSTITUCIONAL.colores, primario: '#1D4ED8', acento: '#F59E0B', oscuro: '#0F172A', fondoAlterno: '#F1F5F9', texto: '#0F172A' },
    tipografia: { cuerpo: 'inter', titulos: 'inter', pesoTitulos: 800, espaciadoTitulos: -3 },
    forma: { radio: 14, tarjetas: 'sombra', botones: 'pildora' }, cabecera: { estilo: 'color' }, pie: { estilo: 'oscuro' } } },
  clasico: { nombre: 'Clásico', descripcion: 'Títulos con serifa, esquinas rectas, sobrio.', valores: {
    colores: { ...INSTITUCIONAL.colores, primario: '#7A1F2B', acento: '#C9A227', oscuro: '#2A1A1D', fondoAlterno: '#F7F4EF', texto: '#211A1B' },
    tipografia: { cuerpo: 'source-sans', titulos: 'merriweather', pesoTitulos: 700, espaciadoTitulos: 0 },
    forma: { radio: 2, tarjetas: 'borde', botones: 'rectos' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'oscuro' } } },
  claro: { nombre: 'Claro y amplio', descripcion: 'Mucho aire, pie claro, tarjetas planas.', valores: {
    colores: { ...INSTITUCIONAL.colores, primario: '#0E7490', acento: '#F2A900', oscuro: '#0B3B4A', fondoAlterno: '#F0F7F9' },
    tipografia: { cuerpo: 'nunito-sans', titulos: 'nunito-sans', pesoTitulos: 800 },
    forma: { radio: 12, tarjetas: 'plano', densidad: 'amplia' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'claro' } } },
  contraste: { nombre: 'Alto contraste', descripcion: 'Negro, blanco y amarillo; letra de alta legibilidad.', valores: {
    colores: { ...INSTITUCIONAL.colores, primario: '#000000', acento: '#FFD000', oscuro: '#000000', fondo: '#FFFFFF', fondoAlterno: '#F2F2F2', texto: '#000000', exito: '#006B2E', peligro: '#B00000' },
    tipografia: { cuerpo: 'atkinson', titulos: 'atkinson', tamano: 19, pesoTitulos: 800, espaciadoTitulos: 0 },
    forma: { radio: 4, tarjetas: 'borde', botones: 'redondeados' }, cabecera: { estilo: 'blanca' }, pie: { estilo: 'oscuro' },
    animaciones: { intensidad: 'sutil' } } },
};

// Opciones de las listas cerradas (lo que no esté aquí se descarta).
export const OPCIONES = {
  tarjetas: { linea: 'Minimalistas (sólo líneas)', borde: 'Con borde', sombra: 'Con sombra', plano: 'Planas (fondo gris)' },
  botones: { redondeados: 'Esquinas suaves', pildora: 'Redondos (píldora)', rectos: 'Rectos' },
  densidad: { compacta: 'Compacta', normal: 'Normal', amplia: 'Amplia' },
  cabeceraEstilo: { blanca: 'Blanca', color: 'Color principal', oscura: 'Oscura' },
  logo: { emblema: 'Emblema (sin texto) y nombre', escudo: 'Escudo completo', personalizado: 'Imagen propia' },
  composicion: { vitrina: 'Vitrina: logo y buscador junto a las fotos', trekking: 'Capital del Trekking: foto de fondo completa con el logo', dividida: 'Texto y foto lado a lado', foto: 'Foto de fondo completa' },
  alto: { bajo: 'Baja', medio: 'Media', alto: 'Alta', pantalla: 'Pantalla completa' },
  alineacion: { izquierda: 'A la izquierda', centro: 'Centrada' },
  fotoLado: { derecha: 'Fotos a la derecha', izquierda: 'Fotos a la izquierda' },
  sombras: { ninguna: 'Sin sombras (sólo bordes)', suaves: 'Suaves', marcadas: 'Marcadas' },
  encabezado: { claro: 'Claro con el tono del área', oscuro: 'Oscuro con el color del área', simple: 'Simple (sin color)' },
  pieEstilo: { oscuro: 'Oscuro', color: 'Color principal', claro: 'Claro' },
  intensidad: { sutil: 'Sutil', normal: 'Normal', expresiva: 'Expresiva' },
  intro: { primera: 'Primera visita de cada sesión', siempre: 'Cada vez que se abre la portada', nunca: 'Nunca' },
  logoAnimacion: { vivo: 'Logo vivo: cada símbolo se anima', caida: 'Las letras caen una a una', aparecer: 'Aparece suavemente', ninguna: 'Sin animación de entrada' },
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
  // Los estilos distintos del de la Capital del Trekking parten del diseño institucional.
  const limpio = id === 'trekking' ? fusionar(PREDETERMINADO, {}) : fusionar(PREDETERMINADO, INSTITUCIONAL);
  const base = { colores: limpio.colores, tipografia: limpio.tipografia, forma: limpio.forma, cabecera: { estilo: limpio.cabecera.estilo }, pie: { estilo: limpio.pie.estilo }, animaciones: { intensidad: limpio.animaciones.intensidad } };
  return normalizar(fusionar(fusionar(cfg, base), { ...e.valores, estilo: id }));
}

export function normalizar(entrada, { permitirCss = true, previo = null } = {}) {
  const e = fusionar(PREDETERMINADO, esObjeto(entrada) ? entrada : {});
  const P = PREDETERMINADO, c = e.colores, t = e.tipografia, f = e.forma, ca = e.cabecera, po = e.portada, pi = e.pie, an = e.animaciones, id = e.identidad;
  return {
    estilo: opcion(e.estilo, { ...ESTILOS, personalizado: 1 }, 'personalizado'),
    colores: Object.fromEntries(Object.keys(P.colores).map((k) => [k, color(c[k], P.colores[k])])),
    tipografia: {
      cuerpo: opcion(t.cuerpo, FUENTES, P.tipografia.cuerpo), titulos: opcion(t.titulos, FUENTES, P.tipografia.titulos),
      tamano: numero(t.tamano, P.tipografia.tamano, 14, 21), pesoTitulos: numero(t.pesoTitulos, 800, 500, 900), espaciadoTitulos: numero(t.espaciadoTitulos, P.tipografia.espaciadoTitulos, -5, 5),
      menuMayusculas: bool(t.menuMayusculas, false),
    },
    forma: {
      radio: numero(f.radio, P.forma.radio, 0, 24), tarjetas: opcion(f.tarjetas, OPCIONES.tarjetas, P.forma.tarjetas), botones: opcion(f.botones, OPCIONES.botones, P.forma.botones),
      densidad: opcion(f.densidad, OPCIONES.densidad, 'normal'), ancho: numero(f.ancho, P.forma.ancho, 960, 1440), sombras: opcion(f.sombras, OPCIONES.sombras, P.forma.sombras), escala: numero(f.escala, 100, 80, 115),
    },
    cabecera: {
      estilo: opcion(ca.estilo, OPCIONES.cabeceraEstilo, P.cabecera.estilo), fija: bool(ca.fija, true), barraSuperior: bool(ca.barraSuperior, P.cabecera.barraSuperior), botonTramites: bool(ca.botonTramites, P.cabecera.botonTramites),
      logo: opcion(ca.logo, OPCIONES.logo, 'emblema'), logoUrl: imagen(ca.logoUrl), tamanoLogo: numero(ca.tamanoLogo, 54, 36, 96),
      subtitulo: texto(ca.subtitulo, P.cabecera.subtitulo, 60), nombre: texto(ca.nombre, P.cabecera.nombre, 60),
    },
    portada: {
      composicion: opcion(po.composicion, OPCIONES.composicion, P.portada.composicion), imagen: imagen(po.imagen), credito: texto(po.credito, P.portada.credito, 120), titulo: texto(po.titulo, P.portada.titulo, 90), bajada: texto(po.bajada, '', 240),
      alto: opcion(po.alto, OPCIONES.alto, P.portada.alto), alineacion: opcion(po.alineacion, OPCIONES.alineacion, 'izquierda'), velo: numero(po.velo, 80, 0, 100),
      franjaDatos: bool(po.franjaDatos, true), populares: bool(po.populares, P.portada.populares),
      fotoLado: opcion(po.fotoLado, OPCIONES.fotoLado, 'derecha'),
      logoAnimacion: opcion(po.logoAnimacion, OPCIONES.logoAnimacion, 'vivo'), logoReposo: bool(po.logoReposo, true), logoGestos: bool(po.logoGestos, true),
      tamanoLogo: numero(po.tamanoLogo, 100, 50, 120), kicker: bool(po.kicker, true), buscador: bool(po.buscador, true), cordillera: bool(po.cordillera, true), puntos: bool(po.puntos, true),
      fotos: [0, 1, 2, 3].map((i) => imagen(Array.isArray(po.fotos) ? po.fotos[i] : '')), intervalo: numero(po.intervalo, 7, 3, 20), kenBurns: bool(po.kenBurns, true),
    },
    identidad: Object.fromEntries(Object.entries(P.identidad).map(([k, v]) => [k, k === 'cinta' ? numero(id.cinta, v, 15, 120) : k === 'encabezado' ? opcion(id.encabezado, OPCIONES.encabezado, v) : bool(id[k], v)])),
    pie: { estilo: opcion(pi.estilo, OPCIONES.pieEstilo, 'oscuro'), emergencias: bool(pi.emergencias, true), boletin: bool(pi.boletin, true), escudo: bool(pi.escudo, true), marcaGrande: bool(pi.marcaGrande, true) },
    animaciones: {
      activas: bool(an.activas, true), intensidad: opcion(an.intensidad, OPCIONES.intensidad, 'normal'), velocidad: numero(an.velocidad, 1, .5, 2),
      intro: opcion(an.intro, OPCIONES.intro, 'primera'), transiciones: bool(an.transiciones, true), aparicion: bool(an.aparicion, true),
      inclinacion: bool(an.inclinacion, P.animaciones.inclinacion), barraCarga: bool(an.barraCarga, true), cordillera: bool(an.cordillera, true),
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
const ALTO = { bajo: 'clamp(320px, 42vh, 420px)', medio: 'clamp(420px, 58vh, 560px)', alto: 'clamp(560px, 82vh, 860px)', pantalla: 'calc(100svh - 116px)' };
const BOTON = { redondeados: null, pildora: '999px', rectos: '2px' };

export function variablesCss(cfg) {
  const c = cfg.colores, t = cfg.tipografia, f = cfg.forma;
  const v = {
    '--azul': c.primario, '--ambar': c.acento, '--azul-profundo': c.oscuro, '--fondo': c.fondo, '--superficie': `color-mix(in srgb, ${c.fondo} 35%, #FFFFFF)`, '--fondo-2': c.fondoAlterno,
    '--texto': c.texto, '--verde': c.exito, '--rojo': c.peligro, '--ambar-tinta': tintaSobre(c.acento), '--sobre-azul': tintaSobre(c.primario),
    '--fuente': `${FUENTES[t.cuerpo].familia}, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
    '--fuente-titulo': `${FUENTES[t.titulos].familia}, ${FUENTES[t.cuerpo].familia}, system-ui, sans-serif`,
    '--tam-base': t.tamano, '--peso-titulo': t.pesoTitulos, '--espaciado-titulo': `${t.espaciadoTitulos / 100}em`,
    '--r': `${f.radio}px`, '--r-control': `${Math.round(f.radio * 0.75)}px`, '--r-boton': BOTON[f.botones] || `${Math.round(f.radio * 0.75)}px`,
    '--esp': ESCALA[f.densidad], '--ancho': `${f.ancho}px`,
    '--logo': `${cfg.cabecera.tamanoLogo}px`, '--hero-alto': ALTO[cfg.portada.alto], '--velo': cfg.portada.velo / 100,
    '--anim-vel': cfg.animaciones.velocidad,
    '--interfaz': cfg.forma.escala / 100, '--tk-logo-escala': cfg.portada.tamanoLogo / 100, '--cinta-dur': `${cfg.identidad.cinta}s`,
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
    'data-portada': cfg.portada.composicion, 'data-hero-alinear': cfg.portada.alineacion, 'data-franja': cfg.portada.franjaDatos ? 'si' : 'no', 'data-populares': cfg.portada.populares ? 'si' : 'no',
    'data-pie': cfg.pie.estilo, 'data-pie-emergencias': cfg.pie.emergencias ? 'si' : 'no', 'data-pie-boletin': cfg.pie.boletin ? 'si' : 'no', 'data-pie-escudo': cfg.pie.escudo ? 'si' : 'no', 'data-pie-marca': cfg.pie.marcaGrande ? 'si' : 'no',
    'data-anim': a.activas ? a.intensidad : 'no', 'data-intro': a.activas ? a.intro : 'nunca',
    'data-anim-transiciones': a.activas && a.transiciones ? 'si' : 'no', 'data-anim-aparicion': a.activas && a.aparicion ? 'si' : 'no',
    'data-anim-inclinacion': a.activas && a.inclinacion ? 'si' : 'no', 'data-anim-carga': a.activas && a.barraCarga ? 'si' : 'no',
    'data-anim-cordillera': a.activas && a.cordillera ? 'si' : 'no',
    'data-logo-anim': a.activas ? cfg.portada.logoAnimacion : 'ninguna', 'data-logo-reposo': a.activas && cfg.portada.logoReposo ? 'si' : 'no', 'data-logo-gestos': a.activas && cfg.portada.logoGestos ? 'si' : 'no',
    'data-kicker': cfg.portada.kicker ? 'si' : 'no', 'data-hero-buscar': cfg.portada.buscador ? 'si' : 'no', 'data-hero-montes': cfg.portada.cordillera ? 'si' : 'no', 'data-hero-puntos': cfg.portada.puntos ? 'si' : 'no',
    'data-kenburns': a.activas && cfg.portada.kenBurns ? 'si' : 'no', 'data-intervalo': String(cfg.portada.intervalo),
    'data-sombras': cfg.forma.sombras, 'data-hero-lado': cfg.portada.fotoLado, 'data-encabezado': cfg.identidad.encabezado,
    ...Object.fromEntries(Object.entries(cfg.identidad).filter(([k]) => k !== 'cinta' && k !== 'encabezado').map(([k, v]) => ['data-id-' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()), v ? 'si' : 'no'])),
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

// ------------------------------------------------------------------ Secciones de la portada
// Secciones que se agregaron después de la primera versión: si un sitio ya guardó su orden,
// aparecen activas en el lugar que les corresponde (después de la sección indicada).
export const SECCIONES_NUEVAS = [['campanas', 'banners', true], ['cinta', 'banners', false], ['mundos', 'noticias', false]];
export function completarSecciones(lista) {
  const todas = (lista || []).map((x) => ({ ...x }));
  for (const [id, despues, activo] of SECCIONES_NUEVAS) {
    if (todas.some((x) => x.id === id)) continue;
    const i = todas.findIndex((x) => x.id === despues);
    todas.splice(i < 0 ? todas.length : i + 1, 0, { id, activo });
  }
  return todas;
}

// Fotos de la portada «Capital del Trekking»: las elegidas en el panel (foto principal y
// cuatro más) o, si no hay ninguna, las cinco del sitio de turismo.
export const FOTOS_TREKKING = [1, 2, 3, 4, 5].map((n) => ({ src: `/img/trekking/portada-${n}-1920.webp`, srcset: `/img/trekking/portada-${n}-960.webp 960w, /img/trekking/portada-${n}-1920.webp 1920w` }));
export function fotosPortada(cfg) {
  const propias = [cfg.portada.imagen, ...cfg.portada.fotos].filter(Boolean).map((src) => ({ src, srcset: '' }));
  return propias.length ? propias : FOTOS_TREKKING;
}
