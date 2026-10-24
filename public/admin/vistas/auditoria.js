import { h, raw, $, api, fallo, fecha, descargarApi, debounce } from '../ui.js';

export default async function (vista) {
  let pagina = 1, q = '';
  vista.innerHTML = String(h`<div class="cabecera-vista"><div><h1>Auditoría</h1><p>Registro inalterable de ingresos, cambios de contenido, permisos, exportaciones y configuración.</p></div><div class="acciones"><button class="btn" data-csv>Exportar CSV</button></div></div>
    <div class="filtros"><label class="campo"><span>Buscar</span><input type="search" data-q placeholder="Acción, persona, objeto…"></label></div>
    <div class="tarjeta plana tabla-envoltura" data-tabla></div><div class="paginacion" data-pag></div>`);
  async function cargar() {
    const r = await api('GET', `auditoria?pagina=${pagina}&q=${encodeURIComponent(q)}`);
    $('[data-tabla]', vista).innerHTML = String(h`<table class="tabla"><thead><tr><th>Fecha</th><th>Persona</th><th>Acción</th><th>Objeto</th><th>Detalle</th><th>IP</th></tr></thead><tbody>
      ${r.items.map((a) => h`<tr><td class="chico" style="white-space:nowrap">${fecha(a.en, { hora: true })}</td><td class="chico">${a.usuario || 'sistema'}</td><td><span class="insignia${/fallido|eliminar|quitado/.test(a.accion) ? ' revision' : ''}">${a.accion}</span></td><td class="chico mono">${a.objeto}</td><td class="chico">${a.detalle}</td><td class="chico mono">${a.ip || ''}</td></tr>`)}</tbody></table>`);
    $('[data-pag]', vista).innerHTML = String(h`<button class="btn chico" data-p="-1"${pagina <= 1 ? raw(' disabled') : ''}>←</button><span>${r.total.toLocaleString('es-CL')} registros</span><button class="btn chico" data-p="1"${pagina * 100 >= r.total ? raw(' disabled') : ''}>→</button>`);
  }
  $('[data-q]', vista).addEventListener('input', debounce((e) => { q = e.target.value; pagina = 1; cargar(); }));
  $('[data-pag]', vista).addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) { pagina += Number(b.dataset.p); cargar(); } });
  $('[data-csv]', vista).addEventListener('click', () => descargarApi('auditoria.csv', 'auditoria.csv').catch(fallo));
  await cargar();
}
