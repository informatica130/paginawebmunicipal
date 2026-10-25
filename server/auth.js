// Autenticación del panel de administración.
// · Contraseñas con scrypt (N=2^15) y sal aleatoria; comparación en tiempo constante.
// · Sesiones en la base: la cookie lleva un token aleatorio de 256 bits y en la base
//   sólo se guarda su SHA-256. Cookie HttpOnly + SameSite=Strict (+ Secure con HTTPS).
// · Token CSRF por sesión exigido en toda petición que modifica datos.
// · Segundo factor TOTP (RFC 6238) compatible con Google Authenticator, Microsoft
//   Authenticator, FreeOTP, etc.; el código no se puede reutilizar.
// · Bloqueo progresivo por cuenta y límite por IP ante intentos fallidos.

import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { ahora } from './db.js';

const scrypt = promisify(crypto.scrypt);
const N = 2 ** 15, R = 8, P = 1, LARGO = 64;

export async function hashClave(clave) {
  const sal = crypto.randomBytes(16);
  const h = await scrypt(String(clave).normalize('NFKC'), sal, LARGO, { N, r: R, p: P, maxmem: 128 * N * R * 2 });
  return `scrypt$${N}$${R}$${P}$${sal.toString('base64')}$${h.toString('base64')}`;
}

export async function verificarClave(clave, guardado) {
  const [alg, n, r, p, sal, hash] = String(guardado || '').split('$');
  if (alg !== 'scrypt' || !hash) {
    // Igualar el tiempo aunque el usuario no exista.
    await scrypt('x', 'y', LARGO, { N, r: R, p: P, maxmem: 128 * N * R * 2 });
    return false;
  }
  const esperado = Buffer.from(hash, 'base64');
  const h = await scrypt(String(clave).normalize('NFKC'), Buffer.from(sal, 'base64'), esperado.length, { N: +n, r: +r, p: +p, maxmem: 128 * +n * +r * 2 });
  return crypto.timingSafeEqual(h, esperado);
}

const COMUNES = ['melipeuco', 'municipalidad', 'password', 'contraseña', 'contrasena', '123456', 'qwerty', 'admin', 'llaima', 'chile'];
export function problemaClave(clave, { email = '', nombre = '' } = {}) {
  const c = String(clave || '');
  if (c.length < 12) return 'La contraseña debe tener al menos 12 caracteres.';
  if (c.length > 200) return 'La contraseña es demasiado larga.';
  const clases = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(c)).length;
  if (clases < 3) return 'Use al menos tres de estos tipos: minúsculas, mayúsculas, números y símbolos.';
  const baja = c.toLowerCase();
  if (/(.)\1{3,}/.test(c)) return 'La contraseña no debe repetir el mismo carácter muchas veces.';
  const usuario = String(email).split('@')[0].toLowerCase();
  if ((usuario.length >= 4 && baja.includes(usuario)) || String(nombre).toLowerCase().split(/\s+/).some((p) => p.length >= 4 && baja.includes(p))) return 'La contraseña no debe contener su nombre ni su correo.';
  if (COMUNES.some((w) => baja.replace(/[^a-zñ]/g, '') === w || (baja.includes(w) && c.length < 16))) return 'La contraseña es demasiado fácil de adivinar.';
  return null;
}

export function claveTemporal() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const b = crypto.randomBytes(16);
  let s = '';
  for (const x of b) s += a[x % a.length];
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12) + '!7';
}

export const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
export const tokenAleatorio = (n = 32) => crypto.randomBytes(n).toString('base64url');

