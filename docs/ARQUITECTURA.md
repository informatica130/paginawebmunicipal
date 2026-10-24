# Arquitectura

```
Navegador ─► server/server.js ─┬─ /css /js /img            archivos estáticos (ETag, caché inmutable con ?v=)
                               ├─ /medios/ /wp-content/    archivos subidos y heredados
                               ├─ /admin/ + /api/admin/*   panel (public/admin) + server/api-admin.js
                               └─ todo lo demás            server/sitio.js → server/render/*.js
                                                           │
                         server/contenidos.js (repositorio)┤ server/tramites.js (Plataforma de Trámites)
                                   server/db.js (SQLite + FTS5)
```

- **Sin dependencias**: Node ≥ 22.5 (`node:sqlite`, `node:http`, `node:crypto`, `zlib`). Mismo enfoque que la Plataforma de Trámites, de modo que ambos proyectos se operan igual.
- **Un solo modelo de contenido**: tabla `contenidos` con columnas comunes (título, slug, estado, fechas, cuerpo, bloques, imagen, padre, área) y un JSON `datos` con los campos propios de cada tipo, definidos en `src/tipos.js`. Taxonomías, revisiones y búsqueda de texto completo (FTS5, sin acentos) son comunes a todos los tipos.
- **Render en el servidor** con plantillas *tagged template* que escapan por defecto (`html\`…\``); el JavaScript del navegador sólo mejora (menú, buscador, carruseles, accesibilidad).
- **Caché** de páginas para visitantes anónimos (60 s, el *nonce* se renueva en cada respuesta) que se invalida con cada cambio del panel.

## Agregar un tipo de contenido

1. Declárelo en `TIPOS` de `src/tipos.js` (etiqueta, campos con su tipo, si tiene cuerpo, bloques, taxonomías, jerarquía) y su ruta en `RUTAS`.
2. El panel ya muestra su listado y su formulario. Si necesita vista pública propia, agregue una plantilla en `server/render/paginas.js` y la ruta en `server/sitio.js` (si no, usa la ficha genérica).
3. Agréguelo al menú lateral del panel en `public/admin/admin.js`.

## Agregar un bloque

1. Normalización/validación en `normalizarBloques` (`server/contenidos.js`).
2. Render en `server/render/bloques.js`.
3. Campos del editor en `BLOQUES` (`public/admin/campos.js`).

## Datos

`DATA_DIR` contiene `sitio.db` (SQLite en modo WAL), `uploads/sitio` (subidos desde el panel), `uploads/wp` (heredados del WordPress) y `backups/`.

## Pruebas

`npm test` levanta el servidor completo con una base temporal, carga la semilla y simula la Plataforma de Trámites.
