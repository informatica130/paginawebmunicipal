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

// Dirección de cada unidad: las que tienen micrositio propio usan ése.
const PROPIOS = { 'dep-educacion': 'educacion', 'dep-salud': 'salud', 'dep-dideco': 'social', 'dep-del': 'udel', 'dep-deportes': 'deporte', 'dep-turismo': 'turismo', 'dep-cultura': 'cultura', 'dep-transito': 'transito', 'dep-dom': 'obras', 'dep-jpl': 'juzgado', 'dep-medioambiente': 'medioambiente', 'dep-alcaldia': 'alcaldia', 'dep-concejo': 'concejo-municipal' };
const SLUGS = { 'dep-oirs': 'oficina-oirs', 'dep-transparencia': 'oficina-de-transparencia', 'dep-partes': 'oficina-de-partes', 'dep-sec-cosoc': 'secretaria-cosoc', 'dep-cosoc': 'cosoc', 'dep-admin': 'administracion-municipal', 'dep-secmun': 'secretaria-municipal', 'dep-secplan': 'secplan', 'dep-daf': 'administracion-y-finanzas', 'dep-control': 'direccion-de-control', 'dep-dsi': 'servicios-incorporados', 'dep-informatica': 'transformacion-digital', 'dep-programas': 'programas-sociales', 'dep-rentas': 'patentes-municipales', 'dep-emergencia': 'emergencias', 'dep-cta': 'comite-tecnico', 'dep-rrhh': 'recursos-humanos', 'dep-dideco-social': 'desarrollo-social', 'dep-dideco-comunitario': 'desarrollo-comunitario', 'dep-uamis': 'uamis', 'dep-mujer': 'oficina-de-la-mujer', 'dep-comunicaciones': 'comunicaciones', 'dep-fomento': 'fomento-productivo', 'dep-hidricos': 'recursos-hidricos', 'dep-inventario': 'inventarios-y-bodega', 'dep-auditoria': 'auditorias', 'dep-juridico': 'asesoria-juridica', 'dep-vehiculos': 'vehiculos-municipales', 'dep-coord-programas': 'coordinacion-de-programas', 'dep-rendiciones': 'rendiciones-de-programas' };
const slugify = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function slugDe(id) { const u = unidad(id); return !u ? '' : PROPIOS[id] || SLUGS[id] || slugify(u.name.replace(/^Oficina de (la |los )?/, '').replace(/^Departamento de /, '').replace(/^Dirección de /, '')); }

function sitio(a) {
  const img = a.imagen || fotos(a.categorias, 1)[0]?.src || '';
  const galeria = a.galeria === false ? [] : fotos(a.categorias, 6);
  const modulos = [...a.modulos];
  if (a.dependencia) modulos.push(mod('tramites', 'tramites', { ancla: 'Trámites', titulo: a.tituloTramites || 'Trámites y solicitudes', dependencia: a.dependencia, etiqueta: a.etiquetaTramites || '', cantidad: 12, vacio: a.vacioTramites ?? 'Para trámites de esta unidad, consulte en la Oficina de Partes o llame al teléfono de contacto.' }));
  if (a.relacionadas?.length) modulos.push(mod('relacionadas', 'enlaces', { titulo: 'Unidades relacionadas', items: a.relacionadas }));
  if (a.categorias.length) modulos.push(mod('noticias', 'noticias', { ancla: 'Noticias', titulo: a.tituloNoticias || `Noticias de ${a.nombre.toLowerCase()}`, categoria: a.categorias[0], palabras: a.palabras || '', cantidad: 6 }));
  if (galeria.length >= 3) modulos.push(mod('galeria', 'galeria', { titulo: 'En terreno', imagenes: galeria }));
  return {
    predeterminado: true,
    sitio: {
      id: a.id || a.slug, nombre: a.nombre, slug: a.slug, unidad: a.unidad, descripcion: a.descripcion, organigrama: a.organigrama || a.dependencia || '', alias: a.alias || [], publicado: true, actualizado: FECHA,
      tema: { color: a.color, oscuro: a.oscuro, acento: a.acento || '#E9A92B', patron: a.patron, icono: a.icono, portada: img ? 'dividida' : 'degradado', imagen: img },
      portada: { antetitulo: a.antetitulo || a.unidad, titulo: a.titulo, bajada: a.bajada, botones: a.botones || [], cifras: a.cifras || [] },
      contacto: { responsable: a.responsable || '', cargo: a.cargo || '', telefono: a.telefono || '', email: a.email || '', direccion: a.direccion || DIRECCION, horario: a.horario || HORARIO, redes: a.redes || [{ texto: 'Consultas, reclamos y sugerencias (OIRS)', url: '/oirs/' }] },
      modulos,
    },
  };
}

