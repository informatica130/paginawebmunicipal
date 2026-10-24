import { h, raw, $, $$, api, estado, aviso, fallo, fecha, insignia, puede, confirmar, modal, ico, aLocal, deLocal, haceCuanto } from '../ui.js';
import { textoRico, editorBloques, campo, elegirMedio, areas } from '../campos.js';
import { marcarCambios } from '../admin.js';

export default async function (vista, args, params, modo) {
  let c;
  if (modo === 'nuevo') {
    const tipo = args[0];
    if (!estado.esquema.tipos[tipo]) throw new Error('Tipo desconocido');
    c = { tipo, titulo: '', slug: '', resumen: '', cuerpo: '', bloques: [], datos: {}, seo: {}, estado: 'borrador', taxonomias: [], imagen: '', padre_id: Number(params.get('padre')) || null, area_id: null, orden: 0, destacado: false, plantilla: '', editable: true };
  } else {
    c = await api('GET', 'contenidos/' + Number(args[0]));
  }
  const esquema = estado.esquema.tipos[c.tipo];
  const nuevo = !c.id;
  const [listaAreas, taxonomias, padres] = await Promise.all([
    areas().catch(() => []),
    esquema.taxonomias?.length ? api('GET', 'taxonomias') : [],
    esquema.jerarquico ? api('GET', `contenidos?tipo=${c.tipo}&limite=500&orden=titulo`).then((r) => r.items.filter((x) => x.id !== c.id)) : [],
  ]);
  const areasPermitidas = estado.sesion.areasPermitidas ? new Set(estado.sesion.areasPermitidas) : null;
  const opcionesAreas = listaAreas.filter((a) => !areasPermitidas || areasPermitidas.has(a.id));
  const soloLectura = !c.editable;
  const puedePublicar = puede('contenido.publicar');

  vista.innerHTML = String(h`
    <div class="cabecera-vista"><div><p class="chico"><a href="#/contenidos/${c.tipo}">← ${esquema.plural}</a></p><h1>${nuevo ? `Nuevo: ${esquema.etiqueta.toLowerCase()}` : `Editar ${esquema.etiqueta.toLowerCase()}`}</h1>
      ${!nuevo ? h`<p>${insignia(c.estado)} · Modificado ${haceCuanto(c.modificado)}${c.modificadoPor ? ' por ' + c.modificadoPor : ''}${c.autor ? ' · Autor: ' + c.autor : ''}</p>` : ''}</div>
      <div class="acciones">${!nuevo && !esquema.sinPagina ? h`<a class="btn" href="${c.estado === 'publicado' ? c.url : '/vista-previa/' + c.id + '/'}" target="_blank" rel="noopener">${ico('ojo', 16)} ${c.estado === 'publicado' ? 'Ver en el sitio' : 'Vista previa'}</a>` : ''}</div>
    </div>
    ${c.bloqueo ? h`<div class="aviso-bloqueo" role="alert">⚠ <b>${c.bloqueo.por}</b> está editando este contenido en este momento. Si guarda, podría sobrescribir sus cambios.</div>` : ''}
    ${soloLectura ? h`<div class="caja alerta">No tiene permiso para modificar este contenido (pertenece a otra persona o a un área que no tiene asignada). Puede verlo, pero no guardarlo.</div>` : ''}
    <form class="editor" novalidate>
      <div class="editor-principal">
        <div class="tarjeta">
          <label class="campo"><span class="sr">Título</span><input class="titulo-grande" name="titulo" placeholder="Título" required maxlength="300"></label>
          ${esquema.sinPagina ? '' : h`<div class="slug"><span>Dirección:</span><span class="mono" data-base></span><input name="slug" class="mono" placeholder="se genera desde el título" aria-label="Dirección (slug)"></div>`}
          ${c.tipo !== 'slide' && c.tipo !== 'acceso' ? h`<label class="campo"><span>${c.tipo === 'aviso' ? 'Texto breve (se muestra junto al título)' : 'Resumen o bajada'}</span><textarea name="resumen" rows="2" maxlength="600" placeholder="Una o dos frases que expliquen de qué se trata. Aparece en tarjetas, buscadores y redes sociales."></textarea></label>` : ''}
          <div data-cuerpo></div>
        </div>
        ${(esquema.campos || []).length ? h`<div class="tarjeta"><h2>${{ tramite: 'Ficha del trámite', evento: 'Datos del evento', area: 'Datos del área', autoridad: 'Datos de la autoridad', sesion: 'Datos de la sesión', documento: 'Archivo y datos', contacto: 'Datos de contacto', slide: 'Banner', acceso: 'Acceso rápido', aviso: 'Configuración del aviso', encuesta: 'Opciones', lugar: 'Datos del lugar', noticia: 'Multimedia', pagina: 'Opciones' }[c.tipo] || 'Datos'}</h2><div data-campos class="fila" style="grid-template-columns:1fr"></div></div>` : ''}
        ${esquema.bloques ? h`<div class="tarjeta"><h2>Bloques de contenido</h2><p class="chico muted">Agregue secciones adicionales: galerías, botones, tarjetas, preguntas frecuentes, mapas, documentos, trámites en línea y más. Se muestran después del texto principal.</p><div data-bloques></div></div>` : ''}
      </div>
      <aside class="editor-lateral">
        <details class="panel" open><summary>Publicación</summary><div>
          <label class="campo"><span>Estado</span><select name="estado">${Object.entries(estado.esquema.estados).filter(([k]) => puedePublicar || ['borrador', 'revision'].includes(k) || k === c.estado).map(([k, v]) => h`<option value="${k}"${k === c.estado ? raw(' selected') : ''}>${v}</option>`)}</select></label>
          ${puedePublicar ? h`<label class="campo"><span>Fecha de publicación</span><input type="datetime-local" name="publicado_en"><small class="ayuda">Si pone una fecha futura y elige «Publicado», se publicará sola en ese momento.</small></label>
          <label class="check"><input type="checkbox" name="destacado"${c.destacado ? raw(' checked') : ''}> Destacar en portada</label>` : h`<p class="chico muted">Su rol envía los contenidos a revisión; un(a) editor(a) los publica.</p>`}
          <div class="acciones" style="margin-top:10px">
            <button type="submit" class="btn primario" data-guardar${soloLectura ? raw(' disabled') : ''}>Guardar</button>
            ${puedePublicar && c.estado !== 'publicado' ? h`<button type="button" class="btn acento" data-publicar${soloLectura ? raw(' disabled') : ''}>Publicar ahora</button>` : ''}
            ${!puedePublicar && c.estado === 'borrador' ? h`<button type="button" class="btn acento" data-revision>Enviar a revisión</button>` : ''}
          </div>
          <p class="chico muted" data-estado-guardado></p>
        </div></details>
        ${esquema.jerarquico || c.tipo !== 'aviso' ? h`<details class="panel" open><summary>Organización</summary><div>
          ${esquema.jerarquico ? h`<label class="campo"><span>${c.tipo === 'area' ? 'Depende de' : 'Página superior'}</span><select name="padre_id"><option value="">— Ninguna (nivel principal) —</option>${padres.map((p) => h`<option value="${p.id}"${p.id === c.padre_id ? raw(' selected') : ''}>${p.titulo}</option>`)}</select></label>` : ''}
          ${c.tipo !== 'area' && !['slide', 'acceso', 'aviso'].includes(c.tipo) ? h`<label class="campo"><span>Área municipal responsable</span><select name="area_id"><option value="">${areasPermitidas ? '— Elija un área —' : '— Ninguna —'}</option>${opcionesAreas.map((a) => h`<option value="${a.id}"${a.id === c.area_id ? raw(' selected') : ''}>${a.titulo}</option>`)}</select></label>` : ''}
          ${esquema.plantillas ? h`<label class="campo"><span>Diseño</span><select name="plantilla">${Object.entries(esquema.plantillas).map(([k, v]) => h`<option value="${k}"${k === (c.plantilla || 'normal') ? raw(' selected') : ''}>${v}</option>`)}</select></label>` : ''}
          ${esquema.ordenable || esquema.jerarquico ? h`<label class="campo"><span>Orden</span><input type="number" name="orden" value="${c.orden || 0}"></label>` : ''}
          ${(esquema.taxonomias || []).map((tt) => h`<div class="campo"><span>${estado.esquema.taxonomias[tt].plural}</span><div class="lista-tax">${taxonomias.filter((t) => t.tipo === tt).map((t) => h`<label class="check"><input type="checkbox" name="tax" value="${t.id}"${c.taxonomias.includes(t.id) ? raw(' checked') : ''}> ${t.nombre}</label>`)}${taxonomias.filter((t) => t.tipo === tt).length ? '' : raw('<p class="chico muted">No hay. Créelas en «Categorías y etiquetas».</p>')}</div></div>`)}
        </div></details>` : ''}
        ${c.tipo !== 'aviso' && c.tipo !== 'contacto' ? h`<details class="panel" open><summary>${c.tipo === 'slide' ? 'Imagen del banner *' : c.tipo === 'autoridad' ? 'Fotografía' : 'Imagen destacada'}</summary><div class="imagen-destacada">
          <img data-img-prev alt="" ${c.imagen ? '' : raw('hidden')}>
          <div class="acciones"><button type="button" class="btn chico" data-elegir-img>Elegir imagen</button><button type="button" class="btn chico fantasma" data-quitar-img>Quitar</button></div>
          <input type="hidden" name="imagen">
        </div></details>` : ''}
        ${esquema.sinPagina ? '' : h`<details class="panel"><summary>Buscadores y redes sociales (SEO)</summary><div>
          <label class="campo"><span>Título para Google</span><input name="seo_titulo" maxlength="120"><span class="contador-seo" data-cont="seo_titulo"></span></label>
          <label class="campo"><span>Descripción para Google</span><textarea name="seo_descripcion" rows="3" maxlength="300"></textarea><span class="contador-seo" data-cont="seo_descripcion"></span></label>
          <label class="check"><input type="checkbox" name="seo_noindex"> No mostrar en buscadores</label>
          <p class="chico muted">Así se verá en Google:</p><div class="vista-google"><b data-g-titulo></b><span data-g-url></span><p data-g-desc style="margin:4px 0 0"></p></div>
        </div></details>`}
        ${!nuevo ? h`<details class="panel"><summary>Historial de cambios (${c.revisiones})</summary><div data-revisiones><p class="chico muted">Ábralo para ver las versiones anteriores.</p></div></details>
        <details class="panel"><summary>Más acciones</summary><div class="acciones">
          ${puede('contenido.crear') ? raw('<button type="button" class="btn chico" data-duplicar>Duplicar</button>') : ''}
          ${c.tipo === 'noticia' && puede('contenido.publicar') && c.estado === 'publicado' ? raw('<button type="button" class="btn chico" data-boletin>Enviar por el boletín</button>') : ''}
          ${puede('contenido.eliminar') && !soloLectura ? raw('<button type="button" class="btn chico peligro" data-eliminar>Eliminar</button>') : ''}
        </div></details>` : ''}
      </aside>
    </form>`);

  const f = $('form', vista);
  f.titulo.value = c.titulo;
  if (f.slug) f.slug.value = nuevo ? '' : c.slug;
  if (f.resumen) f.resumen.value = c.resumen || '';
  if (f.publicado_en) f.publicado_en.value = aLocal(c.publicado_en);
  if (f.imagen) f.imagen.value = c.imagen || '';
  if (f.seo_titulo) { f.seo_titulo.value = c.seo?.titulo || ''; f.seo_descripcion.value = c.seo?.descripcion || ''; f.seo_noindex.checked = !!c.seo?.noindex; }
  const base = $('[data-base]', vista);
  if (base) base.textContent = location.origin + (c.url ? c.url.replace(/[^/]+\/$/, '') : (estado.esquema.rutas[c.tipo] || '/'));

  // Cuerpo, campos y bloques
  let cuerpo = null;
  if (esquema.cuerpo) {
    cuerpo = textoRico(c.cuerpo, { avanzado: puede('html.avanzado') || puede('contenido.editar') });
    const w = $('[data-cuerpo]', vista);
    w.innerHTML = `<span class="campo"><span>${c.tipo === 'noticia' ? 'Texto de la noticia' : c.tipo === 'tramite' ? 'Información adicional (opcional)' : c.tipo === 'aviso' ? 'Detalle (opcional)' : 'Contenido'}</span></span>`;
    w.appendChild(cuerpo.el);
  }
  const controles = (esquema.campos || []).map((def) => { const x = campo(def, c.datos?.[def.k]); $('[data-campos]', vista).appendChild(x.el); return { k: def.k, valor: x.valor }; });
  const bloques = esquema.bloques ? editorBloques(c.bloques) : null;
  if (bloques) $('[data-bloques]', vista).appendChild(bloques.el);

  // Imagen destacada
  const prev = $('[data-img-prev]', vista);
  const fijarImagen = (url) => { f.imagen.value = url; prev.hidden = !url; if (url) prev.src = url; };
  if (prev) { fijarImagen(c.imagen || ''); }
  $('[data-elegir-img]', vista)?.addEventListener('click', async () => { const m = await elegirMedio({ tipo: 'imagen' }); if (m) fijarImagen(m.url); });
  $('[data-quitar-img]', vista)?.addEventListener('click', () => fijarImagen(''));

  // Vista previa de Google
  const actualizarSeo = () => {
    if (!f.seo_titulo) return;
    $('[data-g-titulo]', vista).textContent = (f.seo_titulo.value || f.titulo.value || 'Título') + ' | Municipalidad de Melipeuco';
    $('[data-g-url]', vista).textContent = location.host + (c.url || '/…');
    $('[data-g-desc]', vista).textContent = f.seo_descripcion.value || f.resumen?.value || 'Agregue un resumen para mostrar una descripción.';
    $('[data-cont="seo_titulo"]', vista).textContent = `${f.seo_titulo.value.length}/60 recomendado`;
    $('[data-cont="seo_descripcion"]', vista).textContent = `${f.seo_descripcion.value.length}/160 recomendado`;
  };
  f.addEventListener('input', actualizarSeo);
  actualizarSeo();

  // Recolección y guardado
  const recoger = (estadoForzado) => {
    const datos = Object.fromEntries(controles.map((x) => [x.k, x.valor()]));
    const fechaPub = f.publicado_en?.value ? deLocal(f.publicado_en.value) : undefined;
    return {
      tipo: c.tipo, titulo: f.titulo.value.trim(), slug: f.slug?.value.trim() || undefined, resumen: f.resumen?.value ?? '',
      cuerpo: cuerpo ? cuerpo.valor() : undefined, bloques: bloques ? bloques.valor() : undefined, datos,
      estado: estadoForzado || f.estado.value, publicado_en: fechaPub, destacado: f.destacado ? f.destacado.checked : undefined,
      padre_id: f.padre_id ? Number(f.padre_id.value) || null : undefined, area_id: f.area_id ? Number(f.area_id.value) || null : undefined,
      plantilla: f.plantilla?.value, orden: f.orden ? Number(f.orden.value) || 0 : undefined, imagen: f.imagen?.value ?? undefined,
      taxonomias: esquema.taxonomias?.length ? $$('input[name=tax]:checked', f).map((x) => Number(x.value)) : undefined,
      seo: f.seo_titulo ? { titulo: f.seo_titulo.value, descripcion: f.seo_descripcion.value, noindex: f.seo_noindex.checked } : undefined,
      modificadoBase: c.modificado,
    };
  };
  let inicial = JSON.stringify(recoger());
  marcarCambios(() => JSON.stringify(recoger()) !== inicial);
  let guardando = false;
  async function guardar(estadoForzado) {
    if (guardando || soloLectura) return;
    const d = recoger(estadoForzado);
    if (!d.titulo) { aviso('Escriba un título.', 'error'); f.titulo.focus(); return; }
    if (c.tipo === 'slide' && !d.imagen) { aviso('Elija la imagen del banner.', 'error'); return; }
    guardando = true;
    const b = $('[data-guardar]', vista); b.disabled = true; b.textContent = 'Guardando…';
    try {
      const r = nuevo ? await api('POST', 'contenidos', d) : await api('PUT', 'contenidos/' + c.id, d);
      inicial = JSON.stringify(recoger());
      marcarCambios(null);
      aviso(r.estado === 'publicado' ? 'Guardado y publicado.' : r.estado === 'programado' ? `Programado para el ${fecha(r.publicado_en, { hora: true })}.` : r.estado === 'revision' ? 'Enviado a revisión.' : 'Guardado.', 'ok');
      if (nuevo || estadoForzado || r.estado !== c.estado) { location.hash = '#/editar/' + r.id; if (!nuevo) setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 0); }
      else { c.modificado = r.modificado; $('[data-estado-guardado]', vista).textContent = 'Guardado ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); }
    } catch (e) { fallo(e); } finally { guardando = false; b.disabled = false; b.textContent = 'Guardar'; }
  }
  f.addEventListener('submit', (e) => { e.preventDefault(); guardar(); });
  $('[data-publicar]', vista)?.addEventListener('click', () => guardar('publicado'));
  $('[data-revision]', vista)?.addEventListener('click', () => guardar('revision'));
  const ctrlS = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); guardar(); } };
  document.addEventListener('keydown', ctrlS);
  window.addEventListener('hashchange', () => document.removeEventListener('keydown', ctrlS), { once: true });

  // Bloqueo de edición simultánea (latido cada 60 s)
  if (!nuevo && !soloLectura) {
    const latido = () => api('POST', `contenidos/${c.id}/bloqueo`).catch(() => {});
    latido();
    const t = setInterval(() => { if (!document.body.contains(f)) return clearInterval(t); latido(); }, 60000);
  }

  // Revisiones
  $('[data-revisiones]', vista)?.closest('details').addEventListener('toggle', async (e) => {
    if (!e.target.open) return;
    const lista = await api('GET', `contenidos/${c.id}/revisiones`);
    const cont = $('[data-revisiones]', vista);
    cont.innerHTML = lista.length ? String(h`<ul class="lista-simple">${lista.map((r) => h`<li><span class="chico">${fecha(r.creado, { hora: true })}<br><small class="muted">${r.autor || 'sistema'}</small></span><button type="button" class="btn chico" data-restaurar="${r.id}">Restaurar</button></li>`)}</ul>`) : '<p class="chico muted">Aún no hay versiones anteriores.</p>';
  });
  vista.addEventListener('click', async (e) => {
    const r = e.target.closest('[data-restaurar]');
    if (r) {
      if (!(await confirmar('¿Volver a esta versión? La versión actual quedará guardada en el historial.', { boton: 'Restaurar' }))) return;
      try { await api('POST', `contenidos/${c.id}/revisiones/${r.dataset.restaurar}/restaurar`); marcarCambios(null); aviso('Versión restaurada.', 'ok'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (er) { fallo(er); }
    }
    if (e.target.closest('[data-duplicar]')) { try { const n = await api('POST', `contenidos/${c.id}/duplicar`); aviso('Copia creada como borrador.', 'ok'); location.hash = '#/editar/' + n.id; } catch (er) { fallo(er); } }
    if (e.target.closest('[data-eliminar]')) {
      if (!(await confirmar(`¿Eliminar «${c.titulo}»? Esta acción no se puede deshacer.`, { peligro: true, boton: 'Eliminar' }))) return;
      try { await api('DELETE', 'contenidos/' + c.id); marcarCambios(null); aviso('Eliminado.', 'ok'); location.hash = '#/contenidos/' + c.tipo; } catch (er) { fallo(er); }
    }
    if (e.target.closest('[data-boletin]')) {
      if (!(await confirmar('¿Enviar esta noticia por correo a todas las personas suscritas al boletín?', { boton: 'Enviar' }))) return;
      try { const x = await api('POST', 'boletin/enviar', { contenido: c.id }); aviso(`Enviando a ${x.destinatarios} suscriptores.`, 'ok'); } catch (er) { fallo(er); }
    }
  });
}
