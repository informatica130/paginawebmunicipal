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

// El diseño predeterminado es «Portal colorido»: crema y azul de la Capital del Trekking, la
// franja azul con el escudo y el menú centrados, las campañas como protagonistas junto a los temas
// más consultados, mosaico de accesos con los nueve colores del logo y títulos en Bricolage.
export const PREDETERMINADO = {
  estilo: 'portal',
  colores: { primario: '#1F6FA8', acento: '#E9A92B', oscuro: '#0F3A5A', fondo: '#F7F3EC', fondoAlterno: '#EDE6D9', texto: '#17191B', exito: '#2F7D4A', peligro: '#C62828' },
  tipografia: { cuerpo: 'public-sans', titulos: 'bricolage', tamano: 16, pesoTitulos: 800, espaciadoTitulos: -3, menuMayusculas: true },
  forma: { radio: 18, radioGrande: 22, tarjetas: 'sombra', botones: 'pildora', densidad: 'normal', ancho: 1240, sombras: 'suaves', escala: 100, maqueta: 'portal', elevacion: 4 },
  cabecera: { estilo: 'oscura', centrada: true, fija: true, barraSuperior: false, botonTramites: false, menuAbrir: 'cursor', alternarLogo: true, alternarCada: 7, alternarTk: 6, alternarEfecto: 'giro', alternarEntrada: 'caida', logo: 'emblema', logoUrl: '', tamanoLogo: 54, subtitulo: 'Ilustre Municipalidad de', nombre: 'Melipeuco' },
  portada: { composicion: 'portal', fotoLado: 'derecha', imagen: '', credito: 'Volcán Llaima desde los senderos de Melipeuco', titulo: 'Municipalidad de Melipeuco', bajada: '', alto: 'alto', alineacion: 'izquierda', velo: 80, franjaDatos: true, populares: false,
    // Portada «Capital del Trekking»
    logoAnimacion: 'vivo', logoReposo: true, logoGestos: true, tamanoLogo: 100, kicker: true, buscador: true, cordillera: true, puntos: true,
    fotos: ['', '', '', ''], intervalo: 7, kenBurns: true },
  // Portada «portal»: franja, mosaico, temas y buscador
  portal: {
    bandaPropia: false, bandaInicio: '#2A6A9C', bandaFin: '#0F3A5A', bandaTipo: 'radial', bandaAngulo: 160, patron: 'curvas', patronIntensidad: 50, brillo: true,
    cordillera: true, cordilleraAlto: 100, mosaico: 6, mosaicoEstilo: 'solido', mosaicoColores: 'logo', mosaicoAlto: 150,
    temas: true, temasTitulo: 'Quiero información de…', temasEstilo: 'vidrio', buscador: 'pildora',
    logoTrekking: true, reparto: 'equilibrado', bannerProporcion: 'auto', bannerAjuste: 'cubrir', bannerEfecto: 'zoom',
  },
  // Banner de campañas (en la portada «portal» y en su sección)
  campanas: { autoplay: true, intervalo: 7, transicion: 'deslizar', flechas: 'cursor', puntos: 'pildora', pausa: true, marco: 'sombra', proporcionMovil: 'auto' },
  // Noticias (portada y listados)
  noticias: { disposicion: 'destacada', columnas: 4, proporcion: '16/10', estilo: 'limpia', resumen: 'destacada', fecha: true, categoria: true, efecto: 'zoom', etiqueta: 'texto' },
  // Elementos repetidos en todo el sitio
  elementos: { accesos: 'tarjetas', tramites: 'tarjetas', verTodo: 'pildora', categorias: 'pildora', iconos: 'suaves', separadores: 'ninguno' },
  // Buscador predictivo (portada, cabecera y página de resultados)
  buscador: { predictivo: true, ejemplos: true, ejemplosTexto: 'licencia de conducir, patente comercial, horario de buses, permiso de circulación, certificado de residencia', recientes: true, populares: true, fragmentos: true },
  // Identidad «Capital del Trekking» en todo el sitio
  identidad: { zonas: true, encabezado: 'claro', emblemaEncabezado: true, titulosPalabra: true, progreso: true, lineaCabecera: false, cordilleras: true, accesosColor: true, cinta: 42 },
  pie: { estilo: 'oscuro', emergencias: true, boletin: true, escudo: true, marcaGrande: true },
  animaciones: { activas: true, intensidad: 'normal', velocidad: 1, intro: 'primera', transiciones: true, aparicion: true, inclinacion: false, barraCarga: true, cordillera: true,
    introEstilo: 'escudo3d', escudoVivo: true, profundidad: 70, transicionEstilo: 'columnas', transicionColor: 'zona', transicionNombre: true, transicionLetras: 'logo', precarga: true, aparicionEstilo: 'mixto', cursorLuz: true, ondaClic: true, desplazamientoSuave: true },
  avanzado: { css: '' },
};

