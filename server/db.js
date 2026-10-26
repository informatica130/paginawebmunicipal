// Base de datos del sitio (SQLite integrado en Node ≥ 22.5, sin dependencias).
// Un solo archivo, modo WAL, claves foráneas y búsqueda de texto completo (FTS5).
// Todos los tipos de contenido (páginas, noticias, trámites, eventos, documentos…)
// viven en la tabla `contenidos`; sus campos propios van en `datos` (JSON) según el
// esquema de src/tipos.js. Así se agregan tipos nuevos sin migrar la base.

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const MIGRACIONES = [
  // 1: esquema inicial
  `
  CREATE TABLE contenidos (
    id INTEGER PRIMARY KEY,
    tipo TEXT NOT NULL,
    slug TEXT NOT NULL,
    titulo TEXT NOT NULL DEFAULT '',
    resumen TEXT NOT NULL DEFAULT '',
    cuerpo TEXT NOT NULL DEFAULT '',
    bloques TEXT NOT NULL DEFAULT '[]',
    datos TEXT NOT NULL DEFAULT '{}',
    seo TEXT NOT NULL DEFAULT '{}',
    estado TEXT NOT NULL DEFAULT 'borrador',
    publicado_en TEXT,
    autor_id INTEGER,
    padre_id INTEGER REFERENCES contenidos(id) ON DELETE SET NULL,
    area_id INTEGER REFERENCES contenidos(id) ON DELETE SET NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    imagen TEXT NOT NULL DEFAULT '',
    destacado INTEGER NOT NULL DEFAULT 0,
    plantilla TEXT NOT NULL DEFAULT '',
    wp_id INTEGER,
    url_antigua TEXT,
    bloqueo_por INTEGER,
    bloqueo_hasta TEXT,
    creado TEXT NOT NULL,
    modificado TEXT NOT NULL,
    modificado_por INTEGER
  );
  CREATE UNIQUE INDEX ux_contenidos_slug ON contenidos(tipo, ifnull(padre_id, 0), slug);
  CREATE INDEX ix_contenidos_lista ON contenidos(tipo, estado, publicado_en DESC);
  CREATE INDEX ix_contenidos_padre ON contenidos(padre_id, orden);
  CREATE INDEX ix_contenidos_area ON contenidos(area_id, tipo);
  CREATE INDEX ix_contenidos_url ON contenidos(url_antigua);

  CREATE TABLE revisiones (
    id INTEGER PRIMARY KEY,
    contenido_id INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
    datos TEXT NOT NULL,
    autor_id INTEGER,
    nota TEXT NOT NULL DEFAULT '',
    creado TEXT NOT NULL
  );
  CREATE INDEX ix_revisiones ON revisiones(contenido_id, id DESC);

  CREATE TABLE taxonomias (
    id INTEGER PRIMARY KEY,
    tipo TEXT NOT NULL,
    slug TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    padre_id INTEGER REFERENCES taxonomias(id) ON DELETE SET NULL,
    color TEXT NOT NULL DEFAULT '',
    orden INTEGER NOT NULL DEFAULT 0,
    wp_id INTEGER,
    UNIQUE(tipo, slug)
  );
  CREATE TABLE contenido_taxonomia (
    contenido_id INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
    taxonomia_id INTEGER NOT NULL REFERENCES taxonomias(id) ON DELETE CASCADE,
    PRIMARY KEY (contenido_id, taxonomia_id)
  );
  CREATE INDEX ix_ct_tax ON contenido_taxonomia(taxonomia_id);

  CREATE TABLE medios (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    ruta TEXT,
    nombre TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL DEFAULT '',
    tamano INTEGER NOT NULL DEFAULT 0,
    ancho INTEGER, alto INTEGER,
    alt TEXT NOT NULL DEFAULT '',
    titulo TEXT NOT NULL DEFAULT '',
    creditos TEXT NOT NULL DEFAULT '',
    variantes TEXT NOT NULL DEFAULT '{}',
    carpeta TEXT NOT NULL DEFAULT '',
    huella TEXT,
    subido_por INTEGER,
    wp_id INTEGER,
    creado TEXT NOT NULL
  );
  CREATE INDEX ix_medios_fecha ON medios(creado DESC);
  CREATE INDEX ix_medios_huella ON medios(huella);

  CREATE TABLE menus (
    clave TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    modificado TEXT NOT NULL
  );

  CREATE TABLE ajustes (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );

  CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT '',
    rol TEXT NOT NULL,
    areas TEXT NOT NULL DEFAULT '[]',
    clave TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1,
    debe_cambiar_clave INTEGER NOT NULL DEFAULT 0,
    totp_secreto TEXT,
    totp_activo INTEGER NOT NULL DEFAULT 0,
    totp_ultimo INTEGER NOT NULL DEFAULT 0,
    intentos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TEXT,
    ultimo_acceso TEXT,
    clave_cambiada TEXT,
    acceso_hasta TEXT,
    creado TEXT NOT NULL
  );

  CREATE TABLE sesiones (
    id TEXT PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    csrf TEXT NOT NULL,
    paso TEXT NOT NULL DEFAULT 'ok',
    ip TEXT, agente TEXT,
    creado TEXT NOT NULL,
    ultimo_uso TEXT NOT NULL,
    expira TEXT NOT NULL
  );
  CREATE INDEX ix_sesiones_usuario ON sesiones(usuario_id);

  CREATE TABLE auditoria (
    id INTEGER PRIMARY KEY,
    en TEXT NOT NULL,
    usuario_id INTEGER,
    usuario TEXT NOT NULL DEFAULT '',
    accion TEXT NOT NULL,
    objeto TEXT NOT NULL DEFAULT '',
    detalle TEXT NOT NULL DEFAULT '',
    ip TEXT
  );
  CREATE INDEX ix_auditoria_en ON auditoria(en DESC);
  CREATE INDEX ix_auditoria_usuario ON auditoria(usuario_id, en DESC);

  CREATE TABLE mensajes (
    id INTEGER PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    rut TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    telefono TEXT NOT NULL DEFAULT '',
    asunto TEXT NOT NULL DEFAULT '',
    mensaje TEXT NOT NULL DEFAULT '',
    area_id INTEGER,
    estado TEXT NOT NULL DEFAULT 'nuevo',
    asignado_a INTEGER,
    respuesta TEXT NOT NULL DEFAULT '',
    respondido_en TEXT,
    historial TEXT NOT NULL DEFAULT '[]',
    externo TEXT,
    ip TEXT,
    creado TEXT NOT NULL,
    modificado TEXT NOT NULL
  );
  CREATE INDEX ix_mensajes_estado ON mensajes(estado, creado DESC);

  CREATE TABLE redirecciones (
    id INTEGER PRIMARY KEY,
    origen TEXT NOT NULL UNIQUE,
    destino TEXT NOT NULL,
    codigo INTEGER NOT NULL DEFAULT 301,
    visitas INTEGER NOT NULL DEFAULT 0,
    creado TEXT NOT NULL
  );

  CREATE TABLE suscriptores (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    token TEXT NOT NULL,
    temas TEXT NOT NULL DEFAULT '[]',
    creado TEXT NOT NULL,
    confirmado TEXT
  );

  CREATE TABLE votos (
    encuesta_id INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
    opcion INTEGER NOT NULL,
    huella TEXT NOT NULL,
    creado TEXT NOT NULL,
    PRIMARY KEY (encuesta_id, huella)
  );

  CREATE TABLE visitas (
    dia TEXT NOT NULL,
    ruta TEXT NOT NULL,
    n INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (dia, ruta)
  );

  CREATE VIRTUAL TABLE busqueda USING fts5(
    titulo, texto, contenido_id UNINDEXED, tipo UNINDEXED,
    tokenize = 'unicode61 remove_diacritics 2'
  );
  `,
];

