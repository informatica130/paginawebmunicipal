// Carga inicial del sitio:
//  · cargarPaquete(): vuelca el contenido importado desde WordPress (contenido/semilla/wordpress.json.gz).
//  · sembrarBase(): crea la estructura mejorada que el sitio antiguo no tenía: ajustes, menús,
//    áreas municipales (desde el Reglamento de Organización Interna, el mismo de la Plataforma de
//    Trámites), fichas de trámites, accesos rápidos, banners, directorio telefónico, Concejo y
//    páginas de sección. Sólo crea lo que falta: nunca pisa lo que ya editó el municipio.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ORGANIGRAMA_MELIPEUCO } from '../src/organigrama-melipeuco.js';
import { slugify, recortar, textoPlano } from '../src/util.js';
import { ahora } from './db.js';
import { RAIZ } from './config.js';

export const AJUSTES_BASE = {
  nombre: 'Ilustre Municipalidad de Melipeuco',
  nombreCorto: 'Municipalidad de Melipeuco',
  lema: 'Para todas y todos',
  descripcion: 'Sitio web oficial de la Ilustre Municipalidad de Melipeuco, Región de La Araucanía: noticias, trámites en línea, transparencia, agenda comunal y servicios para vecinas y vecinos.',
  direccion: 'Pedro Aguirre Cerda N° 14, Melipeuco, Región de La Araucanía',
  telefono: '+56 2 3384 8813',
  whatsapp: '+56 9 2092 2023',
  email: 'oficinadepartes@munimelipeuco.cl',
  emailContacto: 'contacto@munimelipeuco.cl',
  horario: 'Lunes a viernes de 08:30 a 13:30 y de 14:30 a 17:30 hrs.',
  mapa: { lat: -38.8547316, lng: -71.6976807, enlace: 'https://www.google.com/maps/place/Municipalidad+de+Melipeuco/@-38.8547316,-71.6976807,17z' },
  redes: { facebook: 'https://www.facebook.com/munimelipeuco', x: 'https://twitter.com/m_melipeuco', youtube: 'https://www.youtube.com/channel/UCxQ299eYJmshjxa8a00FJRQ', instagram: 'https://www.instagram.com/municipalidad.melipeuco' },
  emergencias: [
    { nombre: 'Urgencias CESFAM Melipeuco', telefono: '+56452557691' },
    { nombre: 'Carabineros', telefono: '+56452466915' },
    { nombre: 'Bomberos', telefono: '+56938708549' },
    { nombre: 'Ambulancia SAMU', telefono: '131' },
  ],
  colores: { primario: '#0B4F7C', acento: '#F2A900', oscuro: '#062B45' },
  codigos: { transparencia: 'MU172', sem: '70766500' },
  turismo: { titulo: 'Melipeuco, Capital del Trekking', texto: 'Volcanes, lagunas, araucarias y senderos para toda la familia.', url: 'https://melipeucocapitaldeltrekking.cl/', imagen: '/wp-content/uploads/2025/05/capital-del-trekking-05-1024x307.png' },
  video: { titulo: 'Último video', url: 'https://www.youtube.com/watch?v=K6y_Gbza-Cw' },
  clima: { activo: true, lugar: 'Melipeuco' },
  portada: {
    secciones: [
      { id: 'avisos', activo: true },
      { id: 'banners', activo: true },
      { id: 'accesos', activo: true, titulo: 'Accesos rápidos' },
      { id: 'campanas', activo: true, titulo: 'Campañas municipales' },
      { id: 'tramites', activo: true, titulo: 'Trámites en línea', texto: 'Reserve horas, inicie solicitudes y siga sus trámites sin hacer filas.' },
      { id: 'noticias', activo: true, titulo: 'Últimas noticias', cantidad: 9 },
      { id: 'eventos', activo: true, titulo: 'Agenda comunal', cantidad: 4 },
      { id: 'areas', activo: true, titulo: 'Áreas municipales' },
      { id: 'turismo', activo: true },
      { id: 'encuesta', activo: true },
      { id: 'video', activo: true },
      { id: 'boletin', activo: true, titulo: 'Reciba las noticias en su correo' },
    ],
  },
  boletin: { activo: true },
  mantenimiento: { activo: false, mensaje: 'Estamos realizando mejoras. Vuelva en unos minutos.' },
  analitica: { codigo: '' },
  pie: { texto: '© {anio} Ilustre Municipalidad de Melipeuco. Todos los derechos reservados.' },
  oirs: { activo: true, plazoDias: 10, tipos: { consulta: 'Consulta', reclamo: 'Reclamo', sugerencia: 'Sugerencia', felicitacion: 'Felicitación', denuncia: 'Denuncia' } },
};

const L = (texto, url, extra = {}) => ({ texto, url, hijos: [], ...extra });