// Valores del diseño «Capital del Trekking» (el predeterminado anterior).
const TREKKING = {
  colores: { primario: '#1F6FA8', acento: '#E9A92B', oscuro: '#121417', fondo: '#F7F3EC', fondoAlterno: '#EDE6D9', texto: '#17191B', exito: '#2F7D4A', peligro: '#C62828' },
  tipografia: { cuerpo: 'public-sans', titulos: 'bricolage', pesoTitulos: 800, espaciadoTitulos: -3, menuMayusculas: false },
  forma: { radio: 14, tarjetas: 'sombra', botones: 'redondeados', ancho: 1200, maqueta: 'clasica' }, cabecera: { estilo: 'blanca', centrada: false }, pie: { estilo: 'oscuro' }, portada: { composicion: 'vitrina' },
};

// Valores del diseño institucional anterior (blanco, azul y ámbar, sólo líneas).
const INSTITUCIONAL = {
  colores: { primario: '#0B4F7C', acento: '#F2A900', oscuro: '#0D1B2A', fondo: '#FFFFFF', fondoAlterno: '#F4F5F7', texto: '#121A23', exito: '#1E7B4F', peligro: '#C62828' },
  tipografia: { cuerpo: 'public-sans', titulos: 'public-sans', pesoTitulos: 800, espaciadoTitulos: -2, menuMayusculas: false },
  forma: { radio: 10, tarjetas: 'linea', botones: 'redondeados', maqueta: 'clasica' }, cabecera: { estilo: 'blanca', centrada: false }, pie: { estilo: 'oscuro' },
};

