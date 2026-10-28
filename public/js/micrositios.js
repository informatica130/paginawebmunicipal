// Micrositios de las unidades municipales — esquema compartido.
// Cada unidad (Medio Ambiente, Deportes, Cultura, OMIL…) puede tener su propio sitio dentro del
// sitio municipal: una portada con su color, su patrón y su ícono, una barra de navegación propia
// y los módulos que necesite, en el orden que quiera. Lo usan el servidor (para validar y dibujar)
// y el panel (para armar los formularios), así un módulo nuevo se declara una sola vez aquí.
//
// Tipos de campo (los mismos del panel): texto, parrafo, html, url, archivo, imagen, icono, color,
// opcion, numero, fecha, si, lista y repetidor (con sus subcampos).

export const PATRONES_MICROSITIO = { hojas: 'Hojas', curvas: 'Curvas de nivel', araucarias: 'Araucarias', ondas: 'Ondas', montes: 'Cordillera', puntos: 'Puntos', hexagonos: 'Panal', cuadricula: 'Cuadrícula', diagonales: 'Diagonales', triangulos: 'Triángulos', cruces: 'Cruces', ninguno: 'Sin patrón' };
export const PORTADAS = { degradado: 'Color con patrón y dibujo', foto: 'Foto de fondo con velo de color', dividida: 'Texto y foto lado a lado' };
export const FONDOS_MODULO = { auto: 'Alternado automático', claro: 'Fondo de la página', suave: 'Tinte del color de la unidad', tarjeta: 'Blanco', oscuro: 'Color oscuro de la unidad' };
const ESTADOS_HITO = { hecho: 'Cumplido', curso: 'En curso', pendiente: 'Pendiente' };

const titulo = { k: 'titulo', t: 'texto', l: 'Título' };
const intro = { k: 'intro', t: 'parrafo', l: 'Texto de introducción (opcional)' };

