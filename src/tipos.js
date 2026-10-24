// Esquema de los tipos de contenido del sitio. Un solo lugar decide qué campos tiene
// cada tipo: el panel de administración arma sus formularios con esto y el servidor
// valida contra lo mismo. Para agregar un tipo nuevo (p. ej. «licitación») basta con
// declararlo aquí y, si necesita vista pública propia, agregar su plantilla.
//
// Tipos de campo: texto, parrafo, html, numero, fecha, fechahora, si, opcion, url, email,
// telefono, imagen, archivo, lista (textos), repetidor (filas con subcampos), color,
// icono, area (referencia a un área municipal), tramite (trámite de la plataforma).

const SEO_NOTA = 'Si se deja vacío se usa el título y el resumen.';

export const ICONOS = ['inicio', 'telefono', 'auto', 'salud', 'billete', 'bus', 'documento', 'calendario', 'personas', 'hoja', 'montana', 'escuela', 'deporte', 'balanza', 'casa', 'herramienta', 'info', 'alerta', 'correo', 'ubicacion', 'reloj', 'buscar', 'estrella', 'corazon', 'camion', 'agua', 'basura', 'perro', 'trabajo', 'cultura', 'mapa', 'megafono', 'escudo', 'carpeta', 'enlace', 'descarga', 'video', 'camara', 'wifi', 'fuego', 'arbol', 'nieve', 'sol', 'licencia', 'grafico', 'mano', 'chat', 'usuario', 'llave', 'libro'];