const AREAS = [
  // ---------------------------------------------------------------- Educación
  sitio({ slug: 'educacion', organigrama: 'dep-educacion', alias: [], nombre: 'Educación', unidad: 'Departamento de Educación Municipal (DAEM)', color: '#3E3E9A', oscuro: '#1D1D4F', patron: 'puntos', icono: 'escuela', categorias: ['educacion', 'becas-y-concursos'],
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
  sitio({ slug: 'salud', organigrama: 'dep-salud', alias: [], nombre: 'Salud', unidad: 'Departamento de Salud Municipal · CESFAM Melipeuco', color: '#16A0A8', oscuro: '#0A5155', patron: 'cruces', icono: 'salud', categorias: ['salud'],
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
  sitio({ slug: 'social', organigrama: 'dep-dideco', alias: ['dideco'], nombre: 'Desarrollo Social', unidad: 'Dirección de Desarrollo Comunitario (DIDECO)', color: '#D23B4A', oscuro: '#6E1520', patron: 'ondas', icono: 'corazon', categorias: ['social', 'dideco', 'vivienda', 'uamis'],
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
  sitio({ slug: 'udel', organigrama: 'dep-del', alias: ['desarrollolocal'], nombre: 'Desarrollo Local', unidad: 'Departamento de Desarrollo Económico Local (UDEL)', color: '#8A5A3B', oscuro: '#432816', acento: '#E9A92B', patron: 'montes', icono: 'trabajo', categorias: ['desarrollo-local', 'udel', 'turismo-udel'],
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
  sitio({ slug: 'deporte', organigrama: 'dep-deportes', alias: ['deporte-2'], nombre: 'Deporte', unidad: 'Oficina de Deportes y Recreación', color: '#E2683C', oscuro: '#7A2E12', patron: 'diagonales', icono: 'deporte', categorias: ['deporte', 'poster-deportes'],
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
  sitio({ slug: 'turismo', organigrama: 'dep-turismo', alias: [], nombre: 'Turismo', unidad: 'Oficina de Turismo', color: '#1F6FA8', oscuro: '#0F3A5A', patron: 'montes', icono: 'montana', categorias: ['turismo', 'turismo-udel'],
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
  sitio({ slug: 'cultura', organigrama: 'dep-cultura', alias: [], nombre: 'Cultura', unidad: 'Oficina de Cultura', color: '#7A3E91', oscuro: '#3A1748', patron: 'hexagonos', icono: 'cultura', categorias: ['cultural', 'cultura', 'fiesta-del-baqueano'],
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
  sitio({ slug: 'transito', organigrama: 'dep-transito', alias: [], nombre: 'Tránsito', unidad: 'Departamento de Tránsito y Transporte Público', color: '#D4901A', oscuro: '#5E3F05', acento: '#1F6FA8', patron: 'cuadricula', icono: 'auto', categorias: ['departamento-de-transito-y-transporte-publico', 'transito'],
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
  sitio({ slug: 'obras', organigrama: 'dep-dom', alias: ['dom'], nombre: 'Obras', unidad: 'Dirección de Obras Municipales (DOM)', color: '#C9552B', oscuro: '#5B2210', patron: 'triangulos', icono: 'herramienta', categorias: ['obras'],
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
  sitio({ slug: 'juzgado', organigrama: 'dep-jpl', alias: ['juzgado-2'], nombre: 'Juzgado de Policía Local', unidad: 'Juzgado de Policía Local de Melipeuco', color: '#3E3E9A', oscuro: '#1D1D4F', patron: 'cuadricula', icono: 'balanza', categorias: [], galeria: false,
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


// ================================================================ Gobierno comunal y programas
const contenido = (id, fuente, o = {}) => mod(id, 'contenido', { fuente, filtro: '', cantidad: 6, ...o });
const EXTRA = [
  sitio({ slug: 'alcaldia', organigrama: 'dep-alcaldia', alias: ['alcaldia-y-concejo-municipal'], nombre: 'Alcaldía', unidad: 'Alcaldía de Melipeuco', color: '#B07A12', oscuro: '#4A3304', acento: '#1F6FA8', patron: 'curvas', icono: 'estrella', categorias: ['alcaldia'],
    titulo: 'Alcaldía de Melipeuco', antetitulo: 'Alcalde Alejandro Cuminao Barros', bajada: 'Dirección y administración superior de la Municipalidad: audiencias, gabinete, comunicaciones y la cuenta pública del Alcalde.',
    descripcion: 'Alcaldía de Melipeuco: el Alcalde, cómo solicitar una audiencia, gabinete, comunicaciones, cuenta pública y noticias.',
    responsable: 'Alejandro Cuminao Barros', cargo: 'Alcalde de Melipeuco', telefono: '+56 2 3384 8821', email: 'alcaldia@munimelipeuco.cl', direccion: 'Pedro Aguirre Cerda N° 14, primer piso', horario: 'Audiencias: lunes, miércoles y viernes de 08:30 a 13:00 hrs., por orden de llegada.',
    redes: [{ texto: 'Solicitar audiencia (Ley del Lobby)', url: 'https://www.leylobby.gob.cl/instituciones/MU172' }],
    botones: [{ texto: 'Solicitar audiencia', url: '#m-audiencias' }, { texto: 'Cuenta pública', url: '#m-cuenta' }],
    cifras: [{ valor: '2024 – 2028', etiqueta: 'período del Alcalde' }, { valor: 'Lun · Mié · Vie', etiqueta: 'audiencias de 08:30 a 13:00 hrs.' }],
    modulos: [
      contenido('alcalde', 'autoridades', { ancla: 'El Alcalde', titulo: 'El Alcalde', filtro: 'alcalde' }),
      mod('audiencias', 'texto', { ancla: 'Audiencias', titulo: '¿Cómo solicitar una audiencia?', html: '<p>Puede solicitar audiencia en línea a través del registro de la <strong>Ley del Lobby</strong> o acercarse presencialmente a la Municipalidad, en Pedro Aguirre Cerda N° 14, primer piso. La atención es por orden de llegada los <strong>lunes, miércoles y viernes de 08:30 a 13:00 hrs.</strong></p>', botones: [{ texto: 'Solicitar audiencia (Ley del Lobby)', url: 'https://www.leylobby.gob.cl/instituciones/MU172' }, { texto: 'Concejo Municipal', url: '/concejo-municipal/' }] }),
      mod('facultades', 'texto', { ancla: 'Facultades', titulo: '¿Qué hace el Alcalde?', html: '<p>El Alcalde es la máxima autoridad de la Municipalidad: dirige la administración municipal y es su representante legal. Es elegido por votación popular por un período de cuatro años. Entre sus atribuciones (Ley 18.695, Orgánica Constitucional de Municipalidades):</p>' + lista(['Representar judicial y extrajudicialmente a la Municipalidad.', 'Proponer al Concejo la organización interna de la Municipalidad.', 'Nombrar y remover a los funcionarios de su dependencia.', 'Velar por la probidad administrativa y aplicar medidas disciplinarias.', 'Administrar los recursos financieros de la Municipalidad.', 'Administrar los bienes municipales y nacionales de uso público de la comuna.']) }),
      mod('oficinas', 'tarjetas', { ancla: 'Equipo', titulo: 'Oficinas de la Alcaldía', columnas: '2', items: oficinas('dep-alcaldia', { 'dep-gabinete': 'estrella', 'dep-comunicaciones': 'megafono' }).map((t) => ({ ...t, url: '/' + slugDe(hijas('dep-alcaldia').find((u) => t.texto === u.funciones[0])?.id) + '/' })) }),
      contenido('cuenta', 'videos', { ancla: 'Cuenta pública', titulo: 'Cuenta pública y mensajes del Alcalde', filtro: 'cuenta-publica', cantidad: 4 }),
    ] }),

  sitio({ slug: 'concejo-municipal', organigrama: 'dep-concejo', alias: ['concejosmunicipales'], nombre: 'Concejo Municipal', unidad: 'Concejo Municipal de Melipeuco', color: '#5B3A8C', oscuro: '#26163F', acento: '#E9A92B', patron: 'hexagonos', icono: 'balanza', categorias: [], galeria: false,
    titulo: 'Concejo Municipal', antetitulo: 'Órgano normativo, resolutivo y fiscalizador', bajada: 'Concejalas y concejales, sesiones ordinarias y extraordinarias, actas y transmisiones en vivo del Concejo Municipal de Melipeuco.',
    descripcion: 'Concejo Municipal de Melipeuco: integrantes, sesiones, actas, transmisiones en vivo y COSOC.',
    email: 'secretariamunicipal@munimelipeuco.cl', responsable: 'Secretaría Municipal', cargo: 'Ministra de fe del Concejo',
    redes: [{ texto: 'Transmisiones en YouTube', url: 'https://www.youtube.com/channel/UCxQ299eYJmshjxa8a00FJRQ' }, { texto: 'Todas las sesiones', url: '/concejo/sesiones/' }],
    botones: [{ texto: 'Ver las sesiones', url: '#m-sesiones' }, { texto: 'Transmisiones en vivo', url: 'https://www.youtube.com/channel/UCxQ299eYJmshjxa8a00FJRQ' }],
    modulos: [
      mod('que-es', 'texto', { ancla: 'El Concejo', titulo: '¿Qué es el Concejo Municipal?', html: '<p>El Concejo Municipal es el órgano colegiado de carácter normativo, resolutivo y fiscalizador, encargado de hacer efectiva la participación de la comunidad local y de ejercer las atribuciones que le señala la Ley 18.695. Las sesiones son públicas y se transmiten en vivo por el canal de YouTube de la Municipalidad.</p>' + lista(['Elegir al alcalde en caso de vacancia.', 'Pronunciarse sobre las materias que enumera el artículo 65 de la ley (presupuesto, plan de desarrollo comunal, ordenanzas, entre otras).', 'Fiscalizar el cumplimiento de los planes y programas de inversión municipales y la ejecución del presupuesto.']) }),
      contenido('integrantes', 'autoridades', { ancla: 'Integrantes', titulo: 'Integrantes del Concejo', intro: 'El Concejo lo preside el Alcalde. Las concejalas y concejales se agregan en el panel, en «Alcaldía y Concejo», y aparecen aquí automáticamente.', filtro: 'alcalde concejal' }),
      contenido('sesiones', 'sesiones', { ancla: 'Sesiones', titulo: 'Sesiones, tablas y actas', cantidad: 12 }),
      contenido('videos', 'videos', { ancla: 'Transmisiones', titulo: 'Sesiones transmitidas', filtro: 'concejo-municipal', cantidad: 4 }),
      mod('cosoc', 'llamado', { titulo: 'Consejo Comunal de Organizaciones de la Sociedad Civil', texto: 'El COSOC asegura la participación de las organizaciones de la comuna en el progreso económico, social y cultural de Melipeuco.', icono: 'personas', boton: 'Conocer el COSOC', url: '/cosoc/', boton2: 'Todas las sesiones', url2: '/concejo/sesiones/' }),
    ] }),

  sitio({ slug: 'boxveterinario', id: 'box-veterinario', nombre: 'Box Veterinario', unidad: 'Box Veterinario Municipal · Tenencia responsable', color: '#2F7D4A', oscuro: '#123524', acento: '#E9A92B', patron: 'puntos', icono: 'perro', categorias: ['box-veterinario'],
    imagen: '/wp-content/uploads/2025/09/556059812_1238507841647953_245624008465520436_n.jpg', titulo: 'Box Veterinario Municipal', antetitulo: 'Tenencia responsable de mascotas',
    bajada: 'Atención básica y preventiva para las mascotas de la comunidad —consulta, vacunación y esterilización—, priorizando a familias en situación de vulnerabilidad.',
    descripcion: 'Box Veterinario Municipal de Melipeuco: atención clínica, vacunación antirrábica, esterilización, requisitos, horario y contacto.',
    telefono: '+56 2 3384 8815', horario: 'Lunes a viernes de 09:00 a 17:00 hrs.', direccion: 'Box Veterinario Municipal, Melipeuco', dependencia: 'dep-medioambiente', vacioTramites: '', tituloTramites: 'Fichas de atención',
    botones: [{ texto: 'Requisitos para la atención', url: '#m-requisitos' }, { texto: 'Llamar', url: 'tel:+56233848815' }],
    cifras: [{ valor: 'L a V', etiqueta: 'de 09:00 a 17:00 hrs.' }, { valor: 'Gratuitas', etiqueta: 'campañas periódicas de vacunación y esterilización' }],
    modulos: [
      mod('servicios', 'tarjetas', { ancla: 'Servicios', titulo: 'Nuestros servicios', intro: 'Atención básica y preventiva subsidiada por la Municipalidad de Melipeuco.', columnas: '3', items: [
        { icono: 'salud', etiqueta: 'Clínica', titulo: 'Atención clínica', texto: 'Exámenes físicos completos, diagnóstico y tratamiento básico, asesoría en nutrición y cuidados, y chequeos preventivos.' },
        { icono: 'check', etiqueta: 'Prevención', titulo: 'Vacunación', texto: 'Vacunación antirrábica obligatoria y esquema básico según el calendario oficial, con campañas periódicas gratuitas.' },
        { icono: 'corazon', etiqueta: 'Control', titulo: 'Esterilización', texto: 'Control poblacional y prevención de enfermedades, con seguimiento postquirúrgico y campañas periódicas.' },
      ] }),
      mod('requisitos', 'pasos', { ancla: 'Requisitos', titulo: 'Requisitos para la atención', intro: 'Para acceder a los servicios veterinarios subsidiados por la Municipalidad, presente:', items: [
        { icono: 'licencia', titulo: 'Cédula de identidad', texto: 'Vigente, de la persona dueña de la mascota.' },
        { icono: 'casa', titulo: 'Comprobante de residencia', texto: 'Que acredite domicilio en la comuna de Melipeuco.' },
        { icono: 'documento', titulo: 'Registro Social de Hogares', texto: 'Actualizado, para acceder a los beneficios.' },
      ] }),
      mod('operativos', 'llamado', { titulo: 'Operativos en los sectores', texto: 'El programa de Tenencia Responsable de Mascotas organiza operativos gratuitos de vacunación en distintos sectores de la comuna. Siga las noticias para conocer las próximas fechas.', icono: 'perro', boton: 'Ver noticias', url: '#m-noticias', boton2: 'Medio Ambiente', url2: '/medioambiente/' }),
      mod('preguntas', 'faq', { titulo: 'Preguntas frecuentes', items: [
        { pregunta: '¿Quiénes pueden atenderse?', respuesta: 'Las mascotas de familias con domicilio en Melipeuco, priorizando a familias en situación de vulnerabilidad según el Registro Social de Hogares.' },
        { pregunta: '¿La vacuna antirrábica es obligatoria?', respuesta: 'Sí. Se aplica según el calendario oficial y en campañas periódicas gratuitas.' },
        { pregunta: '¿Dónde me informo de las campañas de esterilización?', respuesta: 'En las noticias de esta página y en las redes sociales de la Municipalidad.' },
      ] }),
    ] }),

  sitio({ slug: 'comite-de-bienestar', id: 'comite-bienestar', nombre: 'Comité de Bienestar', unidad: 'Comité de Bienestar del personal municipal', color: '#1F6FA8', oscuro: '#0F3A5A', patron: 'cruces', icono: 'corazon', categorias: [], galeria: false,
    titulo: 'Comité de Bienestar', antetitulo: 'Para funcionarias y funcionarios municipales', bajada: 'Programa de beneficios exclusivos para el personal municipal de Melipeuco: descuentos en establecimientos de la comuna que conectan a nuestros equipos con el comercio local.',
    descripcion: 'Comité de Bienestar de la Municipalidad de Melipeuco: beneficios y descuentos para el personal municipal en el comercio local.',
    telefono: '+56 2 3384 8813', email: 'contacto@munimelipeuco.cl', redes: [{ texto: 'Acceso de socias y socios', url: '/comitebienestar/' }],
    botones: [{ texto: 'Acceso para socios', url: '/comitebienestar/' }, { texto: 'Cómo usar los beneficios', url: '#m-pasos' }],
    modulos: [
      mod('beneficios', 'tarjetas', { ancla: 'Beneficios', titulo: 'Beneficios en el comercio local', intro: 'Descuentos especiales en establecimientos de confianza de Melipeuco.', columnas: '3', items: [
        { icono: 'estrella', titulo: 'Restaurantes', texto: 'Descuentos en locales de comida de la comuna.' },
        { icono: 'casa', titulo: 'Supermercados', texto: 'Beneficios en compras del hogar.' },
        { icono: 'salud', titulo: 'Salud', texto: 'Descuentos en servicios de salud y bienestar.' },
      ] }),
      mod('pasos', 'pasos', { ancla: 'Cómo usar', titulo: '¿Cómo utilizar los beneficios?', items: [
        { icono: 'buscar', titulo: 'Encuentre un beneficio', texto: 'Revise la lista de establecimientos en el acceso para socios y elija el beneficio.' },
        { icono: 'ubicacion', titulo: 'Visite el establecimiento', texto: 'Muestre su credencial digital (o una captura) al personal del local.' },
        { icono: 'check', titulo: 'Disfrute su descuento', texto: 'El descuento se aplica de inmediato en su compra o servicio.' },
      ] }),
      mod('acceso', 'llamado', { titulo: 'Acceso exclusivo para socias y socios', texto: 'La credencial es personal e intransferible y está disponible sólo para el personal municipal activo.', icono: 'llave', boton: 'Ingresar', url: '/comitebienestar/' }),
    ] }),

  sitio({ slug: 'oficina-de-la-ninez', id: 'oln', nombre: 'Oficina Local de la Niñez', unidad: 'Oficina Local de la Niñez (OLN)', color: '#E2683C', oscuro: '#7A2E12', acento: '#16A0A8', patron: 'ondas', icono: 'personas', categorias: ['oln'], alias: ['oln'],
    titulo: 'Niñas, niños y adolescentes primero', antetitulo: 'Oficina Local de la Niñez (OLN)', bajada: 'Promoción y protección de los derechos de niñas, niños y adolescentes de Melipeuco, en el marco de la Ley N° 21.430 de garantías de la niñez.',
    descripcion: 'Oficina Local de la Niñez de Melipeuco: protección y promoción de derechos de niñas, niños y adolescentes (Ley 21.430), gestión de casos y actividades.',
    telefono: '+56 2 3384 8817', redes: [{ texto: 'Consultas y reclamos (OIRS)', url: '/oirs/' }],
    botones: [{ texto: 'Llamar a la OLN', url: 'tel:+56233848817' }, { texto: 'Qué hacemos', url: '#m-que-hacemos' }],
    modulos: [
      mod('que-hacemos', 'texto', { ancla: 'Qué hacemos', titulo: 'Una oficina para la niñez', html: '<p>La Oficina Local de la Niñez (OLN) acompaña de forma integral a niñas, niños y adolescentes y a sus familias, en el marco de la <strong>Ley N° 21.430</strong> sobre garantías y protección integral de los derechos de la niñez y adolescencia. Su equipo, con gestoras y gestores de casos y territoriales, articula la red local —escuelas, salud, programas sociales— para responder a tiempo.</p>', destacado: 'Elige el buen trato: respeto, empatía y sana convivencia en cada familia y cada escuela.' }),
      mod('lineas', 'tarjetas', { ancla: 'Líneas de trabajo', titulo: 'Líneas de trabajo', columnas: '3', items: [
        { icono: 'corazon', titulo: 'Protección de derechos', texto: 'Gestión de casos y atención integral de niñas, niños y adolescentes.' },
        { icono: 'escuela', titulo: 'Trabajo con escuelas', texto: 'Ferias informativas y espacios seguros junto a los establecimientos de la comuna.' },
        { icono: 'estrella', titulo: 'Promoción del buen trato', texto: 'Actividades comunitarias como el Festival «Elige el Buen Trato».' },
      ] }),
      mod('ayuda', 'llamado', { titulo: '¿Un niño, niña o adolescente necesita ayuda?', texto: 'Comuníquese con la Oficina Local de la Niñez. Ante una emergencia, llame a Carabineros (133).', icono: 'telefono', boton: 'Llamar a la OLN', url: 'tel:+56233848817', boton2: 'Llamar al 133', url2: 'tel:133' }),
    ] }),

  sitio({ slug: 'omil', id: 'omil', nombre: 'OMIL', unidad: 'Oficina Municipal de Información Laboral (OMIL)', color: '#0E7C86', oscuro: '#0A2A33', patron: 'cuadricula', icono: 'trabajo', categorias: ['omil'], galeria: false,
    titulo: 'Encuentre trabajo en Melipeuco', antetitulo: 'Oficina Municipal de Información Laboral', bajada: 'Orientación laboral, inscripción en la Bolsa Nacional de Empleo y conexión con ofertas de trabajo y capacitación para vecinas y vecinos de la comuna.',
    descripcion: 'OMIL Melipeuco: intermediación laboral, Bolsa Nacional de Empleo, ofertas de trabajo y capacitación.', telefono: '+56 2 3384 8818', email: 'udel@munimelipeuco.cl',
    botones: [{ texto: 'Bolsa Nacional de Empleo', url: 'https://www.bne.cl/' }],
    modulos: [
      mod('servicios', 'tarjetas', { ancla: 'Servicios', titulo: 'Cómo le ayudamos', columnas: '3', items: [
        { icono: 'usuario', titulo: 'Orientación laboral', texto: 'Le ayudamos a preparar su currículum y a buscar empleo.' },
        { icono: 'trabajo', titulo: 'Ofertas de trabajo', texto: 'Inscripción en la Bolsa Nacional de Empleo y difusión de ofertas.', url: 'https://www.bne.cl/' },
        { icono: 'escuela', titulo: 'Capacitación', texto: 'Información sobre cursos y programas de capacitación.' },
      ] }),
      mod('jovenes', 'texto', { titulo: 'Cerca de las y los jóvenes', html: '<p>La OMIL también sale del municipio para acercar el mundo laboral a adolescentes y jóvenes, por ejemplo en las ferias informativas del Liceo Los Andes junto a la Oficina Local de la Niñez.</p>' }),
    ], relacionadas: [{ icono: 'trabajo', texto: 'Desarrollo Local (UDEL)', descripcion: 'Fomento productivo y emprendimiento', url: '/udel/' }] }),

  sitio({ slug: 'pdti', id: 'pdti', nombre: 'PDTI', unidad: 'Programa de Desarrollo Territorial Indígena (PDTI)', color: '#6B4E2E', oscuro: '#33230F', acento: '#E9A92B', patron: 'araucarias', icono: 'hoja', categorias: ['pdti', 'desarrollo-local'],
    titulo: 'Desarrollo Territorial Indígena', antetitulo: 'PDTI Municipal · Convenio INDAP', bajada: 'Asesoría técnica, capacitación e incentivos para familias mapuche pehuenche de la comuna, con rescate de saberes y recursos del territorio.',
    descripcion: 'PDTI Municipal de Melipeuco: Programa de Desarrollo Territorial Indígena en convenio con INDAP, talleres, asesoría técnica y emprendimiento.', telefono: '+56 2 3384 8818', email: 'udel@munimelipeuco.cl',
    botones: [{ texto: 'INDAP', url: 'https://www.indap.gob.cl/' }],
    modulos: [
      mod('programa', 'texto', { ancla: 'El programa', titulo: 'El programa', html: '<p>El PDTI Municipal, financiado a través del Convenio INDAP, acompaña a familias y comunidades indígenas de Melipeuco con asesoría técnica, capacitaciones e incentivos para fortalecer sus sistemas productivos y emprendimientos, poniendo en valor la identidad, la cultura y la riqueza natural del territorio.</p>' }),
      mod('lineas', 'tarjetas', { ancla: 'Talleres', titulo: 'Talleres y apoyos', columnas: '3', items: [
        { icono: 'arbol', titulo: 'Bosque nativo', texto: 'Talleres como «Rescatando los aromas del bosque»: inciensos, aceites esenciales e hidrolatos.' },
        { icono: 'agua', titulo: 'Agua y huerta', texto: 'Cosecha de aguas lluvias y riego por goteo para la huerta.' },
        { icono: 'mano', titulo: 'Saberes y oficios', texto: 'Cestería, artesanía y conservación de alimentos.' },
      ] }),
    ], relacionadas: [{ icono: 'trabajo', texto: 'Desarrollo Local (UDEL)', descripcion: 'Programas de fomento productivo', url: '/udel/' }] }),

  sitio({ slug: 'programa-vinculos', id: 'vinculos', nombre: 'Programa Vínculos', unidad: 'Programa Vínculos · Personas mayores', color: '#D23B4A', oscuro: '#6E1520', patron: 'ondas', icono: 'personas', categorias: ['programa-vinculos'], galeria: false,
    titulo: 'Acompañamiento a personas mayores', antetitulo: 'Programa Vínculos', bajada: 'Atención personalizada y cercana durante dos años para que las personas mayores accedan a servicios, prestaciones y redes de apoyo, con una vejez activa y digna.',
    descripcion: 'Programa Vínculos en Melipeuco: acompañamiento a personas mayores durante dos años.', telefono: '+56 2 3384 8800',
    cifras: [{ valor: '97', etiqueta: 'personas mayores acompañadas (2025)' }, { valor: '2 años', etiqueta: 'de acompañamiento personalizado' }],
    modulos: [
      mod('programa', 'texto', { ancla: 'El programa', titulo: 'El programa', html: '<p>El Programa Vínculos entrega acompañamiento personalizado a personas mayores, promoviendo la confianza, el respeto, la unidad y la ayuda mutua. Fortalece su autonomía y les garantiza acceso a servicios, prestaciones sociales y redes de apoyo locales e institucionales.</p><p>En 2025 se sumaron 57 nuevas personas mayores a las 40 que ya participaban, con un total de 97 en la comuna.</p>' }),
    ], relacionadas: [{ icono: 'personas', texto: 'Adulto Mayor e Inclusión (UAMIS)', descripcion: 'Programas para personas mayores', url: '/uamis/' }, { icono: 'corazon', texto: 'Desarrollo Social (DIDECO)', url: '/social/' }] }),

  sitio({ slug: 'seguridad-alimentaria', id: 'seguridad-alimentaria', nombre: 'Seguridad Alimentaria', unidad: 'Programa de Apoyo a la Seguridad Alimentaria', color: '#2F7D4A', oscuro: '#123524', patron: 'hojas', icono: 'hoja', categorias: ['programa-de-apoyo-a-la-seguridad-alimentaria'], galeria: false,
    titulo: 'Producir para el autoconsumo', antetitulo: 'Programa de Apoyo a la Seguridad Alimentaria', bajada: 'En convenio con el Ministerio de Desarrollo Social y Familia y el apoyo técnico del FOSIS, el programa fortalece la autonomía y la seguridad alimentaria de las familias.',
    descripcion: 'Programa de Apoyo a la Seguridad Alimentaria en Melipeuco: invernaderos, gallineros y sistemas de agua para el autoconsumo familiar.', telefono: '+56 2 3384 8811',
    cifras: [{ valor: '13 familias', etiqueta: 'acompañadas durante nueve meses' }, { valor: '$19,3 millones', etiqueta: 'de inversión ministerial y municipal' }],
    modulos: [
      mod('programa', 'texto', { ancla: 'El programa', titulo: 'Cómo funciona', html: '<p>Durante nueve meses, el programa acompañó a 13 familias de la comuna con un proceso de apoyo productivo y social, impulsando proyectos orientados al autoconsumo: <strong>invernaderos, gallineros, cierres perimetrales y sistemas de acumulación y conducción de agua</strong>.</p><p>La ejecución contempló una inversión ministerial de $13.250.000 y un aporte municipal de $6.041.600.</p>' }),
    ], relacionadas: [{ icono: 'corazon', texto: 'Programas Sociales', url: '/' + 'programas-sociales' + '/' }, { icono: 'corazon', texto: 'Desarrollo Social (DIDECO)', url: '/social/' }] }),

  sitio({ slug: 'red-de-cuidados', id: 'red-cuidados', nombre: 'Red Local de Apoyos y Cuidados', unidad: 'Programa Red Local de Apoyos y Cuidados', color: '#16A0A8', oscuro: '#0A5155', patron: 'cruces', icono: 'mano', categorias: [], galeria: false,
    titulo: 'Cuidar a quien cuida', antetitulo: 'Red Local de Apoyos y Cuidados', bajada: 'Atención articulada para personas en situación de dependencia funcional y sus cuidadoras y cuidadores: salud, rehabilitación, apoyo social y acompañamiento comunitario.',
    descripcion: 'Red Local de Apoyos y Cuidados de Melipeuco: apoyo a personas con dependencia y a sus cuidadores.', telefono: '+56 2 3384 8820',
    modulos: [
      mod('programa', 'texto', { ancla: 'El programa', titulo: 'El programa', html: '<p>La Red Local de Apoyos y Cuidados fortalece la atención de las personas en situación de dependencia funcional y de quienes las cuidan, garantizando acceso oportuno y articulado a prestaciones de salud, rehabilitación, apoyo social y acompañamiento comunitario. El Centro de Cuidados atiende en el teléfono +56 2 3384 8820.</p>' }),
    ], relacionadas: [{ icono: 'personas', texto: 'Adulto Mayor e Inclusión (UAMIS)', url: '/uamis/' }, { icono: 'salud', texto: 'Salud', url: '/salud/' }] }),
];

// ================================================================ Todas las demás unidades del organigrama
// Cada una con sus funciones, sus oficinas (enlazadas a sus propios micrositios), sus trámites,
// sus noticias y su contacto. Las que ya tienen un micrositio propio usan ése.
// Contactos (los mismos de la ficha de cada área en el sitio).
const CONTACTOS = {
  'dep-rentas': { telefono: '+56 2 3384 8827', email: 'rentasypatentes@munimelipeuco.cl', direccion: 'Oficina 23, segundo piso' }, 'dep-transito-pc': { email: 'permisosdecirculacion@munimelipeuco.cl' }, 'dep-daf': { telefono: '+56 2 3384 8823', email: 'daf@munimelipeuco.cl' },
  'dep-vivienda': { telefono: '+56 2 3384 8814', email: 'vivienda@munimelipeuco.cl' }, 'dep-emergencia': { telefono: '+56 2 3384 8812' }, 'dep-mujer': { telefono: '+56 2 3384 8816' }, 'dep-secplan': { email: 'secplan@munimelipeuco.cl' },
  'dep-secmun': { email: 'secretariamunicipal@munimelipeuco.cl' }, 'dep-partes': { telefono: '+56 2 3384 8813', email: 'oficinadepartes@munimelipeuco.cl', direccion: 'Mesón principal, primer piso' }, 'dep-oirs': { telefono: '+56 2 3384 8813', email: 'oficinadepartes@munimelipeuco.cl' },
  'dep-control': { email: 'controlinterno@munimelipeuco.cl' }, 'dep-contabilidad': { email: 'contabilidad@munimelipeuco.cl' }, 'dep-rrhh': { email: 'personal@munimelipeuco.cl' }, 'dep-juridico': { email: 'asesorjuridico@munimelipeuco.cl' },
  'dep-informatica': { email: 'informatica@munimelipeuco.cl' }, 'dep-uamis': { telefono: '+56 2 3384 8814', direccion: 'Pedro Aguirre Cerda N° 14, oficina 2, primer piso' }, 'dep-tesoreria': { direccion: 'Tesorería Municipal, oficina 15, piso 2' }, 'dep-aseo': { telefono: '+56 2 3384 8824' },
  'dep-dideco-social': { telefono: '+56 2 3384 8811', email: 'dideco@munimelipeuco.cl' }, 'dep-asistencia-social': { telefono: '+56 2 3384 8811', email: 'dideco@munimelipeuco.cl' }, 'dep-subsidios': { telefono: '+56 2 3384 8811' }, 'dep-organizaciones': { telefono: '+56 2 3384 8811' },
  'dep-juventud': { telefono: '+56 2 3384 8811' }, 'dep-programas': { telefono: '+56 2 3384 8811' }, 'dep-fomento': { telefono: '+56 2 3384 8818', email: 'udel@munimelipeuco.cl' }, 'dep-hidricos': { telefono: '+56 2 3384 8818', email: 'udel@munimelipeuco.cl' },
  'dep-edificacion': { telefono: '+56 2 3384 8825', email: 'obras@munimelipeuco.cl' }, 'dep-inspeccion-dom': { telefono: '+56 2 3384 8825', email: 'obras@munimelipeuco.cl' }, 'dep-catastro': { telefono: '+56 2 3384 8825', email: 'obras@munimelipeuco.cl' }, 'dep-cementerios': { telefono: '+56 2 3384 8825' },
  'dep-transito-lic': { telefono: '+56 2 3384 8829', email: 'transito@munimelipeuco.cl' }, 'dep-transito-senal': { telefono: '+56 2 3384 8829', email: 'transito@munimelipeuco.cl' }, 'dep-alcaldia': {}, 'dep-gabinete': { telefono: '+56 2 3384 8821', email: 'alcaldia@munimelipeuco.cl' }, 'dep-comunicaciones': { telefono: '+56 2 3384 8821' },
};
const NOTICIAS = { 'dep-vivienda': ['vivienda'], 'dep-uamis': ['uamis'], 'dep-dideco-social': ['social'], 'dep-asistencia-social': ['social'], 'dep-programas': ['dideco'], 'dep-organizaciones': ['dideco'], 'dep-fomento': ['udel', 'desarrollo-local'], 'dep-aseo': ['medio-ambiente'], 'dep-emergencia': [], 'dep-gabinete': ['alcaldia'], 'dep-comunicaciones': ['alcaldia'], 'dep-informatica': [], 'dep-edificacion': ['obras'] };
// Teléfonos del directorio que corresponden a cada unidad.
const DIRECTORIO = { 'dep-emergencia': (x) => x.grupo === 'emergencia' || /Emergencia/.test(x.nombre), 'dep-uamis': (x) => /Eleam|Centro de cuidados/i.test(x.nombre), 'dep-rrhh': (x) => /Personal/i.test(x.nombre), 'dep-contabilidad': (x) => /Contabilidad/.test(x.nombre), 'dep-secplan': (x) => /Planificaci/.test(x.nombre), 'dep-partes': (x) => /Recepcion|Oficina de Partes/.test(x.nombre), 'dep-daf': (x) => /Finanzas/.test(x.nombre), 'dep-rentas': (x) => /Rentas/.test(x.nombre), 'dep-vivienda': (x) => /Vivienda/.test(x.nombre), 'dep-mujer': (x) => /Mujer/.test(x.nombre), 'dep-admin': (x) => /Administradora/.test(x.nombre), 'dep-juridico': (x) => /Jur[ií]dico/.test(x.nombre), 'dep-informatica': (x) => /Inform[aá]tica/.test(x.nombre), 'dep-secmun': (x) => /Secretar[ií]a Municipal/.test(x.nombre) };
// Color, patrón e ícono según la dirección a la que pertenece cada unidad.
const RAMAS = { 'dep-alcaldia': ['#B07A12', '#4A3304', 'curvas'], 'dep-concejo': ['#5B3A8C', '#26163F', 'hexagonos'], 'dep-cosoc': ['#5B3A8C', '#26163F', 'hexagonos'], 'dep-admin': ['#1F6FA8', '#0F3A5A', 'curvas'], 'dep-secmun': ['#3E3E9A', '#1D1D4F', 'puntos'], 'dep-dideco': ['#D23B4A', '#6E1520', 'ondas'], 'dep-del': ['#8A5A3B', '#432816', 'montes'], 'dep-dom': ['#C9552B', '#5B2210', 'triangulos'], 'dep-transito': ['#D4901A', '#5E3F05', 'cuadricula'], 'dep-daf': ['#0E7C86', '#0A2A33', 'cuadricula'], 'dep-control': ['#4A5A6A', '#1E2A35', 'diagonales'], 'dep-secplan': ['#16A0A8', '#0A5155', 'curvas'], 'dep-dsi': ['#2E6F9E', '#123552', 'cruces'], 'dep-jpl': ['#3E3E9A', '#1D1D4F', 'cuadricula'] };
const rama = (id) => { let u = unidad(id); while (u && !RAMAS[u.id]) u = unidad(u.parentId); return RAMAS[u?.id] || ['#1F6FA8', '#0F3A5A', 'curvas']; };
const ICONOS = { star: 'estrella', building: 'escudo', people: 'personas', scale: 'balanza', stamp: 'documento', inbox: 'correo', help: 'chat', eye: 'buscar', note: 'documento', heart: 'corazon', home: 'casa', cash: 'billete', user2: 'usuario', award: 'deporte', sparkles: 'estrella', chart: 'grafico', map: 'mapa', book: 'libro', layers: 'carpeta', tool: 'herramienta', archive: 'carpeta', alert: 'alerta', leaf: 'hoja', truck: 'camion', car: 'auto', id: 'licencia', doc: 'documento', list: 'documento', shield: 'escudo', search: 'buscar', cpu: 'wifi' };
const TIPO = { direccion: 'Dirección', departamento: 'Departamento', oficina: 'Oficina', concejo: 'Órgano colegiado', alcaldia: 'Alcaldía', juzgado: 'Juzgado', seccion: 'Sección', unidad: 'Unidad', programa: 'Programa' };
// Textos extra para unidades que atienden mucho público.
const EXTRAS = {
  'dep-emergencia': [mod('numeros', 'llamado', { titulo: 'Teléfonos de emergencia', texto: 'Urgencias CESFAM Melipeuco 45 255 7691 · Bomberos 132 · Carabineros 133 · SAMU 131. Oficina municipal de Emergencia: +56 2 3384 8812.', icono: 'alerta', boton: 'Llamar a Bomberos (132)', url: 'tel:132', boton2: 'Llamar a Carabineros (133)', url2: 'tel:133' })],
  'dep-informatica': [mod('ley', 'texto', { ancla: 'Transformación digital', titulo: 'Ley de Transformación Digital del Estado', html: '<p>La <strong>Ley N° 21.180</strong> establece un marco para modernizar el Estado incorporando tecnologías digitales en los procesos administrativos, para mejorar la eficiencia, la transparencia y la calidad de los servicios a la ciudadanía.</p>' + lista(['Modernización de los trámites municipales.', 'Digitalización de los procesos internos.', 'Más transparencia y acceso a la información.']), botones: [{ texto: 'Convenios de transformación digital', url: '/transformaciondigital/' }, { texto: 'Trámites en línea', url: '/tramites/' }] })],
  'dep-partes': [mod('ingreso', 'texto', { ancla: 'Ingreso de documentos', titulo: 'Ingreso de documentos y solicitudes', html: '<p>En la Oficina de Partes, en el mesón principal del primer piso, se ingresan las cartas, solicitudes y documentos dirigidos a la Municipalidad. También se reciben aquí las solicitudes varias y de maquinaria municipal.</p>', botones: [{ texto: 'Solicitudes varias', url: '/solicitudesvarias/' }, { texto: 'Solicitud de maquinaria', url: '/solicitud-de-maquinaria/' }] })],
  'dep-oirs': [mod('oirs', 'llamado', { titulo: 'Reclamos, consultas y sugerencias', texto: 'Ingrese su solicitud en línea y reciba un código de seguimiento.', icono: 'chat', boton: 'Ir a la OIRS', url: '/oirs/' })],
  'dep-transparencia': [mod('transparencia', 'enlaces', { ancla: 'Transparencia', titulo: 'Transparencia municipal', items: [{ icono: 'documento', texto: 'Transparencia Activa', descripcion: 'Información que la Ley 20.285 obliga a publicar', url: '/transparencia/activa/' }, { icono: 'carpeta', texto: 'Documentos de Transparencia', url: '/transparencia/documentos/' }, { icono: 'buscar', texto: 'Solicitar información', descripcion: 'Transparencia pasiva', url: '/transparencia/' }] })],
  'dep-rentas': [mod('pago', 'llamado', { titulo: 'Pague su patente en línea', texto: 'La patente se paga por semestre: enero y julio. Contribuyentes con morosidad deben acudir a Tesorería Municipal.', icono: 'billete', boton: 'Pagar en línea', url: 'https://www.sem2.gob.cl/tramites/patentes-municipales/70766500/buscar', boton2: 'Obtener una patente', url2: '/patentecomercial/' })],
  'dep-transito-pc': [mod('pago', 'llamado', { titulo: 'Pague su permiso de circulación', texto: 'Primera o segunda cuota, en línea en el sistema SEM.', icono: 'auto', boton: 'Pagar en línea', url: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion/70766500/buscar', boton2: 'Segunda cuota', url2: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion-2c/70766500/buscar' })],
  'dep-transito-lic': [mod('reserva', 'llamado', { titulo: 'Reserve su hora sin filas', texto: 'Agende en línea su hora para licencias de conducir.', icono: 'calendario', boton: 'Reservar hora', url: '/reservadehora/', boton2: 'Guía de la primera licencia', url2: '/licenciadeconducir/' })],
  'dep-secplan': [mod('pladeco', 'enlaces', { ancla: 'PLADECO', titulo: 'Planificación comunal', items: [{ icono: 'mapa', texto: 'PLADECO', descripcion: 'Plan de Desarrollo Comunal', url: '/pladeco/' }, { icono: 'grafico', texto: 'Organigrama', url: '/organigrama/' }] })],
  'dep-cosoc': [contenido('sesiones', 'sesiones', { titulo: 'Sesiones del Concejo', cantidad: 4 })],
  'dep-organizaciones': [mod('fondeve', 'llamado', { titulo: 'Fondo de Desarrollo Vecinal (FONDEVE)', texto: 'Fondos concursables para proyectos de juntas de vecinos y organizaciones comunitarias.', icono: 'personas', boton: 'FONDEVE 2026', url: '/fondeve2026/' })],
  'dep-uamis': [mod('ayudas', 'texto', { titulo: 'Ayudas técnicas SENADIS', html: '<p>La UAMIS orienta y apoya a las personas con discapacidad que postulan a las <strong>ayudas técnicas de SENADIS</strong>. Para postular se requiere estar inscrito en el Registro Nacional de Discapacidad y en el Registro Social de Hogares.</p>', botones: [{ texto: 'SENADIS', url: 'https://www.senadis.gob.cl/' }, { texto: 'Programa Vínculos', url: '/programa-vinculos/' }] })],
};

// Género gramatical del nombre de la unidad (el Departamento, la Oficina…).
const masc = (u) => /^(Departamento|Concejo|Consejo|Comité|Juzgado)/.test(u.name);
const GENERICOS = ORG.filter((u) => u.id !== 'dep-muni' && !PROPIOS[u.id]).map((u) => {
  const padre = unidad(u.parentId), [color, oscuro, patron] = rama(u.id), c = CONTACTOS[u.id] || {};
  const nombrePadre = padre && padre.id !== 'dep-muni' ? padre.name : '';
  const hijasU = hijas(u.id);
  const relacionadas = [
    ...(nombrePadre ? [{ icono: ICONOS[padre.icon] || 'escudo', texto: padre.name, descripcion: 'Unidad de la que depende', url: '/' + slugDe(padre.id) + '/' }] : []),
    ...hijas(u.parentId).filter((x) => x.id !== u.id).slice(0, 5).map((x) => ({ icono: ICONOS[x.icon] || 'escudo', texto: x.name, descripcion: TIPO[x.type] || '', url: '/' + slugDe(x.id) + '/' })),
    { icono: 'grafico', texto: 'Organigrama municipal', descripcion: 'Toda la estructura de la Municipalidad', url: '/organigrama/' },
  ];
  const dir = DIRECTORIO[u.id] ? directorio(DIRECTORIO[u.id]) : [];
  return sitio({
    slug: slugDe(u.id), id: slugDe(u.id), organigrama: u.id, nombre: u.short && u.short.length < u.name.length && u.short.length > 3 ? u.short : u.name, unidad: u.name, color, oscuro, patron, icono: ICONOS[u.icon] || 'escudo',
    categorias: NOTICIAS[u.id] || [], galeria: false, imagen: '',
    titulo: u.name, antetitulo: nombrePadre || 'Municipalidad de Melipeuco', bajada: (u.funciones || [])[0] || '',
    descripcion: `${u.name} de la Municipalidad de Melipeuco: funciones, oficinas, trámites y contacto.`,
    telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || DIRECCION,
    dependencia: u.id, vacioTramites: '', relacionadas,
    modulos: [
      ...(EXTRAS[u.id] || []),
      mod('funciones', 'texto', { ancla: 'Funciones', titulo: 'Qué hacemos', html: `<p>${masc(u) ? 'El' : 'La'} <strong>${u.name}</strong> es parte de la Municipalidad de Melipeuco${nombrePadre ? ` y depende ${masc(padre) ? 'del' : 'de la'} ${nombrePadre}` : ''}. Sus funciones son:</p>` + lista(u.funciones || []) + (u.norma ? `<p><small>Según el ${u.norma.replace('Reglamento N° 12/2025', 'Reglamento de Organización Interna N° 12/2025')}.</small></p>` : '') }),
      ...(hijasU.length ? [mod('oficinas', 'tarjetas', { ancla: 'Oficinas', titulo: 'Oficinas y unidades', columnas: hijasU.length > 3 ? '3' : String(Math.max(2, hijasU.length)), items: hijasU.map((x) => ({ icono: ICONOS[x.icon] || 'escudo', etiqueta: TIPO[x.type] || '', titulo: x.name, texto: (x.funciones || [])[0] || '', url: '/' + slugDe(x.id) + '/' })) })] : []),
      ...(dir.length ? [mod('telefonos', 'directorio', { ancla: 'Contacto', titulo: 'Teléfonos y correos', items: dir })] : []),
    ],
  });
});

// Los micrositios propios enlazan a las oficinas que los integran.
for (const a of [...AREAS, ...EXTRA]) {
  const dep = a.sitio.organigrama;
  for (const m of a.sitio.modulos) if (m.id === 'oficinas' && m.tipo === 'tarjetas') m.items = m.items.map((t) => { if (t.url) return t; const x = hijas(dep).find((u) => (u.funciones || [])[0] === t.texto); return x ? { ...t, url: '/' + slugDe(x.id) + '/' } : t; });
}
const TODOS = [...AREAS, ...EXTRA, ...GENERICOS];
const vistos = new Map();
for (const a of TODOS) { if (vistos.has(a.sitio.slug)) throw new Error('Dirección repetida: ' + a.sitio.slug); vistos.set(a.sitio.slug, a.sitio.nombre); }

fs.mkdirSync(DIR, { recursive: true });
for (const a of TODOS) {
  fs.writeFileSync(path.join(DIR, a.sitio.slug + '.json'), JSON.stringify(a, null, 2) + '\n');
  console.log(`${a.sitio.slug}: ${a.sitio.modulos.length} módulos, foto ${a.sitio.tema.imagen ? 'sí' : 'no'}`);
}