export const MENUS_BASE = {
  superior: { nombre: 'Barra de transparencia', items: [
    L('Ley del Lobby', 'https://www.leylobby.gob.cl/instituciones/MU172', { icono: 'personas', nueva: true }),
    L('Solicitud de información', 'https://www.portaltransparencia.cl/PortalPdT/ingreso-sai-v2?idOrg=608', { icono: 'mano', nueva: true }),
    L('Transparencia Activa', 'https://www.portaltransparencia.cl/PortalPdT/directorio-de-organismos-regulados/?org=MU172', { icono: 'documento', nueva: true }),
    L('Transparencia Pasiva', 'https://www.portaltransparencia.cl/PortalPdT/web/guest/directorio-de-organismos-regulados?p_p_id=pdtorganismos_WAR_pdtorganismosportlet&orgcode=dc0e9af73fe176a43258f68dcddab714', { icono: 'carpeta', nueva: true }),
    L('Declaraciones de patrimonio', 'https://www.declaracionjurada.cl/pubsistema/patrimonio.web.publico/pu/index.html?sid=399', { icono: 'balanza', nueva: true }),
  ] },
  principal: { nombre: 'Menú principal', items: [
    { ...L('Municipio', '/municipio/'), hijos: [
      L('Alcaldía', '/alcaldia-y-concejo-municipal/', { descripcion: 'Alcalde, audiencias y gabinete' }),
      L('Concejo Municipal', '/concejo-municipal/', { descripcion: 'Concejales, sesiones y transmisiones' }),
      L('Áreas municipales', '/areas/', { descripcion: 'Direcciones, departamentos y oficinas' }),
      L('Organigrama', '/organigrama/'),
      L('PLADECO', '/pladeco/', { descripcion: 'Plan de Desarrollo Comunal' }),
      L('Nuestra historia', '/historia/'),
      L('Logotipos y material', '/logotipos-y-material/'),
      L('Transformación digital', '/transformaciondigital/'),
    ] },
    { ...L('Trámites', '/tramites/'), hijos: [
      L('Todos los trámites', '/tramites/', { descripcion: 'Catálogo completo, en línea y presencial' }),
      L('Reservar hora en Tránsito', '/reservadehora/'),
      L('Licencias de conducir', '/tramites/?q=licencia'),
      L('Patentes comerciales', '/tramites/?q=patente'),
      L('Pagar permiso de circulación', 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion/70766500/buscar', { nueva: true }),
      L('Pagar patente municipal', 'https://www.sem2.gob.cl/tramites/patentes-municipales/70766500/buscar', { nueva: true }),
      L('Ver el estado de mi trámite', '/tramites/seguimiento/'),
      L('OIRS: reclamos y sugerencias', '/oirs/'),
    ] },
    { ...L('Servicios', '/areas/'), hijos: [
      L('Educación', '/educacion/'), L('Salud', '/salud/'), L('Desarrollo social', '/social/'), L('Desarrollo local (UDEL)', '/udel/'),
      L('Medio ambiente', '/medioambiente/'), L('Deporte', '/deporte/'), L('Turismo', '/turismo/'), L('Tránsito', '/transito/'),
      L('Juzgado de Policía Local', '/juzgado/'), L('Box veterinario', '/boxveterinario/'), L('Horarios de buses', '/transportepublico/'), L('Comité de bienestar', '/comitebienestar/'),
    ] },
    L('Noticias', '/noticias/'),
    L('Agenda', '/eventos/'),
    L('Transparencia', '/transparencia/'),
    L('Contacto', '/contacto/'),
  ] },
  pie_interes: { nombre: 'Pie: enlaces de interés', items: [
    L('Gobierno Regional de La Araucanía', 'https://www.gorearaucania.cl/', { nueva: true }),
    L('Presidencia de la República', 'https://www.gob.cl/', { nueva: true }),
    L('Servicio de Impuestos Internos', 'https://homer.sii.cl/', { nueva: true }),
    L('Ministerio de Educación', 'https://www.mineduc.cl/', { nueva: true }),
    L('ChileAtiende', 'https://www.chileatiende.gob.cl/', { nueva: true }),
    L('Melipeuco Capital del Trekking', 'https://melipeucocapitaldeltrekking.cl/', { nueva: true }),
  ] },
  pie_servicios: { nombre: 'Pie: servicios municipales', items: [
    L('Permiso de circulación', 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion/70766500/buscar', { nueva: true }),
    L('Segunda cuota permiso de circulación', 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion-2c/70766500/buscar', { nueva: true }),
    L('Transparencia Activa', 'https://www.portaltransparencia.cl/PortalPdT/directorio-de-organismos-regulados/?org=MU172', { nueva: true }),
    L('Ley del Lobby', 'https://www.leylobby.gob.cl/instituciones/MU172', { nueva: true }),
    L('Transparencia pasiva', 'https://www.portaltransparencia.cl/PortalPdT/web/guest/directorio-de-organismos-regulados?p_p_id=pdtorganismos_WAR_pdtorganismosportlet&orgcode=dc0e9af73fe176a43258f68dcddab714', { nueva: true }),
    L('Declaración de patrimonio e intereses', 'https://www.declaracionjurada.cl/dip/index.html', { nueva: true }),
  ] },
  pie_sitio: { nombre: 'Pie: el sitio', items: [
    L('Mapa del sitio', '/mapa-del-sitio/'), L('Accesibilidad', '/accesibilidad/'), L('Política de privacidad', '/politica-privacidad/'), L('Datos abiertos (API)', '/api/public/'),
  ] },
};

const ACCESOS = [
  { titulo: 'Agenda de contacto', enlace: '/contacto/', icono: 'telefono', color: '#e07f10' },
  { titulo: 'Segunda cuota permiso de circulación', enlace: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion-2c/70766500/buscar', icono: 'auto', color: '#b1002e', nuevaVentana: true },
  { titulo: 'Autoconsulta SSASUR', enlace: 'https://autoconsulta.ssasur.cl/auth/login', icono: 'salud', color: '#2f87b5', nuevaVentana: true },
  { titulo: 'Pagar permiso de circulación 2026', enlace: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion/70766500/buscar', icono: 'billete', color: '#13803b', nuevaVentana: true },
  { titulo: 'Horarios de transporte', enlace: '/transportepublico/', icono: 'bus', color: '#1f6fae' },
  { titulo: 'Reservar hora de licencia', enlace: '/reservadehora/', icono: 'licencia', color: '#6d3fc0' },
  { titulo: 'Pagar patente municipal', enlace: 'https://www.sem2.gob.cl/tramites/patentes-municipales/70766500/buscar', icono: 'casa', color: '#a1560b', nuevaVentana: true },
  { titulo: 'OIRS: reclamos y sugerencias', enlace: '/oirs/', icono: 'chat', color: '#0b6b6b' },
];

const BANNERS = [
  { titulo: 'Agenda tu hora en línea para tu licencia de conducir', imagen: '/wp-content/uploads/2026/08/1.png', enlace: '/reservadehora/', textoAlt: 'Agenda tu hora en línea para tu licencia de conducir: sin filas, sin esperas, 100 % seguro.' },
  { titulo: 'Paga tu patente comercial en línea', imagen: '/wp-content/uploads/2026/07/d9e64454-6546-4cce-abc4-edd3c71356d9.png', enlace: 'https://www.sem2.gob.cl/tramites/patentes-municipales/70766500/buscar', textoAlt: 'Municipalidad de Melipeuco: paga tu patente comercial en línea. Contribuyentes con morosidad deben dirigirse presencialmente a Tesorería Municipal, oficina 15, piso 2.' },
  { titulo: 'Paga tu permiso de circulación', imagen: '/wp-content/uploads/2026/02/IMG_9047.JPG-1-1-scaled.jpeg', enlace: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion/70766500/buscar', textoAlt: 'Paga tu permiso de circulación en línea.' },
];

// Fichas de trámites (catálogo mejorado). El detalle completo sigue en las páginas originales.
const T = 'dep-transito';
const comunTransito = { lugar: 'Departamento de Tránsito, Municipalidad de Melipeuco (Pedro Aguirre Cerda N° 14)', telefono: '233848829', email: 'transito@munimelipeuco.cl', horario: 'Lunes a viernes, de 08:30 a 13:30 hrs.', transitoTramite: 'tra-hora-licencia', modalidad: 'mixto', textoBoton: 'Reservar hora en línea' };
const avisoLicencias = 'Todos los requisitos y antecedentes deben presentarse impresos. No debe estar inscrito(a) en el Registro Nacional de Deudores de Pensiones de Alimentos (Ley 21.389). Personas con enfermedades o tratamientos deben presentar informe del médico tratante.';
const examenPractico = 'Para el examen práctico: permiso de circulación, seguro obligatorio, revisión técnica, padrón y elementos de seguridad del vehículo (rueda de repuesto, chaleco reflectante, extintor, gata, triángulo y llave de cruz).';

export const TRAMITES_BASE = [
  { titulo: 'Obtener licencia de conducir por primera vez (clases B, C, D, E y F)', slug: 'licencia-de-conducir-primera-vez', area: T, guia: '/licenciadeconducir/', resumen: 'Requisitos, exámenes y costos para obtener su primera licencia no profesional en Melipeuco.', datos: { ...comunTransito, dirigidoA: 'Personas mayores de 18 años (17 años para clase B con curso de escuela de conductores y autorización notarial) con domicilio en la comuna.', requisitos: ['Cédula de identidad vigente y fotocopia', 'Certificado de estudios (mínimo 8° básico) para clases B y C', 'Comprobante de domicilio en la comuna', 'Certificado de antecedentes', 'Declaración de salud completa', 'Clase F: licencia anterior y curso aprobado (certificado original)'], documentos: ['Cédula de identidad', 'Certificado de estudios', 'Comprobante de domicilio', 'Declaración de salud'], pasos: ['Reserve su hora en línea o en la oficina de Tránsito', 'Prepare los documentos impresos', 'Rinda los exámenes físico (sensométrico), psíquico (psicométrico), entrevista médica, teórico y práctico', 'Retire su licencia una vez aprobados los exámenes'], costo: '0,60 UTM (clase E: 0,25 UTM)', plazo: 'Si reprueba el examen teórico o práctico puede repetirlo una vez dentro de 25 días.', normativa: 'Ley 18.290 de Tránsito. ' + avisoLicencias, claves: 'licencia, carnet de conducir, primera licencia, clase b, examen teórico' } },
  { titulo: 'Licencia de conducir profesional (clases A-2, A-3, A-4 y A-5)', slug: 'licencia-de-conducir-profesional', area: T, guia: '/licenciadeconducir/', resumen: 'Para conducir vehículos de transporte de pasajeros y de carga.', datos: { ...comunTransito, dirigidoA: 'Personas de 20 años o más con licencia clase B con al menos 2 años de antigüedad.', requisitos: ['Edad mínima 20 años', 'Cédula de identidad vigente', 'Licencia clase B con antigüedad mínima de 2 años', 'Curso aprobado en Escuela de Conductores Profesionales autorizada', 'Hoja de vida del conductor', 'Certificado de antecedentes', 'Comprobante de domicilio', 'Declaración de salud completa', 'A-3: 2 años con licencia A-1, A-2, A-4 o A-5 · A-5: 2 años con licencia A-2, A-3 o A-4'], pasos: ['Verifique que cumple la experiencia exigida', 'Apruebe el curso en una escuela autorizada', 'Reserve su hora', 'Rinda los exámenes médicos, teórico y práctico'], costo: '0,60 UTM', normativa: 'Ley 18.290 y Ley 19.495. ' + avisoLicencias, claves: 'licencia profesional, a2, a3, a4, a5, camion, bus' } },
  { titulo: 'Renovar licencia de conducir (control)', slug: 'renovar-licencia-de-conducir', area: T, guia: '/renovarlicencia/', resumen: 'Renovación de licencias clases B, C, D, E, F y profesionales.', datos: { ...comunTransito, requisitos: ['Licencia de conducir anterior', 'Cédula de identidad vigente', 'Certificado de antecedentes', 'Declaración de salud completa', 'Si la licencia no es de Melipeuco: hoja de vida del conductor'], pasos: ['Revise la fecha de vencimiento de su licencia', 'Reserve su hora', 'Rinda los exámenes físico, psíquico y entrevista médica (clases A-1/A-Z antiguas: también teórico)', 'Retire su licencia renovada'], costo: '0,50 UTM (clase E: 0,08 UTM)', normativa: avisoLicencias, claves: 'renovar licencia, control, vencimiento' } },
  { titulo: 'Control con ampliación a nueva clase', slug: 'control-con-ampliacion-a-nueva-clase', area: T, guia: '/controlconampliacionanuevaclase/', resumen: 'Agregue una nueva clase a su licencia junto con su control.', datos: { ...comunTransito, requisitos: ['Licencia de conducir anterior', 'Cédula de identidad vigente', 'Certificado de antecedentes', 'Certificado de estudios (mínimo 8° básico)', 'Declaración de salud completa', 'Si la licencia no es de Melipeuco: hoja de vida y comprobante de domicilio', 'Para clases profesionales: curso aprobado en escuela de conductores'], pasos: ['Reserve su hora', 'Rinda los exámenes físico, psíquico, entrevista médica, teórico y práctico'], costo: '0,50 UTM', normativa: examenPractico, claves: 'ampliacion, nueva clase' } },
  { titulo: 'Duplicado de licencia por robo o extravío', slug: 'duplicado-de-licencia', area: T, guia: '/duplicadosporrobooextravio/', resumen: 'Obtenga un duplicado si perdió su licencia o se la robaron.', datos: { ...comunTransito, requisitos: ['Cédula de identidad vigente (y fotocopia si la licencia es de otra comuna)', 'Certificado de antecedentes', 'Si la licencia es de otra comuna, se solicitan antecedentes a la comuna de origen'], costo: '0,25 UTM', claves: 'duplicado, perdida, robo, extravio' } },
  { titulo: 'Cambio de domicilio en la licencia', slug: 'cambio-de-domicilio-licencia', area: T, guia: '/cambiodedomicilio/', resumen: 'Actualice el domicilio registrado en su licencia de conducir.', datos: { ...comunTransito, requisitos: ['Cédula de identidad vigente', 'Licencia de conducir', 'Certificado de antecedentes'], costo: '0,25 UTM', plazo: 'Para licencias de otras comunas se solicitan antecedentes a la comuna de origen.', claves: 'cambio domicilio' } },
  { titulo: 'Reemplazo de licencia por deterioro', slug: 'reemplazo-de-licencia-por-deterioro', area: T, guia: '/reemplazopordeterioro/', resumen: 'Reemplace su licencia dañada o ilegible.', datos: { ...comunTransito, requisitos: ['Cédula de identidad vigente', 'Licencia de conducir', 'Certificado de antecedentes', 'Si la licencia no es de Melipeuco: hoja de vida y comprobante de domicilio'], costo: '0,25 UTM', claves: 'deterioro, licencia dañada' } },
  { titulo: 'Pagar permiso de circulación', slug: 'pagar-permiso-de-circulacion', area: 'dep-transito-pc', resumen: 'Pague en línea su permiso de circulación (primera o segunda cuota) en el sistema SEM.', datos: { modalidad: 'en_linea', urlEnLinea: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion/70766500/buscar', textoBoton: 'Pagar en línea', email: 'permisosdecirculacion@munimelipeuco.cl', requisitos: ['Placa patente del vehículo', 'Seguro obligatorio (SOAP) vigente', 'Revisión técnica y certificado de emisiones vigentes'], pasos: ['Ingrese al sistema SEM con la placa patente', 'Revise los datos del vehículo', 'Pague con tarjeta o transferencia', 'Descargue su permiso'], formularios: [{ titulo: 'Pagar segunda cuota', url: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion-2c/70766500/buscar' }, { titulo: 'Permiso de locomoción colectiva', url: 'https://www.sem2.gob.cl/tramites/permisos-de-circulacion-locomocion-colectiva/70766500/buscar' }], claves: 'permiso de circulacion, patente auto, sem, segunda cuota' } },
  { titulo: 'Obtener patente comercial', slug: 'obtener-patente-comercial', area: 'dep-rentas', guia: '/patentecomercial/', resumen: 'Permiso municipal para que su negocio funcione legalmente en Melipeuco.', datos: { modalidad: 'presencial', lugar: 'Oficina de Rentas y Patentes, oficina 23, segundo piso', telefono: '233848827', email: 'rentasypatentes@munimelipeuco.cl', requisitos: ['Inicio de actividades en el SII', 'Certificado de Informaciones Previas (uso de suelo) que permita el giro', 'Resolución sanitaria (alimentos, farmacias, salones de belleza y otros)', 'Acreditar derecho a usar el inmueble (dominio, arriendo o autorización)'], documentos: ['Inicio de actividades o carpeta tributaria', 'Constitución de sociedad (si corresponde)', 'Fotocopia de cédula del dueño o representante legal', 'Certificado de la Dirección de Obras (recepción definitiva con destino comercial)', 'Formulario municipal de solicitud', 'Declaración jurada de capital propio'], pasos: ['Verifique el uso de suelo', 'Inscriba la actividad en el SII', 'Obtenga los permisos sectoriales', 'Presente la carpeta en Rentas y Patentes', 'Pague en Tesorería y retire su patente'], costo: 'Entre 2,5 ‰ y 5 ‰ del capital propio (mínimo 1 UTM, máximo 4.000 UTM anuales)', plazo: 'Pago anual en julio o en dos cuotas (julio y enero).', claves: 'patente, negocio, emprender, comercio, mef microempresa familiar' } },
  { titulo: 'Renovar y pagar patente municipal', slug: 'renovar-patente-municipal', area: 'dep-rentas', guia: '/renovarpatentecomercial/', resumen: 'La patente se paga por semestre: enero y julio.', datos: { modalidad: 'mixto', urlEnLinea: 'https://www.sem2.gob.cl/tramites/patentes-municipales/70766500/buscar', textoBoton: 'Pagar en línea', lugar: 'Tesorería Municipal, oficina 15, piso 2', telefono: '233848827', email: 'rentasypatentes@munimelipeuco.cl', pasos: ['Confirme las fechas: 1ª cuota hasta el último día hábil de enero y 2ª cuota hasta el último día hábil de julio', 'Pague en línea o en Tesorería Municipal', 'Si hubo cambios, actualice sus datos en Rentas y Patentes'], plazo: 'No pagar a tiempo genera multas, intereses y posibles acciones de cobro o clausura. Contribuyentes con morosidad deben acudir presencialmente.', claves: 'renovar patente, pagar patente' } },
  { titulo: 'Traslado de patente comercial', slug: 'traslado-de-patente-comercial', area: 'dep-rentas', guia: '/trasladopatentecomercial/', resumen: 'Cambie la dirección de su negocio manteniendo su patente.', datos: { modalidad: 'presencial', lugar: 'Oficina de Rentas y Patentes, oficina 23, segundo piso', telefono: '233848827', email: 'rentasypatentes@munimelipeuco.cl', claves: 'traslado patente, cambio de local' } },
  { titulo: 'Solicitud de vehículo o maquinaria municipal', slug: 'solicitud-de-maquinaria', area: 'dep-dom', guia: '/solicitud-de-maquinaria/', resumen: 'Solicite apoyo con retroexcavadora, excavadora, motoniveladora, camión u otro recurso municipal.', datos: { modalidad: 'presencial', lugar: 'Oficina de Partes (mesón principal, primer piso)', telefono: '233848813', email: 'oficinadepartes@munimelipeuco.cl', requisitos: ['Formulario de solicitud completo y firmado', 'Copia de cédula de identidad', 'Cartola del Registro Social de Hogares'], pasos: ['Descargue y complete el formulario', 'Imprímalo y fírmelo', 'Entréguelo en Oficina de Partes; un asistente social completará el acta de ayuda social', 'La Dirección de Obras evalúa según disponibilidad'], plazo: 'Sujeto a evaluación social y disponibilidad de maquinaria.', claves: 'maquinaria, retroexcavadora, camion, apoyo' } },
  { titulo: 'Solicitudes varias a la Municipalidad', slug: 'solicitudes-varias', area: 'dep-partes', guia: '/solicitudesvarias/', resumen: 'Solicite insumos, apoyos o servicios municipales diversos.', datos: { modalidad: 'presencial', lugar: 'Oficina de Partes', telefono: '233848813', email: 'oficinadepartes@munimelipeuco.cl', claves: 'solicitud, ayuda, apoyo, insumos' } },
  { titulo: 'Reposición ante el Juzgado de Policía Local', slug: 'reposicion-juzgado-policia-local', area: 'dep-jpl', guia: '/solicitud-de-reposicion-2/', resumen: 'Pida que se reconsidere una resolución que le impuso una multa.', datos: { modalidad: 'presencial', lugar: 'Juzgado de Policía Local, tercer piso', telefono: '233848819', horario: 'Lunes a viernes de 08:30 a 14:00 hrs.', claves: 'reposicion, multa, juzgado' } },
  { titulo: 'Querella infraccional y demanda civil', slug: 'querella-infraccional', area: 'dep-jpl', guia: '/solicitud-querella-infraccional/', resumen: 'Por infracciones o accidentes de tránsito, con indemnización de perjuicios.', datos: { modalidad: 'presencial', lugar: 'Juzgado de Policía Local, tercer piso', telefono: '233848819', horario: 'Lunes a viernes de 08:30 a 14:00 hrs.', claves: 'querella, accidente, demanda, indemnizacion' } },
  { titulo: 'Descargos por infracciones', slug: 'descargos-por-infracciones', area: 'dep-jpl', guia: '/solicitud-descargos-por-infracciones/', resumen: 'Presente por escrito su defensa ante una infracción.', datos: { modalidad: 'presencial', lugar: 'Juzgado de Policía Local, tercer piso', telefono: '233848819', horario: 'Lunes a viernes de 08:30 a 14:00 hrs.', claves: 'descargos, parte, infraccion' } },
  { titulo: 'Atención en el Box Veterinario Municipal', slug: 'atencion-box-veterinario', area: 'dep-medioambiente', guia: '/boxveterinario/', resumen: 'Atención clínica, vacunación y esterilización de mascotas.', datos: { modalidad: 'presencial', telefono: '233848815', horario: 'Lunes a viernes de 9:00 a 17:00 hrs.', requisitos: ['Cédula de identidad vigente del propietario', 'Comprobante de residencia en Melipeuco', 'Registro Social de Hogares actualizado'], claves: 'veterinario, mascota, perro, gato, esterilizacion, vacuna' } },
  { titulo: 'Reclamos, consultas y sugerencias (OIRS)', slug: 'oirs', area: 'dep-oirs', resumen: 'Envíe su consulta, reclamo, sugerencia o felicitación y reciba un código de seguimiento.', datos: { modalidad: 'en_linea', urlEnLinea: '/oirs/', textoBoton: 'Escribir a la OIRS', email: 'oficinadepartes@munimelipeuco.cl', telefono: '233848813', plazo: 'Respuesta en un máximo de 10 días hábiles.', normativa: 'Ley 19.880 y Ley 20.500.', claves: 'reclamo, sugerencia, consulta, felicitacion, oirs' } },
  { titulo: 'Solicitud de acceso a la información pública', slug: 'solicitud-acceso-informacion', area: 'dep-transparencia', resumen: 'Solicite información de la Municipalidad según la Ley de Transparencia.', datos: { modalidad: 'en_linea', urlEnLinea: 'https://www.portaltransparencia.cl/PortalPdT/ingreso-sai-v2?idOrg=608', textoBoton: 'Solicitar en el Portal de Transparencia', plazo: '20 días hábiles, prorrogables por 10 días.', normativa: 'Ley 20.285 sobre Acceso a la Información Pública.', claves: 'transparencia, informacion publica, sai' } },
  { titulo: 'Solicitar audiencia (Ley del Lobby)', slug: 'audiencia-ley-del-lobby', area: 'dep-alcaldia', resumen: 'Solicite una audiencia con autoridades municipales.', datos: { modalidad: 'mixto', urlEnLinea: 'https://www.leylobby.gob.cl/instituciones/MU172', textoBoton: 'Solicitar audiencia', lugar: 'Alcaldía, primer piso', horario: 'Atención presencial lunes, miércoles y viernes por orden de llegada, de 08:30 a 13:00 hrs.', normativa: 'Ley 20.730.', claves: 'audiencia, alcalde, lobby' } },
  { titulo: 'Autoconsulta de salud SSASUR', slug: 'autoconsulta-ssasur', area: 'dep-salud', resumen: 'Revise horas y prestaciones de salud del Servicio de Salud Araucanía Sur.', datos: { modalidad: 'en_linea', urlEnLinea: 'https://autoconsulta.ssasur.cl/auth/login', textoBoton: 'Ir a Autoconsulta', telefono: '+56452557691', claves: 'salud, hora medica, cesfam, ssasur' } },
  { titulo: 'Horarios de buses', slug: 'horarios-de-buses', area: 'dep-transito', guia: '/transportepublico/', resumen: 'Salidas desde y hacia Melipeuco, Cunco y Temuco.', datos: { modalidad: 'en_linea', urlEnLinea: '/transportepublico/', textoBoton: 'Ver horarios', claves: 'bus, micro, transporte, temuco, cunco' } },
];

// Datos de contacto por área (directorio telefónico y correos institucionales del sitio antiguo).
const CONTACTO_AREAS = {
  'dep-alcaldia': { telefono: '233848821', email: 'alcaldia@munimelipeuco.cl', responsable: 'Alejandro Cuminao Barros', cargoResponsable: 'Alcalde', horario: 'Audiencias: lunes, miércoles y viernes de 08:30 a 13:00 hrs., por orden de llegada.', categoriaNoticias: 'alcaldia' },
  'dep-transito': { telefono: '233848829', email: 'transito@munimelipeuco.cl', categoriaNoticias: 'departamento-de-transito-y-transporte-publico' },
  'dep-rentas': { telefono: '233848827', email: 'rentasypatentes@munimelipeuco.cl' },
  'dep-transito-pc': { email: 'permisosdecirculacion@munimelipeuco.cl' },
  'dep-jpl': { telefono: '233848819', direccion: 'Pedro Aguirre Cerda N° 14, tercer piso', horario: 'Lunes a viernes de 08:30 a 14:00 hrs.', responsable: 'Rodrigo Jaramillo Contreras', cargoResponsable: 'Juez titular' },
  'dep-daf': { telefono: '233848823', email: 'daf@munimelipeuco.cl' },
  'dep-medioambiente': { telefono: '233848824', categoriaNoticias: 'medio-ambiente' },
  'dep-vivienda': { telefono: '233848814', email: 'vivienda@munimelipeuco.cl', categoriaNoticias: 'vivienda' },
  'dep-del': { telefono: '233848818', email: 'udel@munimelipeuco.cl', categoriaNoticias: 'desarrollo-local' },
  'dep-emergencia': { telefono: '233848812' },
  'dep-dideco': { telefono: '233848811', email: 'dideco@munimelipeuco.cl', categoriaNoticias: 'dideco' },
  'dep-mujer': { telefono: '233848816' },
  'dep-dom': { telefono: '233848825', email: 'obras@munimelipeuco.cl', categoriaNoticias: 'obras' },
  'dep-educacion': { telefono: '233848828', categoriaNoticias: 'educacion' },
  'dep-salud': { telefono: '+56452557691', email: 'cesfam@munimelipeuco.cl', categoriaNoticias: 'salud' },
  'dep-secplan': { email: 'secplan@munimelipeuco.cl' },
  'dep-secmun': { email: 'secretariamunicipal@munimelipeuco.cl' },
  'dep-partes': { telefono: '233848813', email: 'oficinadepartes@munimelipeuco.cl', direccion: 'Mesón principal, primer piso' },
  'dep-oirs': { telefono: '233848813', email: 'oficinadepartes@munimelipeuco.cl' },
  'dep-control': { email: 'controlinterno@munimelipeuco.cl' },
  'dep-contabilidad': { email: 'contabilidad@munimelipeuco.cl' },
  'dep-rrhh': { email: 'personal@munimelipeuco.cl' },
  'dep-juridico': { email: 'asesorjuridico@munimelipeuco.cl' },
  'dep-deportes': { categoriaNoticias: 'deporte' },
  'dep-turismo': { categoriaNoticias: 'turismo' },
  'dep-cultura': { categoriaNoticias: 'cultural' },
  'dep-informatica': { email: 'informatica@munimelipeuco.cl' },
  'dep-uamis': { categoriaNoticias: 'uamis' },
};
const ICONOS_AREA = { star: 'estrella', building: 'escudo', people: 'personas', scale: 'balanza', stamp: 'documento', inbox: 'correo', help: 'chat', eye: 'buscar', note: 'documento', heart: 'corazon', home: 'casa', cash: 'billete', user2: 'usuario', award: 'deporte', sparkles: 'estrella', chart: 'grafico', map: 'mapa', book: 'libro', layers: 'carpeta', tool: 'herramienta', archive: 'carpeta', alert: 'alerta', leaf: 'hoja', truck: 'camion', car: 'auto', id: 'licencia', doc: 'documento', list: 'documento', shield: 'escudo', search: 'buscar', cpu: 'wifi' };

// Páginas de sección del menú antiguo que estaban vacías: ahora reúnen noticias, trámites y contactos.
function paginasSeccion(areaId) {
  const B = (tipo, o = {}) => ({ id: 'b' + Math.random().toString(36).slice(2, 10), tipo, ...o });
  return [
    { slug: 'municipio', titulo: 'Municipio', resumen: 'Conozca la Municipalidad de Melipeuco: autoridades, áreas, organigrama, planificación e historia.', bloques: [
      B('texto', { html: '<p>La Ilustre Municipalidad de Melipeuco es una corporación autónoma de derecho público, con personalidad jurídica y patrimonio propio, cuya finalidad es satisfacer las necesidades de la comunidad local y asegurar su participación en el progreso económico, social y cultural de la comuna (Ley 18.695, Orgánica Constitucional de Municipalidades).</p>' }),
      B('tarjetas', { titulo: 'Conozca su municipio', columnas: 3, tarjetas: [
        { icono: 'estrella', titulo: 'Alcaldía', texto: 'El Alcalde, sus audiencias y su equipo de gabinete.', url: '/alcaldia-y-concejo-municipal/' },
        { icono: 'balanza', titulo: 'Concejo Municipal', texto: 'Concejales, sesiones, actas y transmisiones en vivo.', url: '/concejo-municipal/' },
        { icono: 'escudo', titulo: 'Áreas municipales', texto: 'Direcciones, departamentos y oficinas, con sus funciones y contactos.', url: '/areas/' },
        { icono: 'grafico', titulo: 'Organigrama', texto: 'Estructura orgánica según el Reglamento de Organización Interna.', url: '/organigrama/' },
        { icono: 'mapa', titulo: 'PLADECO', texto: 'Plan de Desarrollo Comunal: la hoja de ruta de la comuna.', url: '/pladeco/' },
        { icono: 'libro', titulo: 'Nuestra historia', texto: 'Los orígenes de Melipeuco y su municipalidad.', url: '/historia/' },
      ] }),
    ] },
    { slug: 'alcaldia-y-concejo-municipal', titulo: 'Alcaldía', resumen: 'El Alcalde de Melipeuco, cómo solicitar una audiencia y noticias de Alcaldía.', bloques: [
      B('autoridades', { titulo: '' }),
      B('texto', { html: '<h2>¿Cómo solicitar una audiencia?</h2><p>Puede solicitar audiencia en línea a través del registro de la Ley del Lobby o acercarse presencialmente a la Municipalidad (Pedro Aguirre Cerda N° 14, primer piso). Atención por orden de llegada los <strong>lunes, miércoles y viernes de 08:30 a 13:00 hrs.</strong></p>' }),
      B('botones', { botones: [{ texto: 'Solicitar audiencia (Ley del Lobby)', url: 'https://www.leylobby.gob.cl/instituciones/MU172', estilo: 'primario' }, { texto: 'Concejo Municipal', url: '/concejo-municipal/', estilo: 'secundario' }] }),
      B('noticias', { titulo: 'Noticias de Alcaldía', categoria: 'alcaldia', cantidad: 6 }),
    ] },
    { slug: 'concejo-municipal', titulo: 'Concejo Municipal', resumen: 'Concejales, sesiones ordinarias y extraordinarias, tablas, actas y transmisiones del Concejo Municipal de Melipeuco.', bloques: [
      B('texto', { html: '<p>El Concejo Municipal es el órgano colegiado de carácter normativo, resolutivo y fiscalizador, encargado de hacer efectiva la participación de la comunidad local (Ley 18.695). Las sesiones son públicas y se transmiten en vivo por el canal de YouTube de la Municipalidad.</p>' }),
      B('autoridades', { titulo: 'Integrantes del Concejo' }),
      B('sesiones', { titulo: 'Sesiones y transmisiones', cantidad: 12 }),
      B('botones', { botones: [{ texto: 'Ver todas las sesiones', url: '/concejo/sesiones/', estilo: 'primario' }, { texto: 'Canal de YouTube', url: 'https://www.youtube.com/channel/UCxQ299eYJmshjxa8a00FJRQ', estilo: 'secundario' }] }),
    ] },
    { slug: 'pladeco', titulo: 'PLADECO: Plan de Desarrollo Comunal', resumen: 'El instrumento rector del desarrollo de la comuna de Melipeuco.', bloques: [
      B('texto', { html: '<p>El Plan de Desarrollo Comunal (PLADECO) es el instrumento rector del desarrollo de la comuna. Contempla las acciones orientadas a satisfacer las necesidades de la comunidad local y a promover su avance social, económico y cultural (art. 7 de la Ley 18.695). Su elaboración y actualización está a cargo de la Secretaría Comunal de Planificación (SECPLAN), con participación de la comunidad.</p>' }),
      B('documentos', { titulo: 'Documentos del PLADECO', coleccion: 'pladeco', cantidad: 20 }),
      B('contactos', { titulo: 'Consultas', email: 'secplan@munimelipeuco.cl' }),
    ] },
    { slug: 'logotipos-y-material', titulo: 'Logotipos y material gráfico', resumen: 'Escudo y logotipos oficiales de la Municipalidad de Melipeuco para uso en comunicaciones.', bloques: [
      B('texto', { html: '<p>Descargue el escudo oficial para usarlo en documentos, actividades y material de difusión patrocinado por la Municipalidad. Respete sus proporciones y colores, y no lo deforme ni lo combine con otros elementos.</p>' }),
      B('galeria', { titulo: 'Escudo municipal', imagenes: [{ src: '/img/escudo-azul.svg', alt: 'Escudo de Melipeuco vectorizado, versión azul para fondos claros' }, { src: '/img/logo-claro.webp', alt: 'Escudo de Melipeuco a color' }], estilo: 'grilla' }),
      B('documentos', { titulo: 'Material descargable', coleccion: 'material-grafico', cantidad: 30, archivos: [{ titulo: 'Escudo vectorial (azul, SVG)', url: '/img/escudo-azul.svg' }, { titulo: 'Escudo vectorial (crema, SVG)', url: '/img/escudo-crema.svg' }, { titulo: 'Escudo (fondo claro, WEBP)', url: '/img/logo-claro.webp' }, { titulo: 'Escudo (fondo oscuro, WEBP)', url: '/img/logo-oscuro.webp' }] }),
    ] },
    { slug: 'educacion', titulo: 'Educación', resumen: 'Departamento de Educación Municipal, establecimientos, becas y noticias de educación.', bloques: [
      B('texto', { html: '<p>El Departamento de Educación Municipal (DAEM) administra los establecimientos educacionales municipales de Melipeuco y vela por las condiciones óptimas para el proceso educativo de niñas, niños, jóvenes y adultos de la comuna.</p>' }),
      B('directorio', { titulo: 'Establecimientos y contactos', grupo: 'educacion' }),
      B('noticias', { titulo: 'Noticias de educación', categoria: 'educacion', cantidad: 6 }),
      B('noticias', { titulo: 'Becas y concursos', categoria: 'becas-y-concursos', cantidad: 3 }),
    ] },
    { slug: 'salud', titulo: 'Salud', resumen: 'CESFAM Melipeuco, postas rurales, urgencias y noticias de salud.', bloques: [
      B('aviso', { nivel: 'emergencia', titulo: 'Urgencias', html: '<p>Urgencias CESFAM Melipeuco: <a href="tel:+56452557691">45 255 7691</a> · SAMU: <a href="tel:131">131</a></p>' }),
      B('botones', { botones: [{ texto: 'Autoconsulta SSASUR', url: 'https://autoconsulta.ssasur.cl/auth/login', estilo: 'primario' }] }),
      B('directorio', { titulo: 'CESFAM y postas rurales', grupo: 'salud' }),
      B('noticias', { titulo: 'Noticias de salud', categoria: 'salud', cantidad: 6 }),
    ] },
    { slug: 'udel', titulo: 'Desarrollo Económico Local (UDEL)', resumen: 'Fomento productivo, turismo, cultura, PDTI y apoyo al emprendimiento.', bloques: [
      B('texto', { html: '<p>El Departamento de Desarrollo Económico Local impulsa el fomento productivo, el turismo, la cultura y el apoyo a emprendedoras, emprendedores y agricultores de la comuna, incluido el Programa de Desarrollo Territorial Indígena (PDTI).</p>' }),
      B('contactos', { titulo: 'Contacto', telefono: '233848818', email: 'udel@munimelipeuco.cl' }),
      B('noticias', { titulo: 'Noticias de desarrollo local', categoria: 'desarrollo-local', cantidad: 6 }),
      B('tramites', { titulo: 'Trámites del área', transitoDepartamento: 'dep-del', cantidad: 12 }),
    ] },
    { slug: 'social', titulo: 'Desarrollo Social (DIDECO)', resumen: 'Programas sociales, Registro Social de Hogares, subsidios, vivienda, adulto mayor, mujer y juventud.', bloques: [
      B('texto', { html: '<p>La Dirección de Desarrollo Comunitario (DIDECO) acompaña a las familias de Melipeuco con programas sociales, apoyo al Registro Social de Hogares, subsidios y pensiones, vivienda, adulto mayor e inclusión, mujer y equidad de género, juventud y organizaciones comunitarias.</p>' }),
      B('contactos', { titulo: 'Contacto', telefono: '233848811', email: 'dideco@munimelipeuco.cl' }),
      B('tramites', { titulo: 'Trámites en línea de DIDECO', transitoDepartamento: 'dep-dideco', cantidad: 12 }),
      B('noticias', { titulo: 'Noticias sociales', categoria: 'social', cantidad: 6 }),
    ] },
    { slug: 'deporte', titulo: 'Deporte', resumen: 'Oficina de Deportes y Recreación: talleres, competencias y actividades deportivas.', bloques: [
      B('noticias', { titulo: 'Noticias de deporte', categoria: 'deporte', cantidad: 9 }),
      B('eventos', { titulo: 'Próximas actividades', cantidad: 6 }),
    ] },
    { slug: 'turismo', titulo: 'Turismo', resumen: 'Melipeuco, Capital del Trekking: volcán Llaima, Parque Nacional Conguillío, laguna Icalma y mucho más.', bloques: [
      B('texto', { html: '<p>Melipeuco está a los pies del volcán Llaima, puerta de entrada al Parque Nacional Conguillío, a la laguna Icalma y a la Reserva de la Biósfera Araucarias. Descubra sus senderos, ríos, termas y la cultura mapuche pehuenche.</p>' }),
      B('botones', { botones: [{ texto: 'Melipeuco Capital del Trekking', url: 'https://melipeucocapitaldeltrekking.cl/', estilo: 'primario' }, { texto: 'Descubre Melipeuco', url: '/descubremelipeuco/', estilo: 'secundario' }] }),
      B('lugares', { titulo: 'Lugares para visitar' }),
      B('noticias', { titulo: 'Noticias de turismo', categoria: 'turismo', cantidad: 6 }),
    ] },
    { slug: 'juzgado', titulo: 'Juzgado de Policía Local', resumen: 'Infracciones de tránsito, ordenanzas municipales, ley del consumidor y otras materias.', bloques: [
      B('texto', { html: '<p>El Juzgado de Policía Local de Melipeuco es un tribunal especial regido por la Ley N° 15.231. Depende administrativamente de la Municipalidad y está sujeto a la supervigilancia de la Corte de Apelaciones de Temuco. Conoce de infracciones de tránsito, ordenanzas municipales, ley del consumidor, alcoholes y otras leyes especiales.</p><ul><li><strong>Juez titular:</strong> Sr. Rodrigo Jaramillo Contreras</li><li><strong>Secretaria abogada titular:</strong> Sra. Natalia Cofré Vidal</li></ul>' }),
      B('contactos', { titulo: 'Contacto', telefono: '233848819', direccion: 'Pedro Aguirre Cerda N° 14, tercer piso', horario: 'Lunes a viernes de 08:30 a 14:00 hrs.' }),
      B('tramites', { titulo: 'Escritos y solicitudes', etiqueta: 'juzgado', cantidad: 12 }),
    ] },
  ];
}

export function cargarPaquete(db, repo, paquete, { reemplazar = false } = {}) {
  const r = { creados: 0, actualizados: 0, omitidos: 0 };
  db.tx(() => {
    // Taxonomías (padres primero)
    const pendientes = [...paquete.taxonomias];
    for (let vuelta = 0; vuelta < 3 && pendientes.length; vuelta++) {
      for (let i = pendientes.length - 1; i >= 0; i--) {
        const t = pendientes[i];
        const padre = t.padre_slug ? db.get('SELECT id FROM taxonomias WHERE tipo = ? AND slug = ?', t.tipo, t.padre_slug) : null;
        if (t.padre_slug && !padre && vuelta < 2) continue;
        repo.asegurarTaxonomia(t.tipo, t.nombre, { slug: t.slug, descripcion: t.descripcion, padre_id: padre?.id, wp_id: t.wp_id });
        pendientes.splice(i, 1);
      }
    }
    // Medios
    for (const m of paquete.medios) {
      db.run(`INSERT INTO medios(url, nombre, mime, ancho, alto, alt, titulo, variantes, wp_id, creado, carpeta) VALUES(?,?,?,?,?,?,?,?,?,?, 'wordpress')
        ON CONFLICT(url) DO UPDATE SET variantes = excluded.variantes, ancho = excluded.ancho, alto = excluded.alto`,
      m.url, m.nombre, m.mime || '', m.ancho, m.alto, m.alt || '', m.titulo || '', JSON.stringify(m.variantes || {}), m.wp_id || null, m.creado || ahora());
    }
    // Contenidos (páginas padre antes que hijas)
    const orden = [...paquete.contenidos].sort((a, b) => (a.padre_slug ? 1 : 0) - (b.padre_slug ? 1 : 0));
    for (const c of orden) {
      const previo = c.wp_id ? db.get('SELECT id, modificado FROM contenidos WHERE tipo = ? AND wp_id = ?', c.tipo, c.wp_id) : null;
      if (previo && !reemplazar) { r.omitidos++; continue; }
      const taxonomias = (c.taxonomias || []).map((t) => db.get('SELECT id FROM taxonomias WHERE tipo = ? AND slug = ?', t.tipo, t.slug)?.id).filter(Boolean);
      const padre = c.padre_slug ? db.get("SELECT id FROM contenidos WHERE tipo = 'pagina' AND slug = ?", c.padre_slug)?.id : null;
      const titulo = c.titulo || recortar(textoPlano(c.cuerpo), 70) || 'Sin título';
      repo.guardar({ ...c, titulo, id: previo?.id, padre_id: padre, taxonomias }, { htmlAvanzado: true, revision: false, conservarFechas: true });
      previo ? r.actualizados++ : r.creados++;
    }
    for (const x of paquete.redirecciones || []) db.run('INSERT OR IGNORE INTO redirecciones(origen, destino, codigo, creado) VALUES(?,?,301,?)', x.origen, x.destino, ahora());
    // Directorio telefónico
    if (!db.get("SELECT 1 FROM contenidos WHERE tipo = 'contacto' LIMIT 1")) {
      const vistos = new Map();
      let n = 0;
      for (const d of paquete.directorio || []) {
        const clave = slugify(d.nombre);
        const previo = vistos.get(clave);
        if (previo) { // fusiona teléfono y correo de la misma unidad
          const c = repo.obtener(previo);
          repo.guardar({ ...c, datos: { ...c.datos, telefono: c.datos.telefono || d.telefono || '', email: c.datos.email || d.email || '' } }, { revision: false });
          continue;
        }
        const c = repo.guardar({ tipo: 'contacto', titulo: d.nombre, estado: 'publicado', orden: n++, datos: { telefono: d.telefono || '', email: d.email || '', grupo: d.grupo } }, { revision: false });
        vistos.set(clave, c.id);
      }
    }
    // Sesiones del Concejo con su transmisión
    if (!db.get("SELECT 1 FROM contenidos WHERE tipo = 'sesion' LIMIT 1")) {
      for (const s of paquete.sesiones || []) {
        const fecha = fechaDesdeTitulo(s.titulo);
        repo.guardar({ tipo: 'sesion', titulo: s.titulo, estado: 'publicado', publicado_en: fecha ? fecha + 'T12:00:00.000Z' : null, datos: { fecha: fecha ? fecha + 'T09:00' : '2025-01-01T09:00', tipoSesion: /extraordin/i.test(s.titulo) ? 'extraordinaria' : /cuenta p[uú]blica/i.test(s.titulo) ? 'especial' : 'ordinaria', video: s.video, lugar: /terreno/i.test(s.titulo) ? 'En terreno' : 'Salón del Concejo Municipal' } }, { revision: false, conservarFechas: true });
      }
    }
  });
  repo.invalidar();
  return r;
}

const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
export function fechaDesdeTitulo(t) {
  const s = String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const m = /(\d{1,2})(?:\s+de|\s*-|,)?\s*-?\s*([a-z]+)\s*(?:de|,)?\s*(\d{4})?/.exec(s.replace(/(lunes|martes|miercoles|jueves|viernes|sabado|domingo)[\s,-]*/g, ''));
  if (!m || !MESES[m[2]]) return null;
  const anio = m[3] || /(20\d\d)/.exec(s)?.[1];
  if (!anio) return null;
  return `${anio}-${String(MESES[m[2]]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
}

export function sembrarBase(db, repo) {
  const hecho = db.ajuste('semilla_base', null);
  if (!db.ajuste('sitio')) db.guardarAjuste('sitio', AJUSTES_BASE);
  const sitio = db.ajuste('sitio');
  // Paletas predeterminadas anteriores: se actualizan a la actual (no se tocan colores elegidos a mano).
  const anteriores = ['#0b5a8c|#ffaa02|#001035', '#14284A|#E3A33A|#0C1A33'];
  if (sitio?.colores && anteriores.includes([sitio.colores.primario, sitio.colores.acento, sitio.colores.oscuro].join('|'))) db.guardarAjuste('sitio', { ...sitio, colores: AJUSTES_BASE.colores });
  for (const [clave, m] of Object.entries(MENUS_BASE)) if (!db.get('SELECT 1 FROM menus WHERE clave = ?', clave)) repo.guardarMenu(clave, m.nombre, m.items);
  // Barra de transparencia con los nombres largos de la primera versión (no cabían en una línea).
  const largos = ['Solicitar información Ley del Lobby', 'Solicitar información Ley de Transparencia', 'Transparencia Activa', 'Transparencia Pasiva', 'Declaraciones de intereses y patrimonio'];
  if (repo.menu('superior').map((i) => i.texto).join('|') === largos.join('|')) repo.guardarMenu('superior', MENUS_BASE.superior.nombre, MENUS_BASE.superior.items);
  if (hecho) return false;

  db.tx(() => {
    const opciones = { revision: false, htmlAvanzado: true };
    // Áreas municipales
    const porDep = new Map();
    for (const d of ORGANIGRAMA_MELIPEUCO) {
      if (d.id === 'dep-muni') continue;
      const extra = CONTACTO_AREAS[d.id] || {};
      const c = repo.guardar({
        tipo: 'area', titulo: d.name, slug: slugify(d.short || d.name), estado: 'publicado', orden: porDep.size,
        padre_id: porDep.get(d.parentId) || null, resumen: (d.funciones || [])[0] || '',
        datos: { nombreCorto: d.short, tipoUnidad: d.type === 'seccion' ? 'unidad' : d.type, funciones: d.funciones || [], norma: d.norma || '', transitoDepartamento: d.id, color: d.color || '', icono: ICONOS_AREA[d.icon] || 'escudo', enMenu: true, ...extra },
      }, opciones);
      porDep.set(d.id, c.id);
    }
    // Trámites
    const etiquetaJuzgado = repo.asegurarTaxonomia('etiqueta', 'Juzgado', { slug: 'juzgado' });
    TRAMITES_BASE.forEach((t, i) => {
      const bloques = t.guia ? [{ id: 'bguia' + i, tipo: 'botones', titulo: '', botones: [{ texto: 'Ver la guía completa', url: t.guia, estilo: 'secundario' }] }] : [];
      repo.guardar({ tipo: 'tramite', titulo: t.titulo, slug: t.slug, resumen: t.resumen, estado: 'publicado', orden: i, area_id: porDep.get(t.area) || null, datos: t.datos, bloques, taxonomias: t.area === 'dep-jpl' ? [etiquetaJuzgado.id] : [] }, opciones);
    });
    // Accesos rápidos y banners
    ACCESOS.forEach((a, i) => repo.guardar({ tipo: 'acceso', titulo: a.titulo, estado: 'publicado', orden: i, datos: { enlace: a.enlace, icono: a.icono, color: a.color, nuevaVentana: !!a.nuevaVentana } }, opciones));
    BANNERS.forEach((b, i) => repo.guardar({ tipo: 'slide', titulo: b.titulo, estado: 'publicado', orden: i, imagen: b.imagen, datos: { enlace: b.enlace, textoAlt: b.textoAlt } }, opciones));
    // Autoridades
    repo.guardar({ tipo: 'autoridad', titulo: 'Alejandro Cuminao Barros', estado: 'publicado', orden: 0, resumen: 'Alcalde de la comuna de Melipeuco.', area_id: porDep.get('dep-alcaldia'), datos: { cargo: 'alcalde', cargoTexto: 'Alcalde', periodo: '2024 – 2028', email: 'alcaldia@munimelipeuco.cl', telefono: '233848821', audiencias: 'https://www.leylobby.gob.cl/instituciones/MU172' } }, opciones);
    // Páginas de sección
    for (const p of paginasSeccion()) {
      const ya = db.get("SELECT id FROM contenidos WHERE tipo = 'pagina' AND slug = ? AND padre_id IS NULL", p.slug);
      if (!ya) repo.guardar({ tipo: 'pagina', estado: 'publicado', plantilla: 'normal', ...p }, opciones);
    }
    // Colecciones de documentos
    for (const [slug, nombre] of [['ordenanzas', 'Ordenanzas municipales'], ['reglamentos', 'Reglamentos'], ['actas-concejo', 'Actas del Concejo'], ['pladeco', 'PLADECO'], ['presupuesto', 'Presupuesto municipal'], ['cuenta-publica', 'Cuenta pública'], ['bases-y-concursos', 'Bases y concursos'], ['formularios', 'Formularios'], ['material-grafico', 'Material gráfico']]) repo.asegurarTaxonomia('coleccion', nombre, { slug });
    // Redirecciones de menús antiguos
    for (const [o, d] of [['/medio-ambiente/', '/medioambiente/'], ['/departamentos/', '/areas/'], ['/descargas/', '/documentos/']]) db.run('INSERT OR IGNORE INTO redirecciones(origen, destino, codigo, creado) VALUES(?,?,301,?)', o, d, ahora());
    // Encuesta de ejemplo (borrador: el municipio decide si la publica)
    repo.guardar({ tipo: 'encuesta', titulo: '¿Qué trámite le gustaría hacer en línea primero?', estado: 'borrador', cuerpo: '<p>Ayúdenos a priorizar la digitalización de los trámites municipales.</p>', datos: { opciones: ['Patentes comerciales', 'Solicitudes de maquinaria', 'Trámites del Juzgado de Policía Local', 'Permisos de la Dirección de Obras', 'Certificados de DIDECO'], mostrarResultados: true } }, opciones);
    db.guardarAjuste('semilla_base', { en: ahora() });
  });
  repo.invalidar();
  return true;
}

export function cargarSemillaWordpress(db, repo) {
  const archivo = path.join(RAIZ, 'contenido/semilla/wordpress.json.gz');
  if (!fs.existsSync(archivo) || db.ajuste('semilla_wordpress')) return null;
  const paquete = JSON.parse(zlib.gunzipSync(fs.readFileSync(archivo)));
  const r = cargarPaquete(db, repo, paquete);
  db.guardarAjuste('semilla_wordpress', { en: ahora(), generado: paquete.generado, ...r });
  return r;
}