export const TIPOS = {
  pagina: {
    etiqueta: 'Página', plural: 'Páginas', icono: 'documento', jerarquico: true, cuerpo: true, bloques: true,
    plantillas: { normal: 'Normal (con índice lateral)', ancho: 'Ancho completo', aterrizaje: 'Portada de sección (sin encabezado)' },
    campos: [
      { k: 'subtitulo', t: 'texto', l: 'Bajada o subtítulo' },
      { k: 'mostrarHijas', t: 'si', l: 'Mostrar las páginas hijas como tarjetas al final' },
    ],
  },
  noticia: {
    etiqueta: 'Noticia', plural: 'Noticias', icono: 'megafono', cuerpo: true, bloques: true, taxonomias: ['categoria', 'etiqueta'],
    campos: [
      { k: 'galeria', t: 'repetidor', l: 'Galería de fotos', sub: [{ k: 'src', t: 'imagen', l: 'Imagen' }, { k: 'alt', t: 'texto', l: 'Descripción' }] },
      { k: 'video', t: 'url', l: 'Video (YouTube, Vimeo o Facebook)' },
      { k: 'fuente', t: 'texto', l: 'Fuente o créditos' },
    ],
  },
  evento: {
    etiqueta: 'Evento', plural: 'Agenda de eventos', icono: 'calendario', cuerpo: true, bloques: true, taxonomias: ['categoria'],
    campos: [
      { k: 'inicio', t: 'fechahora', l: 'Inicio', req: true },
      { k: 'fin', t: 'fechahora', l: 'Término' },
      { k: 'todoElDia', t: 'si', l: 'Todo el día' },
      { k: 'lugar', t: 'texto', l: 'Lugar' },
      { k: 'direccion', t: 'texto', l: 'Dirección' },
      { k: 'lat', t: 'numero', l: 'Latitud (mapa)' }, { k: 'lng', t: 'numero', l: 'Longitud (mapa)' },
      { k: 'organizador', t: 'texto', l: 'Organiza' },
      { k: 'precio', t: 'texto', l: 'Valor (vacío = gratuito)' },
      { k: 'inscripcion', t: 'url', l: 'Enlace de inscripción' },
    ],
  },
  tramite: {
    etiqueta: 'Trámite', plural: 'Trámites y servicios', icono: 'licencia', cuerpo: true, bloques: true, taxonomias: ['etiqueta'],
    campos: [
      { k: 'modalidad', t: 'opcion', l: 'Modalidad', opciones: { presencial: 'Presencial', en_linea: 'En línea', mixto: 'En línea y presencial' }, def: 'presencial' },
      { k: 'transitoTramite', t: 'tramite', l: 'Trámite de la Plataforma Municipal (reserva, solicitud y seguimiento en línea)', ayuda: 'Al elegirlo, la ficha muestra en vivo la próxima hora disponible y el botón para iniciarlo en línea.' },
      { k: 'urlEnLinea', t: 'url', l: 'Otro enlace para hacerlo en línea (SEM, ChileAtiende, etc.)' },
      { k: 'textoBoton', t: 'texto', l: 'Texto del botón principal', def: 'Iniciar trámite en línea' },
      { k: 'dirigidoA', t: 'parrafo', l: '¿Quiénes pueden hacerlo?' },
      { k: 'requisitos', t: 'lista', l: 'Requisitos' },
      { k: 'documentos', t: 'lista', l: 'Documentos que debe presentar' },
      { k: 'pasos', t: 'lista', l: 'Paso a paso' },
      { k: 'costo', t: 'texto', l: 'Costo' },
      { k: 'plazo', t: 'texto', l: 'Plazo de respuesta' },
      { k: 'horario', t: 'texto', l: 'Horario de atención' },
      { k: 'lugar', t: 'texto', l: 'Dónde se realiza' },
      { k: 'telefono', t: 'telefono', l: 'Teléfono' },
      { k: 'email', t: 'email', l: 'Correo' },
      { k: 'formularios', t: 'repetidor', l: 'Formularios y archivos descargables', sub: [{ k: 'titulo', t: 'texto', l: 'Nombre' }, { k: 'url', t: 'archivo', l: 'Archivo' }] },
      { k: 'preguntas', t: 'repetidor', l: 'Preguntas frecuentes', sub: [{ k: 'pregunta', t: 'texto', l: 'Pregunta' }, { k: 'respuesta', t: 'parrafo', l: 'Respuesta' }] },
      { k: 'normativa', t: 'parrafo', l: 'Normativa' },
      { k: 'claves', t: 'texto', l: 'Palabras clave para el buscador', ayuda: 'Separadas por coma: «licencia, carnet de conducir, examen»' },
    ],
  },
  area: {
    etiqueta: 'Área municipal', plural: 'Áreas municipales', icono: 'escudo', jerarquico: true, cuerpo: true, bloques: true,
    campos: [
      { k: 'nombreCorto', t: 'texto', l: 'Nombre corto' },
      { k: 'tipoUnidad', t: 'opcion', l: 'Tipo de unidad', opciones: { alcaldia: 'Alcaldía', concejo: 'Concejo', direccion: 'Dirección', departamento: 'Departamento', oficina: 'Oficina', programa: 'Programa', juzgado: 'Juzgado', unidad: 'Unidad' }, def: 'oficina' },
      { k: 'responsable', t: 'texto', l: 'Jefatura o responsable' },
      { k: 'cargoResponsable', t: 'texto', l: 'Cargo de la jefatura' },
      { k: 'fotoResponsable', t: 'imagen', l: 'Foto de la jefatura' },
      { k: 'telefono', t: 'telefono', l: 'Teléfono' },
      { k: 'email', t: 'email', l: 'Correo' },
      { k: 'direccion', t: 'texto', l: 'Dirección u oficina' },
      { k: 'horario', t: 'texto', l: 'Horario de atención' },
      { k: 'funciones', t: 'lista', l: 'Funciones' },
      { k: 'norma', t: 'texto', l: 'Norma que la crea' },
      { k: 'categoriaNoticias', t: 'texto', l: 'Categoría de noticias asociada (slug)' },
      { k: 'transitoDepartamento', t: 'texto', l: 'Código de la dependencia en la Plataforma de Trámites (p. ej. dep-transito)', ayuda: 'Con él, la página del área muestra en vivo sus trámites en línea.' },
      { k: 'color', t: 'color', l: 'Color' },
      { k: 'icono', t: 'icono', l: 'Ícono' },
      { k: 'enMenu', t: 'si', l: 'Mostrar en el listado de áreas', def: true },
    ],
  },
  autoridad: {
    etiqueta: 'Autoridad', plural: 'Alcaldía y Concejo', icono: 'personas', cuerpo: true, ordenable: true,
    campos: [
      { k: 'cargo', t: 'opcion', l: 'Cargo', opciones: { alcalde: 'Alcalde(sa)', concejal: 'Concejal(a)', administrador: 'Administrador(a) Municipal', secretario: 'Secretario(a) Municipal', director: 'Director(a)', otro: 'Otro' }, def: 'concejal' },
      { k: 'cargoTexto', t: 'texto', l: 'Cargo (texto libre)' },
      { k: 'periodo', t: 'texto', l: 'Período', def: '2024 – 2028' },
      { k: 'email', t: 'email', l: 'Correo' },
      { k: 'telefono', t: 'telefono', l: 'Teléfono' },
      { k: 'comisiones', t: 'lista', l: 'Comisiones' },
      { k: 'audiencias', t: 'url', l: 'Solicitar audiencia (Ley del Lobby)' },
    ],
  },
  sesion: {
    etiqueta: 'Sesión del Concejo', plural: 'Sesiones del Concejo', icono: 'balanza', cuerpo: true,
    campos: [
      { k: 'fecha', t: 'fechahora', l: 'Fecha y hora', req: true },
      { k: 'numero', t: 'texto', l: 'N° de sesión' },
      { k: 'tipoSesion', t: 'opcion', l: 'Tipo', opciones: { ordinaria: 'Ordinaria', extraordinaria: 'Extraordinaria', especial: 'Especial' }, def: 'ordinaria' },
      { k: 'lugar', t: 'texto', l: 'Lugar', def: 'Salón del Concejo Municipal' },
      { k: 'tabla', t: 'lista', l: 'Tabla (puntos a tratar)' },
      { k: 'acta', t: 'archivo', l: 'Acta (PDF)' },
      { k: 'video', t: 'url', l: 'Transmisión o grabación' },
      { k: 'acuerdos', t: 'lista', l: 'Acuerdos adoptados' },
    ],
  },
  documento: {
    etiqueta: 'Documento', plural: 'Documentos y descargas', icono: 'carpeta', cuerpo: true, taxonomias: ['coleccion'],
    campos: [
      { k: 'archivo', t: 'archivo', l: 'Archivo', req: true },
      { k: 'numero', t: 'texto', l: 'N° (decreto, ordenanza, etc.)' },
      { k: 'fechaDoc', t: 'fecha', l: 'Fecha del documento' },
      { k: 'vigente', t: 'si', l: 'Vigente', def: true },
    ],
  },
  contacto: {
    etiqueta: 'Contacto', plural: 'Directorio telefónico', icono: 'telefono', ordenable: true,
    campos: [
      { k: 'telefono', t: 'telefono', l: 'Teléfono' },
      { k: 'anexo', t: 'texto', l: 'Anexo' },
      { k: 'whatsapp', t: 'telefono', l: 'WhatsApp' },
      { k: 'email', t: 'email', l: 'Correo' },
      { k: 'ubicacion', t: 'texto', l: 'Ubicación (piso, oficina)' },
      { k: 'horario', t: 'texto', l: 'Horario' },
      { k: 'grupo', t: 'opcion', l: 'Grupo', opciones: { municipal: 'Teléfonos municipales', emergencia: 'Emergencias', salud: 'Salud', educacion: 'Educación', servicios: 'Servicios públicos', otro: 'Otros' }, def: 'municipal' },
    ],
  },
  lugar: {
    etiqueta: 'Lugar turístico', plural: 'Descubre Melipeuco', icono: 'montana', cuerpo: true, bloques: true, taxonomias: ['categoria'],
    campos: [
      { k: 'tipoLugar', t: 'opcion', l: 'Tipo', opciones: { naturaleza: 'Naturaleza y parques', trekking: 'Senderos y trekking', alojamiento: 'Alojamiento', gastronomia: 'Gastronomía', cultura: 'Cultura y patrimonio', servicio: 'Servicios turísticos' }, def: 'naturaleza' },
      { k: 'direccion', t: 'texto', l: 'Dirección o sector' },
      { k: 'lat', t: 'numero', l: 'Latitud' }, { k: 'lng', t: 'numero', l: 'Longitud' },
      { k: 'telefono', t: 'telefono', l: 'Teléfono' },
      { k: 'web', t: 'url', l: 'Sitio web' },
      { k: 'horario', t: 'texto', l: 'Horario / temporada' },
      { k: 'galeria', t: 'repetidor', l: 'Galería', sub: [{ k: 'src', t: 'imagen', l: 'Imagen' }, { k: 'alt', t: 'texto', l: 'Descripción' }] },
    ],
  },
  slide: {
    etiqueta: 'Banner', plural: 'Banners de portada', icono: 'camara', ordenable: true, sinPagina: true,
    campos: [
      { k: 'imagenMovil', t: 'imagen', l: 'Imagen para celular (opcional, vertical)' },
      { k: 'enlace', t: 'url', l: 'Enlace al pulsar' },
      { k: 'textoBoton', t: 'texto', l: 'Texto del botón (vacío = sin botón)' },
      { k: 'textoAlt', t: 'texto', l: 'Descripción de la imagen (accesibilidad)', req: true, ayuda: 'Escriba lo que dice el banner: lo leen los lectores de pantalla.' },
      { k: 'desde', t: 'fecha', l: 'Mostrar desde' }, { k: 'hasta', t: 'fecha', l: 'Mostrar hasta' },
    ],
  },
  acceso: {
    etiqueta: 'Acceso rápido', plural: 'Accesos rápidos', icono: 'estrella', ordenable: true, sinPagina: true,
    campos: [
      { k: 'enlace', t: 'url', l: 'Enlace', req: true },
      { k: 'icono', t: 'icono', l: 'Ícono', def: 'estrella' },
      { k: 'color', t: 'color', l: 'Color', def: '#0b5a8c' },
      { k: 'nuevaVentana', t: 'si', l: 'Abrir en otra pestaña' },
    ],
  },
  aviso: {
    etiqueta: 'Aviso', plural: 'Avisos y alertas', icono: 'alerta', sinPagina: true,
    campos: [
      { k: 'nivel', t: 'opcion', l: 'Nivel', opciones: { info: 'Información', alerta: 'Alerta (amarilla)', emergencia: 'Emergencia (roja)', exito: 'Buena noticia' }, def: 'info' },
      { k: 'enlace', t: 'url', l: 'Enlace «Más información»' },
      { k: 'desde', t: 'fechahora', l: 'Desde' }, { k: 'hasta', t: 'fechahora', l: 'Hasta' },
      { k: 'enTodas', t: 'si', l: 'Mostrar en todas las páginas (no sólo en la portada)' },
    ],
  },
  encuesta: {
    etiqueta: 'Encuesta', plural: 'Participación ciudadana', icono: 'grafico', cuerpo: true,
    campos: [
      { k: 'opciones', t: 'lista', l: 'Opciones de respuesta', req: true },
      { k: 'desde', t: 'fecha', l: 'Abierta desde' }, { k: 'hasta', t: 'fecha', l: 'Abierta hasta' },
      { k: 'mostrarResultados', t: 'si', l: 'Mostrar resultados al votar', def: true },
    ],
  },
};

