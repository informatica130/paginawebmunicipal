import { h, $, api, aviso, fallo, fecha, insignia, confirmar, descargarApi } from '../ui.js';

export default async function (vista) {
  const r = await api('GET', 'suscriptores');
  const cuenta = (e) => r.resumen.find((x) => x.estado === e)?.n || 0;
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Boletín de noticias</h1><p>Personas suscritas a recibir las noticias por correo. Para enviar una noticia, ábrala y use «Más acciones → Enviar por el boletín».</p></div><div class="acciones"><button class="btn" data-csv>Exportar CSV</button></div></div>
    <div class="indicadores"><div class="indicador"><b>${cuenta('activo')}</b><span>activos</span></div><div class="indicador"><b>${cuenta('pendiente')}</b><span>por confirmar</span></div><div class="indicador"><b>${cuenta('baja')}</b><span>dados de baja</span></div></div>
    <div class="tarjeta plana tabla-envoltura"><table class="tabla"><thead><tr><th>Correo</th><th>Estado</th><th>Suscrito</th><th></th></tr></thead><tbody>
    ${r.items.map((s) => h`<tr><td>${s.email}</td><td>${insignia(s.estado, { activo: 'Activo', pendiente: 'Por confirmar', baja: 'De baja' })}</td><td class="chico">${fecha(s.creado)}</td><td><button class="btn chico peligro" data-borrar="${s.id}">Eliminar</button></td></tr>`)}
    </tbody></table>${r.items.length ? '' : '<p class="cargando">Aún no hay suscriptores.</p>'}</div>`);
  $('[data-csv]', vista).addEventListener('click', () => descargarApi('suscriptores.csv', 'suscriptores.csv').catch(fallo));
  vista.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-borrar]');
    if (!b || !(await confirmar('¿Eliminar este correo de la lista?', { peligro: true, boton: 'Eliminar' }))) return;
    try { await api('DELETE', 'suscriptores/' + b.dataset.borrar); aviso('Eliminado.', 'ok'); b.closest('tr').remove(); } catch (er) { fallo(er); }
  });
}
