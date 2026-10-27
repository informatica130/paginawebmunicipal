import { h, raw, $, $$, api, aviso, fallo, estado, modal } from '../ui.js';
import { campo } from '../campos.js';
import { marcarCambios } from '../admin.js';
import { completarSecciones } from '/js/diseno.js';

const SECCIONES = { avisos: 'Avisos y alertas', banners: 'Portada con el logo de la Capital del Trekking, buscador y «Ahora en Melipeuco»', cinta: 'Cinta de palabras con las nueve letras', campanas: 'Campañas (banners)', mundos: '«Cada letra es una puerta»: nueve áreas del municipio', accesos: 'Accesos rápidos', tramites: 'Trámites en línea', noticias: 'Últimas noticias', eventos: 'Agenda, clima y emergencias', areas: 'Áreas municipales', turismo: 'Capital del Trekking: lugares y cifras', encuesta: 'Encuesta activa', video: 'Último video y Concejo', videoteca: 'Videos de Melipeuco (videoteca de YouTube)', boletin: 'Suscripción al boletín' };

export default async function (vista) {
  const a = await api('GET', 'ajustes');
  const superadmin = estado.sesion.usuario.rol === 'superadmin';
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Ajustes del sitio</h1><p>Identidad, contacto, portada y funciones generales. Los cambios se ven de inmediato.</p></div><div class="acciones"><button class="btn primario" data-guardar>Guardar ajustes</button></div></div>
    <div class="pestanas" role="tablist">${[['identidad', 'Identidad'], ['contacto', 'Contacto'], ['portada', 'Portada'], ['emergencias', 'Emergencias'], ['funciones', 'Funciones'], ...(superadmin ? [['avanzado', 'Avanzado']] : [])].map(([k, v], i) => h`<button type="button" role="tab" data-tab="${k}" aria-selected="${i === 0}">${v}</button>`)}</div>
    <form data-form>
      <section data-panel="identidad" class="tarjeta">
        <div class="fila"><label class="campo"><span>Nombre oficial</span><input name="nombre" value="${a.nombre}"></label><label class="campo"><span>Nombre corto</span><input name="nombreCorto" value="${a.nombreCorto}"></label><label class="campo"><span>Lema</span><input name="lema" value="${a.lema}"></label></div>
        <label class="campo"><span>Descripción (buscadores y redes sociales)</span><textarea name="descripcion" rows="2">${a.descripcion}</textarea></label>
        <p class="caja info chico">Los colores, el logo, la tipografía, la portada y las animaciones se cambian en <a href="#/diseno">Diseño del sitio</a>, con vista previa en vivo.</p>
        <label class="campo"><span>Texto del pie (use {anio} para el año)</span><input name="pie" value="${a.pie?.texto || ''}"></label>
      </section>
      <section data-panel="contacto" class="tarjeta" hidden>
        <div class="fila"><label class="campo"><span>Dirección</span><input name="direccion" value="${a.direccion}"></label><label class="campo"><span>Horario de atención</span><input name="horario" value="${a.horario}"></label></div>
        <div class="fila"><label class="campo"><span>Teléfono</span><input name="telefono" value="${a.telefono}"></label><label class="campo"><span>WhatsApp</span><input name="whatsapp" value="${a.whatsapp || ''}"></label><label class="campo"><span>Correo Oficina de Partes</span><input name="email" value="${a.email}"></label><label class="campo"><span>Correo de contacto</span><input name="emailContacto" value="${a.emailContacto || ''}"></label></div>
        <h3>Ubicación</h3><div class="fila"><label class="campo"><span>Latitud</span><input name="lat" value="${a.mapa?.lat || ''}"></label><label class="campo"><span>Longitud</span><input name="lng" value="${a.mapa?.lng || ''}"></label><label class="campo"><span>Enlace «Cómo llegar»</span><input name="mapaEnlace" value="${a.mapa?.enlace || ''}"></label></div>
        <h3>Redes sociales</h3><div class="fila">${['facebook', 'instagram', 'youtube', 'x', 'tiktok'].map((r) => h`<label class="campo"><span>${r === 'x' ? 'X (Twitter)' : r[0].toUpperCase() + r.slice(1)}</span><input name="r_${r}" value="${a.redes?.[r] || ''}" placeholder="https://"></label>`)}</div>
      </section>
      <section data-panel="portada" class="tarjeta" hidden>
        <p>Active, ordene y nombre las secciones de la portada.</p>
        <ul class="secciones-portada" style="list-style:none;padding:0" data-secciones></ul>
        <h3>Capital del Trekking (sección de turismo)</h3><div class="fila"><label class="campo"><span>Título</span><input name="t_titulo" value="${a.turismo?.titulo || ''}"></label><label class="campo"><span>Enlace</span><input name="t_url" value="${a.turismo?.url || ''}"></label></div>
        <label class="campo"><span>Texto</span><input name="t_texto" value="${a.turismo?.texto || ''}"></label><div data-turismo-img></div>
        <h3>Identidad Capital del Trekking</h3>
        <p class="chico muted">Textos de la cinta, de «Cada letra es una puerta», de los lugares y de las cifras de la sección de turismo. El aspecto (colores, animación del logo, cordilleras…) está en Diseño del sitio.</p>
        <div data-trekking></div>
        <h3>Video destacado</h3><div class="fila"><label class="campo"><span>Título</span><input name="v_titulo" value="${a.video?.titulo || ''}"></label><label class="campo"><span>Enlace de YouTube</span><input name="v_url" value="${a.video?.url || ''}"></label></div>
        <h3>Clima</h3><label class="check"><input type="checkbox" name="clima"${a.clima?.activo ? raw(' checked') : ''}> Mostrar el pronóstico del tiempo (Open-Meteo, sin cookies)</label>
      </section>
      <section data-panel="emergencias" class="tarjeta" hidden><p>Se muestran en la barra superior, el pie de todas las páginas y la portada.</p><div data-emergencias></div></section>
      <section data-panel="funciones" class="tarjeta" hidden>
        <label class="check"><input type="checkbox" name="boletin"${a.boletin?.activo !== false ? raw(' checked') : ''}> Permitir suscripciones al boletín de noticias</label>
        <label class="campo"><span>Plazo de respuesta OIRS (días hábiles)</span><input type="number" name="oirsPlazo" value="${a.oirs?.plazoDias || 10}" min="1" max="60" style="max-width:120px"></label>
        <h3>Modo mantenimiento</h3>
        <label class="check"><input type="checkbox" name="mant"${a.mantenimiento?.activo ? raw(' checked') : ''}> Mostrar un aviso de mantenimiento a los visitantes (las personas con sesión en el panel siguen viendo el sitio)</label>
        <label class="campo"><span>Mensaje</span><input name="mantMsg" value="${a.mantenimiento?.mensaje || ''}"></label>
      </section>
      ${superadmin ? h`<section data-panel="avanzado" class="tarjeta" hidden><label class="campo"><span>Código de analítica (se inserta en todas las páginas)</span><textarea name="analitica" rows="6" class="mono" placeholder="Opcional. Ej.: script de una herramienta de analítica respetuosa de la privacidad.">${a.analitica?.codigo || ''}</textarea><small class="ayuda">Sólo lo puede editar el Super Administrador: este código se ejecuta en el navegador de cada visitante.</small></label></section>` : ''}
    </form>`);

  // Pestañas
  vista.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (!t) return;
    $$('[data-tab]', vista).forEach((b) => b.setAttribute('aria-selected', b === t ? 'true' : 'false'));
    $$('[data-panel]', vista).forEach((p) => { p.hidden = p.dataset.panel !== t.dataset.tab; });
  });
  // Secciones de portada
  let secciones = completarSecciones(a.portada?.secciones);
  for (const id of Object.keys(SECCIONES)) if (!secciones.some((s) => s.id === id)) secciones.push({ id, activo: false });
  const lista = $('[data-secciones]', vista);
  const pintar = () => {
    lista.innerHTML = String(h`${secciones.map((s, i) => h`<li data-i="${i}"><input type="checkbox" data-k="activo"${s.activo ? raw(' checked') : ''} aria-label="Mostrar ${SECCIONES[s.id]}"><b>${SECCIONES[s.id] || s.id}</b><input data-k="titulo" value="${s.titulo || ''}" placeholder="Título (opcional)"><input type="number" data-k="cantidad" value="${s.cantidad || ''}" placeholder="Cant." min="1" max="24">${s.id === 'tramites' ? h`<button type="button" class="btn chico" data-elegir-tramites>Elegir trámites${s.ids?.length ? ` (${s.ids.length})` : ''}</button>` : ''}<span class="acciones"><button type="button" class="btn chico fantasma" data-mov="-1">↑</button><button type="button" class="btn chico fantasma" data-mov="1">↓</button></span></li>`)}`);
  };
  pintar();
  lista.addEventListener('input', (e) => { const i = e.target.closest('[data-i]').dataset.i; const k = e.target.dataset.k; secciones[i][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
  // Trámites de la portada: se eligen y ordenan; sin elección se muestran los destacados (o los en línea).
  lista.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-elegir-tramites]')) return;
    const sec = secciones.find((x) => x.id === 'tramites');
    let todos;
    try { todos = (await api('GET', 'contenidos?tipo=tramite&estado=publicado&limite=300&orden=orden')).items; } catch (er) { return fallo(er); }
    let elegidos = (sec.ids || []).filter((id) => todos.some((t) => t.id === id));
    const cuerpo = document.createElement('div');
    const dibujar = () => {
      const orden = [...elegidos.map((id) => todos.find((t) => t.id === id)), ...todos.filter((t) => !elegidos.includes(t.id))];
      cuerpo.innerHTML = String(h`<p class="chico muted">Marque los trámites que se verán en la portada y ordénelos con las flechas. Si no marca ninguno, se muestran los trámites «destacados en portada» o, si no hay, los primeros en línea.</p>
        <input type="search" data-filtro placeholder="Buscar trámite…" style="width:100%;margin-bottom:10px">
        <ul class="lista-elegir" style="list-style:none;padding:0;margin:0;max-height:55vh;overflow:auto">${orden.map((t) => { const n = elegidos.indexOf(t.id); return h`<li data-id="${t.id}" style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--borde, #ddd)"><label class="check" style="flex:1;margin:0"><input type="checkbox" data-marcar${n >= 0 ? raw(' checked') : ''}> ${n >= 0 ? h`<b>${n + 1}.</b> ` : ''}${t.titulo}</label>${n >= 0 ? h`<button type="button" class="btn chico fantasma" data-sube aria-label="Subir">↑</button><button type="button" class="btn chico fantasma" data-baja aria-label="Bajar">↓</button>` : ''}</li>`; })}</ul>`);
    };
    dibujar();
    cuerpo.addEventListener('input', (ev) => { if (!ev.target.matches('[data-filtro]')) return; const q = ev.target.value.toLowerCase(); $$('li', cuerpo).forEach((li) => { li.hidden = !li.textContent.toLowerCase().includes(q); }); });
    cuerpo.addEventListener('click', (ev) => {
      const li = ev.target.closest('li[data-id]'); if (!li) return;
      const id = Number(li.dataset.id), i = elegidos.indexOf(id);
      if (ev.target.matches('[data-marcar]')) { if (i >= 0) elegidos.splice(i, 1); else elegidos.push(id); dibujar(); }
      else if (ev.target.matches('[data-sube]') && i > 0) { [elegidos[i - 1], elegidos[i]] = [elegidos[i], elegidos[i - 1]]; dibujar(); }
      else if (ev.target.matches('[data-baja]') && i < elegidos.length - 1) { [elegidos[i + 1], elegidos[i]] = [elegidos[i], elegidos[i + 1]]; dibujar(); }
    });
    const pie = document.createElement('div');
    pie.innerHTML = '<button type="button" class="btn fantasma" data-limpiar>Quitar selección</button> <button type="button" class="btn primario" data-listo>Listo</button>';
    const m = modal({ titulo: 'Trámites en la portada', cuerpo, pie, ancho: true });
    $('[data-limpiar]', pie).addEventListener('click', () => { elegidos = []; dibujar(); });
    $('[data-listo]', pie).addEventListener('click', () => { sec.ids = elegidos.slice(); m.cerrar(); pintar(); aviso('Selección lista. Guarde los ajustes para publicarla.'); });
  });
  lista.addEventListener('click', (e) => { const b = e.target.closest('[data-mov]'); if (!b) return; const i = Number(b.closest('[data-i]').dataset.i); const j = i + Number(b.dataset.mov); if (j >= 0 && j < secciones.length) { [secciones[i], secciones[j]] = [secciones[j], secciones[i]]; pintar(); } });
  const imgTurismo = campo({ k: 'imagen', t: 'imagen', l: 'Logo o imagen' }, a.turismo?.imagen);
  $('[data-turismo-img]', vista).appendChild(imgTurismo.el);
  // Identidad Capital del Trekking: cinta, nueve mundos (uno por letra), lugares y cifras.
  const LETRAS = { 0: 'M · montaña (azul)', 1: 'E · rostro (terracota)', 2: 'L · cascada (turquesa)', 3: 'I · araucaria (verde)', 4: 'P · corazón (rojo)', 5: 'E · persona (amarillo)', 6: 'U · animales (café)', 7: 'C · estrellas (índigo)', 8: 'O · kultrún (violeta)' };
  const tk = a.trekkingActual || {};
  const tkCampos = {
    cinta: campo({ k: 'cinta', t: 'lista', l: 'Palabras de la cinta', ayuda: 'Una por línea; entre cada una aparece una letra del logo.' }, tk.cinta),
    mundos: campo({ k: 'mundos', t: 'repetidor', l: '«Cada letra es una puerta»: un área por letra, en orden (M, E, L, I, P, E, U, C, O)', sub: [{ k: 'nombre', t: 'texto', l: 'Nombre' }, { k: 'texto', t: 'texto', l: 'Descripción' }, { k: 'url', t: 'url', l: 'Enlace' }] }, tk.mundos),
    lugares: campo({ k: 'lugares', t: 'repetidor', l: 'Lugares de la Capital del Trekking (fila deslizable)', sub: [{ k: 'nombre', t: 'texto', l: 'Nombre' }, { k: 'tipo', t: 'texto', l: 'Etiqueta' }, { k: 'texto', t: 'texto', l: 'Descripción' }, { k: 'imagen', t: 'imagen', l: 'Foto (vertical)' }, { k: 'url', t: 'url', l: 'Enlace' }, { k: 'letra', t: 'opcion', l: 'Color', opciones: LETRAS }] }, tk.lugares),
    cifras: campo({ k: 'cifras', t: 'repetidor', l: 'Cifras con contador', sub: [{ k: 'numero', t: 'numero', l: 'Número' }, { k: 'sufijo', t: 'texto', l: 'Sufijo (km, %…)' }, { k: 'texto', t: 'texto', l: 'Texto' }] }, tk.cifras),
  };
  Object.values(tkCampos).forEach((c) => $('[data-trekking]', vista).appendChild(c.el));
  const emergencias = campo({ k: 'emergencias', t: 'repetidor', l: 'Teléfonos de emergencia', sub: [{ k: 'nombre', t: 'texto', l: 'Servicio' }, { k: 'telefono', t: 'telefono', l: 'Teléfono' }] }, a.emergencias);
  $('[data-emergencias]', vista).appendChild(emergencias.el);

  const f = $('[data-form]', vista);
  const recoger = () => ({
    nombre: f.nombre.value, nombreCorto: f.nombreCorto.value, lema: f.lema.value, descripcion: f.descripcion.value,
    pie: { texto: f.pie.value },
    direccion: f.direccion.value, horario: f.horario.value, telefono: f.telefono.value, whatsapp: f.whatsapp.value, email: f.email.value, emailContacto: f.emailContacto.value,
    mapa: { lat: f.lat.value, lng: f.lng.value, enlace: f.mapaEnlace.value },
    redes: Object.fromEntries(['facebook', 'instagram', 'youtube', 'x', 'tiktok'].map((r) => [r, f['r_' + r].value])),
    trekking: Object.fromEntries(Object.entries(tkCampos).map(([k, c]) => [k, c.valor()])),
    portada: { secciones }, turismo: { titulo: f.t_titulo.value, texto: f.t_texto.value, url: f.t_url.value, imagen: imgTurismo.valor() },
    video: { titulo: f.v_titulo.value, url: f.v_url.value }, clima: { activo: f.clima.checked, lugar: a.clima?.lugar || 'Melipeuco' },
    emergencias: emergencias.valor(), boletin: { activo: f.boletin.checked }, oirs: { plazoDias: f.oirsPlazo.value },
    mantenimiento: { activo: f.mant.checked, mensaje: f.mantMsg.value },
    ...(superadmin ? { analitica: { codigo: f.analitica.value } } : {}),
  });
  let inicial = JSON.stringify(recoger());
  marcarCambios(() => JSON.stringify(recoger()) !== inicial);
  $('[data-guardar]', vista).addEventListener('click', async () => {
    try { await api('PUT', 'ajustes', recoger()); inicial = JSON.stringify(recoger()); aviso('Ajustes guardados.', 'ok'); } catch (er) { fallo(er); }
  });
}