export const TAXONOMIAS = {
  categoria: { etiqueta: 'Categoría', plural: 'Categorías', jerarquica: true },
  etiqueta: { etiqueta: 'Etiqueta', plural: 'Etiquetas' },
  coleccion: { etiqueta: 'Colección de documentos', plural: 'Colecciones de documentos', jerarquica: true },
};

export const ESTADOS = { borrador: 'Borrador', revision: 'En revisión', publicado: 'Publicado', programado: 'Programado', archivado: 'Archivado' };

// Rutas públicas de cada tipo (las páginas usan su jerarquía de slugs).
export const RUTAS = {
  tramite: '/tramites/', evento: '/eventos/', documento: '/documentos/', area: '/areas/', autoridad: '/autoridades/',
  sesion: '/concejo/sesiones/', lugar: '/descubre/', encuesta: '/participa/', contacto: '/directorio/',
};

// ---------------------------------------------------------------- Permisos y roles
export const PERMISOS = {
  'contenido.ver': 'Ver contenidos en el panel',
  'contenido.crear': 'Crear contenidos',
  'contenido.editar_propio': 'Editar sus propios contenidos',
  'contenido.editar': 'Editar contenidos de otras personas',
  'contenido.publicar': 'Publicar y programar',
  'contenido.eliminar': 'Eliminar contenidos',
  'html.avanzado': 'Editar HTML avanzado (bloques aislados)',
  'medios.subir': 'Subir archivos',
  'medios.eliminar': 'Eliminar archivos',
  'menus.editar': 'Editar menús',
  'taxonomias.editar': 'Editar categorías y etiquetas',
  'mensajes.ver': 'Ver mensajes de contacto y OIRS',
  'mensajes.responder': 'Responder y gestionar mensajes',
  'suscriptores.ver': 'Ver suscriptores del boletín',
  'redirecciones.editar': 'Gestionar redirecciones',
  'ajustes.editar': 'Configurar el sitio',
  'usuarios.gestionar': 'Gestionar usuarios',
  'auditoria.ver': 'Ver registro de auditoría',
  'respaldo.gestionar': 'Respaldos e importación',
  'estadisticas.ver': 'Ver estadísticas de visitas',
};

