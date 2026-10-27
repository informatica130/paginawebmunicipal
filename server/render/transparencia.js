// Centro de Transparencia: las materias que la Ley 20.285 (art. 7) y la Instrucción General N° 11
// del Consejo para la Transparencia obligan a publicar, explicadas en lenguaje simple y enlazadas
// a la ficha oficial de la Municipalidad de Melipeuco (código MU172) en el Portal de Transparencia
// del Estado, más el derecho de acceso (transparencia pasiva), la Ley del Lobby y la probidad.
// Cada materia lleva palabras clave para que el buscador del sitio la encuentre (por ejemplo,
// «sueldos» lleva a «Personal y remuneraciones»). Todo se puede editar en Extensiones → Transparencia.

import { html, crudo, icono, esc } from './comun.js';

export const PORTAL = 'https://www.portaltransparencia.cl/PortalPdT/directorio-de-organismos-regulados/?org=MU172';
export const SOLICITUD = 'https://www.portaltransparencia.cl/PortalPdT/ingreso-sai-v2?idOrg=608';
export const LOBBY = 'https://www.leylobby.gob.cl/instituciones/MU172';
export const PROBIDAD = 'https://www.infoprobidad.cl/';
export const CONSEJO = 'https://www.consejotransparencia.cl/';

export const CATEGORIAS = [
  { titulo: 'Actos publicados en el Diario Oficial', texto: 'Decretos, ordenanzas y otros actos de la Municipalidad que por ley deben publicarse en el Diario Oficial.', icono: 'documento', url: PORTAL, claves: 'diario oficial decretos publicados ordenanzas publicadas' },
  { titulo: 'Potestades, competencias y funciones', texto: 'Qué puede y qué debe hacer la Municipalidad según la Ley Orgánica Constitucional de Municipalidades (Ley 18.695).', icono: 'escudo', url: PORTAL, claves: 'funciones atribuciones competencias potestades ley 18695 organica municipalidades' },
  { titulo: 'Marco normativo', texto: 'Leyes, reglamentos, ordenanzas y demás normas que rigen el funcionamiento municipal.', icono: 'balanza', url: PORTAL, claves: 'leyes reglamentos ordenanzas normativa normas marco legal' },
  { titulo: 'Estructura orgánica', texto: 'Organigrama de la Municipalidad: alcaldía, direcciones, departamentos y unidades.', icono: 'carpeta', url: PORTAL, claves: 'organigrama estructura direcciones departamentos unidades' },
  { titulo: 'Funciones de cada unidad', texto: 'Las facultades, funciones y atribuciones de cada dirección, departamento y unidad interna.', icono: 'personas', url: PORTAL, claves: 'unidades internas funciones departamentos direcciones facultades' },
  { titulo: 'Personal y remuneraciones', texto: 'Dotación de planta, contrata, honorarios y Código del Trabajo, con sus cargos, grados y remuneraciones; escala de sueldos.', icono: 'usuario', url: PORTAL, claves: 'personal remuneraciones sueldos funcionarios planta contrata honorarios codigo del trabajo escala grados dotacion' },
  { titulo: 'Compras y adquisiciones', texto: 'Licitaciones, compras, contratos y proveedores. Las compras públicas se tramitan en Mercado Público (ChileCompra).', icono: 'billete', url: PORTAL, claves: 'compras adquisiciones licitaciones contratos proveedores ordenes de compra mercado publico chilecompra' },
  { titulo: 'Transferencias de fondos', texto: 'Subvenciones y aportes municipales a organizaciones e instituciones (registro de la Ley 19.862).', icono: 'mano', url: PORTAL, claves: 'transferencias subvenciones aportes organizaciones fondos 19862 juntas de vecinos clubes' },
  { titulo: 'Actos y resoluciones con efectos sobre terceros', texto: 'Decretos alcaldicios, permisos, concesiones, patentes y resoluciones que afectan a personas o empresas.', icono: 'licencia', url: PORTAL, claves: 'decretos alcaldicios resoluciones permisos concesiones patentes actos efectos terceros' },
  { titulo: 'Trámites y requisitos', texto: 'Los trámites que se realizan en la Municipalidad, sus requisitos, costos, plazos y dónde hacerlos.', icono: 'buscar', url: '/tramites/', claves: 'tramites requisitos servicios formularios costos plazos' },
  { titulo: 'Subsidios y beneficios', texto: 'Programas sociales, becas y beneficios municipales: requisitos, cómo postular y nómina de beneficiarios.', icono: 'corazon', url: PORTAL, claves: 'subsidios beneficios programas sociales becas ayudas beneficiarios postular' },
  { titulo: 'Participación ciudadana', texto: 'Mecanismos de participación: Consejo de la Sociedad Civil (COSOC), consultas, audiencias públicas y cuenta pública.', icono: 'chat', url: PORTAL, claves: 'participacion ciudadana cosoc consejo sociedad civil consultas audiencias cuenta publica plebiscito' },
  { titulo: 'Presupuesto y su ejecución', texto: 'Presupuesto municipal aprobado y su ejecución: ingresos, gastos y balance de cada período.', icono: 'grafico', url: PORTAL, claves: 'presupuesto ejecucion presupuestaria ingresos gastos balance finanzas' },
  { titulo: 'Auditorías', texto: 'Resultados de auditorías al ejercicio presupuestario, internas o de la Contraloría General de la República.', icono: 'llave', url: PORTAL, claves: 'auditorias contraloria informes fiscalizacion control' },
  { titulo: 'Participación en otras entidades', texto: 'Asociaciones de municipalidades, corporaciones y fundaciones en las que participa la Municipalidad.', icono: 'enlace', url: PORTAL, claves: 'asociaciones municipios corporaciones fundaciones entidades asociacion chilena de municipalidades' },
  { titulo: 'Instrumentos de planificación', texto: 'PLADECO, plan regulador, presupuesto, ordenanzas, cuentas públicas y otros documentos municipales.', icono: 'libro', url: '/documentos/', claves: 'pladeco plan de desarrollo comunal plan regulador cuenta publica ordenanzas planificacion' },
];