export class Db {
  constructor(archivo) {
    if (archivo !== ':memory:') fs.mkdirSync(path.dirname(archivo), { recursive: true });
    this.archivo = archivo;
    this.db = new DatabaseSync(archivo);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;');
    this.cache = new Map();
    this.migrar();
  }

  migrar() {
    const v = this.db.prepare('PRAGMA user_version').get().user_version;
    for (let i = v; i < MIGRACIONES.length; i++) {
      this.tx(() => {
        this.db.exec(MIGRACIONES[i]);
        this.db.exec(`PRAGMA user_version = ${i + 1}`);
      });
    }
  }

  st(sql) {
    let s = this.cache.get(sql);
    if (!s) {
      s = this.db.prepare(sql);
      this.cache.set(sql, s);
    }
    return s;
  }
  get(sql, ...p) { return this.st(sql).get(...p); }
  all(sql, ...p) { return this.st(sql).all(...p); }
  // Las escrituras se avisan a `alEscribir` (memoria compartida, ver server/persistencia.js);
  // dentro de una transacción se avisan sólo si se confirma.
  run(sql, ...p) {
    const r = this.st(sql).run(...p);
    if (this.alEscribir && !this.replicando) { if (this._prof) (this._lote ||= []).push([sql, p]); else this.alEscribir(sql, p); }
    return r;
  }
  exec(sql) { this.db.exec(sql); }

  // Transacción anidable (SAVEPOINT): si fn lanza, se deshace todo lo hecho en ella.
  tx(fn) {
    const nombre = 'sp' + (this._prof = (this._prof || 0) + 1);
    const marca = this._lote?.length || 0;
    this.db.exec(`SAVEPOINT ${nombre}`);
    try {
      const r = fn();
      this.db.exec(`RELEASE ${nombre}`);
      if (this._prof === 1 && this._lote?.length) { const lote = this._lote; this._lote = []; if (this.alEscribir && !this.replicando) lote.forEach(([s, p]) => this.alEscribir(s, p)); }
      return r;
    } catch (e) {
      this.db.exec(`ROLLBACK TO ${nombre}; RELEASE ${nombre}`);
      if (this._lote) this._lote.length = marca;
      throw e;
    } finally {
      this._prof--;
    }
  }

  // Ajustes clave → valor JSON
  ajuste(clave, def = null) {
    const r = this.get('SELECT valor FROM ajustes WHERE clave = ?', clave);
    if (!r) return def;
    try { return JSON.parse(r.valor); } catch { return def; }
  }
  guardarAjuste(clave, valor) {
    this.run('INSERT INTO ajustes(clave, valor) VALUES(?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', clave, JSON.stringify(valor));
  }

  // Copia consistente en caliente (VACUUM INTO) para respaldos.
  copiar(destino) {
    if (fs.existsSync(destino)) fs.unlinkSync(destino);
    this.db.exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
  }

  cerrar() { this.db.close(); }
}

// Convierte una fila de `contenidos` en objeto con los JSON ya leídos.
export function filaContenido(f) {
  if (!f) return null;
  return {
    ...f,
    bloques: parse(f.bloques, []),
    datos: parse(f.datos, {}),
    seo: parse(f.seo, {}),
    destacado: !!f.destacado,
  };
}

export function parse(s, def) {
  if (s == null || s === '') return def;
  try { return JSON.parse(s); } catch { return def; }
}

export const ahora = () => new Date().toISOString();
