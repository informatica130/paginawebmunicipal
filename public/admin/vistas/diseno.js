// Diseño del sitio: colores, tipografía, formas, cabecera, portada, pie y animaciones, con
// vista previa en vivo. La vista previa es el sitio real en un marco; recibe el diseño en
// edición por postMessage y lo aplica sin recargar (public/js/sitio.js).
import { h, raw, $, $$, api, aviso, fallo, estado, confirmar, ico } from '../ui.js';
import { campo } from '../campos.js';
import { marcarCambios } from '../admin.js';
import { PREDETERMINADO, ESTILOS, FUENTES, OPCIONES, SECCIONES_PORTADA, normalizar, migrar, aplicarEstilo, variablesCss, atributos, urlFuentes, logoCabecera, fotosPortada, patronUrl } from '/js/diseno.js';

// Sección de la portada que se está personalizando en «Secciones de la portada».
let secElegida = 'noticias';

// Portadas que llevan el logo vivo y el carrusel de fotos.
const conLogo = (c) => ['trekking', 'vitrina'].includes(c.portada.composicion) || (c.portada.composicion === 'portal' && c.portal.logoTrekking);

// Controles agrupados. ruta = propiedad dentro del diseño.
const GRUPOS = [
  { id: 'colores', titulo: 'Colores', ayuda: 'El texto sobre los botones se ajusta solo para mantener buen contraste.', controles: [
    { ruta: 'colores.primario', tipo: 'color', etiqueta: 'Principal', ayuda: 'Enlaces, botones, íconos y cabecera de color.' },
    { ruta: 'colores.acento', tipo: 'color', etiqueta: 'Acento', ayuda: 'Botón «Buscar», «Trámites» y destacados.' },
    { ruta: 'colores.oscuro', tipo: 'color', etiqueta: 'Profundo', ayuda: 'Pie, barra superior y velo de la portada.' },
    { ruta: 'colores.fondo', tipo: 'color', etiqueta: 'Fondo de página' },
    { ruta: 'colores.fondoAlterno', tipo: 'color', etiqueta: 'Fondo de bandas' },
    { ruta: 'colores.texto', tipo: 'color', etiqueta: 'Texto' },
    { ruta: 'colores.exito', tipo: 'color', etiqueta: 'Etiquetas y «en línea»' },
    { ruta: 'colores.peligro', tipo: 'color', etiqueta: 'Emergencias' },
  ] },
  { id: 'tipografia', titulo: 'Tipografía', controles: [
    { ruta: 'tipografia.cuerpo', tipo: 'lista', etiqueta: 'Letra del texto', opciones: Object.fromEntries(Object.entries(FUENTES).map(([k, f]) => [k, f.nombre])) },
    { ruta: 'tipografia.titulos', tipo: 'lista', etiqueta: 'Letra de los títulos', opciones: Object.fromEntries(Object.entries(FUENTES).map(([k, f]) => [k, f.nombre])) },
    { ruta: 'tipografia.tamano', tipo: 'rango', etiqueta: 'Tamaño del texto', min: 14, max: 21, paso: 1, unidad: ' px' },
    { ruta: 'tipografia.pesoTitulos', tipo: 'rango', etiqueta: 'Grosor de los títulos', min: 500, max: 900, paso: 100 },
    { ruta: 'tipografia.espaciadoTitulos', tipo: 'rango', etiqueta: 'Espaciado de los títulos', min: -5, max: 5, paso: 1 },
    { ruta: 'tipografia.menuMayusculas', tipo: 'si', etiqueta: 'Menú principal en mayúsculas' },
  ] },
  { id: 'forma', titulo: 'Formas y espacios', controles: [
    { ruta: 'forma.radio', tipo: 'rango', etiqueta: 'Redondeo de botones y campos', min: 0, max: 24, paso: 1, unidad: ' px' },
    { ruta: 'forma.radioGrande', tipo: 'rango', etiqueta: 'Redondeo de tarjetas, fotos y banners', min: 0, max: 48, paso: 2, unidad: ' px' },
    { ruta: 'forma.elevacion', tipo: 'rango', etiqueta: 'Cuánto se elevan las tarjetas al pasar el cursor', min: 0, max: 14, paso: 1, unidad: ' px' },
    { ruta: 'forma.tarjetas', tipo: 'botones', etiqueta: 'Tarjetas y listas', opciones: OPCIONES.tarjetas },
    { ruta: 'forma.botones', tipo: 'botones', etiqueta: 'Botones', opciones: OPCIONES.botones },
    { ruta: 'forma.sombras', tipo: 'botones', etiqueta: 'Sombras', opciones: OPCIONES.sombras },
    { ruta: 'forma.maqueta', tipo: 'botones', etiqueta: 'Estructura de las secciones', opciones: OPCIONES.maqueta },
    { ruta: 'forma.densidad', tipo: 'botones', etiqueta: 'Espacio entre secciones', opciones: OPCIONES.densidad },
    { ruta: 'forma.escala', tipo: 'rango', etiqueta: 'Tamaño general de la interfaz', min: 80, max: 115, paso: 5, unidad: ' %', ayuda: 'Achica o agranda todo el sitio a la vez (textos, botones, espacios y logo). Las personas pueden agrandar el texto con el botón de lectura.' },
    { ruta: 'forma.ancho', tipo: 'rango', etiqueta: 'Ancho máximo del contenido', min: 960, max: 1440, paso: 20, unidad: ' px' },
  ] },
  { id: 'fondos', titulo: 'Fondos y patrones', ayuda: 'Un dibujo muy suave detrás de todas las páginas y un degradado de color arriba. Para dar un fondo distinto a una sección de la portada, vaya a «Portada → Secciones de la portada».', controles: [
    { ruta: 'fondos.patron', tipo: 'patron', etiqueta: 'Patrón de fondo de las páginas', opciones: OPCIONES.patronFondo },
    { ruta: 'fondos.color', tipo: 'botones', etiqueta: 'Color del patrón', opciones: OPCIONES.colorPatron, si: (c) => c.fondos.patron !== 'ninguno' },
    { ruta: 'fondos.intensidad', tipo: 'rango', etiqueta: 'Intensidad del patrón', min: 1, max: 40, paso: 1, unidad: ' %', si: (c) => c.fondos.patron !== 'ninguno' },
    { ruta: 'fondos.escala', tipo: 'rango', etiqueta: 'Tamaño del dibujo', min: 50, max: 250, paso: 10, unidad: ' %', si: (c) => c.fondos.patron !== 'ninguno' },
    { ruta: 'fondos.degradado', tipo: 'lista', etiqueta: 'Degradado de color arriba de cada página', opciones: OPCIONES.degradadoFondo },
    { ruta: 'fondos.tinte', tipo: 'rango', etiqueta: 'Tinte de las tarjetas (0 = blancas, 100 = del color del fondo)', min: 0, max: 100, paso: 5, unidad: ' %' },
  ] },
  { id: 'cabecera', titulo: 'Cabecera y logo', controles: [
    { ruta: 'cabecera.estilo', tipo: 'botones', etiqueta: 'Fondo de la cabecera', opciones: OPCIONES.cabeceraEstilo },
    { ruta: 'cabecera.colorPropio', tipo: 'si', etiqueta: 'Elegir el color de la cabecera', si: (c) => c.cabecera.estilo !== 'blanca' },
    { ruta: 'cabecera.color', tipo: 'color', etiqueta: 'Color de la cabecera', si: (c) => c.cabecera.estilo !== 'blanca' && c.cabecera.colorPropio },
    { ruta: 'cabecera.centrada', tipo: 'si', etiqueta: 'Escudo y menú centrados' },
    { ruta: 'cabecera.menuAbrir', tipo: 'botones', etiqueta: 'Abrir los menús (en computador)', opciones: OPCIONES.menuAbrir },
    { ruta: 'cabecera.alternarLogo', tipo: 'si', etiqueta: 'Alternar el escudo con el logo animado «Capital del Trekking»', ayuda: 'El escudo cede su lugar al logo de las nueve letras, que se anima, y luego vuelve. Se detiene mientras el cursor está encima.', si: (c) => c.animaciones.activas },
    { ruta: 'cabecera.alternarCada', tipo: 'rango', etiqueta: 'Tiempo del escudo antes de cambiar', min: 3, max: 30, paso: 1, unidad: ' s', si: (c) => c.animaciones.activas && c.cabecera.alternarLogo },
    { ruta: 'cabecera.alternarTk', tipo: 'rango', etiqueta: 'Tiempo del logo del trekking', min: 3, max: 30, paso: 1, unidad: ' s', si: (c) => c.animaciones.activas && c.cabecera.alternarLogo },
    { ruta: 'cabecera.alternarEntrada', tipo: 'lista', etiqueta: 'Entrada de las letras del logo', opciones: OPCIONES.alternarEntrada, si: (c) => c.animaciones.activas && c.cabecera.alternarLogo },
    { ruta: 'cabecera.alternarEfecto', tipo: 'lista', etiqueta: 'Efecto del cambio', opciones: OPCIONES.alternarEfecto, si: (c) => c.animaciones.activas && c.cabecera.alternarLogo },
    { ruta: 'cabecera.logo', tipo: 'lista', etiqueta: 'Logo', opciones: OPCIONES.logo },
    { ruta: 'cabecera.logoUrl', tipo: 'imagen', etiqueta: 'Imagen del logo propio', si: (c) => c.cabecera.logo === 'personalizado' },
    { ruta: 'cabecera.tamanoLogo', tipo: 'rango', etiqueta: 'Tamaño del logo', min: 36, max: 96, paso: 2, unidad: ' px' },
    { ruta: 'cabecera.subtitulo', tipo: 'texto', etiqueta: 'Texto pequeño junto al logo', si: (c) => c.cabecera.logo === 'emblema' },
    { ruta: 'cabecera.nombre', tipo: 'texto', etiqueta: 'Nombre junto al logo', si: (c) => c.cabecera.logo === 'emblema' },
    { ruta: 'cabecera.fija', tipo: 'si', etiqueta: 'Cabecera fija al bajar (se compacta)' },
    { ruta: 'cabecera.barraSuperior', tipo: 'si', etiqueta: 'Barra de transparencia y accesibilidad' },
    { ruta: 'cabecera.botonTramites', tipo: 'si', etiqueta: 'Botón «Trámites»' },
  ] },
  { id: 'portada', titulo: 'Portada', controles: [
    { ruta: 'portada.composicion', tipo: 'botones', etiqueta: 'Composición', opciones: OPCIONES.composicion },
    { ruta: 'portada.imagen', tipo: 'imagen', etiqueta: 'Foto principal', ayuda: 'Vacío: las fotos de la Capital del Trekking (o la de la plaza y el volcán Llaima en las otras composiciones). Use una foto horizontal de al menos 1600 px de ancho.' },
    { ruta: 'portada.titulo', tipo: 'texto', etiqueta: 'Título' },
    { ruta: 'portada.bajada', tipo: 'textoLargo', etiqueta: 'Texto bajo el título', ayuda: 'Vacío: el lema seguido de una frase de bienvenida.' },
    { ruta: 'portada.credito', tipo: 'texto', etiqueta: 'Pie de foto' },
    { ruta: 'portada.alto', tipo: 'botones', etiqueta: 'Altura', opciones: OPCIONES.alto },
    { ruta: 'portada.alineacion', tipo: 'botones', etiqueta: 'Alineación del texto', opciones: OPCIONES.alineacion, si: (c) => c.portada.composicion === 'foto' },
    { ruta: 'portada.velo', tipo: 'rango', etiqueta: 'Oscurecer la foto (legibilidad)', min: 0, max: 100, paso: 5, unidad: ' %', si: (c) => c.portada.composicion !== 'dividida' },
    { ruta: 'portada.logoAnimacion', tipo: 'lista', etiqueta: 'Animación del logo', opciones: OPCIONES.logoAnimacion, ayuda: 'Con «Logo vivo» el río fluye, el rostro parpadea, las gotas caen, la araucaria se mece, el corazón late, la persona camina, los animales se mueven, las estrellas titilan y el kultrún gira. Use «Animar el logo» para verla.', si: (c) => conLogo(c) },
    { ruta: 'portada.logoReposo', tipo: 'si', etiqueta: 'Letras con vida después de la entrada (movimiento continuo)', si: (c) => conLogo(c) },
    { ruta: 'portada.logoGestos', tipo: 'si', etiqueta: 'Cada letra salta y hace su gesto al pasar el cursor', si: (c) => conLogo(c) },
    { ruta: 'portada.tamanoLogo', tipo: 'rango', etiqueta: 'Tamaño del logo', min: 50, max: 120, paso: 5, unidad: ' %', si: (c) => conLogo(c) },
    { ruta: 'portada.kicker', tipo: 'si', etiqueta: 'Mostrar el título sobre el logo', si: (c) => conLogo(c) },
    { ruta: 'portada.buscador', tipo: 'si', etiqueta: 'Buscador «¿Qué necesita hacer?»', si: (c) => conLogo(c) },
    { ruta: 'portada.cordillera', tipo: 'si', etiqueta: 'Cordillera en capas al pie de la portada', si: (c) => c.portada.composicion === 'trekking' },
    { ruta: 'portada.fotoLado', tipo: 'botones', etiqueta: 'Ubicación de las fotos', opciones: OPCIONES.fotoLado, si: (c) => c.portada.composicion === 'vitrina' },
    { ruta: 'portada.puntos', tipo: 'si', etiqueta: 'Puntos para cambiar de foto', si: (c) => conLogo(c) },
    { ruta: 'portada.kenBurns', tipo: 'si', etiqueta: 'Zoom lento de las fotos', si: (c) => conLogo(c) },
    { ruta: 'portada.intervalo', tipo: 'rango', etiqueta: 'Cambio de foto cada', min: 3, max: 20, paso: 1, unidad: ' s', si: (c) => conLogo(c) },
    { ruta: 'portada.fotos.0', tipo: 'imagen', etiqueta: 'Foto 2 del carrusel', si: (c) => conLogo(c) },
    { ruta: 'portada.fotos.1', tipo: 'imagen', etiqueta: 'Foto 3 del carrusel', si: (c) => conLogo(c) },
    { ruta: 'portada.fotos.2', tipo: 'imagen', etiqueta: 'Foto 4 del carrusel', si: (c) => conLogo(c) },
    { ruta: 'portada.fotos.3', tipo: 'imagen', etiqueta: 'Foto 5 del carrusel', ayuda: 'Si no elige ninguna foto, se usan las cinco de la Capital del Trekking. Los cambios de fotos se ven al guardar.', si: (c) => conLogo(c) },
    { ruta: 'portada.franjaDatos', tipo: 'si', etiqueta: 'Franja de horario, teléfono, tiempo y emergencias' },
    { ruta: 'portada.populares', tipo: 'si', etiqueta: 'Enlaces «Lo más buscado»' },
  ] },
  { id: 'portal', titulo: 'Portada «portal»: franja, mosaico y temas', ayuda: 'Todo se ve al instante en la vista previa.', si: (c) => c.portada.composicion === 'portal', controles: [
    { ruta: 'portal.bandaTipo', tipo: 'botones', etiqueta: 'Fondo de la franja azul', opciones: OPCIONES.bandaTipo },
    { ruta: 'portal.bandaPropia', tipo: 'si', etiqueta: 'Elegir los colores de la franja (si no, usa los del tema)' },
    { ruta: 'portal.bandaInicio', tipo: 'color', etiqueta: 'Color de inicio del degradado', si: (c) => c.portal.bandaPropia && c.portal.bandaTipo !== 'solido' },
    { ruta: 'portal.bandaFin', tipo: 'color', etiqueta: 'Color final (también la cabecera oscura)', si: (c) => c.portal.bandaPropia },
    { ruta: 'portal.bandaAngulo', tipo: 'rango', etiqueta: 'Ángulo del degradado', min: 0, max: 360, paso: 15, unidad: '°', si: (c) => c.portal.bandaTipo === 'lineal' },
    { ruta: 'portal.patron', tipo: 'botones', etiqueta: 'Patrón de fondo', opciones: OPCIONES.patron },
    { ruta: 'portal.patronIntensidad', tipo: 'rango', etiqueta: 'Intensidad del patrón', min: 0, max: 100, paso: 5, unidad: ' %', si: (c) => c.portal.patron !== 'ninguno' },
    { ruta: 'portal.brillo', tipo: 'si', etiqueta: 'Luz que se mueve lentamente sobre la franja' },
    { ruta: 'portal.cordillera', tipo: 'si', etiqueta: 'Silueta de cordillera al pie de la franja' },
    { ruta: 'portal.cordilleraAlto', tipo: 'rango', etiqueta: 'Altura de la cordillera', min: 40, max: 200, paso: 10, unidad: ' px', si: (c) => c.portal.cordillera },
    { ruta: 'portal.mosaico', tipo: 'rango', etiqueta: 'Tarjetas del mosaico (los primeros accesos rápidos)', min: 0, max: 8, paso: 1, unidad: '' },
    { ruta: 'portal.mosaicoEstilo', tipo: 'botones', etiqueta: 'Estilo de las tarjetas', opciones: OPCIONES.mosaicoEstilo, si: (c) => c.portal.mosaico > 0 },
    { ruta: 'portal.mosaicoColores', tipo: 'botones', etiqueta: 'Colores de las tarjetas', opciones: OPCIONES.mosaicoColores, si: (c) => c.portal.mosaico > 0 },
    { ruta: 'portal.mosaicoAlto', tipo: 'rango', etiqueta: 'Alto de las tarjetas', min: 100, max: 240, paso: 10, unidad: ' px', si: (c) => c.portal.mosaico > 0 },
    { ruta: 'portal.temas', tipo: 'si', etiqueta: 'Temas más consultados junto al buscador' },
    { ruta: 'portal.temasTitulo', tipo: 'texto', etiqueta: 'Título de los temas', si: (c) => c.portal.temas },
    { ruta: 'portal.temasEstilo', tipo: 'botones', etiqueta: 'Estilo de los temas', opciones: OPCIONES.temasEstilo, si: (c) => c.portal.temas },
    { ruta: 'portal.buscador', tipo: 'botones', etiqueta: 'Forma del buscador', opciones: OPCIONES.buscador },
    { ruta: 'portal.logoTrekking', tipo: 'si', etiqueta: 'Logo animado «Capital del Trekking» sobre el buscador', ayuda: 'Es el logo vivo de las nueve letras; su animación se elige en «Portada → Animación del logo».' },
    { ruta: 'portal.reparto', tipo: 'botones', etiqueta: 'Reparto entre campaña y buscador', opciones: OPCIONES.reparto },
    { ruta: 'portal.bannerAjuste', tipo: 'botones', etiqueta: 'Cómo se acomoda la imagen', opciones: OPCIONES.bannerAjuste, si: (c) => c.portal.bannerProporcion !== 'auto' },
    { ruta: 'portal.bannerEfecto', tipo: 'botones', etiqueta: 'Al pasar el cursor por el banner', opciones: OPCIONES.bannerEfecto },
  ] },
  { id: 'secciones', titulo: 'Secciones de la portada', ayuda: 'Elija una sección y dele su propio fondo, patrón, forma y espacio. También puede hacer clic en una sección de la vista previa con «Tocar para editar». Qué secciones se muestran y en qué orden se elige en Ajustes del sitio → Portada.', controles: [
    { ruta: '_seccion', tipo: 'elegirSeccion', etiqueta: 'Sección' },
    ...Object.keys(SECCIONES_PORTADA).flatMap((id) => {
      const r = (k) => `secciones.${id}.${k}`, es = () => secElegida === id, x = (c) => c.secciones[id];
      const conFondo = (c) => es() && x(c).fondo !== 'auto' && x(c).fondo !== 'ninguno';
      return [
        { ruta: r('fondo'), tipo: 'lista', etiqueta: 'Fondo', opciones: OPCIONES.fondoSeccion, si: es },
        { ruta: r('color1'), tipo: 'color', etiqueta: (c) => x(c).fondo === 'degradado' ? 'Primer color' : 'Color', si: (c) => es() && ['color', 'degradado'].includes(x(c).fondo) },
        { ruta: r('color2'), tipo: 'color', etiqueta: 'Segundo color', si: (c) => es() && x(c).fondo === 'degradado' },
        { ruta: r('angulo'), tipo: 'rango', etiqueta: 'Ángulo del degradado', min: 0, max: 360, paso: 15, unidad: '°', si: (c) => es() && x(c).fondo === 'degradado' },
        { ruta: r('forma'), tipo: 'botones', etiqueta: 'Forma del fondo', opciones: OPCIONES.formaSeccion, si: conFondo },
        { ruta: r('patron'), tipo: 'patron', etiqueta: 'Patrón', opciones: OPCIONES.patronFondo, si: es },
        { ruta: r('intensidad'), tipo: 'rango', etiqueta: 'Intensidad del patrón', min: 2, max: 50, paso: 1, unidad: ' %', si: (c) => es() && x(c).patron !== 'ninguno' },
        { ruta: r('espacio'), tipo: 'botones', etiqueta: 'Espacio arriba y abajo', opciones: OPCIONES.espacioSeccion, si: es },
        { ruta: r('titulos'), tipo: 'botones', etiqueta: 'Título de la sección', opciones: OPCIONES.titulosAlinear, si: es },
        { ruta: r('celular'), tipo: 'si', etiqueta: 'Mostrar en celulares', si: es },
        { ruta: r('tablet'), tipo: 'si', etiqueta: 'Mostrar en tablets', si: es },
      ];
    }),
  ] },
  { id: 'identidad', titulo: 'Identidad Capital del Trekking', ayuda: 'Los detalles de la marca en todo el sitio. Los textos de la cinta, los nueve mundos, los lugares y las cifras se editan en Ajustes del sitio → Portada.', controles: [
    { ruta: 'identidad.zonas', tipo: 'si', etiqueta: 'Cada área con el color de su letra (encabezados, anillos, cortina)' },
    { ruta: 'identidad.encabezado', tipo: 'botones', etiqueta: 'Encabezado de las páginas interiores', opciones: OPCIONES.encabezado },
    { ruta: 'identidad.emblemaEncabezado', tipo: 'si', etiqueta: 'Emblema flotante en el encabezado de cada página' },
    { ruta: 'identidad.titulosPalabra', tipo: 'si', etiqueta: 'Títulos de las páginas que suben palabra por palabra' },
    { ruta: 'identidad.progreso', tipo: 'si', etiqueta: 'Barra de lectura arcoíris arriba de la pantalla' },
    { ruta: 'identidad.lineaCabecera', tipo: 'si', etiqueta: 'Línea arcoíris bajo la cabecera' },
    { ruta: 'identidad.cordilleras', tipo: 'si', etiqueta: 'Siluetas de cordillera entre secciones y en el pie' },
    { ruta: 'identidad.accesosColor', tipo: 'si', etiqueta: 'Accesos rápidos con los nueve colores del logo' },
    { ruta: 'identidad.cinta', tipo: 'rango', etiqueta: 'Velocidad de la cinta (una vuelta cada)', min: 15, max: 120, paso: 5, unidad: ' s' },
  ] },
  { id: 'campanas', titulo: 'Banner de campañas', ayuda: 'Las imágenes de las campañas se cargan en «Banners de portada».', controles: [
    { ruta: 'campanas.autoplay', tipo: 'si', etiqueta: 'Avanzar solo' },
    { ruta: 'campanas.intervalo', tipo: 'rango', etiqueta: 'Tiempo de cada campaña', min: 3, max: 20, paso: 1, unidad: ' s', si: (c) => c.campanas.autoplay },
    { ruta: 'campanas.transicion', tipo: 'botones', etiqueta: 'Transición entre campañas', opciones: OPCIONES.transicionCampana },
    { ruta: 'campanas.puntos', tipo: 'botones', etiqueta: 'Indicadores', opciones: OPCIONES.puntos },
    { ruta: 'campanas.flechas', tipo: 'botones', etiqueta: 'Flechas', opciones: OPCIONES.flechas },
    { ruta: 'campanas.pausa', tipo: 'si', etiqueta: 'Botón para pausar', si: (c) => c.campanas.autoplay },
    { ruta: 'campanas.marco', tipo: 'botones', etiqueta: 'Marco', opciones: OPCIONES.marcoCampana },
    { ruta: 'portal.bannerProporcion', tipo: 'lista', etiqueta: 'Proporción en computador (portada portal)', opciones: OPCIONES.bannerProporcion, si: (c) => c.portada.composicion === 'portal' },
    { ruta: 'campanas.proporcionMovil', tipo: 'lista', etiqueta: 'Proporción en celulares', opciones: OPCIONES.bannerProporcion, ayuda: 'Si sube una imagen especial para celulares, use «La de la imagen».' },
  ] },
  { id: 'noticias', titulo: 'Noticias', ayuda: 'Se aplica a la portada y, en lo que corresponde, al listado de noticias. La cantidad se elige en Ajustes del sitio → Portada.', controles: [
    { ruta: 'noticias.disposicion', tipo: 'lista', etiqueta: 'Disposición en la portada', opciones: OPCIONES.disposicionNoticias },
    { ruta: 'noticias.columnas', tipo: 'rango', etiqueta: 'Columnas', min: 2, max: 4, paso: 1, unidad: '', si: (c) => ['grilla', 'revista'].includes(c.noticias.disposicion) },
    { ruta: 'noticias.estilo', tipo: 'botones', etiqueta: 'Estilo de cada noticia', opciones: OPCIONES.estiloNoticia },
    { ruta: 'noticias.proporcion', tipo: 'botones', etiqueta: 'Forma de las fotos', opciones: OPCIONES.proporcionFoto },
    { ruta: 'noticias.resumen', tipo: 'botones', etiqueta: 'Resumen', opciones: OPCIONES.resumenNoticia },
    { ruta: 'noticias.fecha', tipo: 'si', etiqueta: 'Mostrar la fecha' },
    { ruta: 'noticias.categoria', tipo: 'si', etiqueta: 'Mostrar la categoría' },
    { ruta: 'noticias.etiqueta', tipo: 'botones', etiqueta: 'Estilo de la categoría', opciones: OPCIONES.etiquetaNoticia, si: (c) => c.noticias.categoria },
    { ruta: 'noticias.efecto', tipo: 'botones', etiqueta: 'Al pasar el cursor', opciones: OPCIONES.efectoNoticia },
  ] },
  { id: 'videos', titulo: 'Videoteca', ayuda: 'La sección /videos/ y los videos de la portada, Noticias y el Concejo. Elija «Videos» en la página de la vista previa para verla.', controles: [
    { ruta: 'videos.tarjeta', tipo: 'botones', etiqueta: 'Forma de cada video', opciones: OPCIONES.tarjetaVideo },
    { ruta: 'videos.tam', tipo: 'botones', etiqueta: 'Tamaño de las tarjetas', opciones: OPCIONES.tamVideo },
    { ruta: 'videos.proporcion', tipo: 'botones', etiqueta: 'Forma de las miniaturas', opciones: OPCIONES.proporcionVideo },
    { ruta: 'videos.carril', tipo: 'si', etiqueta: 'Filas que se deslizan de lado (si no, en cuadrícula)' },
    { ruta: 'videos.previa', tipo: 'si', etiqueta: 'Vista previa animada al pasar el cursor por una miniatura', si: (c) => c.animaciones.activas },
    { ruta: 'videos.duracion', tipo: 'si', etiqueta: 'Mostrar la duración' },
    { ruta: 'videos.categoria', tipo: 'si', etiqueta: 'Mostrar la categoría' },
    { ruta: 'videos.fecha', tipo: 'si', etiqueta: 'Mostrar la fecha' },
    { ruta: 'videos.vistas', tipo: 'si', etiqueta: 'Mostrar las visualizaciones' },
    { ruta: 'videos.marcas', tipo: 'si', etiqueta: 'Etiquetas «Nuevo», «Short», «Transmisión» y «Archivo Canal 3»' },
    { ruta: 'videos.destacado', tipo: 'si', etiqueta: 'Video destacado grande arriba' },
    { ruta: 'videos.destacadoTema', tipo: 'botones', etiqueta: 'Fondo del destacado', opciones: OPCIONES.temaDestacado, si: (c) => c.videos.destacado },
    { ruta: 'videos.filas.concejo', tipo: 'si', etiqueta: 'Fila «Sesiones del Concejo Municipal»' },
    { ruta: 'videos.filas.ultimo', tipo: 'si', etiqueta: 'Fila «Lo último»' },
    { ruta: 'videos.filas.vistos', tipo: 'si', etiqueta: 'Fila «Los más vistos»' },
    { ruta: 'videos.filas.shorts', tipo: 'si', etiqueta: 'Fila «Shorts»' },
    { ruta: 'videos.filas.archivo', tipo: 'si', etiqueta: 'Fila «Archivo histórico Canal 3»' },
    { ruta: 'videos.filas.listas', tipo: 'si', etiqueta: 'Listas de reproducción' },
    { ruta: 'videos.filas.anios', tipo: 'si', etiqueta: 'Videos por año' },
    { ruta: 'videos.filas.canales', tipo: 'si', etiqueta: 'Canales de YouTube' },
    { ruta: 'videos.portadaCantidad', tipo: 'rango', etiqueta: 'Videos en la portada (se aplica al guardar)', min: 3, max: 8, paso: 1, unidad: '' },
  ] },
  { id: 'elementos', titulo: 'Elementos del sitio', ayuda: 'Accesos, trámites, botones, categorías, íconos y separadores en todas las páginas.', controles: [
    { ruta: 'elementos.accesos', tipo: 'botones', etiqueta: 'Accesos rápidos', opciones: OPCIONES.estiloAccesos },
    { ruta: 'elementos.tramites', tipo: 'botones', etiqueta: 'Trámites de la portada', opciones: OPCIONES.estiloTramites },
    { ruta: 'elementos.verTodo', tipo: 'botones', etiqueta: 'Botones «Ver todo»', opciones: OPCIONES.verTodo },
    { ruta: 'elementos.categorias', tipo: 'botones', etiqueta: 'Filtros y categorías', opciones: OPCIONES.estiloCategorias },
    { ruta: 'elementos.iconos', tipo: 'botones', etiqueta: 'Fondo de los íconos', opciones: OPCIONES.estiloIconos },
    { ruta: 'elementos.separadores', tipo: 'botones', etiqueta: 'Entre secciones de la portada', opciones: OPCIONES.separadores },
    { ruta: 'elementos.titulos', tipo: 'lista', etiqueta: 'Títulos de las secciones', opciones: OPCIONES.titulosSeccion },
    { ruta: 'elementos.titulosAlinear', tipo: 'botones', etiqueta: 'Títulos de la portada', opciones: OPCIONES.titulosAlinear },
  ] },
  { id: 'buscador', titulo: 'Buscador predictivo', ayuda: 'Pruébelo escribiendo en el buscador de la vista previa.', controles: [
    { ruta: 'buscador.predictivo', tipo: 'si', etiqueta: 'Mostrar resultados mientras se escribe' },
    { ruta: 'buscador.fragmentos', tipo: 'si', etiqueta: 'Mostrar un trozo del texto donde aparece la palabra', si: (c) => c.buscador.predictivo },
    { ruta: 'buscador.recientes', tipo: 'si', etiqueta: 'Recordar las búsquedas recientes de cada persona (en su navegador)', si: (c) => c.buscador.predictivo },
    { ruta: 'buscador.populares', tipo: 'si', etiqueta: 'Sugerir «lo más buscado» al entrar al buscador', si: (c) => c.buscador.predictivo },
    { ruta: 'buscador.ejemplos', tipo: 'si', etiqueta: 'Ejemplos que se escriben solos en el buscador vacío' },
    { ruta: 'buscador.ejemplosTexto', tipo: 'texto', etiqueta: 'Ejemplos y «lo más buscado» (separados por comas)', si: (c) => c.buscador.ejemplos || c.buscador.populares },
  ] },
  { id: 'pie', titulo: 'Pie de página', controles: [
    { ruta: 'pie.estilo', tipo: 'botones', etiqueta: 'Fondo del pie', opciones: OPCIONES.pieEstilo },
    { ruta: 'pie.colorPropio', tipo: 'si', etiqueta: 'Elegir el color del pie', si: (c) => c.pie.estilo !== 'claro' },
    { ruta: 'pie.color', tipo: 'color', etiqueta: 'Color del pie', si: (c) => c.pie.estilo !== 'claro' && c.pie.colorPropio },
    { ruta: 'pie.emergencias', tipo: 'si', etiqueta: 'Franja de teléfonos de emergencia' },
    { ruta: 'pie.boletin', tipo: 'si', etiqueta: 'Formulario del boletín' },
    { ruta: 'pie.escudo', tipo: 'si', etiqueta: 'Escudo' },
    { ruta: 'pie.marcaGrande', tipo: 'si', etiqueta: 'Logo gigante «Melipeuco Capital del Trekking»' },
  ] },
  { id: 'movil', titulo: 'Celular y tablet', ayuda: 'Cómo se ve el sitio en pantallas chicas: celulares (hasta 720 px de ancho) y tablets (hasta 1024 px). La vista previa cambia sola a «Celular»; use los botones de arriba para ver la tablet. Para ocultar una sección sólo en el celular o la tablet, vaya a Portada → Secciones de la portada.', controles: [
    { ruta: 'movil.barra', tipo: 'si', etiqueta: 'Barra de accesos fija abajo (Inicio, Trámites, Buscar, Noticias, Menú)', ayuda: 'Queda al alcance del pulgar en todas las páginas.' },
    { ruta: 'movil.barraTramites', tipo: 'si', etiqueta: 'Mostrar «Trámites» en la barra', si: (c) => c.movil.barra },
    { ruta: 'movil.texto', tipo: 'rango', etiqueta: 'Tamaño del texto en el celular', min: 90, max: 120, paso: 5, unidad: ' %' },
    { ruta: 'movil.espacio', tipo: 'botones', etiqueta: 'Espacio entre secciones', opciones: OPCIONES.espacioMovil },
    { ruta: 'movil.temas', tipo: 'botones', etiqueta: 'Botones «Quiero información de…»', opciones: OPCIONES.temasMovil },
    { ruta: 'movil.mosaico', tipo: 'lista', etiqueta: 'Mosaico de colores bajo la portada', opciones: OPCIONES.mosaicoMovil },
    { ruta: 'movil.franja', tipo: 'lista', etiqueta: 'Franja de horario, teléfono y clima', opciones: OPCIONES.franjaMovil },
    { ruta: 'movil.noticias', tipo: 'lista', etiqueta: 'Noticias de la portada', opciones: OPCIONES.noticiasMovil },
    { ruta: 'movil.videos', tipo: 'lista', etiqueta: 'Videos de la portada', opciones: OPCIONES.videosMovil },
    { ruta: 'movil.emergencias', tipo: 'si', etiqueta: 'Recuadro de emergencias en la portada', ayuda: 'Los teléfonos de emergencia siguen en el pie de todas las páginas.' },
    { ruta: 'movil.pie', tipo: 'botones', etiqueta: 'Listas del pie', opciones: OPCIONES.pieMovil },
    { ruta: 'movil.tablet', tipo: 'lista', etiqueta: 'Portada en la tablet', opciones: OPCIONES.tabletPortada },
    { ruta: 'movil.tabletColumnas', tipo: 'rango', etiqueta: 'Columnas de noticias y videos en la tablet', min: 2, max: 3, paso: 1 },
  ] },
  { id: 'animaciones', titulo: 'Movimiento general', ayuda: 'Las personas que piden «reducir movimiento» en su equipo nunca ven animaciones.', controles: [
    { ruta: 'animaciones.activas', tipo: 'si', etiqueta: 'Animaciones activas' },
    { ruta: 'animaciones.intensidad', tipo: 'botones', etiqueta: 'Intensidad', opciones: OPCIONES.intensidad, si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.curva', tipo: 'botones', etiqueta: 'Carácter del movimiento', opciones: OPCIONES.curva, si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.velocidad', tipo: 'rango', etiqueta: 'Velocidad', min: .5, max: 2, paso: .1, unidad: '×', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.controlVisitante', tipo: 'si', etiqueta: 'Permitir que cada persona elija «Completo», «Suave» o «Sin animaciones» en Opciones de lectura', ayuda: 'Para quienes las transiciones resultan molestas. Se recuerda en su navegador.', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.desplazamientoSuave', tipo: 'si', etiqueta: 'Desplazamiento suave al usar enlaces dentro de la página' },
  ] },
  { id: 'carga', titulo: 'Pantalla de carga', ayuda: 'Se muestra al abrir la portada. Use «Ver pantalla de carga» en la vista previa.', controles: [
    { ruta: 'animaciones.intro', tipo: 'lista', etiqueta: 'Pantalla de carga de la portada', opciones: OPCIONES.intro, si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.introEstilo', tipo: 'lista', etiqueta: 'Animación de la pantalla de carga', opciones: OPCIONES.introEstilo, ayuda: 'Escudo 3D: cada pieza del escudo (volcán, araucarias, kultrún, trutrucas, laureles, aves y cinta) llega a su manera y el escudo vuela a la cabecera. Logo 3D: las nueve letras se arman y el logo vuela a la portada. Use «Ver pantalla de carga» (guarde antes).', si: (c) => c.animaciones.activas && c.animaciones.intro !== 'nunca' },
    { ruta: 'animaciones.escudoVivo', tipo: 'si', etiqueta: 'Escudo municipal animado en la cabecera y el pie (se mueve al pasar el cursor)', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.profundidad', tipo: 'rango', etiqueta: 'Profundidad del efecto 3D', min: 0, max: 100, paso: 10, unidad: ' %', si: (c) => c.animaciones.activas && /3d$/.test(c.animaciones.introEstilo) },
  ] },
  { id: 'transiciones', titulo: 'Transición entre páginas', ayuda: 'Lo que se ve al pasar de una página a otra. Use «Ver transición» en la vista previa.', controles: [
    { ruta: 'animaciones.transiciones', tipo: 'si', etiqueta: 'Transición entre páginas', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.cordillera', tipo: 'si', etiqueta: 'Transición de identidad al cambiar de página', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.transicionEstilo', tipo: 'lista', etiqueta: 'Estilo de la transición', opciones: OPCIONES.transicionEstilo, ayuda: 'Use «Ver transición» en la vista previa. «Fluida» usa la transición nativa del navegador (Chrome, Edge y Safari recientes); en los demás la página cambia al instante.', si: (c) => c.animaciones.activas && c.animaciones.cordillera },
    { ruta: 'animaciones.transicionColor', tipo: 'botones', etiqueta: 'Colores de la transición', opciones: OPCIONES.transicionColor, si: (c) => c.animaciones.activas && c.animaciones.cordillera && !['cordillera', 'vista'].includes(c.animaciones.transicionEstilo) },
    { ruta: 'animaciones.transicionNombre', tipo: 'si', etiqueta: 'Mostrar el emblema y el nombre de la página de destino', si: (c) => c.animaciones.activas && c.animaciones.cordillera && c.animaciones.transicionEstilo !== 'vista' },
    { ruta: 'animaciones.transicionLetras', tipo: 'botones', etiqueta: 'Letras del nombre de destino', opciones: OPCIONES.transicionLetras, si: (c) => c.animaciones.activas && c.animaciones.cordillera && c.animaciones.transicionEstilo !== 'vista' && c.animaciones.transicionNombre },
    { ruta: 'animaciones.precarga', tipo: 'si', etiqueta: 'Adelantar la descarga de la página al pasar el cursor por un enlace (navegación casi instantánea)', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.barraCarga', tipo: 'si', etiqueta: 'Barra de carga al navegar', si: (c) => c.animaciones.activas },
  ] },
  { id: 'efectos', titulo: 'Efectos al bajar y al tocar', controles: [
    { ruta: 'animaciones.aparicion', tipo: 'si', etiqueta: 'Contenido que aparece al bajar', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.aparicionEstilo', tipo: 'lista', etiqueta: 'Cómo aparece el contenido', opciones: OPCIONES.aparicionEstilo, si: (c) => c.animaciones.activas && c.animaciones.aparicion },
    { ruta: 'animaciones.cursorLuz', tipo: 'si', etiqueta: 'Luz suave que sigue al cursor sobre las tarjetas', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.ondaClic', tipo: 'si', etiqueta: 'Onda al hacer clic en botones y tarjetas', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.inclinacion', tipo: 'si', etiqueta: 'Inclinación 3D al pasar el cursor', si: (c) => c.animaciones.activas },
  ] },
];

// Categorías del panel: cada una muestra sólo sus grupos (uno a la vez, sin listas eternas).
const CATEGORIAS = [
  { id: 'estilos', titulo: 'Estilos listos', icono: 'pincel', texto: 'Diseños completos y versiones guardadas', especial: 'estilos', grupos: [] },
  { id: 'general', titulo: 'Colores y letras', icono: 'texto', texto: 'Paleta, tipografía y tamaños', grupos: ['colores', 'tipografia'] },
  { id: 'formas', titulo: 'Formas y fondos', icono: 'capas', texto: 'Esquinas, sombras, patrones, títulos', grupos: ['forma', 'fondos', 'elementos'] },
  { id: 'cabecera', titulo: 'Cabecera y logo', icono: 'cabecera', texto: 'Menú, logo y su animación', grupos: ['cabecera'] },
  { id: 'portada', titulo: 'Portada', icono: 'inicio', texto: 'Banner, mosaico y cada sección', grupos: ['portada', 'portal', 'campanas', 'secciones', 'identidad'] },
  { id: 'contenidos', titulo: 'Noticias y videos', icono: 'video', texto: 'Tarjetas, videoteca y buscador', grupos: ['noticias', 'videos', 'buscador'] },
  { id: 'movil', titulo: 'Celular y tablet', icono: 'celular', texto: 'Barra inferior, listas y columnas', grupos: ['movil'] },
  { id: 'pie', titulo: 'Pie de página', icono: 'pie', texto: 'Color, boletín y emergencias', grupos: ['pie'] },
  { id: 'movimiento', titulo: 'Animaciones', icono: 'movimiento', texto: 'Carga, transiciones y efectos', grupos: ['animaciones', 'carga', 'transiciones', 'efectos'] },
  { id: 'avanzado', titulo: 'CSS propio', icono: 'llave', texto: 'Reglas avanzadas', especial: 'avanzado', grupos: [], superadmin: true },
];
const categoriaDe = (grupo) => CATEGORIAS.find((k) => k.grupos.includes(grupo))?.id || 'general';
// Partes de la vista previa que se pueden tocar para ir a sus opciones (la más interior gana).
const INSPECTOR = [['.cabecera', 'cabecera'], ['.pt-banda', 'portal'], ['.pt-mosaico', 'portal'], ['.campanas', 'campanas'], ['.hero', 'portada'], ['.franja-datos', 'portada'], ['.hero-buscar', 'buscador'],
  ['[data-sec]', 'secciones'], ['.np, .grilla-noticias, .tarjeta-noticia', 'noticias'], ['.vd-grilla, .vd-tarjeta, .videoteca', 'videos'], ['.pie', 'pie'], ['.encabezado-pagina, .encabezado', 'identidad']];

const PAGINAS = { '/': 'Portada', '/noticias/': 'Noticias', '/videos/': 'Videos', '/tramites/': 'Trámites', '/contacto/': 'Contacto', '/areas/': 'Áreas' };
const DISPOSITIVOS = { computador: ['Computador', 1366], tablet: ['Tablet', 820], celular: ['Celular', 390] };

const leer = (o, ruta) => ruta.split('.').reduce((a, k) => a?.[k], o);
const escribir = (o, ruta, v) => { const k = ruta.split('.'); k.slice(0, -1).reduce((a, x) => a[x], o)[k.at(-1)] = v; };
const copia = (o) => JSON.parse(JSON.stringify(o));

export default async function (vista) {
  const ajustes = await api('GET', 'ajustes');
  const superadmin = estado.sesion.usuario.rol === 'superadmin';
  const desdeColores = ajustes.colores?.primario ? { colores: { primario: ajustes.colores.primario, acento: ajustes.colores.acento, oscuro: ajustes.colores.oscuro } } : {};
  let cfg = normalizar(migrar(ajustes.diseno) || desdeColores);
  let guardado = JSON.stringify(cfg);
  const historial = [];
  let pagina = '/', dispositivo = 'computador';

  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Diseño del sitio</h1><p>Colores, letras, formas, cabecera, portada, pie y animaciones. Los cambios se ven al instante en la vista previa y se publican al guardar.</p></div>
    <div class="acciones"><button class="btn" data-deshacer disabled>Deshacer</button><button class="btn" data-restablecer>Volver al diseño original</button><button class="btn primario" data-guardar>Guardar y publicar</button></div></div>
    <div class="diseno">
      <div class="diseno-controles">
        <div class="tarjeta diseno-herramientas">
          <label class="buscar-opcion"><span class="sr">Buscar una opción</span>${ico('buscar', 16)}<input type="search" data-filtro placeholder="Buscar una opción… (logo, patrón, videos, radio)" autocomplete="off"></label>
          <nav class="diseno-nav" aria-label="Partes del diseño">${CATEGORIAS.filter((k) => !k.superadmin || superadmin).map((k) => h`<button type="button" data-cat="${k.id}" title="${k.texto}" aria-pressed="${k.id === 'general'}">${ico(k.icono, 18)}<span><b>${k.titulo}</b><small>${k.texto}</small></span><i class="insignia-cambios" data-cuenta="${k.id}" hidden></i></button>`)}</nav>
          <div class="fila-herramientas"><label class="interruptor chico"><input type="checkbox" data-solo-cambios><span class="pista" aria-hidden="true"></span><span>Sólo lo que cambié</span></label></div>
        </div>
        <div data-especial="estilos" hidden>
        <details class="tarjeta grupo-diseno" data-versiones><summary>Versiones anteriores</summary><p class="chico muted">Cada vez que guarda, la versión anterior queda aquí. «Ver» la carga en la vista previa; si le gusta, pulse «Guardar y publicar».</p><div data-lista-versiones><p class="chico muted">Cargando…</p></div></details>
        <section class="tarjeta"><h2>Estilos prediseñados</h2><p class="chico muted">Cambian colores, letras y formas de una vez; después puede ajustar cada detalle en las otras partes.</p><div class="estilos" data-estilos></div></section>
        </div>
        <div data-grupos></div>
        ${superadmin ? h`<details class="tarjeta grupo-diseno" open data-especial="avanzado" hidden><summary>CSS propio (avanzado)</summary><p class="chico muted">Reglas CSS que se agregan al final de la hoja de estilos de todas las páginas. Sólo el Super Administrador las puede editar.</p><textarea class="mono" rows="10" data-css spellcheck="false" placeholder=".hero h1 { letter-spacing: 0; }"></textarea></details>` : ''}
      </div>
      <div class="diseno-vista">
        <div class="diseno-barra">
          <select data-pagina aria-label="Página de la vista previa">${Object.entries(PAGINAS).map(([u, t]) => h`<option value="${u}">${t}</option>`)}</select>
          <div class="segmentos" role="group" aria-label="Tamaño de pantalla">${Object.entries(DISPOSITIVOS).map(([k, [t]]) => h`<button type="button" data-dispositivo="${k}" aria-pressed="${k === dispositivo}">${t}</button>`)}</div>
          <button type="button" class="btn chico" data-inspeccionar aria-pressed="false" title="Haga clic en cualquier parte de la vista previa para ir a sus opciones">${ico('cursor', 14)} Tocar para editar</button>
          <button type="button" class="btn chico" data-intro title="Recarga la portada mostrando la pantalla de carga">Ver pantalla de carga</button>
          <button type="button" class="btn chico" data-ver-transicion title="Muestra la transición entre páginas en la vista previa">Ver transición</button>
          <button type="button" class="btn chico" data-reproducir-logo title="Vuelve a reproducir la animación del logo en la vista previa">Animar el logo</button>
          <a class="btn chico fantasma" href="/" target="_blank" rel="noopener">${ico('ojo', 14)} Abrir el sitio</a>
        </div>
        <div class="diseno-marco" data-marco><iframe title="Vista previa del sitio" src="/?vista=diseno" data-iframe></iframe></div>
        <p class="chico muted">La vista previa muestra sus cambios sin publicarlos. Las animaciones de entrada se ven al recargar la página.</p>
      </div>
    </div>`);

  // ---------------------------------------------------------------- Versiones anteriores
  let versiones = [];
  const pintarVersiones = async () => {
    try { versiones = await api('GET', 'diseno/historial'); } catch { versiones = []; }
    const fmt = (f) => new Date(f).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    $('[data-lista-versiones]', vista).innerHTML = String(h`<ul class="lista-simple">
      <li><span><b>Diseño original del sitio</b><br><small class="muted">Capital del Trekking, tal como viene</small></span><button type="button" class="btn chico" data-version="original">Ver</button></li>
      <li><span><b>Diseño institucional anterior</b><br><small class="muted">Blanco, azul y ámbar, sólo líneas</small></span><button type="button" class="btn chico" data-version="institucional">Ver</button></li>
      ${versiones.map((v) => h`<li><span><b>${fmt(v.fecha)}</b><br><small class="muted">${v.usuario || ''} · estilo ${ESTILOS[v.estilo]?.nombre || v.estilo}</small></span><button type="button" class="btn chico" data-version="${v.i}">Ver</button></li>`)}
    </ul>`);
  };
  $('[data-versiones]', vista).addEventListener('click', (e) => {
    const b = e.target.closest('[data-version]');
    if (!b) return;
    historial.push(JSON.stringify(cfg));
    const v = b.dataset.version;
    cfg = v === 'original' ? normalizar({ avanzado: cfg.avanzado }) : v === 'institucional' ? aplicarEstilo(normalizar({ avanzado: cfg.avanzado }), 'institucional') : normalizar(versiones.find((x) => String(x.i) === v)?.diseno || {}, { permitirCss: true });
    pintarGrupos(); actualizar();
    aviso('Versión cargada en la vista previa. Pulse «Guardar y publicar» para usarla, o «Deshacer» para volver.');
  });
  pintarVersiones();

  // ---------------------------------------------------------------- Estilos prediseñados
  const pintarEstilos = () => {
    $('[data-estilos]', vista).innerHTML = String(h`${Object.entries(ESTILOS).map(([id, e]) => {
      const c = normalizar(aplicarEstilo(PREDETERMINADO, id)).colores;
      return h`<button type="button" class="estilo" data-estilo="${id}" aria-pressed="${cfg.estilo === id}">
        <span class="muestras">${[c.primario, c.acento, c.oscuro, c.fondoAlterno].map((x) => h`<i style="background:${x}"></i>`)}</span>
        <b>${e.nombre}</b><small>${e.descripcion}</small></button>`;
    })}`);
  };

  // ---------------------------------------------------------------- Controles
  const etiqueta = (c) => (typeof c.etiqueta === 'function' ? c.etiqueta(cfg) : c.etiqueta);
  const control = (c0) => {
    const c = { ...c0, etiqueta: etiqueta(c0) };
    const v = leer(cfg, c.ruta), id = 'd-' + c.ruta.replace(/\./g, '-');
    const ayuda = c.ayuda ? h`<small class="ayuda">${c.ayuda}</small>` : '';
    switch (c.tipo) {
      case 'color': return h`<label class="campo campo-color" for="${id}"><span>${c.etiqueta}</span><span class="color-doble"><input type="color" id="${id}" data-ruta="${c.ruta}" value="${v}"><input type="text" data-ruta="${c.ruta}" data-hex value="${v}" maxlength="7" aria-label="${c.etiqueta} en hexadecimal"></span>${ayuda}</label>`;
      case 'lista': return h`<label class="campo" for="${id}"><span>${c.etiqueta}</span><select id="${id}" data-ruta="${c.ruta}">${Object.entries(c.opciones || {}).map(([k, t]) => h`<option value="${k}"${k === v ? raw(' selected') : ''}>${t}</option>`)}</select>${ayuda}</label>`;
      case 'botones': return h`<div class="campo"><span>${c.etiqueta}</span><div class="segmentos" role="radiogroup" aria-label="${c.etiqueta}">${Object.entries(c.opciones || {}).map(([k, t]) => h`<button type="button" role="radio" data-ruta="${c.ruta}" data-valor="${k}" aria-checked="${k === v}">${t}</button>`)}</div>${ayuda}</div>`;
      case 'rango': return h`<label class="campo" for="${id}"><span>${c.etiqueta} <output data-salida="${c.ruta}">${v}${c.unidad || ''}</output></span><input type="range" id="${id}" data-ruta="${c.ruta}" min="${c.min}" max="${c.max}" step="${c.paso}" value="${v}">${ayuda}</label>`;
      case 'si': return h`<label class="interruptor"><input type="checkbox" data-ruta="${c.ruta}"${v ? raw(' checked') : ''}><span class="pista" aria-hidden="true"></span><span>${c.etiqueta}</span></label>`;
      case 'texto': return h`<label class="campo" for="${id}"><span>${c.etiqueta}</span><input id="${id}" data-ruta="${c.ruta}" value="${v}" maxlength="120">${ayuda}</label>`;
      case 'textoLargo': return h`<label class="campo" for="${id}"><span>${c.etiqueta}</span><textarea id="${id}" data-ruta="${c.ruta}" rows="2" maxlength="240">${v}</textarea>${ayuda}</label>`;
      case 'imagen': return h`<div class="campo" data-imagen="${c.ruta}"><span>${c.etiqueta}</span>${ayuda}</div>`;
      case 'patron': return h`<div class="campo"><span>${c.etiqueta}</span><div class="patrones" role="radiogroup" aria-label="${c.etiqueta}">${Object.entries(c.opciones).map(([k, t]) => h`<button type="button" role="radio" data-ruta="${c.ruta}" data-valor="${k}" aria-checked="${k === v}" title="${t}"><i style="${k === 'ninguno' ? '' : `background-image:${patronUrl(k, { color: cfg.colores.primario, opacidad: .9 })}`}"></i><span>${t}</span></button>`)}</div>${ayuda}</div>`;
      case 'elegirSeccion': return h`<div class="campo"><span>Elija la sección</span><div class="secciones-elegir" role="radiogroup" aria-label="Sección de la portada">${Object.entries(SECCIONES_PORTADA).map(([k, t]) => { const x = cfg.secciones[k]; const propio = x.fondo !== 'auto' || x.patron !== 'ninguno' || x.espacio !== 'auto' || x.titulos !== 'auto'; return h`<button type="button" role="radio" data-elegir-sec="${k}" aria-checked="${k === secElegida}">${t}${propio ? h`<i class="punto-propio" title="Tiene estilo propio"></i>` : ''}</button>`; })}</div></div>`;
      default: return '';
    }
  };
  let categoria = 'general', filtro = '', soloCambios = false;
  const DEF = normalizar({});
  const sinTilde = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cambiado = (ruta) => !ruta.startsWith('_') && JSON.stringify(leer(cfg, ruta)) !== JSON.stringify(leer(DEF, ruta));
  const todos = () => GRUPOS.flatMap((g) => g.controles);
  const pintarGrupos = () => {
    const cont = $('[data-grupos]', vista);
    const q = sinTilde(filtro.trim()), global = !!q || soloCambios;
    const cat = CATEGORIAS.find((k) => k.id === categoria);
    $$('[data-especial]', vista).forEach((x) => { x.hidden = global || x.dataset.especial !== cat?.especial; });
    $$('[data-cat]', vista).forEach((b) => b.setAttribute('aria-pressed', String(!global && b.dataset.cat === categoria)));
    const visibles = GRUPOS.filter((g) => (!g.si || g.si(cfg)) && (global || cat?.grupos.includes(g.id))).map((g) => {
      const coincide = !q || sinTilde(g.titulo).includes(q);
      const ctl = g.controles.filter((c) => (!c.si || c.si(cfg)) && (coincide || sinTilde(etiqueta(c) + ' ' + (c.ayuda || '')).includes(q)) && (!soloCambios || cambiado(c.ruta)));
      return { g, ctl, n: g.controles.filter((c) => cambiado(c.ruta)).length };
    }).filter((x) => x.ctl.length && (!soloCambios || x.ctl.some((c) => cambiado(c.ruta))));
    cont.innerHTML = visibles.length ? String(h`${global ? h`<p class="chico muted diseno-resultados">${visibles.reduce((n, x) => n + x.ctl.length, 0)} opciones${q ? h` para «${filtro}»` : ''} en ${visibles.length} grupos.</p>` : ''}${visibles.map(({ g, ctl, n }) => h`<section class="tarjeta grupo-diseno abierto" data-grupo="${g.id}"><h2>${g.titulo}${n ? h` <span class="insignia-cambios" title="Opciones cambiadas respecto del diseño original">${n}</span>` : ''}${global ? h` <small class="muted">· ${CATEGORIAS.find((k) => k.id === categoriaDe(g.id))?.titulo}</small>` : ''}</h2>
      <div class="grupo-barra">${g.ayuda ? h`<p class="chico muted">${g.ayuda}</p>` : h`<span></span>`}${n ? h`<button type="button" class="btn chico fantasma" data-restablecer-grupo="${g.id}" title="Vuelve este grupo a como viene el diseño original">↺ Restablecer</button>` : ''}</div>
      <div class="${g.id === 'colores' ? 'rejilla-colores' : 'pila'}">${ctl.map((c) => h`<div class="ctl${cambiado(c.ruta) ? ' cambiado' : ''}" data-ctl="${c.ruta}">${control(c)}${c.ruta.startsWith('_') ? '' : h`<button type="button" class="ctl-volver" data-restablecer-ctl="${c.ruta}" title="Volver al valor original" aria-label="Volver «${etiqueta(c)}» al valor original">↺</button>`}</div>`)}</div></section>`)}`)
      : cat?.especial && !global ? '' : String(h`<p class="tarjeta muted">No hay opciones que coincidan${q ? h` con «${filtro}»` : ''}.</p>`);
    // Selectores de imagen (biblioteca de medios)
    $$('[data-imagen]', cont).forEach((caja) => {
      const ruta = caja.dataset.imagen;
      const c = campo({ k: ruta, t: 'imagen', l: '' }, leer(cfg, ruta));
      caja.appendChild(c.el);
      c.el.addEventListener('input', () => cambiar(ruta, c.valor(), { repintar: false }));
    });
    const css = $('[data-css]', vista);
    if (css) css.value = cfg.avanzado.css;
    contarCambios();
  };
  const contarCambios = () => CATEGORIAS.forEach((k) => {
    const n = GRUPOS.filter((g) => k.grupos.includes(g.id)).flatMap((g) => g.controles).filter((c) => cambiado(c.ruta)).length;
    const el = $(`[data-cuenta="${k.id}"]`, vista);
    if (el) { el.hidden = !n; el.textContent = n; }
  });
  // Abre la parte del diseño de un grupo (desde la vista previa o el buscador) y lo resalta.
  const irAGrupo = (grupo, sec) => {
    if (sec && SECCIONES_PORTADA[sec]) secElegida = sec;
    categoria = categoriaDe(grupo); filtro = ''; soloCambios = false;
    $('[data-filtro]', vista).value = ''; $('[data-solo-cambios]', vista).checked = false;
    pintarGrupos();
    const el = $(`[data-grupo="${grupo}"]`, vista);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.remove('destello'); void el.offsetWidth; el.classList.add('destello'); }
  };

  // ---------------------------------------------------------------- Cambios
  const PERSONALIZA = /^(colores|tipografia|forma|cabecera\.estilo)/;
  // Parte de la página que muestra cada grupo de opciones (la vista previa se desplaza hasta ella).
  const ZONAS = { videos: '.videoteca, .seccion-videoteca', noticias: '.seccion-noticias', campanas: '.campanas', 'cabecera.': '.cabecera', 'elementos.accesos': '.accesos-seccion, .pt-mosaico', 'elementos.tramites': '.seccion-tramites', 'elementos.verTodo': '.seccion-tramites', 'elementos.separadores': '.seccion-tramites', buscador: '.hero-buscar, .cabecera', 'portal.mosaico': '.pt-mosaico', pie: '.pie' };
  let ultimaZona = '';
  function irA(ruta) {
    const ms = /^secciones\.(\w+)\./.exec(ruta);
    if (ms) { ZONAS[ruta] = `[data-sec="${ms[1]}"]`; }
    const k = ms ? ruta : Object.keys(ZONAS).find((z) => ruta.startsWith(z));
    if (!k || k === ultimaZona) return;
    ultimaZona = k;
    try { iframe.contentWindow?.postMessage({ tipo: 'mlp-ir', sel: ZONAS[k] }, location.origin); } catch { /* aún cargando */ }
  }
  function cambiar(ruta, valor, { repintar = true } = {}) {
    irA(ruta);
    historial.push(JSON.stringify(cfg)); if (historial.length > 60) historial.shift();
    const nuevo = copia(cfg);
    escribir(nuevo, ruta, valor);
    if (PERSONALIZA.test(ruta)) nuevo.estilo = 'personalizado';
    const condiciones = () => [...GRUPOS.filter((g) => g.si).map((g) => g.si(cfg)), ...todos().filter((c) => c.si).map((c) => c.si(cfg)), ...todos().filter((c) => typeof c.etiqueta === 'function').map(etiqueta)].join();
    const previoSi = condiciones();
    cfg = normalizar(nuevo, { permitirCss: true });
    const ahoraSi = condiciones();
    if (repintar && previoSi !== ahoraSi) pintarGrupos();
    actualizar();
  }
  function actualizar() {
    $('[data-deshacer]', vista).disabled = !historial.length;
    $$('[data-ctl]', vista).forEach((x) => x.classList.toggle('cambiado', cambiado(x.dataset.ctl)));
    $$('[data-estilo]', vista).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.estilo === cfg.estilo)));
    contarCambios();
    enviar();
  }

  const grupos = $('.diseno-controles', vista);
  grupos.addEventListener('input', (e) => {
    const el = e.target, ruta = el.dataset.ruta;
    if (el.matches('[data-css]')) { cambiar('avanzado.css', el.value, { repintar: false }); return; }
    if (el.matches('[data-filtro]')) { filtro = el.value; pintarGrupos(); return; }
    if (el.matches('[data-solo-cambios]')) { soloCambios = el.checked; pintarGrupos(); return; }
    if (!ruta) return;
    let v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
    if (el.dataset.hex !== undefined) { if (!/^#[0-9a-f]{6}$/i.test(v)) return; $(`input[type=color][data-ruta="${ruta}"]`, vista).value = v; }
    if (el.type === 'color') $(`input[data-hex][data-ruta="${ruta}"]`, vista).value = v.toUpperCase();
    const salida = $(`[data-salida="${ruta}"]`, vista);
    if (salida) salida.textContent = v + (todos().find((c) => c.ruta === ruta)?.unidad || '');
    cambiar(ruta, v, { repintar: el.type === 'checkbox' || el.tagName === 'SELECT' });
  });
  grupos.addEventListener('click', (e) => {
    const kt = e.target.closest('[data-cat]');
    if (kt) { if (kt.dataset.cat === 'movil' && dispositivo === 'computador') $('[data-dispositivo="celular"]', vista)?.click();
      categoria = kt.dataset.cat; filtro = ''; soloCambios = false; $('[data-filtro]', vista).value = ''; $('[data-solo-cambios]', vista).checked = false; pintarGrupos(); $('[data-grupos]', vista).scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    const es = e.target.closest('[data-elegir-sec]');
    if (es) { secElegida = es.dataset.elegirSec; pintarGrupos(); ultimaZona = ''; irA(`secciones.${secElegida}.fondo`); return; }
    const rg = e.target.closest('[data-restablecer-grupo]'), rc = e.target.closest('[data-restablecer-ctl]');
    if (rg || rc) {
      const rutas = rc ? [rc.dataset.restablecerCtl] : GRUPOS.find((g) => g.id === rg.dataset.restablecerGrupo).controles.map((c) => c.ruta);
      historial.push(JSON.stringify(cfg));
      const nuevo = copia(cfg);
      rutas.forEach((r) => escribir(nuevo, r, copia({ v: leer(DEF, r) }).v));
      cfg = normalizar(nuevo, { permitirCss: true });
      pintarGrupos(); actualizar();
      return;
    }
    const b = e.target.closest('[data-valor]');
    if (b) { $$(`[data-ruta="${b.dataset.ruta}"]`, vista).forEach((x) => x.setAttribute('aria-checked', String(x === b))); cambiar(b.dataset.ruta, b.dataset.valor); return; }
    const est = e.target.closest('[data-estilo]');
    if (est) { historial.push(JSON.stringify(cfg)); cfg = aplicarEstilo(cfg, est.dataset.estilo); pintarGrupos(); actualizar(); aviso(`Estilo «${ESTILOS[est.dataset.estilo].nombre}» aplicado en la vista previa. Guarde para publicarlo.`); }
  });

  // ---------------------------------------------------------------- Vista previa
  const iframe = $('[data-iframe]', vista), marco = $('[data-marco]', vista);
  const mensaje = () => {
    const logo = logoCabecera(cfg);
    return {
      tipo: 'mlp-diseno', css: variablesCss(cfg), cssPropio: cfg.avanzado.css, atributos: atributos(cfg), fuentes: urlFuentes(cfg),
      textos: { 'cabecera.subtitulo': cfg.cabecera.subtitulo, 'cabecera.nombre': cfg.cabecera.nombre, 'portada.titulo': cfg.portada.titulo, 'portada.bajada': cfg.portada.bajada || (cfg.portada.composicion === 'portal' ? `${ajustes.lema || 'Para todas y todos'}: trámites, servicios e información de Melipeuco.` : cfg.portada.composicion === 'trekking' ? `${ajustes.lema || 'Para todas y todos'}. Trámites, servicios e información de la comuna, a los pies del volcán Llaima.` : `${ajustes.lema || 'Para todas y todos'}. Trámites, servicios e información para las vecinas y vecinos de la comuna.`), 'portada.credito': cfg.portada.credito, 'portal.temasTitulo': cfg.portal.temasTitulo },
      imagenes: { 'portada.imagen': cfg.portada.imagen || '/img/plaza-melipeuco-1536.webp', ...((fotos) => Object.fromEntries([0, 1, 2, 3, 4, 5].map((i) => ['portada.foto-' + i, fotos[i % fotos.length].src])))(fotosPortada(cfg)) },
      logo: { claro: logo.src, oscuro: logo.oscuro, conTexto: logo.conTexto },
    };
  };
  let marcoPendiente = 0;
  function enviar() {
    cancelAnimationFrame(marcoPendiente);
    marcoPendiente = requestAnimationFrame(() => { try { iframe.contentWindow?.postMessage(mensaje(), location.origin); } catch { /* aún cargando */ } });
  }
  // «Tocar para editar»: la vista previa resalta la parte bajo el cursor y, al hacer clic, avisa
  // qué grupo de opciones le corresponde.
  let inspeccionar = false;
  const NOMBRES = Object.fromEntries(GRUPOS.map((g) => [g.id, g.titulo]));
  const enviarInspector = () => { try { iframe.contentWindow?.postMessage({ tipo: 'mlp-inspeccionar', activo: inspeccionar, zonas: INSPECTOR, nombres: { ...NOMBRES, ...Object.fromEntries(Object.entries(SECCIONES_PORTADA).map(([k, t]) => ['sec:' + k, 'Sección «' + t + '»'])) } }, location.origin); } catch { /* aún cargando */ } };
  $('[data-inspeccionar]', vista).addEventListener('click', (e) => {
    inspeccionar = !inspeccionar; e.currentTarget.setAttribute('aria-pressed', String(inspeccionar)); enviarInspector();
    if (inspeccionar) aviso('Haga clic en cualquier parte de la vista previa para ver sus opciones. Vuelva a pulsar el botón para navegar normalmente.');
  });
  const alListo = (e) => {
    if (e.origin !== location.origin || e.source !== iframe.contentWindow) return;
    if (e.data?.tipo === 'mlp-vista-lista') { enviar(); if (inspeccionar) enviarInspector(); }
    if (e.data?.tipo === 'mlp-elegido' && NOMBRES[e.data.grupo]) irAGrupo(e.data.grupo, e.data.sec);
  };
  window.addEventListener('message', alListo);
  iframe.addEventListener('load', enviar);
  const cargar = (extra = '') => { iframe.src = pagina + (pagina.includes('?') ? '&' : '?') + 'vista=diseno' + extra; };
  $('[data-pagina]', vista).addEventListener('change', (e) => { pagina = e.target.value; cargar(); });
  $$('[data-dispositivo]', vista).forEach((b) => b.addEventListener('click', () => {
    dispositivo = b.dataset.dispositivo;
    $$('[data-dispositivo]', vista).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    marco.dataset.dispositivo = dispositivo;
    ajustarMarco();
  }));
  // El sitio se dibuja al ancho real del dispositivo y se escala para caber en el marco.
  function ajustarMarco() {
    const ancho = DISPOSITIVOS[dispositivo][1], disp = marco.clientWidth - 16, alto = marco.clientHeight;
    const escala = Math.min(1, disp / ancho);
    iframe.style.width = ancho + 'px';
    iframe.style.height = alto / escala + 'px';
    iframe.style.transform = `scale(${escala})`;
  }
  const medidor = new ResizeObserver(ajustarMarco);
  medidor.observe(marco);
  $('[data-ver-transicion]', vista).addEventListener('click', () => {
    if (!cfg.animaciones.activas || !cfg.animaciones.cordillera) return aviso('Active «Transición de identidad al cambiar de página» en Animaciones.');
    try { iframe.contentWindow?.postMessage({ ...mensaje(), transicion: true }, location.origin); } catch { /* aún cargando */ }
  });
  $('[data-reproducir-logo]', vista).addEventListener('click', () => {
    if (pagina !== '/') { pagina = '/'; $('[data-pagina]', vista).value = '/'; cargar(); return; }
    try { iframe.contentWindow?.postMessage({ ...mensaje(), reproducir: true }, location.origin); } catch { /* aún cargando */ }
  });
  $('[data-intro]', vista).addEventListener('click', () => {
    if (!cfg.animaciones.activas || cfg.animaciones.intro === 'nunca') return aviso('La pantalla de carga está desactivada en «Animaciones».');
    pagina = '/'; $('[data-pagina]', vista).value = '/';
    aviso('La vista previa usa el diseño guardado para la pantalla de carga; los colores nuevos se aplican al terminar.');
    cargar('&intro=1');
  });

  // ---------------------------------------------------------------- Guardar, deshacer, restablecer
  $('[data-guardar]', vista).addEventListener('click', async () => {
    try {
      const r = await api('PUT', 'ajustes', { diseno: cfg });
      cfg = normalizar(r.diseno, { permitirCss: true }); guardado = JSON.stringify(cfg);
      aviso('Diseño guardado y publicado. La versión anterior quedó en «Versiones anteriores».', 'ok');
      pintarVersiones();
    } catch (er) { fallo(er); }
  });
  $('[data-deshacer]', vista).addEventListener('click', () => {
    if (!historial.length) return;
    cfg = JSON.parse(historial.pop()); pintarGrupos(); actualizar();
  });
  $('[data-restablecer]', vista).addEventListener('click', async () => {
    if (!(await confirmar('Se volverá al diseño original del sitio en la vista previa (colores, letras, formas, cabecera, portada, pie y animaciones). No se publica hasta que guarde.', { titulo: 'Volver al diseño original', boton: 'Restablecer' }))) return;
    historial.push(JSON.stringify(cfg)); cfg = normalizar({ avanzado: cfg.avanzado }); pintarGrupos(); actualizar();
  });
  marcarCambios(() => JSON.stringify(cfg) !== guardado);
  // Al salir de la vista se deja de escuchar al marco.
  const observador = new MutationObserver(() => { if (!vista.contains(iframe)) { window.removeEventListener('message', alListo); observador.disconnect(); medidor.disconnect(); } });
  observador.observe(vista, { childList: true });

  pintarEstilos();
  pintarGrupos();
  actualizar();
}