export const DERECHOS = [
  { titulo: 'Solicitar información (transparencia pasiva)', texto: 'Cualquier persona puede pedir información municipal, sin expresar motivo y gratis (salvo costos de reproducción). La Municipalidad debe responder en 20 días hábiles, prorrogables por 10 más.', url: SOLICITUD, icono: 'mano', boton: 'Hacer una solicitud', claves: 'solicitud acceso informacion transparencia pasiva pedir informacion sai 20285' },
  { titulo: 'Ley del Lobby', texto: 'Solicite audiencia con el alcalde, concejales y otros sujetos pasivos, y revise las audiencias, viajes y donativos registrados.', url: LOBBY, icono: 'personas', boton: 'Ir a Ley del Lobby', claves: 'lobby audiencia 20730 viajes donativos alcalde concejales' },
  { titulo: 'Declaraciones de patrimonio e intereses', texto: 'Las autoridades declaran su patrimonio e intereses según la Ley 20.880; se consultan en InfoProbidad.', url: PROBIDAD, icono: 'escudo', boton: 'Ir a InfoProbidad', claves: 'probidad declaraciones patrimonio intereses 20880 infoprobidad' },
  { titulo: 'Si no le responden: amparo', texto: 'Si su solicitud no se responde a tiempo o se niega, puede presentar un reclamo (amparo) ante el Consejo para la Transparencia dentro de 15 días hábiles.', url: CONSEJO, icono: 'balanza', boton: 'Consejo para la Transparencia', claves: 'amparo reclamo consejo para la transparencia cplt denegacion' },
];

export const PASOS = [
  ['Ingrese su solicitud', 'En el Portal de Transparencia, por correo o en la Oficina de Partes. Indique su nombre, la información que necesita y cómo quiere recibirla.'],
  ['Reciba su número', 'Le entregan un número de solicitud para seguir su estado.'],
  ['Espere la respuesta', 'Plazo de 20 días hábiles, que puede extenderse por 10 días hábiles más con aviso.'],
  ['Si no está conforme', 'Presente un amparo ante el Consejo para la Transparencia dentro de 15 días hábiles.'],
];

