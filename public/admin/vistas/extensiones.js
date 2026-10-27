// Extensiones: ventanas emergentes, bloques en cualquier zona del sitio, fuentes de datos
// externas (APIs) y código propio. Lo que un sitio necesita agregar algún día sin programar.
import { h, raw, $, $$, api, aviso, fallo, confirmar, ico } from '../ui.js';
import { textoRico, campo } from '../campos.js';

const PESTANAS = [['emergentes', 'Ventanas emergentes'], ['zonas', 'Bloques en zonas'], ['fuentes', 'Fuentes de datos (API)'], ['transparencia', 'Transparencia'], ['codigo', 'Código propio']];
const SECCIONES = { banners: 'la portada principal', campanas: 'las campañas', accesos: 'los accesos rápidos', tramites: 'los trámites', noticias: 'las noticias', videoteca: 'los videos', eventos: 'la agenda', areas: 'las áreas', turismo: 'turismo', video: 'el video', encuesta: 'la encuesta', boletin: 'el boletín', mundos: 'los nueve mundos', cinta: 'la cinta' };
const nuevoId = () => 'x' + Math.random().toString(36).slice(2, 10);
const copia = (o) => JSON.parse(JSON.stringify(o));
const opciones = (lista, v) => Object.entries(lista).map(([k, t]) => h`<option value="${k}"${k === v ? raw(' selected') : ''}>${t}</option>`);

const PLANTILLA_EJEMPLO = `<ul>
{{#items}}
  <li><a href="{{url}}">{{titulo}}</a> <small>{{fecha}}</small></li>
{{/items}}
</ul>
{{^items}}<p>No hay datos por ahora.</p>{{/items}}`;

