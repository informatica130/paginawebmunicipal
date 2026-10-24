// Utilidades compartidas por el servidor (y, las que no dependen de Node, por el panel).

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ENT[c]);

// HTML ya seguro (no se vuelve a escapar al interpolarlo).
export class Seguro {
  constructor(s) { this.s = String(s ?? ''); }
  toString() { return this.s; }
}
export const crudo = (s) => new Seguro(s);

// Plantillas: html`<p>${valor}</p>` escapa todo lo interpolado salvo Seguro y
// arreglos (que se unen). null/undefined/false no imprimen nada.
export function html(partes, ...vals) {
  let out = partes[0];
  for (let i = 0; i < vals.length; i++) out += interp(vals[i]) + partes[i + 1];
  return new Seguro(out);
}
function interp(v) {
  if (v == null || v === false) return '';
  if (v instanceof Seguro) return v.s;
  if (Array.isArray(v)) return v.map(interp).join('');
  return esc(v);
}

export function slugify(s, max = 90) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '') || 'sin-titulo';
}

export function textoPlano(h) {
  return String(h || '')
    .replace(/<(script|style|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'" })[m])
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

export function recortar(s, n = 180) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), n * 0.6)).replace(/[,.;:\s]+$/, '') + '…';
}

const TZ = 'America/Santiago';
export function fecha(iso, { largo = false, hora = false, diaSemana = false } = {}) {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  if (isNaN(d)) return '';
  const o = { timeZone: TZ, day: 'numeric', month: largo ? 'long' : 'short', year: 'numeric' };
  if (diaSemana) o.weekday = 'long';
  if (hora) { o.hour = '2-digit'; o.minute = '2-digit'; }
  return d.toLocaleString('es-CL', o).replace(/\.$/, '');
}
export function horaDe(iso) {
  if (!iso || iso.length <= 10) return '';
  return new Date(iso).toLocaleTimeString('es-CL', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}
// Fecha local (Chile) YYYY-MM-DD
export function hoyLocal(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function rutValido(rut) {
  const r = String(rut || '').replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{6,9}[\dK]$/.test(r)) return false;
  let suma = 0, mul = 2;
  for (let i = r.length - 2; i >= 0; i--) { suma += Number(r[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const dv = 11 - (suma % 11);
  return (dv === 11 ? '0' : dv === 10 ? 'K' : String(dv)) === r.at(-1);
}
export function formatoRut(rut) {
  const r = String(rut || '').replace(/[.\s-]/g, '').toUpperCase();
  if (r.length < 2) return r;
  return r.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + r.at(-1);
}

export const emailValido = (e) => /^[^@\s<>"]+@[^@\s<>"]+\.[^@\s<>"]{2,}$/.test(String(e || '')) && String(e).length <= 200;

export function urlSegura(u, { permitirRelativa = true } = {}) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (permitirRelativa && /^(\/(?!\/)|#|\?)/.test(s)) return s;
  return '';
}

export const lectura = (h) => Math.max(1, Math.round(textoPlano(h).split(/\s+/).length / 200));