// Configuración efectiva: la del panel o, si no hay, la predeterminada.
export function configuracion(ext = {}) {
  const t = ext.transparencia || {};
  return {
    activo: t.activo !== false,
    intro: t.intro || 'La Municipalidad de Melipeuco publica mensualmente su información en el Portal de Transparencia del Estado, con el código MU172. Aquí encontrará qué contiene cada materia y el enlace directo para revisarla.',
    categorias: Array.isArray(t.categorias) && t.categorias.length ? t.categorias : CATEGORIAS,
  };
}

const externo = (u) => /^https?:/.test(u);
const attrs = (u) => crudo(`href="${esc(u)}"${externo(u) ? ' target="_blank" rel="noopener"' : ''}`);

export function centroTransparencia(ext) {
  const c = configuracion(ext);
  if (!c.activo) return '';
  return html`<section class="centro-transparencia" aria-labelledby="ct-titulo">
    <div class="ct-cabeza">
      <div><h2 id="ct-titulo">Transparencia Activa</h2><p>${c.intro}</p></div>
      <a class="boton boton-primario" ${attrs(PORTAL)}>${crudo(icono('documento', { tam: 18 }))} Ver todo en el Portal de Transparencia</a>
    </div>
    <div class="ct-filtro"><label for="ct-buscar" class="sr">Buscar una materia</label>${crudo(icono('buscar', { tam: 18 }))}<input id="ct-buscar" type="search" placeholder="¿Qué busca? Ej.: sueldos, licitaciones, presupuesto…" data-filtrar=".ct-materias > li" autocomplete="off"></div>
    <ul class="ct-materias">${c.categorias.map((m, i) => html`<li data-filtrable="${(m.claves || '') + ' ' + m.titulo + ' ' + m.texto}"><a class="ct-materia" ${attrs(m.url || PORTAL)} style="--i:${i}">
      <span class="ct-ico">${crudo(icono(m.icono || 'documento', { tam: 22 }))}</span>
      <span class="ct-txt"><b>${m.titulo}</b><small>${m.texto}</small></span>
      <span class="ct-ir" aria-hidden="true">${crudo(icono(externo(m.url || PORTAL) ? 'enlace' : 'flecha', { tam: 16 }))}</span>${externo(m.url || PORTAL) ? html`<span class="sr"> (abre en otra pestaña)</span>` : ''}
    </a></li>`)}</ul>
    <h2 class="ct-sub">Sus derechos</h2>
    <ul class="ct-derechos">${DERECHOS.map((d) => html`<li><span class="ct-ico">${crudo(icono(d.icono, { tam: 22 }))}</span><div><h3>${d.titulo}</h3><p>${d.texto}</p><a class="ver-todo" ${attrs(d.url)}>${d.boton}</a></div></li>`)}</ul>
    <h2 class="ct-sub">Cómo pedir información</h2>
    <ol class="ct-pasos">${PASOS.map(([t, x]) => html`<li><b>${t}</b><span>${x}</span></li>`)}</ol>
  </section>`;
}

// Para el buscador predictivo: materias cuyo nombre, descripción o palabras clave coinciden.
export function buscarTransparencia(ext, palabras, norm) {
  const c = configuracion(ext);
  if (!c.activo) return [];
  const todas = [...c.categorias.map((m) => ({ ...m, url: m.url || PORTAL })), ...DERECHOS];
  return todas.filter((m) => { const t = norm(`${m.titulo} ${m.texto} ${m.claves || ''}`); return palabras.every((p) => t.includes(p)); })
    .slice(0, 3).map((m) => ({ tipo: 'Transparencia', clave: 'documento', titulo: m.titulo, url: m.url, externo: externo(m.url), fragmento: m.texto }));
}