export const MODULOS = {
  texto: { n: 'Texto e imagen', d: 'Presentación, política, misión o cualquier texto con una foto opcional.', icono: 'documento', campos: [titulo,
    { k: 'html', t: 'html', l: 'Texto' }, { k: 'imagen', t: 'imagen', l: 'Imagen (opcional)' }, { k: 'lado', t: 'opcion', l: 'Lado de la imagen', opciones: { derecha: 'A la derecha', izquierda: 'A la izquierda' }, def: 'derecha' },
    { k: 'destacado', t: 'parrafo', l: 'Frase destacada (opcional)' }, { k: 'botones', t: 'repetidor', l: 'Botones', sub: [{ k: 'texto', t: 'texto', l: 'Texto' }, { k: 'url', t: 'url', l: 'Enlace' }] }] },
  pestanas: { n: 'Temas en pestañas', d: 'Varios temas en pestañas: cada uno con texto, puntos clave, imagen y enlace.', icono: 'carpeta', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Pestañas', sub: [{ k: 'titulo', t: 'texto', l: 'Nombre de la pestaña' }, { k: 'icono', t: 'icono', l: 'Ícono' }, { k: 'html', t: 'html', l: 'Contenido' }, { k: 'puntos', t: 'lista', l: 'Puntos clave' }, { k: 'imagen', t: 'imagen', l: 'Imagen' }, { k: 'enlace', t: 'url', l: 'Enlace «Saber más»' }] }] },
  tarjetas: { n: 'Tarjetas', d: 'Programas, servicios o accesos, cada uno con ícono, texto y enlace.', icono: 'estrella', campos: [titulo, intro,
    { k: 'columnas', t: 'opcion', l: 'Columnas', opciones: { 2: '2', 3: '3', 4: '4' }, def: '3' },
    { k: 'items', t: 'repetidor', l: 'Tarjetas', sub: [{ k: 'icono', t: 'icono', l: 'Ícono' }, { k: 'etiqueta', t: 'texto', l: 'Etiqueta pequeña' }, { k: 'titulo', t: 'texto', l: 'Título' }, { k: 'texto', t: 'parrafo', l: 'Texto' }, { k: 'url', t: 'url', l: 'Enlace' }] }] },
  cifras: { n: 'Cifras y estadísticas', d: 'Datos de la comuna en números grandes, con su fuente.', icono: 'grafico', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Cifras', sub: [{ k: 'valor', t: 'texto', l: 'Valor (ej.: 90, 1.250, 30%)' }, { k: 'unidad', t: 'texto', l: 'Unidad (ej.: millones, toneladas)' }, { k: 'etiqueta', t: 'texto', l: 'Qué mide' }, { k: 'nota', t: 'texto', l: 'Nota o año' }, { k: 'icono', t: 'icono', l: 'Ícono' }] },
    { k: 'fuente', t: 'texto', l: 'Fuente de los datos' }] },
  pasos: { n: 'Paso a paso', d: 'Cómo hacer algo: separar residuos, compostar, inscribirse…', icono: 'check', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Pasos', sub: [{ k: 'icono', t: 'icono', l: 'Ícono' }, { k: 'titulo', t: 'texto', l: 'Paso' }, { k: 'texto', t: 'parrafo', l: 'Explicación' }] }] },
  documentos: { n: 'Documentos', d: 'Ordenanzas, políticas, actas, informes y guías para descargar.', icono: 'descarga', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Documentos', sub: [{ k: 'titulo', t: 'texto', l: 'Nombre' }, { k: 'descripcion', t: 'texto', l: 'Descripción' }, { k: 'tipo', t: 'texto', l: 'Tipo (Ordenanza, Acta, Informe, Guía…)' }, { k: 'anio', t: 'texto', l: 'Año' }, { k: 'url', t: 'archivo', l: 'Archivo o enlace' }, { k: 'doc', t: 'texto', l: 'O el código del documento de Transparencia' }] },
    { k: 'vacio', t: 'texto', l: 'Texto si todavía no hay documentos', def: 'Estamos preparando estos documentos; se publicarán aquí.' }] },
  calendario: { n: 'Calendario de actividades', d: 'Talleres, operativos, ferias y reuniones; los pasados se ocultan solos.', icono: 'calendario', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Actividades', sub: [{ k: 'fecha', t: 'fecha', l: 'Fecha' }, { k: 'hora', t: 'texto', l: 'Hora' }, { k: 'titulo', t: 'texto', l: 'Actividad' }, { k: 'lugar', t: 'texto', l: 'Lugar' }, { k: 'tipo', t: 'texto', l: 'Tipo (Taller, Operativo, Reunión…)' }, { k: 'texto', t: 'parrafo', l: 'Detalle' }, { k: 'url', t: 'url', l: 'Inscripción o más información' }] },
    { k: 'categoria', t: 'texto', l: 'Sumar los eventos de la Agenda con esta categoría (slug, opcional)' },
    { k: 'vacio', t: 'texto', l: 'Texto si no hay actividades próximas', def: 'Pronto publicaremos nuevas actividades.' }] },
  tabla: { n: 'Tabla u horario', d: 'Horarios de recolección, rutas, puntos de entrega… en filas y columnas.', icono: 'reloj', campos: [titulo, intro,
    { k: 'columnas', t: 'lista', l: 'Columnas (una por línea)' }, { k: 'filas', t: 'parrafo', l: 'Filas: una por línea, columnas separadas por |' }, { k: 'nota', t: 'texto', l: 'Nota al pie' }] },
  directorio: { n: 'Directorio de instituciones', d: 'Organismos y entidades con su descripción y contacto.', icono: 'escudo', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Instituciones', sub: [{ k: 'nombre', t: 'texto', l: 'Nombre' }, { k: 'sigla', t: 'texto', l: 'Sigla' }, { k: 'texto', t: 'parrafo', l: 'Qué hace' }, { k: 'url', t: 'url', l: 'Sitio web' }, { k: 'telefono', t: 'texto', l: 'Teléfono' }, { k: 'email', t: 'texto', l: 'Correo' }] }] },
  mapa: { n: 'Mapa', d: 'Mapa de Google My Maps u OpenStreetMap, con su leyenda.', icono: 'mapa', campos: [titulo, intro,
    { k: 'url', t: 'url', l: 'Dirección del mapa para insertar (Google My Maps → Insertar en mi sitio)' }, { k: 'alto', t: 'numero', l: 'Alto (px)', def: 460 },
    { k: 'leyenda', t: 'repetidor', l: 'Leyenda', sub: [{ k: 'color', t: 'color', l: 'Color' }, { k: 'texto', t: 'texto', l: 'Qué indica' }] },
    { k: 'vacio', t: 'texto', l: 'Texto si todavía no hay mapa', def: 'El mapa está en preparación.' }] },
  hitos: { n: 'Hoja de ruta', d: 'Etapas de un plan o certificación con su estado.', icono: 'bandera', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Etapas', sub: [{ k: 'periodo', t: 'texto', l: 'Período' }, { k: 'titulo', t: 'texto', l: 'Etapa' }, { k: 'texto', t: 'parrafo', l: 'Objetivo' }, { k: 'estado', t: 'opcion', l: 'Estado', opciones: ESTADOS_HITO, def: 'pendiente' }] }] },
  faq: { n: 'Preguntas frecuentes', d: 'Preguntas y respuestas que se despliegan.', icono: 'chat', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Preguntas', sub: [{ k: 'pregunta', t: 'texto', l: 'Pregunta' }, { k: 'respuesta', t: 'parrafo', l: 'Respuesta' }] }] },
  noticias: { n: 'Noticias de la unidad', d: 'Las últimas noticias de una categoría o con ciertas palabras.', icono: 'megafono', campos: [titulo,
    { k: 'categoria', t: 'texto', l: 'Categoría (slug, ej.: medio-ambiente)' }, { k: 'palabras', t: 'texto', l: 'O noticias que mencionen estas palabras (separadas por coma)' }, { k: 'cantidad', t: 'numero', l: 'Cantidad', def: 6 }] },
  galeria: { n: 'Galería de fotos', d: 'Fotos de actividades, obras y lugares.', icono: 'camara', campos: [titulo, intro,
    { k: 'imagenes', t: 'repetidor', l: 'Fotos', sub: [{ k: 'src', t: 'imagen', l: 'Foto' }, { k: 'alt', t: 'texto', l: 'Descripción' }] }] },
  llamado: { n: 'Llamado a la acción', d: 'Una franja destacada con un botón: inscripción, denuncia, encuesta…', icono: 'megafono', campos: [titulo,
    { k: 'texto', t: 'parrafo', l: 'Texto' }, { k: 'icono', t: 'icono', l: 'Ícono' }, { k: 'boton', t: 'texto', l: 'Texto del botón' }, { k: 'url', t: 'url', l: 'Enlace del botón' },
    { k: 'boton2', t: 'texto', l: 'Segundo botón (opcional)' }, { k: 'url2', t: 'url', l: 'Enlace del segundo botón' }] },
  enlaces: { n: 'Enlaces de interés', d: 'Plataformas y sitios relacionados.', icono: 'enlace', campos: [titulo, intro,
    { k: 'items', t: 'repetidor', l: 'Enlaces', sub: [{ k: 'icono', t: 'icono', l: 'Ícono' }, { k: 'texto', t: 'texto', l: 'Nombre' }, { k: 'descripcion', t: 'texto', l: 'Descripción' }, { k: 'url', t: 'url', l: 'Enlace' }] }] },
  tramites: { n: 'Trámites del área', d: 'Las fichas de trámites del sitio y los trámites en línea de la Plataforma de la unidad.', icono: 'licencia', campos: [titulo, intro,
    { k: 'dependencia', t: 'texto', l: 'Código de la unidad en el organigrama (ej.: dep-transito; incluye sus oficinas)' }, { k: 'etiqueta', t: 'texto', l: 'O trámites con esta etiqueta (slug)' }, { k: 'cantidad', t: 'numero', l: 'Cantidad máxima', def: 12 },
    { k: 'vacio', t: 'texto', l: 'Texto si no hay trámites', def: 'Consulte los trámites de esta unidad en la Oficina de Partes.' }] },
  contenido: { n: 'Contenido del sitio', d: 'Autoridades, sesiones del Concejo, agenda, directorio telefónico, lugares, formularios, fotos o videos, siempre al día.', icono: 'carpeta', campos: [titulo, intro,
    { k: 'fuente', t: 'opcion', l: 'Qué mostrar', opciones: { autoridades: 'Autoridades', sesiones: 'Sesiones del Concejo', eventos: 'Próximos eventos de la agenda', directorio: 'Directorio telefónico', lugares: 'Lugares turísticos', formulario: 'Formulario', videos: 'Videos de la videoteca', fotos: 'Álbumes de la fototeca' }, def: 'eventos' },
    { k: 'filtro', t: 'texto', l: 'Filtro (autoridades: alcalde o concejal · directorio: municipal, salud, educacion, emergencia · lugares: tipo · formulario: contacto, oirs o suscripcion · videos: categoría · fotos: área, vacío = la de este micrositio)' },
    { k: 'cantidad', t: 'numero', l: 'Cantidad', def: 6 }] },
  video: { n: 'Video', d: 'Un video de YouTube o Vimeo.', icono: 'video', campos: [titulo, intro, { k: 'url', t: 'url', l: 'Enlace del video' }] },
};

// Campos comunes de cada módulo (además de los suyos).
export const COMUNES = [
  { k: 'ancla', t: 'texto', l: 'Nombre corto en la barra de navegación (vacío = no aparece)' },
  { k: 'fondo', t: 'opcion', l: 'Fondo', opciones: FONDOS_MODULO, def: 'auto' },
  { k: 'visible', t: 'si', l: 'Visible', def: true },
];

// Datos generales de cada micrositio.
export const GENERAL = [
  { k: 'nombre', t: 'texto', l: 'Nombre del micrositio', req: true },
  { k: 'slug', t: 'texto', l: 'Dirección (ej.: medioambiente → sitio/medioambiente/)', req: true },
  { k: 'unidad', t: 'texto', l: 'Unidad o departamento responsable' },
  { k: 'descripcion', t: 'parrafo', l: 'Descripción para buscadores y redes sociales' },
  { k: 'organigrama', t: 'texto', l: 'Código de la unidad en el organigrama (ej.: dep-salud), para enlazar su ficha de Áreas municipales' },
  { k: 'alias', t: 'lista', l: 'Otras direcciones que llevan a este micrositio (una por línea, sin barras)' },
  { k: 'publicado', t: 'si', l: 'Publicado (si no, sólo lo ve quien tiene sesión en el panel)', def: false },
  { k: 'actualizado', t: 'fecha', l: 'Fecha de la última actualización de la información' },
];
export const TEMA = [
  { k: 'color', t: 'color', l: 'Color principal de la unidad', def: '#2F7D4A' },
  { k: 'oscuro', t: 'color', l: 'Color oscuro', def: '#123524' },
  { k: 'acento', t: 'color', l: 'Color de acento', def: '#E9A92B' },
  { k: 'patron', t: 'opcion', l: 'Patrón', opciones: PATRONES_MICROSITIO, def: 'hojas' },
  { k: 'icono', t: 'icono', l: 'Ícono de la unidad', def: 'hoja' },
  { k: 'portada', t: 'opcion', l: 'Tipo de portada', opciones: PORTADAS, def: 'degradado' },
  { k: 'imagen', t: 'imagen', l: 'Foto de la portada' },
];
export const PORTADA = [
  { k: 'antetitulo', t: 'texto', l: 'Texto pequeño sobre el título' },
  { k: 'titulo', t: 'texto', l: 'Título grande' },
  { k: 'bajada', t: 'parrafo', l: 'Bajada' },
  { k: 'botones', t: 'repetidor', l: 'Botones', sub: [{ k: 'texto', t: 'texto', l: 'Texto' }, { k: 'url', t: 'url', l: 'Enlace' }] },
  { k: 'cifras', t: 'repetidor', l: 'Datos destacados en la portada', sub: [{ k: 'valor', t: 'texto', l: 'Valor' }, { k: 'etiqueta', t: 'texto', l: 'Qué es' }] },
];
export const CONTACTO = [
  { k: 'responsable', t: 'texto', l: 'Encargada o encargado' }, { k: 'cargo', t: 'texto', l: 'Cargo' },
  { k: 'telefono', t: 'texto', l: 'Teléfono' }, { k: 'email', t: 'texto', l: 'Correo' },
  { k: 'direccion', t: 'texto', l: 'Dirección u oficina' }, { k: 'horario', t: 'texto', l: 'Horario de atención' },
  { k: 'redes', t: 'repetidor', l: 'Redes o enlaces de la unidad', sub: [{ k: 'texto', t: 'texto', l: 'Nombre' }, { k: 'url', t: 'url', l: 'Enlace' }] },
];
