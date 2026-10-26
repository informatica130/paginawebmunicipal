// Diseño del sitio: colores, tipografía, formas, cabecera, portada, pie y animaciones, con
// vista previa en vivo. La vista previa es el sitio real en un marco; recibe el diseño en
// edición por postMessage y lo aplica sin recargar (public/js/sitio.js).
import { h, raw, $, $$, api, aviso, fallo, estado, confirmar, ico } from '../ui.js';
import { campo } from '../campos.js';
import { marcarCambios } from '../admin.js';
import { PREDETERMINADO, ESTILOS, FUENTES, OPCIONES, normalizar, aplicarEstilo, variablesCss, atributos, urlFuentes, logoCabecera, fotosPortada } from '/js/diseno.js';

// Portadas que llevan el logo vivo y el carrusel de fotos.
const conLogo = (c) => ['trekking', 'vitrina'].includes(c.portada.composicion);

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
    { ruta: 'tipografia.tamano', tipo: 'rango', etiqueta: 'Tamaño del texto', min: 15, max: 21, paso: 1, unidad: ' px' },
    { ruta: 'tipografia.pesoTitulos', tipo: 'rango', etiqueta: 'Grosor de los títulos', min: 500, max: 900, paso: 100 },
    { ruta: 'tipografia.espaciadoTitulos', tipo: 'rango', etiqueta: 'Espaciado de los títulos', min: -5, max: 5, paso: 1 },
    { ruta: 'tipografia.menuMayusculas', tipo: 'si', etiqueta: 'Menú principal en mayúsculas' },
  ] },
  { id: 'forma', titulo: 'Formas y espacios', controles: [
    { ruta: 'forma.radio', tipo: 'rango', etiqueta: 'Redondeo de las esquinas', min: 0, max: 24, paso: 1, unidad: ' px' },
    { ruta: 'forma.tarjetas', tipo: 'botones', etiqueta: 'Tarjetas y listas', opciones: OPCIONES.tarjetas },
    { ruta: 'forma.botones', tipo: 'botones', etiqueta: 'Botones', opciones: OPCIONES.botones },
    { ruta: 'forma.sombras', tipo: 'botones', etiqueta: 'Sombras', opciones: OPCIONES.sombras },
    { ruta: 'forma.densidad', tipo: 'botones', etiqueta: 'Espacio entre secciones', opciones: OPCIONES.densidad },
    { ruta: 'forma.ancho', tipo: 'rango', etiqueta: 'Ancho máximo del contenido', min: 1040, max: 1440, paso: 20, unidad: ' px' },
  ] },
  { id: 'cabecera', titulo: 'Cabecera y logo', controles: [
    { ruta: 'cabecera.estilo', tipo: 'botones', etiqueta: 'Fondo de la cabecera', opciones: OPCIONES.cabeceraEstilo },
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
  { id: 'pie', titulo: 'Pie de página', controles: [
    { ruta: 'pie.estilo', tipo: 'botones', etiqueta: 'Fondo del pie', opciones: OPCIONES.pieEstilo },
    { ruta: 'pie.emergencias', tipo: 'si', etiqueta: 'Franja de teléfonos de emergencia' },
    { ruta: 'pie.boletin', tipo: 'si', etiqueta: 'Formulario del boletín' },
    { ruta: 'pie.escudo', tipo: 'si', etiqueta: 'Escudo' },
    { ruta: 'pie.marcaGrande', tipo: 'si', etiqueta: 'Logo gigante «Melipeuco Capital del Trekking»' },
  ] },
  { id: 'animaciones', titulo: 'Animaciones', ayuda: 'Las personas que piden «reducir movimiento» en su equipo nunca ven animaciones.', controles: [
    { ruta: 'animaciones.activas', tipo: 'si', etiqueta: 'Animaciones activas' },
    { ruta: 'animaciones.intensidad', tipo: 'botones', etiqueta: 'Intensidad', opciones: OPCIONES.intensidad, si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.velocidad', tipo: 'rango', etiqueta: 'Velocidad', min: .5, max: 2, paso: .1, unidad: '×', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.intro', tipo: 'lista', etiqueta: 'Pantalla de carga con el escudo', opciones: OPCIONES.intro, si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.aparicion', tipo: 'si', etiqueta: 'Contenido que aparece al bajar', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.inclinacion', tipo: 'si', etiqueta: 'Inclinación 3D al pasar el cursor', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.transiciones', tipo: 'si', etiqueta: 'Transición entre páginas', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.cordillera', tipo: 'si', etiqueta: 'Cortina de cordillera con el color de cada sección al cambiar de página', si: (c) => c.animaciones.activas },
    { ruta: 'animaciones.barraCarga', tipo: 'si', etiqueta: 'Barra de carga al navegar', si: (c) => c.animaciones.activas },
  ] },
];

const PAGINAS = { '/': 'Portada', '/noticias/': 'Noticias', '/tramites/': 'Trámites', '/contacto/': 'Contacto', '/areas/': 'Áreas' };
const DISPOSITIVOS = { computador: ['Computador', 1366], tablet: ['Tablet', 820], celular: ['Celular', 390] };

const leer = (o, ruta) => ruta.split('.').reduce((a, k) => a?.[k], o);
const escribir = (o, ruta, v) => { const k = ruta.split('.'); k.slice(0, -1).reduce((a, x) => a[x], o)[k.at(-1)] = v; };
const copia = (o) => JSON.parse(JSON.stringify(o));

export default async function (vista) {
  const ajustes = await api('GET', 'ajustes');
  const superadmin = estado.sesion.usuario.rol === 'superadmin';
  const desdeColores = ajustes.colores?.primario ? { colores: { primario: ajustes.colores.primario, acento: ajustes.colores.acento, oscuro: ajustes.colores.oscuro } } : {};
  let cfg = normalizar(ajustes.diseno || desdeColores);
  let guardado = JSON.stringify(cfg);
  const historial = [];
  let pagina = '/', dispositivo = 'computador';

  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Diseño del sitio</h1><p>Colores, letras, formas, cabecera, portada, pie y animaciones. Los cambios se ven al instante en la vista previa y se publican al guardar.</p></div>
    <div class="acciones"><button class="btn" data-deshacer disabled>Deshacer</button><button class="btn" data-restablecer>Volver al diseño original</button><button class="btn primario" data-guardar>Guardar y publicar</button></div></div>
    <div class="diseno">
      <div class="diseno-controles">
        <section class="tarjeta"><h2>Estilos prediseñados</h2><p class="chico muted">Cambian colores, letras y formas de una vez; después puede ajustar cada detalle.</p><div class="estilos" data-estilos></div></section>
        <div data-grupos></div>
        ${superadmin ? h`<details class="tarjeta grupo-diseno"><summary>CSS propio (avanzado)</summary><p class="chico muted">Reglas CSS que se agregan al final de la hoja de estilos de todas las páginas. Sólo el Super Administrador las puede editar.</p><textarea class="mono" rows="10" data-css spellcheck="false" placeholder=".hero h1 { letter-spacing: 0; }"></textarea></details>` : ''}
      </div>
      <div class="diseno-vista">
        <div class="diseno-barra">
          <select data-pagina aria-label="Página de la vista previa">${Object.entries(PAGINAS).map(([u, t]) => h`<option value="${u}">${t}</option>`)}</select>
          <div class="segmentos" role="group" aria-label="Tamaño de pantalla">${Object.entries(DISPOSITIVOS).map(([k, [t]]) => h`<button type="button" data-dispositivo="${k}" aria-pressed="${k === dispositivo}">${t}</button>`)}</div>
          <button type="button" class="btn chico" data-intro title="Recarga la portada mostrando la pantalla de carga">Ver pantalla de carga</button>
          <button type="button" class="btn chico" data-reproducir-logo title="Vuelve a reproducir la animación del logo en la vista previa">Animar el logo</button>
          <a class="btn chico fantasma" href="/" target="_blank" rel="noopener">${ico('ojo', 14)} Abrir el sitio</a>
        </div>
        <div class="diseno-marco" data-marco><iframe title="Vista previa del sitio" src="/?vista=diseno" data-iframe></iframe></div>
        <p class="chico muted">La vista previa muestra sus cambios sin publicarlos. Las animaciones de entrada se ven al recargar la página.</p>
      </div>
    </div>`);

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
  const control = (c) => {
    const v = leer(cfg, c.ruta), id = 'd-' + c.ruta.replace('.', '-');
    const ayuda = c.ayuda ? h`<small class="ayuda">${c.ayuda}</small>` : '';
    switch (c.tipo) {
      case 'color': return h`<label class="campo campo-color" for="${id}"><span>${c.etiqueta}</span><span class="color-doble"><input type="color" id="${id}" data-ruta="${c.ruta}" value="${v}"><input type="text" data-ruta="${c.ruta}" data-hex value="${v}" maxlength="7" aria-label="${c.etiqueta} en hexadecimal"></span>${ayuda}</label>`;
      case 'lista': return h`<label class="campo" for="${id}"><span>${c.etiqueta}</span><select id="${id}" data-ruta="${c.ruta}">${Object.entries(c.opciones).map(([k, t]) => h`<option value="${k}"${k === v ? raw(' selected') : ''}>${t}</option>`)}</select>${ayuda}</label>`;
      case 'botones': return h`<div class="campo"><span>${c.etiqueta}</span><div class="segmentos" role="radiogroup" aria-label="${c.etiqueta}">${Object.entries(c.opciones).map(([k, t]) => h`<button type="button" role="radio" data-ruta="${c.ruta}" data-valor="${k}" aria-checked="${k === v}">${t}</button>`)}</div>${ayuda}</div>`;
      case 'rango': return h`<label class="campo" for="${id}"><span>${c.etiqueta} <output data-salida="${c.ruta}">${v}${c.unidad || ''}</output></span><input type="range" id="${id}" data-ruta="${c.ruta}" min="${c.min}" max="${c.max}" step="${c.paso}" value="${v}">${ayuda}</label>`;
      case 'si': return h`<label class="interruptor"><input type="checkbox" data-ruta="${c.ruta}"${v ? raw(' checked') : ''}><span class="pista" aria-hidden="true"></span><span>${c.etiqueta}</span></label>`;
      case 'texto': return h`<label class="campo" for="${id}"><span>${c.etiqueta}</span><input id="${id}" data-ruta="${c.ruta}" value="${v}" maxlength="120">${ayuda}</label>`;
      case 'textoLargo': return h`<label class="campo" for="${id}"><span>${c.etiqueta}</span><textarea id="${id}" data-ruta="${c.ruta}" rows="2" maxlength="240">${v}</textarea>${ayuda}</label>`;
      case 'imagen': return h`<div class="campo" data-imagen="${c.ruta}"><span>${c.etiqueta}</span>${ayuda}</div>`;
      default: return '';
    }
  };
  const abiertos = new Set(['colores']);
  const pintarGrupos = () => {
    $$('details[data-grupo]', vista).forEach((d) => (d.open ? abiertos.add(d.dataset.grupo) : abiertos.delete(d.dataset.grupo)));
    const cont = $('[data-grupos]', vista);
    cont.innerHTML = String(h`${GRUPOS.map((g) => h`<details class="tarjeta grupo-diseno" data-grupo="${g.id}"${abiertos.has(g.id) ? raw(' open') : ''}><summary>${g.titulo}</summary>
      ${g.ayuda ? h`<p class="chico muted">${g.ayuda}</p>` : ''}
      <div class="${g.id === 'colores' ? 'rejilla-colores' : 'pila'}">${g.controles.filter((c) => !c.si || c.si(cfg)).map(control)}</div></details>`)}`);
    // Selectores de imagen (biblioteca de medios)
    $$('[data-imagen]', cont).forEach((caja) => {
      const ruta = caja.dataset.imagen;
      const c = campo({ k: ruta, t: 'imagen', l: '' }, leer(cfg, ruta));
      caja.appendChild(c.el);
      c.el.addEventListener('input', () => cambiar(ruta, c.valor(), { repintar: false }));
    });
    const css = $('[data-css]', vista);
    if (css) css.value = cfg.avanzado.css;
  };

  // ---------------------------------------------------------------- Cambios
  const PERSONALIZA = /^(colores|tipografia|forma|cabecera\.estilo)/;
  function cambiar(ruta, valor, { repintar = true } = {}) {
    historial.push(JSON.stringify(cfg)); if (historial.length > 60) historial.shift();
    const nuevo = copia(cfg);
    escribir(nuevo, ruta, valor);
    if (PERSONALIZA.test(ruta)) nuevo.estilo = 'personalizado';
    const previoSi = GRUPOS.flatMap((g) => g.controles).filter((c) => c.si).map((c) => c.si(cfg)).join();
    cfg = normalizar(nuevo, { permitirCss: true });
    const ahoraSi = GRUPOS.flatMap((g) => g.controles).filter((c) => c.si).map((c) => c.si(cfg)).join();
    if (repintar && previoSi !== ahoraSi) pintarGrupos();
    actualizar();
  }
  function actualizar() {
    $('[data-deshacer]', vista).disabled = !historial.length;
    $$('[data-estilo]', vista).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.estilo === cfg.estilo)));
    enviar();
  }

  const grupos = $('.diseno-controles', vista);
  grupos.addEventListener('input', (e) => {
    const el = e.target, ruta = el.dataset.ruta;
    if (el.matches('[data-css]')) { cambiar('avanzado.css', el.value, { repintar: false }); return; }
    if (!ruta) return;
    let v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
    if (el.dataset.hex !== undefined) { if (!/^#[0-9a-f]{6}$/i.test(v)) return; $(`input[type=color][data-ruta="${ruta}"]`, vista).value = v; }
    if (el.type === 'color') $(`input[data-hex][data-ruta="${ruta}"]`, vista).value = v.toUpperCase();
    const salida = $(`[data-salida="${ruta}"]`, vista);
    if (salida) salida.textContent = v + (GRUPOS.flatMap((g) => g.controles).find((c) => c.ruta === ruta)?.unidad || '');
    cambiar(ruta, v, { repintar: el.type === 'checkbox' || el.tagName === 'SELECT' });
  });
  grupos.addEventListener('click', (e) => {
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
      textos: { 'cabecera.subtitulo': cfg.cabecera.subtitulo, 'cabecera.nombre': cfg.cabecera.nombre, 'portada.titulo': cfg.portada.titulo, 'portada.bajada': cfg.portada.bajada || (cfg.portada.composicion === 'trekking' ? `${ajustes.lema || 'Para todas y todos'}. Trámites, servicios e información de la comuna, a los pies del volcán Llaima.` : `${ajustes.lema || 'Para todas y todos'}. Trámites, servicios e información para las vecinas y vecinos de la comuna.`), 'portada.credito': cfg.portada.credito },
      imagenes: { 'portada.imagen': cfg.portada.imagen || '/img/plaza-melipeuco-1536.webp', ...Object.fromEntries([0, 1, 2, 3, 4, 5].map((i, _, fotos = fotosPortada(cfg)) => ['portada.foto-' + i, fotos[i % fotos.length].src])) },
      logo: { claro: logo.src, oscuro: logo.oscuro, conTexto: logo.conTexto },
    };
  };
  let marcoPendiente = 0;
  function enviar() {
    cancelAnimationFrame(marcoPendiente);
    marcoPendiente = requestAnimationFrame(() => { try { iframe.contentWindow?.postMessage(mensaje(), location.origin); } catch { /* aún cargando */ } });
  }
  const alListo = (e) => { if (e.origin === location.origin && e.source === iframe.contentWindow && e.data?.tipo === 'mlp-vista-lista') enviar(); };
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
      aviso('Diseño guardado y publicado.', 'ok');
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
