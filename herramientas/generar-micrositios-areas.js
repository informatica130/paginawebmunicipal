// Genera los micrositios de las áreas municipales (contenido/micrositios/<area>.json) a partir de
// la información que ya tiene el sitio: las funciones del organigrama (Reglamento N° 12/2025), los
// contactos y el directorio telefónico, las fotos de las noticias de cada categoría y los textos
// de las páginas de sección. Lo que no está en esas fuentes se escribió a mano aquí, de forma
// general y sin datos inventados; cada unidad lo puede corregir y completar desde el panel.
//
// Uso: node herramientas/generar-micrositios-areas.js
// (Medio Ambiente tiene su propio archivo, escrito a mano, y no se toca.)

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { ORGANIGRAMA_MELIPEUCO as ORG } from '../src/organigrama-melipeuco.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(RAIZ, 'contenido', 'micrositios');
const semilla = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(RAIZ, 'contenido', 'semilla', 'wordpress.json.gz'))));
const FECHA = '2026-10-27';
const DIRECCION = 'Pedro Aguirre Cerda N° 14, Melipeuco';
const HORARIO = 'Lunes a viernes de 08:30 a 13:30 y de 14:30 a 17:30 hrs.';

const unidad = (id) => ORG.find((u) => u.id === id);
const hijas = (id) => ORG.filter((u) => u.parentId === id);
const lista = (xs) => '<ul>' + xs.map((x) => `<li>${x}</li>`).join('') + '</ul>';
const fono = (t) => { const s = String(t || '').replace(/\D/g, ''); return !s ? '' : s.length === 9 && s.startsWith('2') ? `+56 ${s.slice(0, 1)} ${s.slice(1, 5)} ${s.slice(5)}` : s.length === 9 && s.startsWith('9') ? `+56 ${s.slice(0, 1)} ${s.slice(1, 5)} ${s.slice(5)}` : s.length === 9 ? `+56 ${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5)}` : s.startsWith('56') && s.length === 11 ? `+56 ${s.slice(2, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : t; };

// Noticias de una categoría, de la más reciente a la más antigua.
const noticias = (cats) => semilla.contenidos.filter((c) => c.tipo === 'noticia' && c.estado === 'publicado' && (c.taxonomias || []).some((t) => cats.includes(t.slug)))
  .sort((a, b) => String(b.publicado_en).localeCompare(String(a.publicado_en)));
const fotos = (cats, n = 6) => noticias(cats).filter((c) => c.imagen && /\.(jpe?g|webp)$/i.test(c.imagen)).slice(0, n).map((c) => ({ src: c.imagen, alt: c.titulo.replace(/[^\p{L}\p{N}\s.,:;«»"“”()¡!¿?%°-]/gu, '').trim() }));
const directorio = (filtro) => semilla.directorio.filter(filtro).map((x) => ({ nombre: x.nombre.replace(/\b(Some|Cesfam|Udel|Dideco)\b/g, (m) => m.toUpperCase()).replace('Medioambiente', 'Medio ambiente'), sigla: '', texto: '', url: '', telefono: fono(x.telefono), email: x.email || '' }));

// Tarjetas con las oficinas de una unidad (nombre y primera función del organigrama).
const oficinas = (id, iconos = {}) => hijas(id).map((u) => ({ icono: iconos[u.id] || 'escudo', etiqueta: u.type === 'departamento' ? 'Departamento' : 'Oficina', titulo: ((t) => t[0].toUpperCase() + t.slice(1))(u.name.replace(/^Oficina de (la |los )?/, '').replace(/^Departamento de /, '')), texto: (u.funciones || [])[0] || '', url: '' }));
const funciones = (id, titulo = 'Qué hace la unidad') => ({ id: 'funciones', tipo: 'texto', ancla: 'Funciones', titulo, html: lista(unidad(id).funciones) + `<p><small>Según el ${unidad(id).norma.replace('Reglamento N° 12/2025', 'Reglamento de Organización Interna N° 12/2025')}.</small></p>` });
const mod = (id, tipo, o) => ({ id, tipo, ...o });

function sitio(a) {
  const img = a.imagen || fotos(a.categorias, 1)[0]?.src || '';
  const galeria = a.galeria === false ? [] : fotos(a.categorias, 6);
  const modulos = [...a.modulos];
  if (a.dependencia) modulos.push(mod('tramites', 'tramites', { ancla: 'Trámites', titulo: a.tituloTramites || 'Trámites y solicitudes', dependencia: a.dependencia, etiqueta: a.etiquetaTramites || '', cantidad: 12, vacio: 'Para trámites de esta unidad, consulte en la Oficina de Partes o llame al teléfono de contacto.' }));
  if (a.categorias.length) modulos.push(mod('noticias', 'noticias', { ancla: 'Noticias', titulo: a.tituloNoticias || `Noticias de ${a.nombre.toLowerCase()}`, categoria: a.categorias[0], palabras: a.palabras || '', cantidad: 6 }));
  if (galeria.length >= 3) modulos.push(mod('galeria', 'galeria', { titulo: 'En terreno', imagenes: galeria }));
  return {
    predeterminado: true,
    sitio: {
      id: a.slug, nombre: a.nombre, slug: a.slug, unidad: a.unidad, descripcion: a.descripcion, publicado: true, actualizado: FECHA,
      tema: { color: a.color, oscuro: a.oscuro, acento: a.acento || '#E9A92B', patron: a.patron, icono: a.icono, portada: img ? 'dividida' : 'degradado', imagen: img },
      portada: { antetitulo: a.antetitulo || a.unidad, titulo: a.titulo, bajada: a.bajada, botones: a.botones || [], cifras: a.cifras || [] },
      contacto: { responsable: a.responsable || '', cargo: a.cargo || '', telefono: a.telefono || '', email: a.email || '', direccion: a.direccion || DIRECCION, horario: a.horario || HORARIO, redes: a.redes || [{ texto: 'Consultas, reclamos y sugerencias (OIRS)', url: '/oirs/' }] },
      modulos,
    },
  };
}

const AREAS = [
  // ---------------------------------------------------------------- Educación
  sitio({ slug: 'educacion', nombre: 'Educación', unidad: 'Departamento de Educación Municipal (DAEM)', color: '#3E3E9A', oscuro: '#1D1D4F', patron: 'puntos', icono: 'escuela', categorias: ['educacion', 'becas-y-concursos'],
    titulo: 'Educación pública para Melipeuco', bajada: 'Escuelas, liceo y programas para que niñas, niños, jóvenes y personas adultas de la comuna aprendan cerca de su casa.',
    descripcion: 'Departamento de Educación Municipal de Melipeuco: establecimientos, becas, programas extraescolares y noticias de educación.',
    telefono: '+56 2 3384 8828', botones: [{ texto: 'Becas y concursos', url: '#m-becas' }, { texto: 'Establecimientos', url: '#m-establecimientos' }],
    cifras: [{ valor: 'Escuela y liceo', etiqueta: 'municipales en la comuna, con escuelas rurales' }, { valor: 'Beca Municipal', etiqueta: 'para estudiantes de educación superior' }],
    modulos: [
      mod('presentacion', 'texto', { ancla: 'El DAEM', titulo: 'El Departamento de Educación', html: '<p>El Departamento de Educación Municipal (DAEM) administra los establecimientos educacionales municipales de Melipeuco y vela por las condiciones óptimas para el proceso educativo: la dirección administrativa de las escuelas y el liceo, sus recursos humanos, financieros y materiales, la capacitación docente y no docente, los programas extraescolares y la educación de madres, padres y apoderados.</p>', destacado: 'Una educación cercana, que valora la cultura de la cordillera y del pueblo mapuche pehuenche.' }),
      mod('establecimientos', 'directorio', { ancla: 'Establecimientos', titulo: 'Establecimientos y contactos', intro: 'Comuníquese directamente con cada establecimiento para matrículas y consultas.', items: directorio((x) => x.grupo === 'educacion').map((x) => ({ ...x, texto: /Liceo/.test(x.nombre) ? 'Enseñanza media en Melipeuco.' : /Escuela/.test(x.nombre) ? 'Educación básica municipal.' : 'Administración de la educación municipal.' })) }),
      mod('programas', 'tarjetas', { ancla: 'Programas', titulo: 'Programas y apoyos', columnas: '3', items: [
        { icono: 'libro', etiqueta: 'Lectura', titulo: 'Biblioteca y Bibliomóvil', texto: 'La Biblioteca Pública Municipal, renovada en 2025, y el Bibliomóvil que visita las escuelas rurales.' },
        { icono: 'deporte', etiqueta: 'Extraescolar', titulo: 'Deporte y cultura escolar', texto: 'Corridas escolares, campeonatos comunales de cueca y talleres extraescolares.' },
        { icono: 'personas', etiqueta: 'Comunidad', titulo: 'Familias y apoderados', texto: 'Educación de madres, padres y apoderados y trabajo con las comunidades educativas.' },
      ] }),
      mod('becas', 'llamado', { titulo: 'Beca Municipal de educación superior', texto: 'Cada año la Municipalidad abre la postulación a la Beca Municipal para estudiantes de la comuna. Revise las bases y fechas en las noticias de Becas y concursos.', icono: 'escuela', boton: 'Ver becas y concursos', url: '/categoria/becas-y-concursos/' }),
      funciones('dep-educacion', 'Funciones del Departamento'),
    ] }),

  // ---------------------------------------------------------------- Salud
  sitio({ slug: 'salud', nombre: 'Salud', unidad: 'Departamento de Salud Municipal · CESFAM Melipeuco', color: '#16A0A8', oscuro: '#0A5155', patron: 'cruces', icono: 'salud', categorias: ['salud'],
    titulo: 'Salud cerca de cada familia', bajada: 'CESFAM Melipeuco y postas rurales de Caren, Cumcumllaque y Llaima: atención primaria, programas de salud y urgencias.',
    descripcion: 'Salud municipal de Melipeuco: CESFAM, postas rurales, urgencias, teléfonos y noticias de salud.',
    telefono: '+56 45 255 7691', email: 'cesfam@munimelipeuco.cl', antetitulo: 'Departamento de Salud Municipal',
    botones: [{ texto: 'Autoconsulta SSASUR', url: 'https://autoconsulta.ssasur.cl/auth/login' }, { texto: 'Teléfonos del CESFAM', url: '#m-telefonos' }],
    cifras: [{ valor: '1 CESFAM', etiqueta: 'en Melipeuco' }, { valor: '3 postas', etiqueta: 'rurales: Caren, Cumcumllaque y Llaima' }, { valor: '131', etiqueta: 'SAMU, ambulancia de urgencia' }],
    modulos: [
      mod('urgencias', 'llamado', { titulo: 'Urgencias', texto: 'Urgencias CESFAM Melipeuco: 45 255 7691 · Ambulancia SAMU: 131 · Bomberos: 132 · Carabineros: 133.', icono: 'alerta', boton: 'Llamar a urgencias', url: 'tel:+56452557691', boton2: 'Llamar al SAMU', url2: 'tel:131' }),
      mod('presentacion', 'texto', { ancla: 'El CESFAM', titulo: 'Atención primaria de salud', html: '<p>El Departamento de Salud Municipal asegura la atención de los establecimientos de salud de la comuna: el <strong>Centro de Salud Familiar (CESFAM) Melipeuco</strong> y las <strong>postas de salud rural</strong> de Caren, Cumcumllaque y Llaima. Desarrolla los programas del Ministerio de Salud para cada etapa de la vida, con un enfoque familiar y comunitario.</p><p>Para revisar sus horas, exámenes o recetas puede usar la Autoconsulta del Servicio de Salud Araucanía Sur.</p>', botones: [{ texto: 'Autoconsulta SSASUR', url: 'https://autoconsulta.ssasur.cl/auth/login' }] }),
      mod('telefonos', 'directorio', { ancla: 'Teléfonos', titulo: 'Teléfonos del CESFAM y las postas', intro: 'Llame directamente a la sección que necesita.', items: directorio((x) => x.grupo === 'salud' || (/cesfam|posta|ges|some|per cápita/i.test(x.nombre) && x.grupo === 'municipal')) }),
      mod('programas', 'tarjetas', { ancla: 'Programas', titulo: 'Programas y servicios', columnas: '4', items: [
        { icono: 'personas', titulo: 'Atención familiar', texto: 'Controles de salud para niñas, niños, adultos y personas mayores.' },
        { icono: 'corazon', titulo: 'Salud mental', texto: 'Atención y acompañamiento en salud mental.' },
        { icono: 'casa', titulo: 'Atención domiciliaria', texto: 'Visitas a personas mayores y con dependencia severa.' },
        { icono: 'check', titulo: 'GES', texto: 'Garantías explícitas en salud: consulte en el CESFAM.' },
      ] }),
      mod('preguntas', 'faq', { titulo: 'Preguntas frecuentes', items: [
        { pregunta: '¿Cómo pido una hora en el CESFAM?', respuesta: 'Llame al SOME del CESFAM o acérquese personalmente. Para revisar horas y exámenes puede usar la Autoconsulta SSASUR.' },
        { pregunta: '¿Qué hago ante una urgencia?', respuesta: 'Llame a Urgencias CESFAM Melipeuco (45 255 7691) o al SAMU (131).' },
        { pregunta: '¿Dónde están las postas rurales?', respuesta: 'En los sectores de Caren, Cumcumllaque y Llaima. Sus teléfonos están en esta página.' },
      ] }),
      funciones('dep-salud', 'Funciones del Departamento de Salud'),
    ] }),

  // ---------------------------------------------------------------- Desarrollo social
  sitio({ slug: 'social', nombre: 'Desarrollo Social', unidad: 'Dirección de Desarrollo Comunitario (DIDECO)', color: '#D23B4A', oscuro: '#6E1520', patron: 'ondas', icono: 'corazon', categorias: ['social', 'dideco', 'vivienda', 'uamis'],
    titulo: 'Acompañamos a cada familia', bajada: 'Registro Social de Hogares, ayudas sociales, subsidios y pensiones, vivienda, personas mayores, mujeres, juventud y organizaciones comunitarias.',
    descripcion: 'DIDECO Melipeuco: programas sociales, Registro Social de Hogares, subsidios, vivienda, adulto mayor, mujer, juventud y organizaciones comunitarias.',
    telefono: '+56 2 3384 8811', email: 'dideco@munimelipeuco.cl', tituloTramites: 'Trámites y postulaciones',
    botones: [{ texto: 'Ver las oficinas', url: '#m-oficinas' }, { texto: 'Trámites en línea', url: '#m-tramites' }],
    cifras: [{ valor: '9 oficinas', etiqueta: 'y programas para la comunidad' }, { valor: 'FONDEVE', etiqueta: 'fondo concursable para juntas de vecinos' }],
    modulos: [
      mod('presentacion', 'texto', { ancla: 'DIDECO', titulo: 'La Dirección de Desarrollo Comunitario', html: '<p>DIDECO asesora a la comunidad y a sus organizaciones, realiza diagnósticos socioeconómicos, administra los programas sociales de cobertura nacional y entrega asistencia social, incluida la ayuda en emergencias según el reglamento de ayudas sociales.</p><p>Si necesita orientación sobre beneficios, el Registro Social de Hogares o una ayuda social, acérquese a DIDECO en el municipio.</p>' }),
      mod('oficinas', 'tarjetas', { ancla: 'Oficinas', titulo: 'Oficinas y programas', columnas: '3', items: [
        ...oficinas('dep-dideco-social', { 'dep-asistencia-social': 'mano', 'dep-vivienda': 'casa', 'dep-subsidios': 'billete', 'dep-uamis': 'personas', 'dep-deportes': 'deporte', 'dep-mujer': 'usuario', 'dep-juventud': 'estrella' }),
        ...oficinas('dep-dideco-comunitario', { 'dep-organizaciones': 'personas' }),
      ].map((t) => (t.titulo === 'Deportes y Recreación' ? { ...t, url: '/deporte/' } : t)) }),
      mod('temas', 'pestanas', { ancla: 'Beneficios', titulo: 'Beneficios y apoyos', items: [
        { titulo: 'Registro Social de Hogares', icono: 'documento', html: '<p>El Registro Social de Hogares es la puerta de entrada a la mayoría de los beneficios del Estado. En DIDECO puede ingresar, actualizar o rectificar su información.</p>', puntos: ['Lleve su cédula de identidad.', 'Mantenga actualizados los integrantes y el domicilio de su hogar.'], enlace: 'https://www.registrosocial.gob.cl/' },
        { titulo: 'Vivienda', icono: 'casa', html: '<p>La Oficina de Vivienda asesora a quienes postulan a subsidios habitacionales, en coordinación con el SERVIU: orienta la creación de comités, arma los expedientes y apoya los proyectos técnicos.</p>', puntos: ['Subsidio de construcción en sitio propio.', 'Mejoramiento y ampliación de viviendas.', 'Viviendas de emergencia.'] },
        { titulo: 'Personas mayores e inclusión', icono: 'personas', html: '<p>La UAMIS impulsa planes y programas para las personas mayores y para la inclusión de personas con discapacidad o dependencia, y asesora a sus organizaciones en proyectos y personalidad jurídica.</p>', puntos: ['Operativos de salud y talleres.', 'Proyecto de la Casa del Adulto Mayor.', 'Entrega de leña en invierno para personas de 60 años o más (inscripción en UAMIS).'] },
        { titulo: 'Mujeres y juventud', icono: 'usuario', html: '<p>La Oficina de la Mujer y Equidad de Género promueve la autonomía y el liderazgo de las mujeres y articula la red local contra la violencia. La Oficina de la Juventud apoya a jóvenes y a sus organizaciones con información, capacitación y fondos concursables.</p>' },
        { titulo: 'Organizaciones comunitarias', icono: 'escudo', html: '<p>La Oficina de Organizaciones Comunitarias asesora a juntas de vecinos y otras organizaciones (Ley 19.418), tramita su personalidad jurídica y las apoya en sus postulaciones al Fondo de Desarrollo Vecinal (FONDEVE).</p>', enlace: '/fondeve2026/' },
      ] }),
      funciones('dep-dideco', 'Funciones de DIDECO'),
    ], dependencia: 'dep-dideco', palabras: 'registro social, subsidio, vivienda, adulto mayor' }),

  // ---------------------------------------------------------------- Desarrollo económico local
  sitio({ slug: 'udel', nombre: 'Desarrollo Local', unidad: 'Departamento de Desarrollo Económico Local (UDEL)', color: '#8A5A3B', oscuro: '#432816', acento: '#E9A92B', patron: 'montes', icono: 'trabajo', categorias: ['desarrollo-local', 'udel', 'turismo-udel'],
    titulo: 'Emprender y producir en Melipeuco', bajada: 'Fomento productivo, apoyo a agricultoras y agricultores, PDTI, recursos hídricos, saneamiento de títulos, turismo y cultura.',
    descripcion: 'UDEL Melipeuco: fomento productivo, PDTI, PRODESAL, recursos hídricos, saneamiento de títulos, ferias, turismo y cultura.',
    telefono: '+56 2 3384 8818', email: 'udel@munimelipeuco.cl', antetitulo: 'Desarrollo Económico Local',
    botones: [{ texto: 'Programas', url: '#m-programas' }, { texto: 'Oficinas', url: '#m-oficinas' }],
    cifras: [{ valor: 'PDTI y PRODESAL', etiqueta: 'programas de apoyo a la agricultura familiar' }, { valor: 'Ferias', etiqueta: 'de emprendimiento dentro y fuera de la comuna' }],
    modulos: [
      mod('presentacion', 'texto', { ancla: 'La UDEL', titulo: 'Desarrollo Económico Local', html: '<p>La UDEL impulsa políticas para aumentar las fuentes productivas de la comuna y apoya a la pequeña empresa campesina en coordinación con los organismos agropecuarios y forestales. Coordina los programas de fomento productivo —como el PDTI y PRODESAL—, los proyectos de riego y drenaje, el saneamiento de títulos rurales y los derechos de agua, y la tenencia responsable de mascotas.</p>' }),
      mod('programas', 'pestanas', { ancla: 'Programas', titulo: 'Programas y apoyos', items: [
        { titulo: 'Agricultura familiar', icono: 'hoja', html: '<p>Los programas <strong>PDTI</strong> (Desarrollo Territorial Indígena) y <strong>PRODESAL</strong> acompañan a familias campesinas con asesoría técnica, capacitaciones e incentivos para mejorar su producción.</p>', puntos: ['Talleres de huerta, conservación de alimentos y cosecha de aguas lluvias.', 'Rescate de saberes y productos del bosque nativo.'] },
        { titulo: 'Emprendimiento', icono: 'trabajo', html: '<p>La Oficina de Fomento Productivo promueve la regularización de los emprendimientos locales y gestiona ferias, como la feria de la Fiesta del Baqueano y el Festival de la Mosqueta Cordillerana.</p>' },
        { titulo: 'Agua y títulos', icono: 'agua', html: '<p>La Oficina de Recursos Hídricos y Saneamiento de Títulos asesora en el acceso y manejo del agua —incluida la Ley 21.435, que reformó el Código de Aguas—, apoya proyectos de riego y la regularización de títulos de dominio con Bienes Nacionales.</p>' },
        { titulo: 'Mascotas', icono: 'perro', html: '<p>Operativos gratuitos de vacunación y la atención del Box Veterinario Municipal para promover la tenencia responsable de mascotas.</p>', enlace: '/boxveterinario/' },
      ] }),
      mod('oficinas', 'tarjetas', { ancla: 'Oficinas', titulo: 'Oficinas', columnas: '4', items: oficinas('dep-del', { 'dep-fomento': 'trabajo', 'dep-hidricos': 'agua', 'dep-turismo': 'montana', 'dep-cultura': 'cultura' }).map((t) => ({ ...t, url: /Turismo/.test(t.titulo) ? '/turismo/' : /Cultura/.test(t.titulo) ? '/cultura/' : '' })) }),
      funciones('dep-del', 'Funciones de la UDEL'),
    ], dependencia: 'dep-del', palabras: 'pdti, prodesal, emprendimiento, feria' }),

  // ---------------------------------------------------------------- Deporte
  sitio({ slug: 'deporte', nombre: 'Deporte', unidad: 'Oficina de Deportes y Recreación', color: '#E2683C', oscuro: '#7A2E12', patron: 'diagonales', icono: 'deporte', categorias: ['deporte', 'poster-deportes'],
    titulo: 'Melipeuco en movimiento', bajada: 'Talleres, escuelas deportivas, campeonatos y actividades recreativas para todas las edades, en el estadio, el gimnasio y la naturaleza.',
    descripcion: 'Oficina de Deportes y Recreación de Melipeuco: talleres, escuelas deportivas, campeonatos y eventos como la Media Maratón Entre Ríos y Volcanes.',
    antetitulo: 'Oficina de Deportes y Recreación', telefono: '+56 2 3384 8811',
    botones: [{ texto: 'Media Maratón Entre Ríos y Volcanes', url: '/entreriosyvolcanes/' }, { texto: 'Actividades', url: '#m-actividades' }],
    modulos: [
      mod('presentacion', 'texto', { ancla: 'La oficina', titulo: 'Deporte y recreación para todos', html: '<p>La Oficina de Deportes y Recreación, parte de DIDECO, organiza y ejecuta programas deportivos y recreativos, fomenta la participación de clubes, organizaciones y sectores de la comuna y se coordina con instituciones públicas y privadas para traer más deporte a Melipeuco.</p>' }),
      mod('actividades', 'tarjetas', { ancla: 'Actividades', titulo: 'Escuelas, talleres y eventos', columnas: '3', items: [
        { icono: 'deporte', etiqueta: 'Fútbol', titulo: 'Campeonatos y torneos', texto: 'Campeonato comunal y torneos de fútbol masculino y femenino.' },
        { icono: 'montana', etiqueta: 'Aire libre', titulo: 'Trail y montaña', texto: 'Media Maratón «Entre Ríos y Volcanes», raid y deportes en la Capital del Trekking.', url: '/entreriosyvolcanes/' },
        { icono: 'personas', etiqueta: 'Escuelas', titulo: 'Escuelas deportivas', texto: 'Atletismo, artes marciales, muro de escalada y talleres para personas mayores.' },
        { icono: 'estrella', etiqueta: 'Eventos', titulo: 'Grandes eventos', texto: 'Velada internacional de boxeo, cicletada familiar y juegos populares de Fiestas Patrias.' },
        { icono: 'escuela', etiqueta: 'Escolar', titulo: 'Deporte escolar', texto: 'Corrida escolar comunal en el Día de la Actividad Física, con el DAEM.' },
      ] }),
      mod('agenda', 'calendario', { ancla: 'Calendario', titulo: 'Próximas actividades', items: [], categoria: 'deporte', vacio: 'Pronto publicaremos las próximas competencias, inscripciones y talleres.' }),
      funciones('dep-deportes', 'Funciones de la oficina'),
    ] }),

  // ---------------------------------------------------------------- Turismo
  sitio({ slug: 'turismo', nombre: 'Turismo', unidad: 'Oficina de Turismo', color: '#1F6FA8', oscuro: '#0F3A5A', patron: 'montes', icono: 'montana', categorias: ['turismo', 'turismo-udel'],
    titulo: 'Melipeuco, Capital del Trekking', bajada: 'A los pies del volcán Llaima: puerta de entrada al Parque Nacional Conguillío, la laguna Icalma y la Reserva de la Biósfera Araucarias, en el Geoparque Kütralkura.',
    descripcion: 'Turismo en Melipeuco, Capital del Trekking: volcán Llaima, Parque Nacional Conguillío, laguna Icalma, Geoparque Kütralkura, fiestas y cultura mapuche pehuenche.',
    antetitulo: 'Oficina de Turismo · Capital del Trekking', telefono: '+56 9 3944 8069', redes: [{ texto: 'Sitio Melipeuco Capital del Trekking', url: 'https://melipeucocapitaldeltrekking.cl/' }, { texto: 'Descubre Melipeuco', url: '/descubremelipeuco/' }],
    botones: [{ texto: 'Melipeuco Capital del Trekking', url: 'https://melipeucocapitaldeltrekking.cl/' }, { texto: 'Descubre Melipeuco', url: '/descubremelipeuco/' }],
    cifras: [{ valor: 'Volcán Llaima', etiqueta: 'y Parque Nacional Conguillío' }, { valor: 'Geoparque', etiqueta: 'Kütralkura, Geoparque Mundial UNESCO' }, { valor: 'Parador', etiqueta: 'turístico: +56 9 3944 8069' }],
    modulos: [
      mod('destinos', 'pestanas', { ancla: 'Qué hacer', titulo: 'Qué hacer en Melipeuco', items: [
        { titulo: 'Trekking y volcanes', icono: 'montana', html: '<p>Senderos entre araucarias milenarias, coladas de lava y miradores al volcán Llaima. Melipeuco es la <strong>Capital del Trekking</strong>.</p>', enlace: 'https://melipeucocapitaldeltrekking.cl/' },
        { titulo: 'Parque Nacional Conguillío', icono: 'arbol', html: '<p>Lagos, bosques de araucarias y el volcán Llaima, con acceso desde Melipeuco. Revise las condiciones y horarios en CONAF antes de su visita.</p>', enlace: 'https://www.conaf.cl/' },
        { titulo: 'Lagunas y ríos', icono: 'agua', html: '<p>La laguna Icalma, el río Truful-Truful y el río Allipén, con saltos, playas de río y paisajes volcánicos.</p>', enlace: '/descubremelipeuco/' },
        { titulo: 'Cultura y fiestas', icono: 'cultura', html: '<p>La Fiesta del Baqueano, el Festival de la Mosqueta Cordillerana, el Festival de la Montaña y la cultura mapuche pehuenche.</p>', enlace: '/cultura/' },
      ] }),
      mod('presentacion', 'texto', { ancla: 'La oficina', titulo: 'La Oficina de Turismo', html: '<p>La Oficina de Turismo, parte de la UDEL, elabora planes y proyectos de promoción del turismo, se vincula con SERNATUR y con el sector privado y difunde el potencial turístico de la comuna. Melipeuco participa además en la red de Geoparques Mundiales de la UNESCO.</p>' }),
      mod('enlaces', 'enlaces', { titulo: 'Para planificar su viaje', items: [
        { icono: 'montana', texto: 'Melipeuco Capital del Trekking', descripcion: 'Rutas, alojamiento y servicios turísticos', url: 'https://melipeucocapitaldeltrekking.cl/' },
        { icono: 'mapa', texto: 'Descubre Melipeuco', descripcion: 'Lugares para visitar en la comuna', url: '/descubremelipeuco/' },
        { icono: 'bus', texto: 'Horario de buses', descripcion: 'Transporte público hacia y desde Melipeuco', url: '/transportepublico/' },
        { icono: 'documento', texto: 'Prestadores de servicios', descripcion: 'Listado de prestadores de servicios turísticos', url: '/listado-de-prestadores-de-servicio-melipeuco/' },
      ] }),
      funciones('dep-turismo', 'Funciones de la oficina'),
    ] }),

  // ---------------------------------------------------------------- Cultura
  sitio({ slug: 'cultura', nombre: 'Cultura', unidad: 'Oficina de Cultura', color: '#7A3E91', oscuro: '#3A1748', patron: 'hexagonos', icono: 'cultura', categorias: ['cultural', 'cultura', 'fiesta-del-baqueano'],
    titulo: 'Cultura viva de la cordillera', bajada: 'Fiestas costumbristas, música, libros, talleres y la cultura mapuche pehuenche: la vida cultural de Melipeuco y su Biblioteca Municipal.',
    descripcion: 'Oficina de Cultura de Melipeuco: Fiesta del Baqueano, Biblioteca Pública Municipal, talleres, conciertos, efemérides y patrimonio.',
    antetitulo: 'Oficina de Cultura', botones: [{ texto: 'Agenda cultural', url: '/eventos/' }, { texto: 'Fiesta del Baqueano', url: '/fiestadelbaqueano/' }],
    modulos: [
      mod('presentacion', 'texto', { ancla: 'La oficina', titulo: 'La Oficina de Cultura', html: '<p>La Oficina de Cultura, parte de la UDEL, protege los bienes y monumentos de interés comunal, fomenta museos, bibliotecas y centros culturales —y administra la Biblioteca Pública Municipal—, y organiza concursos, talleres, exposiciones, conciertos y efemérides.</p>', destacado: 'La cultura de Melipeuco nace del encuentro entre la cordillera, el pueblo mapuche pehuenche y sus familias colonas.' }),
      mod('temas', 'tarjetas', { ancla: 'Actividades', titulo: 'Fiestas, talleres y patrimonio', columnas: '3', items: [
        { icono: 'estrella', etiqueta: 'Tradición', titulo: 'Fiesta del Baqueano', texto: 'La gran fiesta costumbrista de la comuna, con desfile y feria.', url: '/fiestadelbaqueano/' },
        { icono: 'libro', etiqueta: 'Lectura', titulo: 'Biblioteca Pública Municipal', texto: 'Préstamo de libros, lanzamientos y actividades, renovada en 2025.' },
        { icono: 'cultura', etiqueta: 'Música', titulo: 'Conciertos y peñas', texto: 'Conciertos, peñas folclóricas y presentaciones de ballet folclórico.' },
        { icono: 'mano', etiqueta: 'Oficios', titulo: 'Talleres', texto: 'Cestería con fibras vegetales, textilería y artesanía en madera.' },
        { icono: 'calendario', etiqueta: 'Efemérides', titulo: 'Fiestas Patrias y aniversario', texto: 'Desfiles, juegos populares y el aniversario de la comuna.' },
        { icono: 'escudo', etiqueta: 'Patrimonio', titulo: 'Patrimonio local', texto: 'Protección de los bienes y monumentos de interés comunal.' },
      ] }),
      mod('agenda', 'calendario', { ancla: 'Agenda', titulo: 'Agenda cultural', items: [], categoria: 'cultura', vacio: 'Revise la agenda completa del sitio para ver las próximas actividades.' }),
      funciones('dep-cultura', 'Funciones de la oficina'),
    ] }),

  // ---------------------------------------------------------------- Tránsito
  sitio({ slug: 'transito', nombre: 'Tránsito', unidad: 'Departamento de Tránsito y Transporte Público', color: '#D4901A', oscuro: '#5E3F05', acento: '#1F6FA8', patron: 'cuadricula', icono: 'auto', categorias: ['departamento-de-transito-y-transporte-publico', 'transito'],
    titulo: 'Licencias, permisos y una comuna segura', bajada: 'Licencias de conducir, permisos de circulación, señalización vial y transporte público, con reserva de horas en línea.',
    descripcion: 'Departamento de Tránsito de Melipeuco: licencias de conducir, reserva de horas, permisos de circulación, señalización y transporte público.',
    telefono: '+56 2 3384 8829', email: 'transito@munimelipeuco.cl', dependencia: 'dep-transito', tituloTramites: 'Trámites de Tránsito',
    botones: [{ texto: 'Reservar hora para licencia', url: '/reservadehora/' }, { texto: 'Pagar permiso de circulación', url: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion/70766500/buscar' }],
    cifras: [{ valor: 'En línea', etiqueta: 'reserva de horas para licencias' }, { valor: '2 cuotas', etiqueta: 'para pagar el permiso de circulación' }],
    modulos: [
      mod('licencias', 'pestanas', { ancla: 'Licencias', titulo: 'Licencias de conducir', intro: 'Revise la guía de su trámite y reserve su hora en línea.', items: [
        { titulo: 'Primera licencia', icono: 'licencia', html: '<p>Para obtener su primera licencia no profesional (clases B, C, D, E y F) debe rendir los exámenes físico, psíquico, teórico y práctico.</p>', puntos: ['Cédula de identidad vigente.', 'Certificado de estudios (mínimo 8° básico) para clases B y C.', 'Comprobante de domicilio en la comuna.'], enlace: '/licenciadeconducir/' },
        { titulo: 'Renovación (control)', icono: 'reloj', html: '<p>Renueve su licencia antes de su vencimiento. Rendirá los exámenes físico, psíquico y la entrevista médica.</p>', enlace: '/renovarlicencia/' },
        { titulo: 'Ampliación de clase', icono: 'auto', html: '<p>Agregue una nueva clase a su licencia junto con su control.</p>', enlace: '/controlconampliacionanuevaclase/' },
        { titulo: 'Duplicados y cambios', icono: 'documento', html: '<p>Duplicado por robo o extravío, cambio de domicilio y reemplazo por deterioro.</p>', enlace: '/duplicadosporrobooextravio/' },
      ] }),
      mod('reserva', 'llamado', { titulo: 'Reserve su hora sin filas', texto: 'Agende en línea su hora para licencias de conducir: sin filas, sin esperas.', icono: 'calendario', boton: 'Reservar hora', url: '/reservadehora/', boton2: 'Horario de buses', url2: '/transportepublico/' }),
      mod('oficinas', 'tarjetas', { ancla: 'Oficinas', titulo: 'Oficinas del departamento', columnas: '3', items: oficinas('dep-transito', { 'dep-transito-lic': 'licencia', 'dep-transito-pc': 'auto', 'dep-transito-senal': 'alerta' }) }),
      funciones('dep-transito', 'Funciones del departamento'),
    ] }),

  // ---------------------------------------------------------------- Obras
  sitio({ slug: 'obras', nombre: 'Obras', unidad: 'Dirección de Obras Municipales (DOM)', color: '#C9552B', oscuro: '#5B2210', patron: 'triangulos', icono: 'herramienta', categorias: ['obras'],
    titulo: 'Construimos la comuna', bajada: 'Permisos de edificación, urbanización, inspección de obras, alumbrado, caminos, cementerios, emergencias y maquinaria municipal.',
    descripcion: 'Dirección de Obras Municipales de Melipeuco: permisos de edificación, certificados, inspección, vialidad, alumbrado, cementerios, emergencias y solicitud de maquinaria.',
    telefono: '+56 2 3384 8825', email: 'obras@munimelipeuco.cl', dependencia: 'dep-dom', tituloTramites: 'Trámites y solicitudes',
    botones: [{ texto: 'Solicitar maquinaria', url: '/solicitud-de-maquinaria/' }, { texto: 'Oficinas', url: '#m-oficinas' }],
    modulos: [
      mod('presentacion', 'texto', { ancla: 'La DOM', titulo: 'La Dirección de Obras', html: '<p>La Dirección de Obras Municipales vela por el cumplimiento de la Ley General de Urbanismo y Construcciones, el Plan Regulador y las ordenanzas: aprueba subdivisiones y proyectos, otorga permisos de edificación, fiscaliza y recibe las obras, y se encarga de la vialidad urbana y rural, las construcciones municipales, el alumbrado público, las aceras y los pavimentos.</p>' }),
      mod('oficinas', 'tarjetas', { ancla: 'Oficinas', titulo: 'Oficinas de la DOM', columnas: '3', items: oficinas('dep-dom', { 'dep-edificacion': 'casa', 'dep-inspeccion-dom': 'buscar', 'dep-catastro': 'carpeta', 'dep-emergencia': 'alerta', 'dep-cementerios': 'escudo', 'dep-aseo': 'basura', 'dep-vehiculos': 'camion', 'dep-medioambiente': 'hoja', 'dep-transito': 'auto' }).map((t) => ({ ...t, url: /Medio Ambiente/.test(t.titulo) ? '/medioambiente/' : /Tránsito/.test(t.titulo) ? '/transito/' : '' })) }),
      mod('maquinaria', 'llamado', { titulo: 'Solicitud de maquinaria municipal', texto: 'Apoyo con retroexcavadora, motoniveladora, camión u otros recursos, sujeto a evaluación social y disponibilidad.', icono: 'camion', boton: 'Cómo solicitarla', url: '/solicitud-de-maquinaria/' }),
      funciones('dep-dom', 'Funciones de la Dirección'),
    ] }),

  // ---------------------------------------------------------------- Juzgado
  sitio({ slug: 'juzgado', nombre: 'Juzgado de Policía Local', unidad: 'Juzgado de Policía Local de Melipeuco', color: '#3E3E9A', oscuro: '#1D1D4F', patron: 'cuadricula', icono: 'balanza', categorias: [], galeria: false,
    titulo: 'Juzgado de Policía Local', bajada: 'Infracciones de tránsito, ordenanzas municipales, derechos del consumidor, alcoholes y otras materias de su competencia.',
    descripcion: 'Juzgado de Policía Local de Melipeuco: materias, escritos y solicitudes, horario y contacto.',
    telefono: '+56 2 3384 8819', direccion: 'Pedro Aguirre Cerda N° 14, tercer piso', horario: 'Lunes a viernes de 08:30 a 14:00 hrs.', responsable: 'Rodrigo Jaramillo Contreras', cargo: 'Juez titular',
    dependencia: 'dep-jpl', etiquetaTramites: 'juzgado', tituloTramites: 'Escritos y solicitudes',
    botones: [{ texto: 'Escritos y solicitudes', url: '#m-tramites' }],
    modulos: [
      mod('presentacion', 'texto', { ancla: 'El juzgado', titulo: 'Un tribunal cercano', html: '<p>El Juzgado de Policía Local de Melipeuco es un tribunal especial regido por la Ley N° 15.231. Depende administrativamente de la Municipalidad y está sujeto a la supervigilancia de la Corte de Apelaciones de Temuco.</p><ul><li><strong>Juez titular:</strong> Sr. Rodrigo Jaramillo Contreras</li><li><strong>Secretaria abogada titular:</strong> Sra. Natalia Cofré Vidal</li></ul>' }),
      mod('materias', 'tarjetas', { ancla: 'Materias', titulo: 'Qué materias conoce', columnas: '3', items: [
        { icono: 'auto', titulo: 'Tránsito', texto: 'Infracciones y accidentes de tránsito y transporte.' },
        { icono: 'documento', titulo: 'Ordenanzas municipales', texto: 'Infracciones a las ordenanzas y a las rentas municipales.' },
        { icono: 'billete', titulo: 'Consumidor', texto: 'Ley 19.496 sobre protección de los derechos de los consumidores.' },
        { icono: 'casa', titulo: 'Urbanismo y copropiedad', texto: 'Urbanismo y construcción, y Ley 19.537 de copropiedad inmobiliaria.' },
        { icono: 'alerta', titulo: 'Alcoholes', texto: 'Infracciones a la ley de alcoholes.' },
        { icono: 'balanza', titulo: 'Otras leyes', texto: 'Leyes 18.700, 19.303 y otras que la ley le encomiende.' },
      ] }),
      mod('preguntas', 'faq', { titulo: 'Preguntas frecuentes', items: [
        { pregunta: '¿Cómo presento descargos por una infracción?', respuesta: 'Presente por escrito su defensa en el Juzgado. Revise la ficha «Descargos por infracciones» en los escritos y solicitudes.' },
        { pregunta: '¿Puedo pedir que se reconsidere una multa?', respuesta: 'Sí, mediante una solicitud de reposición ante el Juzgado.' },
        { pregunta: '¿Cuál es el horario de atención?', respuesta: 'Lunes a viernes de 08:30 a 14:00 hrs., en el tercer piso del edificio municipal.' },
      ] }),
      funciones('dep-jpl', 'Competencia del Juzgado'),
    ] }),
];

fs.mkdirSync(DIR, { recursive: true });
for (const a of AREAS) {
  fs.writeFileSync(path.join(DIR, a.sitio.slug + '.json'), JSON.stringify(a, null, 2) + '\n');
  console.log(`${a.sitio.slug}: ${a.sitio.modulos.length} módulos, foto ${a.sitio.tema.imagen ? 'sí' : 'no'}`);
}