// ---------------------------------------------------------------- TOTP
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(buf) {
  let bits = 0, val = 0, out = '';
  for (const b of buf) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
export function desdeBase32(s) {
  const limpio = String(s).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0, val = 0;
  const out = [];
  for (const ch of limpio) {
    val = (val << 5) | B32.indexOf(ch); bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
export function codigoTotp(secreto, paso) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(paso));
  const h = crypto.createHmac('sha1', desdeBase32(secreto)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1e6).padStart(6, '0');
}
// Devuelve el paso aceptado (para impedir reutilizarlo) o 0 si el código no sirve.
export function verificarTotp(secreto, codigo, ultimoPaso = 0, t = Date.now()) {
  const c = String(codigo || '').replace(/\D/g, '');
  if (c.length !== 6 || !secreto) return 0;
  const actual = Math.floor(t / 30000);
  for (const d of [0, -1, 1]) {
    const paso = actual + d;
    if (paso <= ultimoPaso) continue;
    if (crypto.timingSafeEqual(Buffer.from(codigoTotp(secreto, paso)), Buffer.from(c))) return paso;
  }
  return 0;
}
export const nuevoSecretoTotp = () => base32(crypto.randomBytes(20));

// ---------------------------------------------------------------- Sesiones
export const COOKIE = 'mlp_admin';
const INACTIVIDAD_MIN = 120;
const MAX_HORAS = 12;

// Sesiones firmadas (sólo donde cada instancia tiene su propia base, como Vercel): la cookie
// lleva además los datos de la sesión firmados con HMAC-SHA256, y una instancia que no la
// conoce la reconstruye en su base tras verificar la firma. Sin esto, cada petición que cae
// en otra instancia cierra la sesión.
const FIRMAS = new WeakMap(); // base → llave de firma
export function usarSesionesFirmadas(db, secreto) {
  if (secreto) FIRMAS.set(db, crypto.createHash('sha256').update('sesiones|' + secreto).digest()); else FIRMAS.delete(db);
}
const firmar = (llave, datos) => crypto.createHmac('sha256', llave).update(datos).digest('base64url');
function tokenFirmado(llave, datos) {
  const cuerpo = Buffer.from(JSON.stringify(datos)).toString('base64url');
  return `${tokenAleatorio(16)}.${cuerpo}.${firmar(llave, cuerpo)}`;
}
function leerFirmado(llave, token) {
  const [, cuerpo, f] = token.split('.');
  if (!cuerpo || !f) return null;
  const esperada = Buffer.from(firmar(llave, cuerpo)), dada = Buffer.from(f);
  if (esperada.length !== dada.length || !crypto.timingSafeEqual(esperada, dada)) return null;
  try { return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')); } catch { return null; }
}

export function crearSesion(db, usuario, { ip, agente, paso = 'ok', csrf = tokenAleatorio(24), expira = new Date(Date.now() + MAX_HORAS * 3600e3).toISOString() }) {
  const firma = FIRMAS.get(db);
  const token = firma ? tokenFirmado(firma, { e: usuario.email, c: csrf, p: paso, x: expira }) : tokenAleatorio(32);
  const t = ahora();
  db.run('INSERT INTO sesiones(id, usuario_id, csrf, paso, ip, agente, creado, ultimo_uso, expira) VALUES(?,?,?,?,?,?,?,?,?)',
    sha256(token), usuario.id, csrf, paso, ip || null, String(agente || '').slice(0, 300), t, t, expira);
  // Máximo 5 sesiones simultáneas por persona: se cierran las más antiguas.
  db.run(`DELETE FROM sesiones WHERE usuario_id = ? AND id NOT IN (SELECT id FROM sesiones WHERE usuario_id = ? ORDER BY ultimo_uso DESC LIMIT 5)`, usuario.id, usuario.id);
  return token;
}

export function leerSesion(db, token) {
  const firma = FIRMAS.get(db);
  if (!token || token.length > (firma ? 1000 : 100)) return null;
  let s = db.get('SELECT * FROM sesiones WHERE id = ?', sha256(token));
  if (!s && firma) {
    // Sesión iniciada en otra instancia: se reconstruye si la firma es válida y no venció.
    const d = leerFirmado(firma, token);
    const u = d && Date.parse(d.x) > Date.now() && db.get('SELECT * FROM usuarios WHERE email = ?', d.e);
    if (!u) return null;
    const t = ahora();
    db.run('INSERT OR IGNORE INTO sesiones(id, usuario_id, csrf, paso, ip, agente, creado, ultimo_uso, expira) VALUES(?,?,?,?,?,?,?,?,?)', sha256(token), u.id, String(d.c), d.p === 'ok' ? 'ok' : 'totp', null, '', t, t, d.x);
    s = db.get('SELECT * FROM sesiones WHERE id = ?', sha256(token));
  }
  if (!s) return null;
  const n = Date.now();
  if (Date.parse(s.expira) < n || Date.parse(s.ultimo_uso) + INACTIVIDAD_MIN * 60e3 < n) {
    db.run('DELETE FROM sesiones WHERE id = ?', s.id);
    return null;
  }
  const u = db.get('SELECT * FROM usuarios WHERE id = ?', s.usuario_id);
  if (!u || !u.activo || (u.acceso_hasta && u.acceso_hasta < new Date().toISOString().slice(0, 10))) {
    db.run('DELETE FROM sesiones WHERE id = ?', s.id);
    return null;
  }
  // Se actualiza el último uso como máximo una vez por minuto.
  if (Date.parse(s.ultimo_uso) + 60e3 < n) db.run('UPDATE sesiones SET ultimo_uso = ? WHERE id = ?', ahora(), s.id);
  return { sesion: s, usuario: u };
}

export function cookieSesion(token, { segura, borrar = false }) {
  const partes = [`${COOKIE}=${borrar ? '' : token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (segura) partes.push('Secure');
  partes.push(borrar ? 'Max-Age=0' : `Max-Age=${MAX_HORAS * 3600}`);
  return partes.join('; ');
}

export function leerCookies(req) {
  const out = {};
  for (const p of String(req.headers.cookie || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  }
  return out;
}

// ---------------------------------------------------------------- Límite de intentos
export class Limitador {
  constructor() { this.m = new Map(); setInterval(() => this.limpiar(), 60e3).unref(); }
  // true si se excedió: `max` eventos en `ventanaSeg`.
  exceso(clave, max, ventanaSeg) {
    const n = Date.now();
    let e = this.m.get(clave);
    if (!e || e.hasta < n) { e = { c: 0, hasta: n + ventanaSeg * 1000 }; this.m.set(clave, e); }
    e.c++;
    return e.c > max;
  }
  limpiar() { const n = Date.now(); for (const [k, e] of this.m) if (e.hasta < n) this.m.delete(k); }
}
