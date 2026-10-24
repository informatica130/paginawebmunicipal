// Utilidades del panel: escape, plantillas, llamadas a la API con CSRF, avisos y diálogos.

export const estado = { sesion: null, csrf: '', esquema: null };

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ENT[c]);

// h`...` escapa lo interpolado; los arreglos se unen; raw() deja pasar HTML confiable.
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(s);
export function h(partes, ...vals) {
  let out = partes[0];
  vals.forEach((v, i) => { out += val(v) + partes[i + 1]; });
  return new Raw(out);
}
function val(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(val).join('');
  return esc(v);
}
export function nodo(html) {
  const t = document.createElement('template');
  t.innerHTML = String(html).trim();
  return t.content.firstElementChild;
}
export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export class ErrorApi extends Error { constructor(msg, status) { super(msg); this.status = status; } }

export async function api(metodo, ruta, cuerpo, { crudo = false, cabeceras = {} } = {}) {
  const op = { method: metodo, credentials: 'same-origin', headers: { 'X-CSRF': estado.csrf, ...cabeceras } };
  if (cuerpo !== undefined) {
    if (cuerpo instanceof Blob || cuerpo instanceof ArrayBuffer) op.body = cuerpo;
    else { op.body = JSON.stringify(cuerpo); op.headers['Content-Type'] = 'application/json'; }
  }
  const r = await fetch('/api/admin/' + ruta, op);
  if (crudo) return r;
  let datos = null;
  try { datos = await r.json(); } catch { /* vacío */ }
  if (!r.ok) {
    if (r.status === 401 && ruta !== 'login' && ruta !== 'login/totp') { estado.sesion = null; window.dispatchEvent(new Event('mlp:salir')); }
    if (r.status === 428) window.dispatchEvent(new Event('mlp:cambiar-clave'));
    throw new ErrorApi(datos?.error || `Error ${r.status}`, r.status);
  }
  return datos;
}

export function aviso(texto, tipo = '') {
  const c = $('#avisos');
  const t = nodo(h`<div class="toast ${tipo}" role="${tipo === 'error' ? 'alert' : 'status'}">${texto}</div>`);
  c.appendChild(t);
  setTimeout(() => t.remove(), tipo === 'error' ? 7000 : 3500);
}
export const fallo = (e) => aviso(e.message || String(e), 'error');

export function modal({ titulo, cuerpo, pie = '', ancho = false, alCerrar }) {
  const anterior = document.activeElement;
  const f = nodo(h`<div class="fondo-modal"><div class="modal${ancho ? ' ancho' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
    <header><h2 id="modal-titulo">${titulo}</h2><button type="button" class="btn fantasma" data-cerrar aria-label="Cerrar">✕</button></header>
    <div class="cuerpo"></div>${pie ? raw('<footer></footer>') : ''}</div></div>`);
  const c = $('.cuerpo', f);
  if (typeof cuerpo === 'string' || cuerpo instanceof Raw) c.innerHTML = String(cuerpo); else if (cuerpo) c.appendChild(cuerpo);
  if (pie) { const p = $('footer', f); if (typeof pie === 'string' || pie instanceof Raw) p.innerHTML = String(pie); else p.appendChild(pie); }
  const cerrar = () => { f.remove(); document.removeEventListener('keydown', tecla); anterior?.focus?.(); alCerrar?.(); };
  const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
  document.addEventListener('keydown', tecla);
  f.addEventListener('click', (e) => { if (e.target === f || e.target.closest('[data-cerrar]')) cerrar(); });
  document.body.appendChild(f);
  setTimeout(() => ($('input, select, textarea, button:not([data-cerrar])', c) || $('[data-cerrar]', f)).focus(), 30);
  return { raiz: f, cuerpo: c, cerrar };
}

export function confirmar(texto, { titulo = 'Confirmar', boton = 'Aceptar', peligro = false } = {}) {
  return new Promise((ok) => {
    let resp = false;
    const m = modal({ titulo, cuerpo: h`<p>${texto}</p>`, pie: h`<button class="btn" data-cerrar>Cancelar</button><button class="btn ${peligro ? 'peligro' : 'primario'}" data-ok>${boton}</button>`, alCerrar: () => ok(resp) });
    $('[data-ok]', m.raiz).addEventListener('click', () => { resp = true; m.cerrar(); });
  });
}

export function pedirTexto(titulo, { etiqueta = '', valor = '', tipo = 'text' } = {}) {
  return new Promise((ok) => {
    let resp = null;
    const m = modal({ titulo, cuerpo: h`<form><label class="campo"><span>${etiqueta}</span><input type="${tipo}" value="${valor}" required></label></form>`, pie: h`<button class="btn" data-cerrar>Cancelar</button><button class="btn primario" data-ok>Aceptar</button>`, alCerrar: () => ok(resp) });
    const enviar = (e) => { e?.preventDefault(); resp = $('input', m.raiz).value; m.cerrar(); };
    $('form', m.raiz).addEventListener('submit', enviar);
    $('[data-ok]', m.raiz).addEventListener('click', enviar);
  });
}

const TZ = 'America/Santiago';
export function fecha(iso, { hora = false } = {}) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? iso + 'T12:00' : iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', ...(hora ? { hour: '2-digit', minute: '2-digit' } : {}) });
}
export function haceCuanto(iso) {
  if (!iso) return '';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.round(s / 86400)} días`;
  return fecha(iso);
}
// ISO (UTC) -> valor para <input type="datetime-local"> en hora de Chile
export function aLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// valor local de Chile -> ISO UTC (calcula el desfase de esa fecha)
export function deLocal(v) {
  if (!v) return null;
  const supuesto = new Date(v + ':00Z');
  const comoChile = new Date(aLocal(supuesto.toISOString()) + ':00Z');
  return new Date(supuesto.getTime() + (supuesto - comoChile)).toISOString();
}

export const puede = (p) => !!estado.sesion?.permisos.includes(p);
export const ESTADOS = { borrador: 'Borrador', revision: 'En revisión', publicado: 'Publicado', programado: 'Programado', archivado: 'Archivado' };
export const insignia = (e, etiquetas = ESTADOS) => h`<span class="insignia ${e}">${etiquetas[e] || e}</span>`;

export function descargar(nombre, contenido, tipo = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export async function descargarApi(ruta, nombre) {
  const r = await api('GET', ruta, undefined, { crudo: true });
  if (!r.ok) throw new ErrorApi('No se pudo descargar.', r.status);
  descargar(nombre, await r.blob());
}

export function debounce(fn, ms = 250) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

const IC = {
  inicio: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1"/>', correo: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
  usuarios: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>', ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  grafico: '<path d="M18 20V10M12 20V4M6 20v-6"/>', escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', buscar: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', ojo: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  servidor: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/>', llave: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', mas: '<path d="M12 5v14M5 12h14"/>', enlace: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
};
export const ico = (n, t = 18) => raw(`<svg class="ico" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || IC.doc}</svg>`);