const TODOS = Object.keys(PERMISOS);
export const ROLES = {
  superadmin: { nombre: 'Super Administrador(a)', desc: 'Control total, incluida la seguridad y los usuarios.', permisos: TODOS },
  administrador: { nombre: 'Administrador(a) del sitio', desc: 'Todo el contenido y la configuración, sin gestionar usuarios ni respaldos.', permisos: TODOS.filter((p) => !['usuarios.gestionar', 'respaldo.gestionar'].includes(p)) },
  editor: { nombre: 'Editor(a)', desc: 'Crea, edita y publica cualquier contenido; gestiona medios y menús.', permisos: ['contenido.ver', 'contenido.crear', 'contenido.editar_propio', 'contenido.editar', 'contenido.publicar', 'contenido.eliminar', 'medios.subir', 'medios.eliminar', 'menus.editar', 'taxonomias.editar', 'estadisticas.ver'] },
  periodista: { nombre: 'Periodista / Redactor(a)', desc: 'Redacta y envía a revisión; no publica.', permisos: ['contenido.ver', 'contenido.crear', 'contenido.editar_propio', 'medios.subir'] },
  area: { nombre: 'Encargado(a) de área', desc: 'Publica sólo en las áreas asignadas (p. ej. Tránsito, Salud).', permisos: ['contenido.ver', 'contenido.crear', 'contenido.editar_propio', 'contenido.editar', 'contenido.publicar', 'medios.subir'] },
  oirs: { nombre: 'Atención OIRS', desc: 'Gestiona los mensajes de contacto, reclamos y sugerencias.', permisos: ['contenido.ver', 'mensajes.ver', 'mensajes.responder', 'suscriptores.ver'] },
  consulta: { nombre: 'Consulta / Control', desc: 'Sólo lectura del panel y de la auditoría.', permisos: ['contenido.ver', 'auditoria.ver', 'estadisticas.ver', 'mensajes.ver'] },
};

export function tienePermiso(usuario, permiso) {
  if (!usuario) return false;
  return (ROLES[usuario.rol]?.permisos || []).includes(permiso);
}
