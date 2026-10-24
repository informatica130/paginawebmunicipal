// Estructura orgánica de la Municipalidad de Melipeuco según el Reglamento de
// Organización Interna N° 12 de 29-04-2025 (modificación aprobada por el Concejo
// en la sesión ordinaria N° 07 de 04-02-2025). Cada unidad lleva su norma de
// creación y sus funciones resumidas: se usan en el organigrama, en la ficha de
// cada dependencia, en Transparencia Activa (estructura orgánica y facultades,
// art. 7 letras a y b de la Ley 20.285) y como contexto para el asistente.
//
// Los identificadores antiguos (dep-transito, dep-dom, dep-secmun, dep-rentas…) se
// conservan para no romper agendas, trámites, buzones ni numeraciones existentes.

export const NORMA_ORGANIGRAMA = {
  nombre: 'Reglamento de Organización Interna N° 12',
  fecha: '2025-04-29',
  detalle: 'Modificación del Reglamento de Organización Interna (D.E. N° 72 de 10-01-2023), aprobada por el Concejo Municipal en sesión ordinaria N° 07 de 04-02-2025.',
};

const R = (art) => `Reglamento N° 12/2025, art. ${art}`;

// type: municipalidad | alcaldia | concejo | direccion | departamento | seccion | oficina | unidad | programa | juzgado
// gestionPropia: las jefaturas superiores no heredan acceso operativo (agendas, turnos,
// expedientes); el organigrama y la cadena jerárquica siguen siendo los mismos.
export const ORGANIGRAMA_MELIPEUCO = [
  { id: 'dep-muni', code: 'MUNI', name: 'Municipalidad de Melipeuco', short: 'Municipalidad', type: 'municipalidad', parentId: null, color: '#1f3a5f', icon: 'building', norma: R('2'),
    funciones: ['Corporación autónoma de derecho público constituida por el Alcalde y el Concejo (Ley 18.695).'] },

  // ---------------- Alcaldía ----------------
  { id: 'dep-alcaldia', code: 'ALC', name: 'Alcaldía', short: 'Alcaldía', type: 'alcaldia', parentId: 'dep-muni', color: '#7a5a1e', icon: 'star', norma: R('3'),
    funciones: ['Dirección y administración superior y supervigilancia del funcionamiento de la Municipalidad.', 'Proponer iniciativas al Concejo; nombrar y remover a los funcionarios de su dependencia.', 'Velar por la observancia del principio de probidad administrativa.', 'Administrar los recursos financieros y ejercer las atribuciones de los arts. 63 y 65 de la Ley 18.695.'] },
  { id: 'dep-gabinete', code: 'GAB', name: 'Oficina de Gabinete', short: 'Gabinete', type: 'oficina', parentId: 'dep-alcaldia', color: '#7a5a1e', icon: 'star', norma: R('4'),
    funciones: ['Mantener informada a la comunidad de las actividades del Municipio.', 'Colaborar en situaciones que requieren pronunciamiento o decisión directa del Alcalde.', 'Programar y coordinar las actividades administrativas y protocolares del Alcalde.', 'Supervisar la atención de público, la programación de audiencias y el apoyo directo al Alcalde.', 'Coordinar ceremonias y actividades donde participe la autoridad comunal y cuidar el protocolo.'] },
  { id: 'dep-comunicaciones', code: 'COM', name: 'Oficina de Comunicaciones, Relaciones Públicas y Protocolo', short: 'Comunicaciones', type: 'oficina', parentId: 'dep-alcaldia', color: '#a16207', icon: 'megaphone', norma: R('5'),
    funciones: ['Crear y mantener canales de información entre el Municipio y la comunidad.', 'Relación con medios de prensa; comunicados, cuñas radiales y registro fotográfico y audiovisual.', 'Mantener actualizada la página web municipal, sus diarios digitales y la agenda municipal.', 'Formatos tipo de comunicación municipal y correcto uso de logos y frases institucionales.', 'Transmitir las sesiones del Concejo y publicar sus grabaciones dentro de 72 horas, disponibles por al menos tres años (Ley 21.534).'] },

  // ---------------- Órganos colegiados ----------------
  { id: 'dep-concejo', code: 'CONCEJO', name: 'Concejo Municipal', short: 'Concejo', type: 'concejo', parentId: 'dep-muni', color: '#334155', icon: 'people', norma: R('2'),
    funciones: ['Órgano normativo, resolutivo y fiscalizador (Ley 18.695, título III).', 'Sesiones, acuerdos y actas a cargo de la Secretaría Municipal como ministro de fe.'] },
  { id: 'dep-cosoc', code: 'COSOC', name: 'Consejo Comunal de Organizaciones de la Sociedad Civil (COSOC)', short: 'COSOC', type: 'concejo', parentId: 'dep-muni', color: '#475569', icon: 'people', norma: R('2'),
    funciones: ['Órgano asesor para asegurar la participación de la comunidad en el progreso económico, social y cultural de la comuna.', 'Lo preside el Alcalde y actúa como secretaria la Secretaría Municipal.'] },

  // ---------------- Administración Municipal ----------------
  { id: 'dep-admin', code: 'ADM', name: 'Administración Municipal', short: 'Administración Municipal', type: 'direccion', parentId: 'dep-muni', color: '#1e40af', icon: 'building', norma: R('8 y 9'),
    funciones: ['Coordinar y gestionar permanentemente todas las unidades municipales según las instrucciones del Alcalde.', 'Colaborar en la elaboración y seguimiento del Plan Anual de Acción Municipal.', 'Ejercer las atribuciones que le delegue expresamente el Alcalde.', 'Presidir el Comité Técnico Administrativo.', 'Analizar y actualizar reglamentos, manuales de organización, procedimientos y descripciones de cargos.', 'Coordinar y controlar la fiscalización en materias de tránsito, obras y patentes.', 'Coordinar programas de igualdad de oportunidades entre hombres y mujeres.', 'Elaborar el presupuesto municipal con Finanzas y SECPLAN; informar a la SUBDERE.'] },
  { id: 'dep-juridico', code: 'JUR', name: 'Oficina de Asesoría Jurídica Municipal', short: 'Jurídico', type: 'oficina', parentId: 'dep-admin', color: '#6b21a8', icon: 'scale', norma: R('10'),
    funciones: ['Participar en juicios en que la Municipalidad sea parte o tenga interés.', 'Prestar apoyo legal al Alcalde y al Concejo y orientación jurídica a la comunidad cuando proceda.', 'Informar en derecho los asuntos legales de las direcciones, con archivo actualizado y considerando la jurisprudencia de la Contraloría.', 'Apoyar la redacción de ordenanzas, reglamentos, instructivos, convenios y contratos.', 'Cobranza judicial de impuestos, derechos y otros ingresos municipales.', 'Atender requerimientos de la Contraloría y efectuar investigaciones y sumarios administrativos cuando lo ordene el Alcalde.'] },
  { id: 'dep-cta', code: 'CTA', name: 'Comité Técnico Administrativo', short: 'Comité Técnico', type: 'concejo', parentId: 'dep-admin', color: '#1e3a8a', icon: 'people', norma: R('11'),
    funciones: ['Instancia asesora del Alcalde, presidida por el Administrador Municipal e integrada por los directivos.', 'Difundir y analizar políticas, planes, programas y proyectos de desarrollo comunal.', 'Proponer estrategias operativas y mejoras de procedimientos administrativos internos.', 'Evaluar el cumplimiento de políticas, planes e instrucciones de la autoridad.'] },

  // ---------------- Secretaría Municipal ----------------
  { id: 'dep-secmun', code: 'SECMUN', name: 'Secretaría Municipal', short: 'Secretaría Municipal', type: 'direccion', parentId: 'dep-muni', color: '#5b4b8a', icon: 'stamp', norma: R('12'),
    funciones: ['Dirigir la secretaría administrativa del Alcalde y del Concejo.', 'Ministro de fe en todas las actuaciones municipales (incluido art. 177 del Código del Trabajo).', 'Recibir, mantener y tramitar las declaraciones de intereses y patrimonio.', 'Funciones de la Ley 19.418 sobre juntas de vecinos y organizaciones comunitarias.', 'Transcribir resoluciones del Alcalde y acuerdos del Concejo y velar por su cumplimiento.', 'Mantener el Registro de Personas Jurídicas Receptoras de Fondos Públicos.', 'Otorgar copias autorizadas de documentación no reservada.'] },
  { id: 'dep-partes', code: 'PARTES', name: 'Oficina de Partes y Archivo', short: 'Oficina de Partes', type: 'oficina', parentId: 'dep-secmun', color: '#6d28d9', icon: 'inbox', norma: R('13'),
    funciones: ['Flujo, control, archivo y conservación de toda la documentación que ingresa y egresa de la Municipalidad.', 'Registros numerados correlativos de decretos, reglamentos, ordenanzas, oficios y resoluciones.', 'Ingreso, clasificación y distribución de la correspondencia oficial.', 'Archivo central de la documentación oficial.', 'Control de plazos de tramitación conforme a la Ley 19.880 e informar al público el estado de sus presentaciones.', 'Recibir presentaciones y reclamos según la Ordenanza de Participación Ciudadana.', 'Distribuir copias de decretos, reglamentos, ordenanzas y circulares.'] },
  { id: 'dep-oirs', code: 'OIRS', name: 'Oficina de Informaciones, Reclamos y Sugerencias (OIRS)', short: 'OIRS', type: 'oficina', parentId: 'dep-secmun', color: '#7c3aed', icon: 'help', norma: R('14'),
    funciones: ['Informar sobre la organización, competencias, requisitos, plazos y procedimientos de las prestaciones municipales.', 'Recibir sugerencias y reclamos (libro foliado) y remitirlos mensualmente a la Administración Municipal.', 'Realizar encuestas de satisfacción sobre las prestaciones y la calidad de la atención.'],
    servicios: ['Información', 'Reclamo', 'Sugerencia', 'Felicitación', 'Otro'] },
  { id: 'dep-transparencia', code: 'TRANSP', name: 'Oficina Municipal de Transparencia', short: 'Transparencia', type: 'oficina', parentId: 'dep-secmun', color: '#0e7490', icon: 'eye', norma: R('15'),
    funciones: ['Cumplir la Ley 20.285 manteniendo permanentemente actualizados los antecedentes del art. 7 (transparencia activa).', 'Velar por la entrega de información en los plazos legales y hacer seguimiento de las solicitudes de acceso.', 'Archivar física o digitalmente todas las solicitudes ingresadas.', 'Coordinarse con el Concejo; elaborar manuales y procedimientos de transparencia; capacitar a los funcionarios.', 'Informar al Alcalde sobre la gestión interna de transparencia.'] },
  { id: 'dep-sec-cosoc', code: 'SECOSOC', name: 'Secretaría del Consejo Comunal de Organizaciones de la Sociedad Civil', short: 'Secretaría COSOC', type: 'oficina', parentId: 'dep-secmun', color: '#8b5cf6', icon: 'note', norma: R('16'),
    funciones: ['Redactar y archivar las actas.', 'Preparar la documentación para los consejeros.', 'Formar el protocolo encuadernado y sellado con índice numérico de actos decisorios y actas.'] },

  // ---------------- DIDECO ----------------
  { id: 'dep-dideco', code: 'DIDECO', name: 'Dirección de Desarrollo Comunitario', short: 'DIDECO', type: 'direccion', parentId: 'dep-muni', color: '#16a085', icon: 'people', norma: R('17 y 18'),
    funciones: ['Asesorar al Alcalde y al Concejo en la promoción del desarrollo comunitario.', 'Asesoría técnica a organizaciones comunitarias, su desarrollo, legalización y participación.', 'Acciones en salud pública, medio ambiente, educación y cultura, capacitación laboral, deporte, empleo, fomento productivo y turismo.', 'Asistencia social, incluida la paliativa en emergencias según el reglamento de ayudas sociales.', 'Diagnósticos socioeconómicos y registros actualizados; administrar programas sociales de cobertura nacional.', 'Mantener bodega para atender estados de necesidad manifiesta y registro de atenciones y prestaciones.'] },
  { id: 'dep-dideco-social', code: 'DDS', name: 'Departamento de Desarrollo Social', short: 'Desarrollo Social', type: 'departamento', parentId: 'dep-dideco', color: '#0d9488', icon: 'heart', norma: R('19'),
    funciones: ['Mejorar la situación de pobreza y vulnerabilidad en la comuna.', 'Diagnósticos socioeconómicos y registro actualizado.', 'Administrar proyectos de cobertura nacional para personas vulnerables.', 'Orientar sobre beneficios sociales, su difusión y postulación.', 'Atender casos sociales, emergencias y necesidad manifiesta; administrar las bodegas del departamento.'] },
  { id: 'dep-asistencia-social', code: 'ASOC', name: 'Oficina de Asistencia Social', short: 'Asistencia Social', type: 'oficina', parentId: 'dep-dideco-social', color: '#0f766e', icon: 'heart', norma: R('20'),
    funciones: ['Diagnósticos de problemas sociales y sectores afectados.', 'Resguardar el tratamiento de datos sensibles de las personas atendidas; discreción y reserva de los casos sociales.', 'Protocolos de atención de casos sociales y trabajo en red.', 'Velar por que las ayudas lleguen a los casos autorizados; inventario de bodegas; decretos de ayudas sociales.'],
    servicios: ['Atención asistente social', 'Ayuda social', 'Registro Social de Hogares', 'Informe social', 'Otro'] },
  { id: 'dep-vivienda', code: 'VIV', name: 'Oficina de Vivienda', short: 'Vivienda', type: 'oficina', parentId: 'dep-dideco-social', color: '#0f766e', icon: 'home', norma: R('23'),
    funciones: ['Asesorar a postulantes a viviendas sociales y subsidios habitacionales, en coordinación con el SERVIU.', 'Orientar la creación de comités y organizar la demanda.', 'Formar expedientes administrativos, técnicos y sociales para postulaciones.', 'Diseñar proyectos técnicos y apoyar la inspección de obras en terreno.'] },
  { id: 'dep-subsidios', code: 'SUBS', name: 'Oficina de Subsidios y Pensiones', short: 'Subsidios y Pensiones', type: 'oficina', parentId: 'dep-dideco-social', color: '#0f766e', icon: 'cash', norma: R('24'),
    funciones: ['Administrar pensiones y subsidios de la red social con atención expedita.', 'Aplicar subsidios según antecedentes, diagnóstico y estratificación social, priorizando la extrema pobreza.'] },
  { id: 'dep-uamis', code: 'UAMIS', name: 'Oficina de Adulto Mayor e Inclusión Social (UAMIS)', short: 'Adulto Mayor e Inclusión', type: 'oficina', parentId: 'dep-dideco-social', color: '#0f766e', icon: 'user2', norma: R('25'),
    funciones: ['Planes y programas de desarrollo social del adulto mayor y de inclusión de personas con discapacidad o dependencia.', 'Catastro de organizaciones de adultos mayores y de personas con discapacidad y sus socios.', 'Asesorar en personalidad jurídica, proyectos y su ejecución; supervisar proyectos adjudicados.'] },
  { id: 'dep-deportes', code: 'DEP', name: 'Oficina de Deportes y Recreación', short: 'Deportes', type: 'oficina', parentId: 'dep-dideco-social', color: '#0f766e', icon: 'award', norma: R('26'),
    funciones: ['Organizar y ejecutar programas deportivos y recreativos.', 'Fomentar la participación de organizaciones y sectores; coordinar con instituciones públicas y privadas.'] },
  { id: 'dep-mujer', code: 'MUJ', name: 'Oficina de la Mujer y Equidad de Género', short: 'Mujer y Equidad', type: 'oficina', parentId: 'dep-dideco-social', color: '#be185d', icon: 'heart', norma: R('27'),
    funciones: ['Mejorar la calidad de vida de las mujeres, su empoderamiento y autonomía.', 'Informar sobre derechos y servicios; capacitación; liderazgo y asociatividad.', 'Redes de apoyo local, incluida la red de no violencia contra la mujer.'] },
  { id: 'dep-juventud', code: 'JUV', name: 'Oficina de la Juventud', short: 'Juventud', type: 'oficina', parentId: 'dep-dideco-social', color: '#0f766e', icon: 'sparkles', norma: R('28'),
    funciones: ['Integración, información y participación de jóvenes y adolescentes.', 'Apoyo técnico a organizaciones juveniles en proyectos y fondos concursables.', 'Capacitación y redes de apoyo (cultura, deporte, inserción educacional y laboral).'] },
  { id: 'dep-dideco-comunitario', code: 'DDC', name: 'Departamento de Desarrollo Comunitario', short: 'Desarrollo Comunitario', type: 'departamento', parentId: 'dep-dideco', color: '#0d9488', icon: 'people', norma: R('21') },
  { id: 'dep-organizaciones', code: 'OOCC', name: 'Oficina de Organizaciones Comunitarias', short: 'Organizaciones Comunitarias', type: 'oficina', parentId: 'dep-dideco-comunitario', color: '#0f766e', icon: 'people', norma: R('22'),
    funciones: ['Promover la organización, consolidación y participación de las organizaciones comunitarias.', 'Orientar y capacitar a la comunidad organizada; asesorar el cumplimiento de la Ley 19.418.', 'Registro interno de organizaciones comunales.', 'Formular proyectos y asesorar postulaciones al Fondo de Desarrollo Vecinal.', 'Tramitar personalidad jurídica e incentivar la legalización de organizaciones.'] },
  { id: 'dep-del', code: 'DEL', name: 'Departamento de Desarrollo Económico Local', short: 'Desarrollo Económico Local', type: 'departamento', parentId: 'dep-dideco', color: '#15803d', icon: 'chart', norma: R('29'),
    funciones: ['Políticas para aumentar las fuentes productivas de la comuna.', 'Coordinar con organismos agropecuarios y forestales en apoyo a la pequeña empresa campesina.', 'Estadísticas de la situación económica rural; información de apoyo a contribuyentes (cartografía, censos, análisis de aguas).', 'Proyectos de riego y drenaje; saneamiento de títulos rurales; derechos de agua.', 'Tenencia responsable de mascotas.', 'Coordinar y rendir programas de fomento productivo (PDTI, PRODESAL, PRODEMU, entre otros).'] },
  { id: 'dep-fomento', code: 'FOM', name: 'Oficina de Promoción del Fomento Productivo Local', short: 'Fomento Productivo', type: 'oficina', parentId: 'dep-del', color: '#15803d', icon: 'chart', norma: R('30'),
    funciones: ['Promover fuentes productivas y capacidades locales.', 'Promover la regularización de emprendimientos locales.', 'Gestionar ferias de emprendimiento dentro y fuera de la comuna.'] },
  { id: 'dep-hidricos', code: 'RRHHID', name: 'Oficina de Recursos Hídricos y Saneamiento de Títulos', short: 'Recursos Hídricos y Títulos', type: 'oficina', parentId: 'dep-del', color: '#0369a1', icon: 'map', norma: R('31'),
    funciones: ['Asesoría en acceso y manejo del agua; información sobre la Ley 21.435 (Reforma al Código de Aguas).', 'Apoyo en proyectos de riego y saneamiento de títulos de dominio.', 'Línea base, plan anual de trabajo y difusión; registro actualizado de datos comunales.'] },
  { id: 'dep-turismo', code: 'TUR', name: 'Oficina de Turismo', short: 'Turismo', type: 'oficina', parentId: 'dep-del', color: '#15803d', icon: 'map', norma: R('32'),
    funciones: ['Políticas, planes y proyectos de promoción del turismo.', 'Vínculo con SERNATUR y el sector privado turístico.', 'Difusión y estudios del potencial turístico comunal.'] },
  { id: 'dep-cultura', code: 'CUL', name: 'Oficina de Cultura', short: 'Cultura', type: 'oficina', parentId: 'dep-del', color: '#9333ea', icon: 'book', norma: R('33'),
    funciones: ['Protección de bienes y monumentos nacionales de incidencia comunal.', 'Fomentar museos, bibliotecas y centros culturales; administrar la biblioteca municipal.', 'Concursos, talleres, exposiciones, conciertos y efemérides.', 'Programas de mejoramiento en educación pública no traspasada.'] },
  { id: 'dep-programas', code: 'DPS', name: 'Departamento de Programas Sociales', short: 'Programas Sociales', type: 'departamento', parentId: 'dep-dideco', color: '#0d9488', icon: 'layers', norma: R('34'),
    funciones: ['Implementar, coordinar y rendir los programas sociales de Gobierno en convenio (niñez, adolescencia, mujeres, adultos mayores, dependencia y otros).', 'Contraparte de los programas; fiscalizar rendiciones y cumplimiento de metas.', 'Registro actualizado de los programas en convenio y sus usuarios.'] },
  { id: 'dep-coord-programas', code: 'CPS', name: 'Oficina de Coordinación de Programas Sociales', short: 'Coordinación de Programas', type: 'oficina', parentId: 'dep-programas', color: '#0d9488', icon: 'layers', norma: R('35'),
    funciones: ['Coordinar los programas sociales que administra el Municipio.', 'Registro administrativo y de usuarios de cada programa; agenda de atención.', 'Oferta de servicios y cobertura actualizada.'] },
  { id: 'dep-rendiciones', code: 'RPS', name: 'Oficina de Rendiciones de Programas Sociales', short: 'Rendiciones', type: 'oficina', parentId: 'dep-programas', color: '#0d9488', icon: 'cash', norma: R('36'),
    funciones: ['Revisión periódica de la ejecución de los programas en convenio.', 'Rendir los recursos en plazo y en las plataformas ministeriales; registro de rendiciones.', 'Alertas por retraso en el uso de recursos; cierres y reintegros.'] },

  // ---------------- DOM ----------------
  { id: 'dep-dom', code: 'DOM', name: 'Dirección de Obras Municipales', short: 'Obras (DOM)', type: 'direccion', parentId: 'dep-muni', color: '#8e6e3a', icon: 'tool', norma: R('37 y 38'),
    funciones: ['Velar por el cumplimiento de la Ley General de Urbanismo y Construcciones, el Plan Regulador y las ordenanzas.', 'Aprobar subdivisiones, proyectos de urbanización y construcción; otorgar permisos de edificación, fiscalizar y recibir obras.', 'Fiscalizar obras en uso y aplicar normas ambientales de construcción.', 'Catastro de obras de urbanización y edificación.', 'Vialidad urbana y rural; construcciones municipales; bases técnicas y fiscalización de contratos de obras.', 'Mantención y proyectos de alumbrado público, aceras y pavimentos.'] },
  { id: 'dep-edificacion', code: 'EDIF', name: 'Oficina de Edificación y Urbanización', short: 'Edificación', type: 'oficina', parentId: 'dep-dom', color: '#8e6e3a', icon: 'building', norma: R('39'),
    funciones: ['Revisar y aprobar proyectos de subdivisión, fusión, loteo, urbanización y construcción.', 'Girar los derechos municipales de permisos y servicios de la DOM.', 'Otorgar permisos y certificados para la ejecución y recepción de obras; recibir obras y autorizar su uso.'],
    servicios: ['Permiso de edificación', 'Recepción de obras', 'Certificados (número, informaciones previas)', 'Subdivisión / fusión', 'Consultas'] },
  { id: 'dep-inspeccion-dom', code: 'INSPDOM', name: 'Oficina de Inspección de Obras', short: 'Inspección DOM', type: 'oficina', parentId: 'dep-dom', color: '#8e6e3a', icon: 'eye', norma: R('40'),
    funciones: ['Fiscalizar obras de edificación, ampliación, remodelación y demolición.', 'Fiscalizar la normativa de instalación de locales comerciales, estacionamientos, establecimientos y hoteles.', 'Inspeccionar obras en uso.'] },
  { id: 'dep-catastro', code: 'CAT', name: 'Oficina de Catastros y Archivos', short: 'Catastro y Archivo DOM', type: 'oficina', parentId: 'dep-dom', color: '#8e6e3a', icon: 'archive', norma: R('41'),
    funciones: ['Catastro actualizado de obras de urbanización y edificación.', 'Informes de uso de suelo para patentes, permisos y concesiones.', 'Archivo de la documentación de la Dirección de Obras.'] },
  { id: 'dep-emergencia', code: 'EMER', name: 'Oficina de Emergencia y Protección Civil', short: 'Emergencias', type: 'oficina', parentId: 'dep-dom', color: '#dc2626', icon: 'alert', norma: R('42'),
    funciones: ['Prevención, mitigación, atención, control y recuperación ante emergencias y catástrofes.', 'Planificar y coordinar el Comité de Emergencia Comunal y el COE; comités vecinales de protección civil.', 'Base de datos de emergencias y mapa de riesgos y vulnerabilidad de la comuna.', 'Centro de comunicaciones comunal y equipos de radiocomunicación.', 'Coordinar a Salud, Bomberos, Carabineros, PDI, CONAF, empresas de servicios y otros.'] },
  { id: 'dep-cementerios', code: 'CEM', name: 'Oficina de Cementerios', short: 'Cementerios', type: 'oficina', parentId: 'dep-dom', color: '#57534e', icon: 'building', norma: R('43'),
    funciones: ['Dirección administrativa y gestión de los cementerios municipales (Ley 18.096).', 'Cumplir el Código Sanitario y el Reglamento General de Cementerios (D.S. 357/1970).'] },
  { id: 'dep-aseo', code: 'ASEO', name: 'Oficina de Aseo y Ornato', short: 'Aseo y Ornato', type: 'oficina', parentId: 'dep-dom', color: '#4d7c0f', icon: 'leaf', norma: R('44 y 45'),
    funciones: ['Aseo de vías públicas, parques, jardines y bienes nacionales de uso público.', 'Extracción y disposición final de residuos, o control del servicio concesionado.', 'Áreas verdes y ornato; catastro de plazas y arbolado.', 'Retiro de escombros, vehículos, especies y animales abandonados.', 'Denunciar infracciones de aseo al Juzgado de Policía Local.'] },
  { id: 'dep-vehiculos', code: 'VEH', name: 'Oficina de Vehículos', short: 'Vehículos', type: 'oficina', parentId: 'dep-dom', color: '#57534e', icon: 'truck', norma: R('46'),
    funciones: ['Coordinación y mantención de los vehículos municipales y sus contratos de reparación.', 'Calendarizar el uso de vehículos y maquinaria; catastro con carpeta al día.', 'Velar por el correcto uso de los vehículos municipales.'] },
  { id: 'dep-medioambiente', code: 'DMA', name: 'Oficina de Medio Ambiente', short: 'Medio Ambiente', type: 'oficina', parentId: 'dep-dom', color: '#27ae60', icon: 'leaf', norma: R('47'),
    funciones: ['Asesorar en planificación, gestión y control ambiental del territorio comunal.', 'Proyectos y programas ambientales con el Ministerio del Medio Ambiente.', 'Participar en la evaluación ambiental de proyectos (SEIA).', 'Recibir denuncias ambientales y coordinar su fiscalización.', 'Educación ambiental y estrategia de conservación de la biodiversidad.'] },
  { id: 'dep-transito', code: 'TRA', name: 'Departamento de Tránsito y Transporte Público', short: 'Tránsito', type: 'departamento', parentId: 'dep-dom', color: '#c0392b', icon: 'car', norma: R('48'), modules: ['transito'], gestionPropia: true,
    funciones: ['Otorgar y renovar licencias de conducir.', 'Determinar el sentido de circulación de vehículos con los organismos competentes.', 'Señalizar adecuadamente las vías públicas.', 'Aplicar las normas de tránsito y transporte público en la comuna.', 'Otorgar y renovar permisos de circulación.'] },
  { id: 'dep-transito-lic', code: 'TRA-LIC', name: 'Oficina de Licencias de Conducir', short: 'Licencias', type: 'oficina', parentId: 'dep-transito', color: '#c0392b', icon: 'id', norma: R('49'),
    funciones: ['Otorgar, renovar, restringir o denegar licencias de conducir.', 'Solicitar el certificado de antecedentes del conductor al Registro Civil.', 'Efectuar los exámenes para el otorgamiento o renovación.', 'Registro de licencias otorgadas y denegadas e informe al Registro Nacional de Conductores.', 'Giro de derechos municipales y estadísticas para organismos del Estado.'] },
  { id: 'dep-transito-pc', code: 'TRA-PC', name: 'Oficina de Permisos de Circulación', short: 'Permisos de circulación', type: 'oficina', parentId: 'dep-transito', color: '#d35400', icon: 'doc', norma: R('50'),
    funciones: ['Otorgar y renovar permisos de circulación y sus duplicados.', 'Registro comunal de permisos de circulación; informar o rechazar traslados.', 'Giro de derechos y estadísticas para organismos del Estado.'] },
  { id: 'dep-transito-senal', code: 'TRA-SEN', name: 'Oficina de Señalización Vial', short: 'Señalización vial', type: 'oficina', parentId: 'dep-transito', color: '#b45309', icon: 'map', norma: R('51'),
    funciones: ['Mantener señalizadas las vías públicas urbanas.', 'Cumplir normas e instrucciones del Ministerio de Transportes.', 'Proponer el sentido de circulación y evacuar informes técnicos de tránsito.'] },

  // ---------------- DAF ----------------
  { id: 'dep-daf', code: 'DAF', name: 'Dirección de Administración y Finanzas', short: 'Administración y Finanzas', type: 'direccion', parentId: 'dep-muni', color: '#b45309', icon: 'cash', norma: R('52'),
    funciones: ['Asesorar al Alcalde en la administración del personal y financiera de los bienes municipales.', 'Estudiar, calcular, proponer y regular la percepción de ingresos municipales.', 'Colaborar con SECPLAN en el presupuesto municipal.', 'Visar los decretos que irroguen gastos o generen recursos.', 'Llevar la contabilidad municipal según la normativa de la Contraloría.', 'Efectuar los pagos, manejar la cuenta corriente y rendir cuenta a la Contraloría; recaudar ingresos.'] },
  { id: 'dep-contabilidad', code: 'CONT', name: 'Oficina de Contabilidad y Presupuesto', short: 'Contabilidad y Presupuesto', type: 'oficina', parentId: 'dep-daf', color: '#b45309', icon: 'chart', norma: R('53'),
    funciones: ['Contabilidad patrimonial y presupuestaria; balance anual.', 'Valor actualizado de activos y pasivos; revalorizaciones y depreciaciones.', 'Control de ingresos y egresos; registro de obligaciones financieras con terceros.', 'Refrendar e imputar presupuestariamente los egresos e ingresos.', 'Formar y custodiar los expedientes de rendiciones de cuenta para la Contraloría.'] },
  { id: 'dep-tesoreria', code: 'TES', name: 'Oficina de Tesorería Municipal', short: 'Tesorería', type: 'oficina', parentId: 'dep-daf', color: '#a16207', icon: 'cash', norma: R('54'),
    funciones: ['Recaudar tributos e ingresos municipales; custodiar fondos, especies valoradas y garantías.', 'Pagar las obligaciones municipales y depositar lo recaudado.', 'Rendición mensual de caja con conciliaciones bancarias.', 'Establecer cajas recaudadoras; actuar como martillero en remates municipales.'],
    servicios: ['Pago de derechos', 'Pago de patentes', 'Pago de permiso de circulación', 'Otro'] },
  { id: 'dep-rentas', code: 'RYP', name: 'Oficina de Patentes Municipales', short: 'Patentes', type: 'oficina', parentId: 'dep-daf', color: '#b7950b', icon: 'cash', norma: R('55'),
    funciones: ['Tramitar otorgamiento, traslado, transferencia y caducidad de patentes comerciales, industriales, de alcoholes y profesionales.', 'Registro de patentes y de propaganda comercial.', 'Análisis de las declaraciones de capital propio.', 'Permisos y concesiones sobre bienes nacionales de uso público para actividades lucrativas.', 'Apoyo en permisos de circulación: registro comunal, traslados y giro del impuesto.'] },
  { id: 'dep-inspeccion-daf', code: 'INSP', name: 'Oficina de Inspección Municipal', short: 'Inspección Municipal', type: 'oficina', parentId: 'dep-daf', color: '#a16207', icon: 'eye', norma: R('56'),
    funciones: ['Planificar la fiscalización externa en materias normativas y tributarias.', 'Controlar comercio establecido y ambulante, Ley de Alcoholes, ferias y mercados.', 'Colaborar en el control de la Ley de Tránsito y de las normas de edificación.', 'Controlar ruidos molestos, contaminación y propaganda en la vía pública.', 'Denunciar infracciones al Juzgado de Policía Local y hacer efectivas las clausuras.'] },
  { id: 'dep-rrhh', code: 'RRHH', name: 'Departamento de Recursos Humanos', short: 'Recursos Humanos', type: 'departamento', parentId: 'dep-daf', color: '#9a3412', icon: 'people', norma: R('57'),
    funciones: ['Proponer políticas de administración de personal y aplicar la carrera funcionaria.', 'Registros del personal: nombramientos, calificaciones, escalafones, medidas disciplinarias, permisos y feriados.', 'Tramitar nombramientos, renuncias, permisos y feriados; resoluciones finales de sumarios.', 'Planes de capacitación y evaluación del desempeño.', 'Higiene y ambiente de trabajo; programas de prevención de riesgos.', 'Sistemas de control de asistencia y horario del personal municipal.'] },
  { id: 'dep-prevencion', code: 'PREV', name: 'Oficina de Prevención de Riesgos', short: 'Prevención de Riesgos', type: 'oficina', parentId: 'dep-rrhh', color: '#9a3412', icon: 'shield', norma: R('58'),
    funciones: ['Evaluar y controlar riesgos de accidentes y enfermedades profesionales.', 'Educación preventiva y capacitación; estadísticas.', 'Asesorar a los comités paritarios.', 'Protocolos para el bienestar físico y emocional; investigaciones de puestos de trabajo ante denuncias de acoso laboral.', 'Encuesta anual de satisfacción de trabajadores.'] },
  { id: 'dep-remuneraciones', code: 'REM', name: 'Oficina de Remuneraciones', short: 'Remuneraciones', type: 'oficina', parentId: 'dep-daf', color: '#9a3412', icon: 'cash', norma: R('59'),
    funciones: ['Calcular, registrar y pagar las remuneraciones y planillas de cotizaciones.', 'Retenciones judiciales y descuentos; certificados de remuneraciones.', 'Conciliación de la cuenta de remuneraciones dentro de los primeros cinco días hábiles del mes.', 'Control presupuestario del gasto en personal.'] },
  { id: 'dep-adquisiciones', code: 'ADQ', name: 'Oficina de Adquisiciones', short: 'Adquisiciones', type: 'oficina', parentId: 'dep-daf', color: '#c2410c', icon: 'list', norma: R('60'),
    funciones: ['Recibir solicitudes de compra, cotizar y emitir órdenes de compra.', 'Registro y precalificación de proveedores.', 'Colaborar con SECPLAN en bases de licitación.', 'Archivo de órdenes de compra, facturas y propuestas.', 'Enajenación de bienes; comisión de compras (Adquisiciones, Administración Municipal, Control y Finanzas).'] },
  { id: 'dep-inventario', code: 'INV', name: 'Oficina de Activo Fijo, Inventarios y Bodega', short: 'Inventario y Bodega', type: 'oficina', parentId: 'dep-daf', color: '#c2410c', icon: 'archive', norma: R('61'),
    funciones: ['Registros e inventarios valorados de bienes municipales por dependencia.', 'Altas y bajas de especies; decretos de baja y remates.', 'Inventarios generales, rotativos y selectivos.', 'Recepción, almacenamiento y distribución de materiales; stock mínimo.', 'Registro de inmuebles arrendados.'] },

  // ---------------- Control ----------------
  { id: 'dep-control', code: 'CTRL', name: 'Dirección de Control', short: 'Control', type: 'direccion', parentId: 'dep-muni', color: '#0f766e', icon: 'eye', norma: R('62'),
    funciones: ['Auditoría operativa interna para fiscalizar la legalidad y eficiencia de la actuación municipal.', 'Controlar la ejecución financiera y presupuestaria; informe trimestral al Concejo.', 'Representar al Alcalde los actos que estime ilegales, con acceso a toda la documentación pertinente.', 'Colaborar con el Concejo en su función fiscalizadora y responder por escrito a los concejales.', 'Atender a la Contraloría General, de la que depende técnicamente.', 'Revisar rendiciones de cuenta, inventarios e imputaciones contables.'] },
  { id: 'dep-auditoria', code: 'AUD', name: 'Oficina de Auditorías y Revisión', short: 'Auditorías', type: 'oficina', parentId: 'dep-control', color: '#0f766e', icon: 'search', norma: R('63'),
    funciones: ['Auditoría operativa interna bajo la supervisión del Director de Control.', 'Antecedentes para el control financiero y presupuestario.', 'Constatar imputaciones contables y comprobar inventarios físicos.'] },

  // ---------------- SECPLAN ----------------
  { id: 'dep-secplan', code: 'SECPLAN', name: 'Secretaría Comunal de Planificación', short: 'SECPLAN', type: 'direccion', parentId: 'dep-muni', color: '#1d4ed8', icon: 'map', norma: R('64 y 65'),
    funciones: ['Secretaría técnica permanente del Alcalde y del Concejo en políticas, planes, programas y proyectos.', 'Elaborar y actualizar el Plan de Desarrollo Comunal (PLADECO) y asesorar en el presupuesto.', 'Estudios y evaluación del desarrollo comunal; Plan Municipal de Inversiones.', 'Información de proyectos de inversión para su aprobación y seguimiento.', 'Coordinar solicitudes de subvención; nexo con la planificación regional.'] },
  { id: 'dep-informatica', code: 'INF', name: 'Oficina de Desarrollo Informático y Transformación Digital Municipal', short: 'Informática y TD', type: 'oficina', parentId: 'dep-secplan', color: '#2c3e50', icon: 'cpu', norma: R('66'),
    funciones: ['Administrar los sistemas de información, redes y equipos computacionales.', 'Liderar la Transformación Digital en el marco de la Ley 21.180 y apoyar su implementación.', 'Estrategias, reglamentos y manuales de digitalización de procesos.', 'Soporte y capacitación a usuarios internos; contraparte técnica de servicios informáticos contratados.', 'Integridad de la información y planes de contingencia.', 'Estadísticas y bases de datos integradas para la toma de decisiones.'] },

  // ---------------- Servicios incorporados ----------------
  { id: 'dep-dsi', code: 'DSI', name: 'Dirección de Servicios Incorporados a la Gestión Municipal', short: 'Servicios Incorporados', type: 'direccion', parentId: 'dep-muni', color: '#4338ca', icon: 'layers', norma: R('67'),
    funciones: ['Asesorar al Alcalde y al Concejo en salud y educación municipal.', 'Administrar los recursos humanos, materiales y financieros de los servicios traspasados.', 'Controlar la transferencia de recursos del Servicio de Salud y del Ministerio de Educación y su rendición.', 'Registro de convenios vigentes.'] },
  { id: 'dep-salud', code: 'DESAM', name: 'Departamento de Salud Municipal', short: 'Salud', type: 'departamento', parentId: 'dep-dsi', color: '#2980b9', icon: 'heart', norma: R('68'), gestionPropia: true,
    funciones: ['Asegurar la atención de los establecimientos de salud municipal.', 'Dirección administrativa de los establecimientos de salud.', 'Concursos y provisión de personal; cumplimiento de normas y programas del Ministerio de Salud.'] },
  { id: 'dep-educacion', code: 'DAEM', name: 'Departamento de Educación Municipal', short: 'Educación', type: 'departamento', parentId: 'dep-dsi', color: '#8e44ad', icon: 'book', norma: R('69'),
    funciones: ['Condiciones óptimas para el proceso educativo en los establecimientos municipales.', 'Dirección administrativa de los establecimientos; recursos humanos, financieros y materiales.', 'Capacitación docente y no docente; programas extraescolares; educación de padres y apoderados.'] },

  // ---------------- JPL ----------------
  { id: 'dep-jpl', code: 'JPL', name: 'Juzgado de Policía Local', short: 'JPL', type: 'juzgado', parentId: 'dep-muni', color: '#34495e', icon: 'scale', norma: R('70 y 71'), gestionPropia: true,
    funciones: ['Depende administrativamente de la Municipalidad y técnicamente de la Corte de Apelaciones (Ley 15.231).', 'Conoce infracciones de tránsito y transporte, ordenanzas, rentas municipales, urbanismo, alcoholes y otras leyes especiales.', 'Ley 18.700, Ley 19.303, Ley 19.496 (consumidor), Ley 19.537 (copropiedad) y otras que la ley le encomiende.'] },
];

// Nombres que traía la versión anterior de la plataforma: la migración sólo
// reestructura las dependencias que nadie ha personalizado.
export const NOMBRES_ANTERIORES = {
  'dep-secmun': 'Secretaría Municipal / Oficina de Partes',
  'dep-transito': 'Dirección de Tránsito y Transporte Público',
  'dep-transito-lic': 'Departamento de Licencias de Conducir',
  'dep-transito-pc': 'Permisos de Circulación',
  'dep-medioambiente': 'Departamento de Medio Ambiente, Aseo y Ornato',
  'dep-salud': 'Departamento de Salud Municipal',
  'dep-educacion': 'Departamento de Educación Municipal',
  'dep-rentas': 'Rentas y Patentes',
  'dep-juridico': 'Asesoría Jurídica',
  'dep-control': 'Dirección de Control Interno',
  'dep-informatica': 'Unidad de Informática y Transformación Digital',
  'dep-dom': 'Dirección de Obras Municipales',
  'dep-dideco': 'Dirección de Desarrollo Comunitario',
  'dep-admin': 'Administración Municipal',
  'dep-alcaldia': 'Alcaldía',
  'dep-jpl': 'Juzgado de Policía Local',
  'dep-muni': 'Municipalidad de Melipeuco',
};
