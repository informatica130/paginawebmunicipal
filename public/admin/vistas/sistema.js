import { h, raw, $, api, aviso, fallo, fecha, puede, confirmar, descargar, descargarApi } from '../ui.js';

export default async function (vista) {
  const [plataforma, respaldos, redirecciones, importacion, facebook] = await Promise.all([
    api('GET', 'plataforma'),
    puede('respaldo.gestionar') ? api('GET', 'respaldos') : null,
    puede('redirecciones.editar') ? api('GET', 'redirecciones') : null,
    puede('respaldo.gestionar') ? api('GET', 'importar-wordpress') : null,
    puede('respaldo.gestionar') ? api('GET', 'importar-facebook') : null,
  ]);
  const p = plataforma.estado;
  const cat = plataforma.catalogo;
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Sistema e integraciones</h1><p>Conexión con la Plataforma Municipal de Trámites, respaldos, importación desde WordPress y Facebook, y redirecciones.</p></div></div>
    <section class="tarjeta"><h2>Plataforma Municipal de Trámites</h2>
      ${p.configurado ? h`<p class="estado-plataforma"><span class="punto ${p.enLinea ? 'ok' : 'mal'}"></span> <b>${p.enLinea ? 'Conectada' : 'Sin respuesta'}</b> · ${p.base} ${p.version ? '· versión ' + p.version : ''}</p>
        <p class="chico muted">El sitio lee en vivo el catálogo público de la plataforma: cada trámite nuevo que se publique allí aparece solo en «Trámites» y en la página de su área. Las fichas del sitio pueden vincularse a un trámite de la plataforma (campo «Trámite de la Plataforma») para ofrecer reserva de hora, solicitud y seguimiento en línea.</p>
        <div class="acciones"><a class="btn" href="${plataforma.enlaces?.portal}" target="_blank" rel="noopener">Portal ciudadano</a><a class="btn" href="${plataforma.enlaces?.intranet}" target="_blank" rel="noopener">Intranet</a><button class="btn" data-refrescar>Actualizar datos</button></div>
        ${cat ? h`<h3 style="margin-top:16px">${cat.tramites.length} trámites en línea publicados en la plataforma</h3><div class="tabla-envoltura"><table class="tabla"><thead><tr><th>Código</th><th>Trámite</th><th>Dependencia</th><th>Hora</th></tr></thead><tbody>${cat.tramites.map((t) => h`<tr><td class="mono chico">${t.id}</td><td>${t.nombre}</td><td class="chico">${t.departamento?.name || ''}</td><td>${t.conHora ? '✔' : ''}</td></tr>`)}</tbody></table></div>` : ''}`
      : h`<div class="caja alerta"><p><b>No está conectada.</b> Para integrar los trámites en línea, defina en el servidor del sitio:</p><pre class="mono chico">TRAMITES_URL=https://tramites.municipalidadmelipeuco.cl/
TRAMITES_API_KEY=(llave con alcance «solicitudes.crear», opcional: OIRS → Oficina de Partes)
CORS_ORIGINS=https://tramites.municipalidadmelipeuco.cl</pre><p class="chico">Y en la plataforma: <code>CORS_ORIGINS</code> y <code>FRAME_ANCESTORS</code> deben incluir el dominio de este sitio.</p></div>`}
    </section>
    ${respaldos ? h`<section class="tarjeta"><h2>Respaldos</h2><p class="chico muted">Se crea un respaldo automático cada día (se conservan los últimos). Los archivos subidos están en la carpeta de datos del servidor.</p>
      <div class="acciones"><button class="btn primario" data-respaldo>Crear respaldo ahora</button><button class="btn" data-exportar>Exportar contenido (JSON)</button></div>
      <ul class="lista-simple" style="margin-top:12px">${respaldos.slice(0, 10).map((r) => h`<li><span class="mono chico">${r.archivo}</span><span class="chico">${(r.tamano / 1048576).toFixed(1)} MB · ${fecha(r.fecha, { hora: true })} <button class="btn chico" data-descargar="${r.archivo}">Descargar</button></span></li>`)}</ul></section>
    <section class="tarjeta"><h2>Importar desde el sitio WordPress</h2>
      <p class="chico">Vuelve a leer municipalidadmelipeuco.cl (noticias, páginas, eventos, categorías y medios) y agrega lo que falte. No modifica lo que ya existe, salvo que marque «reemplazar».</p>
      <p class="chico">Última importación: <b>${{ nunca: 'nunca desde el panel', curso: 'en curso…', medios: 'descargando archivos…', listo: 'completada', error: 'con error' }[importacion.en] || importacion.en}</b>${importacion.fin ? ' · ' + fecha(importacion.fin, { hora: true }) : ''}${importacion.creados != null ? ` · ${importacion.creados} nuevos, ${importacion.omitidos} ya existían` : ''}${importacion.error ? ' · ' + importacion.error : ''}</p>
      <label class="check"><input type="checkbox" data-medios> Descargar también imágenes y archivos al servidor (necesario antes de apagar el WordPress antiguo)</label>
      <label class="check"><input type="checkbox" data-reemplazar> Reemplazar el contenido importado con la versión del WordPress</label>
      <button class="btn" data-importar>Importar ahora</button></section>` : ''}
    ${facebook ? h`<section class="tarjeta"><h2>Publicaciones de Facebook</h2>
      <p class="chico">Agrega como noticias las publicaciones y los álbumes con texto de la página de Facebook del municipio (con sus fotos y categorías) y las publicaciones del CESFAM Melipeuco (con etiquetas por programa de salud), y como eventos pasados de la agenda las fiestas y actividades de los álbumes. Los álbumes completos se ven en la fototeca (/fotos/). Sólo crea las que faltan: no toca las que ya se importaron, aunque se hayan editado o eliminado.</p>
      <p class="chico">${facebook.noticias ?? facebook.disponibles} noticias y ${facebook.eventos || 0} eventos en el paquete · <b>${facebook.importadas} ya están en el sitio</b>${facebook.ultima ? ' · última importación ' + fecha(facebook.ultima.fin, { hora: true }) : ''}</p>
      <button class="btn" data-facebook ${facebook.importadas >= facebook.disponibles ? 'disabled' : ''}>Importar publicaciones</button></section>` : ''}
    ${redirecciones ? h`<section class="tarjeta"><h2>Redirecciones</h2><p class="chico muted">Envían direcciones antiguas a las nuevas (útil para enlaces impresos o publicados en redes).</p>
      <form class="fila" data-redir><input name="origen" placeholder="/direccion-antigua/" required><input name="destino" placeholder="/direccion-nueva/ o https://…" required><select name="codigo"><option value="301">Permanente (301)</option><option value="302">Temporal (302)</option></select><button class="btn">Agregar</button></form>
      <div class="tabla-envoltura"><table class="tabla"><thead><tr><th>Origen</th><th>Destino</th><th>Usos</th><th></th></tr></thead><tbody>${redirecciones.map((r) => h`<tr><td class="mono chico">${r.origen}</td><td class="mono chico">${r.destino}</td><td>${r.visitas}</td><td><button class="btn chico peligro" data-borrar-redir="${r.id}">✕</button></td></tr>`)}</tbody></table></div></section>` : ''}
    <section class="tarjeta"><h2>Mantenimiento</h2><div class="acciones">${puede('ajustes.editar') ? raw('<button class="btn" data-reindexar>Reconstruir índice de búsqueda</button>') : ''}<button class="btn" data-cache>Limpiar caché del sitio</button><a class="btn" href="/api/salud" target="_blank" rel="noopener">Estado del servidor</a></div></section>`);

  vista.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    try {
      if (b.dataset.refrescar !== undefined) { await api('GET', 'plataforma?refrescar=1'); window.dispatchEvent(new HashChangeEvent('hashchange')); }
      if (b.dataset.respaldo !== undefined) { const r = await api('POST', 'respaldos'); aviso(`Respaldo creado: ${r.archivo}`, 'ok'); window.dispatchEvent(new HashChangeEvent('hashchange')); }
      if (b.dataset.descargar) await descargarApi('respaldos/' + b.dataset.descargar, b.dataset.descargar);
      if (b.dataset.exportar !== undefined) { const d = await api('GET', 'exportar'); descargar(`sitio-melipeuco-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(d), 'application/json'); }
      if (b.dataset.importar !== undefined) {
        if (!(await confirmar('¿Importar ahora desde el WordPress? Puede tardar varios minutos.', { boton: 'Importar' }))) return;
        await api('POST', 'importar-wordpress', { medios: $('[data-medios]', vista).checked, reemplazar: $('[data-reemplazar]', vista).checked });
        aviso('Importación iniciada. Recargue esta sección en unos minutos para ver el resultado.', 'ok');
      }
      if (b.dataset.facebook !== undefined) {
        if (!(await confirmar('¿Agregar las noticias y eventos de Facebook que faltan?', { boton: 'Importar' }))) return;
        const r = await api('POST', 'importar-facebook');
        aviso(`${r.creados - (r.eventos || 0)} noticias y ${r.eventos || 0} eventos nuevos${r.omitidos ? `, ${r.omitidos} ya estaban` : ''}.`, 'ok');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
      if (b.dataset.borrarRedir) { await api('DELETE', 'redirecciones/' + b.dataset.borrarRedir); b.closest('tr').remove(); }
      if (b.dataset.reindexar !== undefined) { await api('POST', 'reindexar'); aviso('Índice de búsqueda reconstruido.', 'ok'); }
      if (b.dataset.cache !== undefined) { await api('POST', 'cache/limpiar'); aviso('Caché limpiada.', 'ok'); }
    } catch (er) { fallo(er); }
  });
  $('[data-redir]', vista)?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try { await api('POST', 'redirecciones', { origen: f.origen.value, destino: f.destino.value, codigo: f.codigo.value }); aviso('Redirección guardada.', 'ok'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (er) { fallo(er); }
  });
}