// Estilos prediseñados: cambian colores, tipografía, forma, cabecera y pie (no los textos ni las fotos).
export const ESTILOS = {
  portal: { nombre: 'Portal colorido', descripcion: 'Franja azul con el escudo y el menú centrados, campañas protagonistas, temas más consultados y mosaico de colores.', valores: { portada: { composicion: 'portal' } } },
  trekking: { nombre: 'Capital del Trekking', descripcion: 'Papel crema, los nueve colores del logo, sombras suaves y la portada vitrina con el logo vivo.', valores: TREKKING },
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
  composicion: { portal: 'Portal: campañas, temas más consultados y mosaico de accesos', vitrina: 'Vitrina: logo y buscador junto a las fotos', trekking: 'Capital del Trekking: foto de fondo completa con el logo', dividida: 'Texto y foto lado a lado', foto: 'Foto de fondo completa' },
  alto: { bajo: 'Baja', medio: 'Media', alto: 'Alta', pantalla: 'Pantalla completa' },
  alineacion: { izquierda: 'A la izquierda', centro: 'Centrada' },
  maqueta: { portal: 'Portal: títulos centrados y noticias en mosaico', clasica: 'Clásica: títulos a la izquierda' },
  fotoLado: { derecha: 'Fotos a la derecha', izquierda: 'Fotos a la izquierda' },
  sombras: { ninguna: 'Sin sombras (sólo bordes)', suaves: 'Suaves', marcadas: 'Marcadas' },
  encabezado: { claro: 'Claro con el tono del área', oscuro: 'Oscuro con el color del área', simple: 'Simple (sin color)' },
  pieEstilo: { oscuro: 'Oscuro', color: 'Color principal', claro: 'Claro' },
  intensidad: { sutil: 'Sutil', normal: 'Normal', expresiva: 'Expresiva' },
  intro: { primera: 'Primera visita de cada sesión', siempre: 'Cada vez que se abre la portada', nunca: 'Nunca' },
  introEstilo: { escudo3d: 'El escudo municipal se arma en 3D y vuela a la cabecera', logo3d: 'El logo se reconstruye en 3D, pieza por pieza', escudo: 'El escudo municipal se arma (clásica, plana)' },
  transicionEstilo: { columnas: 'Nueve columnas que giran en 3D (una por letra)', portal: 'Portal: el emblema del área se abre en círculo', cordillera: 'Cordillera: capas de montaña que suben', telon: 'Telón: dos paños se cierran con el escudo al centro', persiana: 'Persiana: nueve franjas horizontales que giran', diagonal: 'Barrido diagonal con los colores del área', vista: 'Fluida: la cabecera queda quieta y el contenido se desliza (la más rápida)' },
  menuAbrir: { cursor: 'Al pasar el cursor', clic: 'Al hacer clic' },
  alternarEfecto: { giro: 'Giro en 3D', volteo: 'Volteo lateral', fundido: 'Fundido suave', deslizar: 'Desliza hacia arriba', barrido: 'Barrido', zoom: 'Acercamiento' },
  alternarEntrada: { caida: 'Las letras caen y rebotan', salto: 'Saltan desde abajo', ola: 'Crecen en ola', vivo: 'Logo vivo completo', aparecer: 'Aparece de una vez' },
  transicionLetras: { logo: 'Letras de colores como el logo', simple: 'Letras simples' },
  transicionCampana: { deslizar: 'Deslizar', fundido: 'Fundido', zoom: 'Fundido con acercamiento', profundidad: 'Profundidad 3D' },
  flechas: { cursor: 'Al pasar el cursor', siempre: 'Siempre', nunca: 'Nunca' },
  puntos: { pildora: 'Píldoras', puntos: 'Puntos', barra: 'Barras de progreso', ninguno: 'Ocultos' },
  marcoCampana: { sombra: 'Con sombra', borde: 'Borde blanco', plano: 'Plano' },
  disposicionNoticias: { destacada: 'Mosaico con una destacada', grilla: 'Grilla pareja', revista: 'Revista: la primera a lo ancho', lista: 'Lista con foto al lado', carrusel: 'Carrusel deslizable' },
  proporcionFoto: { '16/10': '16:10', '4/3': '4:3', '3/2': '3:2', '1/1': 'Cuadrada', '21/9': 'Panorámica' },
  estiloNoticia: { limpia: 'Limpia (foto y texto)', tarjeta: 'Tarjeta con fondo', superpuesta: 'Texto sobre la foto' },
  resumenNoticia: { destacada: 'Sólo en la destacada', todas: 'En todas', ninguna: 'En ninguna' },
  efectoNoticia: { zoom: 'Acercar la foto', elevar: 'Elevar la tarjeta', brillo: 'Brillo que cruza', ninguno: 'Sin efecto' },
  etiquetaNoticia: { texto: 'Texto de color', pildora: 'Píldora suave', solida: 'Píldora de color' },
  estiloAccesos: { tarjetas: 'Tarjetas con ícono', iconos: 'Íconos grandes en círculo', pildoras: 'Píldoras compactas' },
  estiloTramites: { tarjetas: 'Tarjetas en grilla', filas: 'Lista en filas' },
  verTodo: { pildora: 'Botón píldora', enlace: 'Enlace con flecha' },
  estiloCategorias: { pildora: 'Píldoras', subrayado: 'Pestañas subrayadas' },
  estiloIconos: { suaves: 'Fondo suave', solidos: 'Fondo de color', lineas: 'Sólo el trazo' },
  separadores: { ninguno: 'Sin separadores', ondas: 'Ondas entre secciones', montes: 'Cordillera entre secciones' },
  aparicionEstilo: { mixto: 'Cada elemento a su manera', subir: 'Suben', fundido: 'Aparecen', zoom: 'Crecen', giro3d: 'Giran en 3D', lateral: 'Llegan desde el lado', desenfoque: 'Se enfocan' },
  reparto: { equilibrado: 'Equilibrado', banner: 'Campaña más grande', panel: 'Buscador más ancho' },
  bannerProporcion: { auto: 'La de la imagen', '16/9': 'Panorámica 16:9', '21/9': 'Cine 21:9', '3/1': 'Franja 3:1', '4/3': 'Clásica 4:3', '1/1': 'Cuadrada 1:1' },
  bannerAjuste: { cubrir: 'Llenar el marco (recorta los bordes)', completa: 'Imagen completa (sin recortar)' },
  bannerEfecto: { zoom: 'Acercar la imagen', elevar: 'Elevar la tarjeta', ninguno: 'Sin efecto' },
  transicionColor: { zona: 'Color del área de destino', arcoiris: 'Los nueve colores del logo' },
  bandaTipo: { radial: 'Degradado circular', lineal: 'Degradado lineal', solido: 'Color sólido' },
  patron: { curvas: 'Curvas de nivel', puntos: 'Puntos', diagonales: 'Líneas diagonales', ninguno: 'Sin patrón' },
  mosaicoEstilo: { solido: 'Color sólido', degradado: 'Degradado', blanco: 'Tarjeta blanca con ícono de color' },
  mosaicoColores: { logo: 'Colores del logo', tema: 'Color principal y acento' },
  temasEstilo: { vidrio: 'Vidrio sobre la franja', solido: 'Botones blancos' },
  buscador: { pildora: 'Píldora', redondeado: 'Esquinas suaves' },
  curva: { suave: 'Suave', rebote: 'Con rebote', rapida: 'Rápida y precisa' },
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
  const limpio = id === 'portal' ? fusionar(PREDETERMINADO, {}) : fusionar(PREDETERMINADO, INSTITUCIONAL);
  const base = { colores: limpio.colores, tipografia: limpio.tipografia, forma: limpio.forma, cabecera: { estilo: limpio.cabecera.estilo, centrada: limpio.cabecera.centrada }, pie: { estilo: limpio.pie.estilo }, animaciones: { intensidad: limpio.animaciones.intensidad } };
  return normalizar(fusionar(fusionar(cfg, base), { ...e.valores, estilo: id }));
}

