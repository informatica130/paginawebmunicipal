#!/usr/bin/env node
// Respaldos de la base del sitio (copia consistente en caliente con VACUUM INTO).
// Con BACKUP_KEY se cifran con AES-256-GCM. Se conservan los últimos BACKUP_KEEP.
//   node herramientas/respaldo.js                       crea un respaldo ahora
//   node herramientas/respaldo.js descifrar <archivo.enc> <salida.db>
// Los archivos subidos (DATA_DIR/uploads) se respaldan aparte con la copia del servidor.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const clave = (k) => crypto.createHash('sha256').update(String(k)).digest();

export function respaldar(db, cfg) {
  const dir = path.join(cfg.DATA_DIR, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const marca = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const destino = path.join(dir, `sitio-${marca}.db`);
  db.copiar(destino);
  let final = destino;
  if (cfg.BACKUP_KEY) {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', clave(cfg.BACKUP_KEY), iv);
    const datos = Buffer.concat([c.update(fs.readFileSync(destino)), c.final()]);
    final = destino + '.enc';
    fs.writeFileSync(final, Buffer.concat([Buffer.from('MLPS1'), iv, c.getAuthTag(), datos]));
    fs.unlinkSync(destino);
  }
  const huella = crypto.createHash('sha256').update(fs.readFileSync(final)).digest('hex');
  fs.writeFileSync(final + '.sha256', `${huella}  ${path.basename(final)}\n`);
  const todos = fs.readdirSync(dir).filter((f) => /^sitio-.*\.db(\.enc)?$/.test(f)).sort();
  for (const f of todos.slice(0, Math.max(0, todos.length - (cfg.BACKUP_KEEP || 14)))) {
    fs.rmSync(path.join(dir, f), { force: true });
    fs.rmSync(path.join(dir, f + '.sha256'), { force: true });
  }
  return { archivo: final, huella, tamano: fs.statSync(final).size };
}

export function descifrar(archivo, salida, k) {
  const b = fs.readFileSync(archivo);
  if (b.subarray(0, 5).toString() !== 'MLPS1') throw new Error('No es un respaldo cifrado del sitio.');
  const d = crypto.createDecipheriv('aes-256-gcm', clave(k), b.subarray(5, 17));
  d.setAuthTag(b.subarray(17, 33));
  fs.writeFileSync(salida, Buffer.concat([d.update(b.subarray(33)), d.final()]));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { cargarEnv } = await import('../server/config.js');
  const cfg = cargarEnv();
  if (process.argv[2] === 'descifrar') {
    if (!cfg.BACKUP_KEY) throw new Error('Defina BACKUP_KEY.');
    descifrar(process.argv[3], process.argv[4], cfg.BACKUP_KEY);
    console.log('Respaldo descifrado en', process.argv[4]);
  } else {
    const { Db } = await import('../server/db.js');
    const db = new Db(path.join(cfg.DATA_DIR, 'sitio.db'));
    const r = respaldar(db, cfg);
    console.log(`Respaldo creado: ${r.archivo} (${(r.tamano / 1048576).toFixed(1)} MB)`);
    db.cerrar();
  }
}
