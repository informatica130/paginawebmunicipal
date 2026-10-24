import { h, raw, $, api, aviso, fallo, fecha, insignia, puede, descargarApi, debounce } from '../ui.js';
import { actualizarMensajes } from '../admin.js';

const ESTADOS = { nuevo: 'Nuevo', en_proceso: 'En proceso', respondido: 'Respondido', cerrado: 'Cerrado' };
const TIPOS = { consulta: 'Consulta', reclamo: 'Reclamo', sugerencia: 'Sugerencia', felicitacion: 'Felicitación', denuncia: 'Denuncia', contacto: 'Contacto' };

export default async function (vista, [id], params) {
  if (id) return detalle(vista, Number(id));
  const f = { estado: params.get('estado') || '', tipo: '', q: '', pagina: 1 };
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Mensajes y OIRS</h1><p>Consultas, reclamos, sugerencias y mensajes de contacto enviados desde el sitio. Cada persona recibe un código para seguir su respuesta.</p></div>
    <div class="acciones"><button class="btn" data-csv>Exportar CSV</button></div></div>
    <div class="filtros"><label class="campo"><span>Buscar</span><input type="search" data-q placeholder="Código, nombre, correo o asunto"></label>
      <label class="campo"><span>Estado</span><select data-estado><option value="">Todos</option>${Object.entries(ESTADOS).map(([k, v]) => h`<option value="${k}"${k === f.estado ? raw(' selected') : ''}>${v}</option>`)}</select></label>
      <label class="campo"><span>Tipo</span><select data-tipo><option value="">Todos</option>${Object.entries(TIPOS).map(([k, v]) => h`<option value="${k}">${v}</option>`)}</select></label></div>
    <div class="tarjeta plana tabla-envoltura" data-tabla></div><div class="paginacion" data-pag></div>`);
  async function cargar() {
    const r = await api('GET', `mensajes?pagina=${f.pagina}&estado=${f.estado}&tipo=${f.tipo}&q=${encodeURIComponent(f.q)}`);
    $('[data-tabla]', vista).innerHTML = r.items.length ? String(h`<table class="tabla"><thead><tr><th>Código</th><th>Asunto</th><th>Tipo</th><th>Estado</th><th>Recibido</th><th>Asignado</th></tr></thead><tbody>
      ${r.items.map((m) => h`<tr><td class="mono chico"><a href="#/mensajes/${m.id}">${m.codigo}</a></td><td class="titulo"><a href="#/mensajes/${m.id}">${m.asunto}</a><small>${m.nombre} · ${m.email}${m.area ? ' · ' + m.area : ''}</small></td><td>${TIPOS[m.tipo] || m.tipo}</td><td>${insignia(m.estado, ESTADOS)}</td><td class="chico">${fecha(m.creado, { hora: true })}</td><td class="chico">${m.asignado || '—'}</td></tr>`)}
      </tbody></table>`) : '<p class="cargando">No hay mensajes con estos filtros.</p>';
    $('[data-pag]', vista).innerHTML = String(h`<button class="btn chico" data-p="-1"${f.pagina <= 1 ? raw(' disabled') : ''}>←</button><span>${r.total} mensajes</span><button class="btn chico" data-p="1"${f.pagina * 50 >= r.total ? raw(' disabled') : ''}>→</button>`);
  }
  $('[data-q]', vista).addEventListener('input', debounce((e) => { f.q = e.target.value; f.pagina = 1; cargar(); }));
  $('[data-estado]', vista).addEventListener('change', (e) => { f.estado = e.target.value; f.pagina = 1; cargar(); });
  $('[data-tipo]', vista).addEventListener('change', (e) => { f.tipo = e.target.value; f.pagina = 1; cargar(); });
  $('[data-pag]', vista).addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) { f.pagina += Number(b.dataset.p); cargar(); } });
  $('[data-csv]', vista).addEventListener('click', () => descargarApi('mensajes.csv', 'mensajes-oirs.csv').catch(fallo));
  await cargar();
}

async function detalle(vista, id) {
  const [m, usuarios] = await Promise.all([api('GET', 'mensajes/' + id), api('GET', 'usuarios/lista').catch(() => [])]);
  const responder = puede('mensajes.responder');
  vista.innerHTML = String(h`<p class="chico"><a href="#/mensajes">← Mensajes</a></p>
    <div class="cabecera-vista"><div><h1>${m.asunto}</h1><p><span class="mono">${m.codigo}</span> · ${TIPOS[m.tipo] || m.tipo} · ${insignia(m.estado, ESTADOS)} · ${fecha(m.creado, { hora: true })}</p></div></div>
    <div class="editor">
      <div>
        <section class="tarjeta"><h2>Mensaje</h2><div class="mensaje-texto">${m.mensaje}</div></section>
        ${m.respuesta ? h`<section class="tarjeta"><h2>Respuesta enviada</h2><div class="mensaje-texto">${m.respuesta}</div><p class="chico muted">${fecha(m.respondido_en, { hora: true })}</p></section>` : ''}
        ${responder ? h`<section class="tarjeta"><h2>${m.respuesta ? 'Responder nuevamente' : 'Responder'}</h2><form data-responder>
          <label class="campo"><span>Respuesta para ${m.nombre}</span><textarea name="respuesta" rows="8" required placeholder="Escriba una respuesta clara y cordial. La persona la verá con su código de seguimiento${m.email ? ' y la recibirá por correo' : ''}."></textarea></label>
          <label class="check"><input type="checkbox" name="correo" checked> Enviar también por correo a ${m.email}</label>
          <button class="btn primario">Enviar respuesta</button></form></section>` : ''}
      </div>
      <aside>
        <section class="tarjeta"><h2>Remitente</h2><p><b>${m.nombre}</b>${m.rut ? h`<br>RUN ${m.rut}` : ''}<br><a href="mailto:${m.email}">${m.email}</a>${m.telefono ? h`<br><a href="tel:${m.telefono}">${m.telefono}</a>` : ''}</p>
          ${m.area ? h`<p class="chico">Área: ${m.area}</p>` : ''}${m.externo ? h`<p class="chico">Ingresado en la Plataforma de Trámites: <span class="mono">${m.externo}</span></p>` : ''}</section>
        ${responder ? h`<section class="tarjeta"><h2>Gestión</h2><form data-gestion>
          <label class="campo"><span>Estado</span><select name="estado">${Object.entries(ESTADOS).map(([k, v]) => h`<option value="${k}"${k === m.estado ? raw(' selected') : ''}>${v}</option>`)}</select></label>
          <label class="campo"><span>Asignado a</span><select name="asignado_a"><option value="">— Nadie —</option>${usuarios.map((u) => h`<option value="${u.id}"${u.id === m.asignado_a ? raw(' selected') : ''}>${u.nombre}</option>`)}</select></label>
          <label class="campo"><span>Nota interna (no la ve la persona)</span><textarea name="nota" rows="3"></textarea></label>
          <button class="btn">Guardar</button></form></section>` : ''}
        <section class="tarjeta"><h2>Historial</h2><ul class="historial">${m.historial.map((x) => h`<li><b>${x.evento}</b>${x.texto ? h`<br>${x.texto}` : ''}<br><small class="muted">${fecha(x.en, { hora: true })}${x.por ? ' · ' + x.por : ''}</small></li>`)}</ul></section>
      </aside>
    </div>`);
  $('[data-responder]', vista)?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('POST', `mensajes/${id}/responder`, { respuesta: e.target.respuesta.value, enviarCorreo: e.target.correo.checked }); aviso(r.enviado ? 'Respuesta enviada por correo.' : 'Respuesta guardada (visible con el código).', 'ok'); actualizarMensajes(); detalle(vista, id); } catch (er) { fallo(er); }
  });
  $('[data-gestion]', vista)?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try { await api('PUT', 'mensajes/' + id, { estado: f.estado.value, asignado_a: f.asignado_a.value, nota: f.nota.value }); aviso('Guardado.', 'ok'); actualizarMensajes(); detalle(vista, id); } catch (er) { fallo(er); }
  });
}