// Revisión del diseño. Los diseños guardados antes de «Portal colorido» (sin revisión y con otra
// portada) pasan una sola vez al nuevo diseño; conservan textos, fotos, logo y CSS propio. Lo que
// se guarde después (o una versión anterior que se restaure) lleva la revisión y no se toca.
export const REVISION = 3;
export function migrar(d) {
  if (!esObjeto(d) || !Object.keys(d).length || Number(d.revision) >= REVISION) return d;
  if (d.portada?.composicion === 'portal') return { ...d, revision: REVISION };
  return aplicarEstilo(normalizar(d), 'portal');
}

export function normalizar(entrada, { permitirCss = true, previo = null } = {}) {
  const e = fusionar(PREDETERMINADO, esObjeto(entrada) ? entrada : {});
  const P = PREDETERMINADO, c = e.colores, t = e.tipografia, f = e.forma, ca = e.cabecera, po = e.portada, pi = e.pie, an = e.animaciones, id = e.identidad, pt = e.portal, PP = P.portal, bu = e.buscador, cp = e.campanas, no = e.noticias, el = e.elementos;
  return {
    revision: REVISION,
    estilo: opcion(e.estilo, { ...ESTILOS, personalizado: 1 }, 'personalizado'),
    colores: Object.fromEntries(Object.keys(P.colores).map((k) => [k, color(c[k], P.colores[k])])),
    tipografia: {
      cuerpo: opcion(t.cuerpo, FUENTES, P.tipografia.cuerpo), titulos: opcion(t.titulos, FUENTES, P.tipografia.titulos),
      tamano: numero(t.tamano, P.tipografia.tamano, 14, 21), pesoTitulos: numero(t.pesoTitulos, 800, 500, 900), espaciadoTitulos: numero(t.espaciadoTitulos, P.tipografia.espaciadoTitulos, -5, 5),
      menuMayusculas: bool(t.menuMayusculas, P.tipografia.menuMayusculas),
    },
    forma: {
      radio: numero(f.radio, P.forma.radio, 0, 24), tarjetas: opcion(f.tarjetas, OPCIONES.tarjetas, P.forma.tarjetas), botones: opcion(f.botones, OPCIONES.botones, P.forma.botones),
      densidad: opcion(f.densidad, OPCIONES.densidad, 'normal'), ancho: numero(f.ancho, P.forma.ancho, 960, 1440), sombras: opcion(f.sombras, OPCIONES.sombras, P.forma.sombras), escala: numero(f.escala, 100, 80, 115), radioGrande: numero(f.radioGrande, P.forma.radioGrande, 0, 48), elevacion: numero(f.elevacion, P.forma.elevacion, 0, 14), maqueta: opcion(f.maqueta, OPCIONES.maqueta, P.forma.maqueta),
    },
    cabecera: {
      estilo: opcion(ca.estilo, OPCIONES.cabeceraEstilo, P.cabecera.estilo), centrada: bool(ca.centrada, P.cabecera.centrada), fija: bool(ca.fija, true), barraSuperior: bool(ca.barraSuperior, P.cabecera.barraSuperior), botonTramites: bool(ca.botonTramites, P.cabecera.botonTramites), menuAbrir: opcion(ca.menuAbrir, OPCIONES.menuAbrir, 'cursor'), alternarLogo: bool(ca.alternarLogo, true), alternarCada: numero(ca.alternarCada, 7, 3, 30), alternarTk: numero(ca.alternarTk, 6, 3, 30), alternarEfecto: opcion(ca.alternarEfecto, OPCIONES.alternarEfecto, 'giro'), alternarEntrada: opcion(ca.alternarEntrada, OPCIONES.alternarEntrada, 'caida'),
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
    portal: {
      bandaPropia: bool(pt.bandaPropia, false), bandaInicio: color(pt.bandaInicio, PP.bandaInicio), bandaFin: color(pt.bandaFin, PP.bandaFin),
      bandaTipo: opcion(pt.bandaTipo, OPCIONES.bandaTipo, PP.bandaTipo), bandaAngulo: numero(pt.bandaAngulo, PP.bandaAngulo, 0, 360),
      patron: opcion(pt.patron, OPCIONES.patron, PP.patron), patronIntensidad: numero(pt.patronIntensidad, PP.patronIntensidad, 0, 100), brillo: bool(pt.brillo, PP.brillo),
      cordillera: bool(pt.cordillera, PP.cordillera), cordilleraAlto: numero(pt.cordilleraAlto, PP.cordilleraAlto, 40, 200),
      mosaico: numero(pt.mosaico, PP.mosaico, 0, 8), mosaicoEstilo: opcion(pt.mosaicoEstilo, OPCIONES.mosaicoEstilo, PP.mosaicoEstilo), mosaicoColores: opcion(pt.mosaicoColores, OPCIONES.mosaicoColores, PP.mosaicoColores), mosaicoAlto: numero(pt.mosaicoAlto, PP.mosaicoAlto, 100, 240),
      temas: bool(pt.temas, PP.temas), temasTitulo: texto(pt.temasTitulo, PP.temasTitulo, 60), temasEstilo: opcion(pt.temasEstilo, OPCIONES.temasEstilo, PP.temasEstilo), buscador: opcion(pt.buscador, OPCIONES.buscador, PP.buscador),
      logoTrekking: bool(pt.logoTrekking, PP.logoTrekking), reparto: opcion(pt.reparto, OPCIONES.reparto, PP.reparto),
      bannerProporcion: opcion(pt.bannerProporcion, OPCIONES.bannerProporcion, PP.bannerProporcion), bannerAjuste: opcion(pt.bannerAjuste, OPCIONES.bannerAjuste, PP.bannerAjuste), bannerEfecto: opcion(pt.bannerEfecto, OPCIONES.bannerEfecto, PP.bannerEfecto),
    },
    campanas: {
      autoplay: bool(cp.autoplay, true), intervalo: numero(cp.intervalo, 7, 3, 20), transicion: opcion(cp.transicion, OPCIONES.transicionCampana, 'deslizar'),
      flechas: opcion(cp.flechas, OPCIONES.flechas, 'cursor'), puntos: opcion(cp.puntos, OPCIONES.puntos, 'pildora'), pausa: bool(cp.pausa, true),
      marco: opcion(cp.marco, OPCIONES.marcoCampana, 'sombra'), proporcionMovil: opcion(cp.proporcionMovil, OPCIONES.bannerProporcion, 'auto'),
    },
    noticias: {
      disposicion: opcion(no.disposicion, OPCIONES.disposicionNoticias, 'destacada'), columnas: numero(no.columnas, 4, 2, 4), proporcion: opcion(no.proporcion, OPCIONES.proporcionFoto, '16/10'),
      estilo: opcion(no.estilo, OPCIONES.estiloNoticia, 'limpia'), resumen: opcion(no.resumen, OPCIONES.resumenNoticia, 'destacada'), fecha: bool(no.fecha, true), categoria: bool(no.categoria, true),
      efecto: opcion(no.efecto, OPCIONES.efectoNoticia, 'zoom'), etiqueta: opcion(no.etiqueta, OPCIONES.etiquetaNoticia, 'texto'),
    },
    elementos: {
      accesos: opcion(el.accesos, OPCIONES.estiloAccesos, 'tarjetas'), tramites: opcion(el.tramites, OPCIONES.estiloTramites, 'tarjetas'), verTodo: opcion(el.verTodo, OPCIONES.verTodo, 'pildora'),
      categorias: opcion(el.categorias, OPCIONES.estiloCategorias, 'pildora'), iconos: opcion(el.iconos, OPCIONES.estiloIconos, 'suaves'), separadores: opcion(el.separadores, OPCIONES.separadores, 'ninguno'),
    },
    buscador: {
      predictivo: bool(bu.predictivo, true), ejemplos: bool(bu.ejemplos, true), ejemplosTexto: texto(bu.ejemplosTexto, P.buscador.ejemplosTexto, 300),
      recientes: bool(bu.recientes, true), populares: bool(bu.populares, true), fragmentos: bool(bu.fragmentos, true),
    },
    identidad: Object.fromEntries(Object.entries(P.identidad).map(([k, v]) => [k, k === 'cinta' ? numero(id.cinta, v, 15, 120) : k === 'encabezado' ? opcion(id.encabezado, OPCIONES.encabezado, v) : bool(id[k], v)])),
    pie: { estilo: opcion(pi.estilo, OPCIONES.pieEstilo, 'oscuro'), emergencias: bool(pi.emergencias, true), boletin: bool(pi.boletin, true), escudo: bool(pi.escudo, true), marcaGrande: bool(pi.marcaGrande, true) },
    animaciones: {
      activas: bool(an.activas, true), intensidad: opcion(an.intensidad, OPCIONES.intensidad, 'normal'), velocidad: numero(an.velocidad, 1, .5, 2),
      intro: opcion(an.intro, OPCIONES.intro, 'primera'), transiciones: bool(an.transiciones, true), aparicion: bool(an.aparicion, true),
      inclinacion: bool(an.inclinacion, P.animaciones.inclinacion), barraCarga: bool(an.barraCarga, true), cordillera: bool(an.cordillera, P.animaciones.cordillera),
      curva: opcion(an.curva, OPCIONES.curva, 'suave'),
      introEstilo: opcion(an.introEstilo, OPCIONES.introEstilo, P.animaciones.introEstilo), escudoVivo: bool(an.escudoVivo, true), profundidad: numero(an.profundidad, 70, 0, 100),
      transicionEstilo: opcion(an.transicionEstilo, OPCIONES.transicionEstilo, 'columnas'), transicionColor: opcion(an.transicionColor, OPCIONES.transicionColor, 'zona'),
      transicionNombre: bool(an.transicionNombre, true), transicionLetras: opcion(an.transicionLetras, OPCIONES.transicionLetras, 'logo'), precarga: bool(an.precarga, true),
      aparicionEstilo: opcion(an.aparicionEstilo, OPCIONES.aparicionEstilo, 'mixto'), cursorLuz: bool(an.cursorLuz, true), ondaClic: bool(an.ondaClic, true), desplazamientoSuave: bool(an.desplazamientoSuave, true),
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
const CURVAS = { suave: 'cubic-bezier(.2, .8, .2, 1)', rebote: 'cubic-bezier(.34, 1.56, .64, 1)', rapida: 'cubic-bezier(.4, 0, .2, 1)' };
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
    '--interfaz': cfg.forma.escala / 100, '--r-l': `${cfg.forma.radioGrande}px`, '--r-xl': `${Math.round(cfg.forma.radioGrande * 1.3)}px`, '--elevacion': `${cfg.forma.elevacion}px`,
    '--mov': CURVAS[cfg.animaciones.curva], '--pt-angulo': `${cfg.portal.bandaAngulo}deg`, '--pt-patron': cfg.portal.patronIntensidad / 100,
    '--pt-montes': `${cfg.portal.cordilleraAlto}px`, '--pt-tile-alto': `${cfg.portal.mosaicoAlto}px`, '--pt-banner-ar': cfg.portal.bannerProporcion === 'auto' ? 'auto' : cfg.portal.bannerProporcion.replace('/', ' / '), '--camp-ar-movil': cfg.campanas.proporcionMovil === 'auto' ? 'auto' : cfg.campanas.proporcionMovil.replace('/', ' / '), '--camp-dur': `${cfg.campanas.intervalo}s`, '--tn-ar': cfg.noticias.proporcion.replace('/', ' / '), '--tn-cols': cfg.noticias.columnas, '--alternar': `${cfg.cabecera.alternarCada}s`,
    ...(cfg.portal.bandaPropia ? { '--pt-ini': cfg.portal.bandaInicio, '--pt-fin': cfg.portal.bandaFin } : {}), '--tk-logo-escala': cfg.portada.tamanoLogo / 100, '--cinta-dur': `${cfg.identidad.cinta}s`,
  };
  return ':root{' + Object.entries(v).map(([k, x]) => `${k}:${x}`).join(';') + '}';
}

export function atributos(cfg) {
  const a = cfg.animaciones;
  return {
    'data-cabecera': cfg.cabecera.estilo, 'data-logo-cabecera': cfg.cabecera.logo, 'data-escudo-vivo': cfg.animaciones.activas && cfg.animaciones.escudoVivo ? 'si' : 'no', 'data-cabecera-fija': cfg.cabecera.fija ? 'si' : 'no',
    'data-barra-superior': cfg.cabecera.barraSuperior ? 'si' : 'no', 'data-boton-tramites': cfg.cabecera.botonTramites ? 'si' : 'no',
    'data-menu-mayusculas': cfg.tipografia.menuMayusculas ? 'si' : 'no',
    'data-tarjetas': cfg.forma.tarjetas, 'data-botones': cfg.forma.botones, 'data-densidad': cfg.forma.densidad,
    'data-portada': cfg.portada.composicion, 'data-hero-alinear': cfg.portada.alineacion, 'data-franja': cfg.portada.franjaDatos ? 'si' : 'no', 'data-populares': cfg.portada.populares ? 'si' : 'no',
    'data-pie': cfg.pie.estilo, 'data-pie-emergencias': cfg.pie.emergencias ? 'si' : 'no', 'data-pie-boletin': cfg.pie.boletin ? 'si' : 'no', 'data-pie-escudo': cfg.pie.escudo ? 'si' : 'no', 'data-pie-marca': cfg.pie.marcaGrande ? 'si' : 'no',
    'data-anim': a.activas ? a.intensidad : 'no', 'data-intro': a.activas ? a.intro : 'nunca',
    'data-anim-transiciones': a.activas && a.transiciones ? 'si' : 'no', 'data-anim-aparicion': a.activas && a.aparicion ? 'si' : 'no',
    'data-anim-inclinacion': a.activas && a.inclinacion ? 'si' : 'no', 'data-anim-carga': a.activas && a.barraCarga ? 'si' : 'no',
    'data-anim-cordillera': a.activas && a.cordillera ? 'si' : 'no', 'data-transicion': a.transicionEstilo, 'data-transicion-color': a.transicionColor,
    'data-intro-estilo': a.introEstilo, 'data-intro-profundidad': String(a.profundidad),
    'data-logo-anim': a.activas ? cfg.portada.logoAnimacion : 'ninguna', 'data-logo-reposo': a.activas && cfg.portada.logoReposo ? 'si' : 'no', 'data-logo-gestos': a.activas && cfg.portada.logoGestos ? 'si' : 'no',
    'data-kicker': cfg.portada.kicker ? 'si' : 'no', 'data-hero-buscar': cfg.portada.buscador ? 'si' : 'no', 'data-hero-montes': cfg.portada.cordillera ? 'si' : 'no', 'data-hero-puntos': cfg.portada.puntos ? 'si' : 'no',
    'data-kenburns': a.activas && cfg.portada.kenBurns ? 'si' : 'no', 'data-intervalo': String(cfg.portada.intervalo),
    'data-pt-banda': cfg.portal.bandaTipo, 'data-pt-patron': cfg.portal.patron, 'data-pt-brillo': a.activas && cfg.portal.brillo ? 'si' : 'no', 'data-pt-cordillera': cfg.portal.cordillera ? 'si' : 'no',
    'data-pt-mosaico': String(cfg.portal.mosaico), 'data-pt-mosaico-estilo': cfg.portal.mosaicoEstilo, 'data-pt-mosaico-colores': cfg.portal.mosaicoColores,
    'data-pt-temas': cfg.portal.temas ? 'si' : 'no', 'data-pt-temas-estilo': cfg.portal.temasEstilo, 'data-pt-buscador': cfg.portal.buscador, 'data-pt-propia': cfg.portal.bandaPropia ? 'si' : 'no',
    'data-pt-logo': cfg.portal.logoTrekking ? 'si' : 'no', 'data-pt-reparto': cfg.portal.reparto, 'data-pt-banner': cfg.portal.bannerProporcion === 'auto' ? 'auto' : 'fijo', 'data-pt-ajuste': cfg.portal.bannerAjuste, 'data-pt-efecto': cfg.portal.bannerEfecto,
    'data-alternar-logo': a.activas && cfg.cabecera.alternarLogo ? 'si' : 'no', 'data-alternar-efecto': cfg.cabecera.alternarEfecto, 'data-alternar-cada': String(cfg.cabecera.alternarCada), 'data-alternar-tk': String(cfg.cabecera.alternarTk), 'data-alternar-entrada': cfg.cabecera.alternarEntrada, 'data-transicion-letras': a.transicionLetras,
    'data-camp-auto': cfg.campanas.autoplay ? String(cfg.campanas.intervalo) : '0', 'data-camp-trans': cfg.campanas.transicion, 'data-camp-flechas': cfg.campanas.flechas, 'data-camp-puntos': cfg.campanas.puntos, 'data-camp-pausa': cfg.campanas.pausa ? 'si' : 'no', 'data-camp-marco': cfg.campanas.marco, 'data-camp-movil': cfg.campanas.proporcionMovil === 'auto' ? 'auto' : 'fijo',
    'data-noticias': cfg.noticias.disposicion, 'data-tn-estilo': cfg.noticias.estilo, 'data-tn-resumen': cfg.noticias.resumen, 'data-tn-fecha': cfg.noticias.fecha ? 'si' : 'no', 'data-tn-categoria': cfg.noticias.categoria ? 'si' : 'no', 'data-tn-efecto': cfg.noticias.efecto, 'data-tn-etiqueta': cfg.noticias.etiqueta,
    'data-el-accesos': cfg.elementos.accesos, 'data-el-tramites': cfg.elementos.tramites, 'data-el-ver-todo': cfg.elementos.verTodo, 'data-el-categorias': cfg.elementos.categorias, 'data-el-iconos': cfg.elementos.iconos, 'data-el-separadores': cfg.elementos.separadores,
    'data-aparicion-estilo': a.aparicionEstilo, 'data-cursor-luz': a.activas && a.cursorLuz ? 'si' : 'no', 'data-onda-clic': a.activas && a.ondaClic ? 'si' : 'no', 'data-desplazamiento': a.desplazamientoSuave ? 'suave' : 'normal',
    'data-menu-abrir': cfg.cabecera.menuAbrir, 'data-transicion-nombre': cfg.animaciones.transicionNombre ? 'si' : 'no', 'data-precarga': cfg.animaciones.precarga ? 'si' : 'no',
    'data-busca-predictivo': cfg.buscador.predictivo ? 'si' : 'no', 'data-busca-ejemplos': cfg.buscador.ejemplos ? 'si' : 'no', 'data-busca-recientes': cfg.buscador.recientes ? 'si' : 'no', 'data-busca-populares': cfg.buscador.populares ? 'si' : 'no', 'data-busca-fragmentos': cfg.buscador.fragmentos ? 'si' : 'no', 'data-busca-lista': cfg.buscador.ejemplosTexto,
    'data-sombras': cfg.forma.sombras, 'data-maqueta': cfg.forma.maqueta, 'data-cabecera-centrada': cfg.cabecera.centrada ? 'si' : 'no', 'data-hero-lado': cfg.portada.fotoLado, 'data-encabezado': cfg.identidad.encabezado,
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
export const SECCIONES_NUEVAS = [['campanas', 'banners', true], ['cinta', 'banners', false], ['mundos', 'noticias', false], ['videoteca', 'noticias', true]];
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
