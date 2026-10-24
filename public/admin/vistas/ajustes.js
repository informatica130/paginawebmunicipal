import { h, raw, $, $$, api, aviso, fallo, estado } from '../ui.js';
import { campo } from '../campos.js';
import { marcarCambios } from '../admin.js';

const SECCIONES = { avisos: 'Avisos y alertas', banners: 'Portada con el volcán, buscador y «Ahora en Melipeuco»', campanas: 'Campañas (banners)', accesos: 'Accesos rápidos', tramites: 'Trámites en línea', noticias: 'Últimas noticias', eventos: 'Agenda, clima y emergencias', areas: 'Áreas municipales', turismo: 'Banda de turismo', encuesta: 'Encuesta activa', video: 'Último video y Concejo', boletin: 'Suscripción al boletín' };

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
        <h3>Banda de turismo</h3><div class="fila"><label class="campo"><span>Título</span><input name="t_titulo" value="${a.turismo?.titulo || ''}"></label><label class="campo"><span>Enlace</span><input name="t_url" value="${a.turismo?.url || ''}"></label></div>
        <label class="campo"><span>Texto</span><input name="t_texto" value="${a.turismo?.texto || ''}"></label><div data-turismo-img></div>
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
  let secciones = (a.portada?.secciones || []).map((s) => ({ ...s }));
  for (const id of Object.keys(SECCIONES)) if (!secciones.some((s) => s.id === id)) secciones.push({ id, activo: false });
  const lista = $('[data-secciones]', vista);
  const pintar = () => {
    lista.innerHTML = String(h`${secciones.map((s, i) => h`<li data-i="${i}"><input type="checkbox" data-k="activo"${s.activo ? raw(' checked') : ''} aria-label="Mostrar ${SECCIONES[s.id]}"><b>${SECCIONES[s.id] || s.id}</b><input data-k="titulo" value="${s.titulo || ''}" placeholder="Título (opcional)"><input type="number" data-k="cantidad" value="${s.cantidad || ''}" placeholder="Cant." min="1" max="24"><span class="acciones"><button type="button" class="btn chico fantasma" data-mov="-1">↑</button><button type="button" class="btn chico fantasma" data-mov="1">↓</button></span></li>`)}`);
  };
  pintar();
  lista.addEventListener('input', (e) => { const i = e.target.closest('[data-i]').dataset.i; const k = e.target.dataset.k; secciones[i][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; });
  lista.addEventListener('click', (e) => { const b = e.target.closest('[data-mov]'); if (!b) return; const i = Number(b.closest('[data-i]').dataset.i); const j = i + Number(b.dataset.mov); if (j >= 0 && j < secciones.length) { [secciones[i], secciones[j]] = [secciones[j], secciones[i]]; pintar(); } });
  const imgTurismo = campo({ k: 'imagen', t: 'imagen', l: 'Logo o imagen' }, a.turismo?.imagen);
  $('[data-turismo-img]', vista).appendChild(imgTurismo.el);
  const emergencias = campo({ k: 'emergencias', t: 'repetidor', l: 'Teléfonos de emergencia', sub: [{ k: 'nombre', t: 'texto', l: 'Servicio' }, { k: 'telefono', t: 'telefono', l: 'Teléfono' }] }, a.emergencias);
  $('[data-emergencias]', vista).appendChild(emergencias.el);

  const f = $('[data-form]', vista);
  const recoger = () => ({
    nombre: f.nombre.value, nombreCorto: f.nombreCorto.value, lema: f.lema.value, descripcion: f.descripcion.value,
    pie: { texto: f.pie.value },
    direccion: f.direccion.value, horario: f.horario.value, telefono: f.telefono.value, whatsapp: f.whatsapp.value, email: f.email.value, emailContacto: f.emailContacto.value,
    mapa: { lat: f.lat.value, lng: f.lng.value, enlace: f.mapaEnlace.value },
    redes: Object.fromEntries(['facebook', 'instagram', 'youtube', 'x', 'tiktok'].map((r) => [r, f['r_' + r].value])),
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