export default async function (vista) {
  let datos = await api('GET', 'extensiones');
  const O = datos.opciones;
  const zonasTodas = { ...O.ZONAS, ...Object.fromEntries(O.ZONAS_PORTADA.map((s) => [`portada:${s}`, `Portada: después de ${SECCIONES[s] || s}`])) };
  let pestana = 'emergentes', sucio = false;
  const ricos = new Map(); // ruta → función que entrega el HTML del editor
  const abiertos = new Set();

  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Extensiones</h1><p>Agregue al sitio ventanas emergentes, bloques en cualquier lugar, datos de otras plataformas (APIs) y servicios externos, sin programar.</p></div>
    <div class="acciones"><a class="btn" href="/" target="_blank" rel="noopener">${ico('ojo', 16)} Ver el sitio</a><button class="btn primario" data-guardar>Guardar y publicar</button></div></div>
    <div class="segmentos pestanas-ext" role="tablist">${PESTANAS.map(([k, t]) => h`<button type="button" role="tab" data-pestana="${k}" aria-pressed="${k === pestana}">${t}</button>`)}</div>
    <div data-cuerpo></div>`);
  const cuerpo = $('[data-cuerpo]', vista);

  // ---------------------------------------------------------------- Campos comunes
  const leer = (ruta) => ruta.split('.').reduce((o, k) => o?.[k], datos);
  const escribir = (ruta, v) => { const k = ruta.split('.'); k.slice(0, -1).reduce((o, x) => o[x], datos)[k.at(-1)] = v; sucio = true; };
  const texto = (ruta, etiqueta, { ayuda = '', max = 200, ph = '' } = {}) => h`<label class="campo"><span>${etiqueta}</span><input data-c="${ruta}" value="${leer(ruta) ?? ''}" maxlength="${max}" placeholder="${ph}">${ayuda ? h`<small class="ayuda">${ayuda}</small>` : ''}</label>`;
  const numero = (ruta, etiqueta, min, max, unidad = '') => h`<label class="campo"><span>${etiqueta}</span><span class="fila-num"><input type="number" data-c="${ruta}" data-num value="${leer(ruta)}" min="${min}" max="${max}">${unidad ? h`<small>${unidad}</small>` : ''}</span></label>`;
  const lista = (ruta, etiqueta, ops, { ayuda = '' } = {}) => h`<label class="campo"><span>${etiqueta}</span><select data-c="${ruta}" data-repintar>${opciones(ops, leer(ruta))}</select>${ayuda ? h`<small class="ayuda">${ayuda}</small>` : ''}</label>`;
  const si = (ruta, etiqueta) => h`<label class="interruptor"><input type="checkbox" data-c="${ruta}" data-repintar${leer(ruta) !== false ? raw(' checked') : ''}><span class="pista" aria-hidden="true"></span><span>${etiqueta}</span></label>`;
  const area = (ruta, etiqueta, { filas = 8, ayuda = '', ph = '' } = {}) => h`<label class="campo"><span>${etiqueta}</span><textarea class="mono" rows="${filas}" data-c="${ruta}" spellcheck="false" placeholder="${ph}">${leer(ruta) ?? ''}</textarea>${ayuda ? h`<small class="ayuda">${ayuda}</small>` : ''}</label>`;
  const fecha = (ruta, etiqueta) => h`<label class="campo"><span>${etiqueta}</span><input type="date" data-c="${ruta}" value="${leer(ruta) || ''}"></label>`;
  const rico = (ruta, etiqueta) => h`<div class="campo"><span>${etiqueta}</span><div data-rico="${ruta}"></div></div>`;
  const imagen = (ruta, etiqueta) => h`<div class="campo" data-imagen="${ruta}"><span>${etiqueta}</span></div>`;
  const dondeYCuando = (base, x) => h`<div class="rejilla-2">${lista(`${base}.paginas`, 'Dónde se muestra', O.PAGINAS)}${fecha(`${base}.desde`, 'Desde (opcional)')}${fecha(`${base}.hasta`, 'Hasta (opcional)')}</div>
    ${x.paginas === 'rutas' ? area(`${base}.rutas`, 'Direcciones (una por línea)', { filas: 3, ayuda: 'Ej.: /tramites/ o /noticias/* para todas las que empiezan así.', ph: '/tramites/\n/noticias/*' }) : ''}`;

  const tarjeta = (tipo, i, x, titulo, resumen, contenido) => h`<details class="tarjeta item-ext${x.activo === false ? ' inactivo' : ''}" data-item="${tipo}.${i}"${abiertos.has(x.id) ? raw(' open') : ''} data-id="${x.id}">
    <summary><span class="item-ext-titulo"><b>${titulo || 'Sin título'}</b><small class="muted">${resumen}</small></span>${x.activo === false ? h`<span class="insignia">Desactivado</span>` : h`<span class="insignia activo">Activo</span>`}</summary>
    <div class="pila">${contenido}
      <div class="fila-acciones"><button type="button" class="btn chico" data-subir="${tipo}.${i}" ${i === 0 ? raw('disabled') : ''}>↑ Subir</button><button type="button" class="btn chico" data-duplicar="${tipo}.${i}">Duplicar</button><button type="button" class="btn chico peligro" data-quitar="${tipo}.${i}">Eliminar</button></div>
    </div></details>`;

  // ---------------------------------------------------------------- Pestañas
  const VISTAS = {
    emergentes: () => h`<p class="muted">Avisos que aparecen sobre la página: campañas, emergencias, encuestas, invitaciones. Puede elegir cuándo aparecen y cada cuánto se repiten para la misma persona.</p>
      ${datos.emergentes.map((x, i) => tarjeta('emergentes', i, x, x.nombre || x.titulo, `${O.ESTILOS_EMERGENTE[x.estilo]} · ${O.DISPAROS[x.disparo]} · ${O.FRECUENCIAS[x.frecuencia]}`, h`
        ${si(`emergentes.${i}.activo`, 'Activa')}
        <div class="rejilla-2">${texto(`emergentes.${i}.nombre`, 'Nombre interno', { ph: 'Ej.: Campaña vacunación' })}${texto(`emergentes.${i}.titulo`, 'Título', { max: 120 })}</div>
        ${rico(`emergentes.${i}.texto`, 'Texto')}
        ${imagen(`emergentes.${i}.imagen`, 'Imagen (opcional)')}
        <div class="rejilla-2">${texto(`emergentes.${i}.boton.texto`, 'Botón: texto', { max: 50 })}${texto(`emergentes.${i}.boton.url`, 'Botón: enlace', { ph: '/tramites/ o https://…' })}${texto(`emergentes.${i}.boton2.texto`, 'Segundo botón: texto', { max: 50 })}${texto(`emergentes.${i}.boton2.url`, 'Segundo botón: enlace')}</div>
        <div class="rejilla-2">${lista(`emergentes.${i}.estilo`, 'Forma', O.ESTILOS_EMERGENTE)}${lista(`emergentes.${i}.fondo`, 'Color', O.FONDOS)}${lista(`emergentes.${i}.disparo`, 'Cuándo aparece', O.DISPAROS)}
          ${x.disparo === 'tiempo' ? numero(`emergentes.${i}.segundos`, 'Segundos de espera', 0, 120, 's') : ''}${x.disparo === 'desplazamiento' ? numero(`emergentes.${i}.porcentaje`, 'Al bajar este porcentaje', 5, 95, '%') : ''}
          ${lista(`emergentes.${i}.frecuencia`, 'Cada cuánto, para la misma persona', O.FRECUENCIAS)}${x.frecuencia === 'dias' ? numero(`emergentes.${i}.dias`, 'Cada cuántos días', 1, 365, 'días') : ''}</div>
        ${dondeYCuando(`emergentes.${i}`, x)}
        <p class="chico muted">Si cambia el título, el texto, la imagen o los botones, la ventana vuelve a mostrarse a quienes ya la vieron.</p>`))}
      <button type="button" class="btn" data-agregar="emergentes">${ico('mas', 16)} Agregar ventana emergente</button>`,

    zonas: () => h`<p class="muted">Contenido propio en cualquier lugar del sitio: una franja sobre la cabecera, un aviso bajo el menú, un mapa al final de una página, un widget de otra plataforma entre las secciones de la portada…</p>
      ${datos.zonas.map((x, i) => tarjeta('zonas', i, x, x.nombre, `${zonasTodas[x.zona] || x.zona} · ${O.TIPOS_ZONA[x.tipo]} · ${O.PAGINAS[x.paginas]}`, h`
        ${si(`zonas.${i}.activo`, 'Activo')}
        <div class="rejilla-2">${texto(`zonas.${i}.nombre`, 'Nombre interno')}${texto(`zonas.${i}.titulo`, 'Título visible (opcional)', { max: 140 })}
          ${lista(`zonas.${i}.zona`, 'Ubicación', zonasTodas, { ayuda: 'Las de la portada aparecen si esa sección está activa.' })}${lista(`zonas.${i}.tipo`, 'Tipo de bloque', O.TIPOS_ZONA)}
          ${x.tipo === 'aviso' ? lista(`zonas.${i}.nivel`, 'Nivel del aviso', O.NIVELES) : lista(`zonas.${i}.fondo`, 'Fondo', O.FONDOS)}
          ${lista(`zonas.${i}.ancho`, 'Ancho', { contenedor: 'Al ancho del contenido', completo: 'De borde a borde' })}</div>
        ${x.tipo === 'html' || x.tipo === 'aviso' ? rico(`zonas.${i}.html`, 'Contenido') : ''}
        ${x.tipo === 'aislado' ? h`${area(`zonas.${i}.html`, 'HTML con scripts', { filas: 12, ayuda: 'Se muestra en un marco aislado: puede usar scripts y conectarse a otras plataformas sin poner en riesgo el sitio. Ideal para widgets, mapas, calculadoras o formularios externos.', ph: '<div id="widget"></div>\n<script src="https://…"></script>' })}${numero(`zonas.${i}.alto`, 'Alto inicial', 80, 4000, 'px')}` : ''}
        ${x.tipo === 'fuente' ? h`${lista(`zonas.${i}.fuente`, 'Fuente de datos', { '': datos.fuentes.length ? 'Elija una fuente…' : 'Primero cree una fuente en la pestaña «Fuentes de datos»', ...Object.fromEntries(datos.fuentes.map((f) => [f.id, f.nombre])) })}
          ${area(`zonas.${i}.plantilla`, 'Plantilla', { filas: 10, ayuda: raw('Use <code>{{campo}}</code> para un dato, <code>{{#lista}}…{{/lista}}</code> para repetir, <code>{{^lista}}…{{/lista}}</code> si no hay datos, <code>{{.}}</code> para el valor actual y <code>{{@indice}}</code> para el número. Si la fuente entrega una lista, se llama <code>items</code>.'), ph: PLANTILLA_EJEMPLO })}` : ''}
        ${dondeYCuando(`zonas.${i}`, x)}`))}
      <button type="button" class="btn" data-agregar="zonas">${ico('mas', 16)} Agregar bloque</button>`,

    fuentes: () => h`<p class="muted">Conecte el sitio con cualquier plataforma que entregue datos en JSON por https: indicadores, horarios de buses, farmacias de turno, calidad del aire, eventos de otra institución… El servidor la consulta, la guarda unos minutos y usted la muestra con un bloque de tipo «Datos de una fuente externa».</p>
      ${datos.fuentes.map((x, i) => tarjeta('fuentes', i, x, x.nombre, `${x.url}${datos.estadoFuentes?.[x.id]?.error ? ' · último error: ' + datos.estadoFuentes[x.id].error : ''}`, h`
        <div class="rejilla-2">${texto(`fuentes.${i}.nombre`, 'Nombre', { max: 80 })}${numero(`fuentes.${i}.minutos`, 'Guardar en memoria', 1, 1440, 'minutos')}</div>
        ${texto(`fuentes.${i}.url`, 'Dirección de la API (https)', { max: 800, ph: 'https://api.ejemplo.cl/datos?comuna=melipeuco' })}
        ${texto(`fuentes.${i}.ruta`, 'Parte de la respuesta que se usa (opcional)', { ph: 'Ej.: data.items', ayuda: 'Si la respuesta trae los datos dentro de otra propiedad, indíquela con puntos.' })}
        <div class="rejilla-2">${texto(`fuentes.${i}.encabezado.nombre`, 'Encabezado de autenticación (opcional)', { ph: 'Ej.: Authorization o X-API-Key' })}${texto(`fuentes.${i}.encabezado.valor`, 'Valor (clave secreta)', { max: 600, ayuda: 'Se guarda en el servidor y nunca llega al navegador.' })}</div>
        <div><button type="button" class="btn chico" data-probar="${i}">${ico('ojo', 14)} Probar la fuente</button></div><pre class="muestra-fuente" data-muestra="${i}" hidden></pre>`))}
      <button type="button" class="btn" data-agregar="fuentes">${ico('mas', 16)} Agregar fuente</button>`,

    transparencia: () => h`<p class="muted">El Centro de Transparencia aparece en <a href="/transparencia/" target="_blank" rel="noopener">/transparencia/</a>: las materias que la Ley 20.285 obliga a publicar, explicadas en simple y enlazadas a la ficha oficial de la Municipalidad (MU172) en el Portal de Transparencia, más los derechos y los pasos para pedir información. Las palabras clave permiten que el buscador del sitio las encuentre.</p>
      <div class="tarjeta pila">${si('transparencia.activo', 'Mostrar el Centro de Transparencia')}${area('transparencia.intro', 'Texto de presentación (opcional)', { filas: 3, ph: 'La Municipalidad publica mensualmente su información en el Portal de Transparencia…' })}</div>
      ${datos.transparencia.categorias.length ? '' : h`<div class="tarjeta"><p class="muted">Se muestran las ${O.materias.length} materias oficiales. Cárguelas para editarlas, cambiar sus enlaces o agregar otras.</p><button type="button" class="btn" data-cargar-materias>Cargar las materias para editarlas</button></div>`}
      ${datos.transparencia.categorias.map((m, i) => h`<details class="tarjeta item-ext" data-id="m${i}"${abiertos.has('m' + i) ? raw(' open') : ''}><summary><span class="item-ext-titulo"><b>${m.titulo}</b><small class="muted">${m.url}</small></span></summary><div class="pila">
        <div class="rejilla-2">${texto(`transparencia.categorias.${i}.titulo`, 'Materia', { max: 120 })}${lista(`transparencia.categorias.${i}.icono`, 'Ícono', Object.fromEntries(O.iconos.map((k) => [k, k])))}</div>
        ${area(`transparencia.categorias.${i}.texto`, 'Descripción', { filas: 2 })}
        ${texto(`transparencia.categorias.${i}.url`, 'Enlace', { max: 500, ayuda: 'Puede apuntar a la sección exacta del Portal de Transparencia o a una página del sitio.' })}
        ${texto(`transparencia.categorias.${i}.claves`, 'Palabras clave para el buscador', { max: 300, ph: 'sueldos funcionarios planta contrata' })}
        <div class="fila-acciones"><button type="button" class="btn chico" data-subir="transparencia.categorias.${i}" ${i === 0 ? raw('disabled') : ''}>↑ Subir</button><button type="button" class="btn chico peligro" data-quitar="transparencia.categorias.${i}">Eliminar</button></div>
      </div></details>`)}
      ${datos.transparencia.categorias.length ? h`<button type="button" class="btn" data-agregar="materia">${ico('mas', 16)} Agregar materia</button>` : ''}`,

    codigo: () => datos.superadmin ? h`<p class="muted">Para servicios que piden pegar un código (analítica, chat de atención, verificación de dominio, píxeles). Los scripts reciben automáticamente el permiso de la página. Sólo el Super Administrador puede editar esta pestaña.</p>
      <div class="tarjeta pila">
        ${area('codigo.cabeza', 'Código en <head>', { filas: 8, ph: '<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>' })}
        ${area('codigo.cuerpo', 'Código antes de </body>', { filas: 8 })}
        ${area('codigo.dominios', 'Dominios externos permitidos (uno por línea)', { filas: 4, ayuda: 'Los dominios desde donde esos códigos cargan scripts, estilos o datos. Ej.: https://www.googletagmanager.com', ph: 'https://www.googletagmanager.com\nhttps://www.google-analytics.com' })}
      </div>` : h`<p class="tarjeta muted">Sólo el Super Administrador puede ver y editar el código propio.</p>`,
  };

  const NUEVOS = {
    emergentes: () => ({ id: nuevoId(), activo: true, nombre: '', titulo: 'Nuevo aviso', texto: '<p>Escriba aquí el mensaje.</p>', imagen: '', boton: { texto: '', url: '' }, boton2: { texto: '', url: '' }, estilo: 'modal', fondo: 'ninguno', disparo: 'tiempo', segundos: 4, porcentaje: 40, frecuencia: 'sesion', dias: 7, paginas: 'portada', rutas: '', desde: '', hasta: '' }),
    zonas: () => ({ id: nuevoId(), activo: true, nombre: 'Nuevo bloque', titulo: '', zona: 'final-contenido', tipo: 'html', html: '<p>Contenido del bloque.</p>', nivel: 'info', fuente: '', plantilla: PLANTILLA_EJEMPLO, alto: 360, ancho: 'contenedor', fondo: 'ninguno', paginas: 'todas', rutas: '', desde: '', hasta: '' }),
    fuentes: () => ({ id: nuevoId(), nombre: 'Nueva fuente', url: '', ruta: '', minutos: 15, encabezado: { nombre: '', valor: '' } }),
  };

  function recogerRicos() { for (const [ruta, f] of ricos) { try { const k = ruta.split('.'); k.slice(0, -1).reduce((o, x) => o[x], datos)[k.at(-1)] = f(); } catch { /* la tarjeta ya no existe */ } } }
  function pintar() {
    recogerRicos();
    $$('details[data-id]', cuerpo).forEach((d) => (d.open ? abiertos.add(d.dataset.id) : abiertos.delete(d.dataset.id)));
    ricos.clear();
    $$('[data-pestana]', vista).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pestana === pestana)));
    cuerpo.innerHTML = String(h`<div class="pila">${VISTAS[pestana]()}</div>`);
    $$('[data-rico]', cuerpo).forEach((caja) => { const r = textoRico(leer(caja.dataset.rico) || ''); caja.appendChild(r.el); ricos.set(caja.dataset.rico, r.valor); r.el.addEventListener('input', () => { sucio = true; }); });
    $$('[data-imagen]', cuerpo).forEach((caja) => { const ruta = caja.dataset.imagen; const c = campo({ k: ruta, t: 'imagen', l: '' }, leer(ruta) || ''); caja.appendChild(c.el); c.el.addEventListener('input', () => escribir(ruta, c.valor())); c.el.addEventListener('change', () => escribir(ruta, c.valor())); });
  }

  cuerpo.addEventListener('input', (e) => {
    const el = e.target.closest('[data-c]'); if (!el) return;
    escribir(el.dataset.c, el.type === 'checkbox' ? el.checked : el.dataset.num !== undefined ? Number(el.value) : el.value);
  });
  cuerpo.addEventListener('change', (e) => { if (e.target.closest('[data-repintar]')) pintar(); });
  cuerpo.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const ref = b.dataset.subir || b.dataset.duplicar || b.dataset.quitar || '';
    const i = Number(ref.split('.').at(-1)), tipo = ref.split('.').slice(0, -1).join('.');
    const lst = () => leer(tipo);
    if (b.dataset.cargarMaterias !== undefined) { datos.transparencia.categorias = copia(O.materias); sucio = true; pintar(); return; }
    if (b.dataset.agregar === 'materia') { datos.transparencia.categorias.push({ titulo: 'Nueva materia', texto: '', url: '', icono: 'documento', claves: '' }); sucio = true; pintar(); return; }
    if (b.dataset.agregar) { recogerRicos(); const x = NUEVOS[b.dataset.agregar](); datos[b.dataset.agregar].push(x); abiertos.add(x.id); sucio = true; pintar(); return; }
    if (b.dataset.subir) { recogerRicos(); const l = lst(); [l[i - 1], l[i]] = [l[i], l[i - 1]]; sucio = true; pintar(); return; }
    if (b.dataset.duplicar) { recogerRicos(); const x = { ...copia(lst()[i]), id: nuevoId() }; if (x.nombre) x.nombre += ' (copia)'; lst().splice(i + 1, 0, x); abiertos.add(x.id); sucio = true; pintar(); return; }
    if (b.dataset.quitar) { if (!(await confirmar('¿Eliminar este elemento? Se quitará del sitio al guardar.', { peligro: true, boton: 'Eliminar' }))) return; recogerRicos(); lst().splice(i, 1); sucio = true; pintar(); return; }
    if (b.dataset.probar !== undefined) {
      const pre = $(`[data-muestra="${b.dataset.probar}"]`, cuerpo); pre.hidden = false; pre.textContent = 'Consultando…';
      try { const r = await api('POST', 'extensiones/probar-fuente', datos.fuentes[b.dataset.probar]); pre.textContent = r.ok ? `Funciona. Muestra de lo que entrega:\n\n${r.muestra}` : `No funcionó: ${r.error}`; } catch (er) { pre.textContent = 'No funcionó: ' + er.message; }
    }
  });
  $$('[data-pestana]', vista).forEach((b) => b.addEventListener('click', () => { pestana = b.dataset.pestana; pintar(); }));
  $('[data-guardar]', vista).addEventListener('click', async (e) => {
    recogerRicos();
    e.target.disabled = true;
    try {
      const r = await api('PUT', 'extensiones', datos);
      datos = { ...datos, ...r }; sucio = false;
      aviso('Extensiones guardadas y publicadas.'); pintar();
    } catch (er) { fallo(er); } finally { e.target.disabled = false; }
  });
  addEventListener('beforeunload', (e) => { if (sucio) e.preventDefault(); });
  pintar();
}
