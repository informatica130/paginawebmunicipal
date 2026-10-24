#!/usr/bin/env node
// Recuperación de acceso desde la consola del servidor (si nadie puede ingresar al panel).
//   npm run usuario -- restablecer correo@munimelipeuco.cl      nueva contraseña temporal y desbloqueo
//   npm run usuario -- crear correo@munimelipeuco.cl "Nombre" superadmin
//   npm run usuario -- quitar-2fa correo@munimelipeuco.cl
//   npm run usuario -- listar

import path from 'node:path';
import { cargarEnv } from '../server/config.js';
import { Db, ahora } from '../server/db.js';
import { hashClave, claveTemporal } from '../server/auth.js';
import { ROLES } from '../src/tipos.js';

const cfg = cargarEnv();
const db = new Db(path.join(cfg.DATA_DIR, 'sitio.db'));
const [accion, email, nombre, rol = 'editor'] = process.argv.slice(2);
const auditar = (a, o) => db.run("INSERT INTO auditoria(en, usuario, accion, objeto, detalle) VALUES(?, 'consola del servidor', ?, ?, '')", ahora(), a, o);

if (accion === 'listar') {
  for (const u of db.all('SELECT email, nombre, rol, activo, totp_activo FROM usuarios ORDER BY nombre')) console.log(`${u.activo ? '✔' : '✗'} ${u.email.padEnd(40)} ${u.rol.padEnd(14)} ${u.totp_activo ? '2FA' : '   '} ${u.nombre}`);
} else if (accion === 'restablecer' && email) {
  const t = claveTemporal();
  const r = db.run('UPDATE usuarios SET clave = ?, debe_cambiar_clave = 1, intentos = 0, bloqueado_hasta = NULL, activo = 1 WHERE email = ?', await hashClave(t), email);
  if (!r.changes) { console.error('No existe ese usuario.'); process.exit(1); }
  db.run('DELETE FROM sesiones WHERE usuario_id = (SELECT id FROM usuarios WHERE email = ?)', email);
  auditar('usuario.restablecer', email);
  console.log(`Contraseña temporal de ${email}: ${t}`);
} else if (accion === 'crear' && email) {
  if (!ROLES[rol]) { console.error('Roles válidos: ' + Object.keys(ROLES).join(', ')); process.exit(1); }
  const t = claveTemporal();
  db.run('INSERT INTO usuarios(email, nombre, rol, clave, debe_cambiar_clave, creado) VALUES(?,?,?,?,1,?)', email, nombre || email, rol, await hashClave(t), ahora());
  auditar('usuario.crear', email);
  console.log(`Usuario ${email} (${ROLES[rol].nombre}) creado. Contraseña temporal: ${t}`);
} else if (accion === 'quitar-2fa' && email) {
  db.run('UPDATE usuarios SET totp_activo = 0, totp_secreto = NULL WHERE email = ?', email);
  auditar('usuario.totp_quitado', email);
  console.log('Verificación en dos pasos quitada para', email);
} else {
  console.log('Uso: npm run usuario -- [listar | restablecer <correo> | crear <correo> "<nombre>" <rol> | quitar-2fa <correo>]');
}
db.cerrar();
