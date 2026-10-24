# Migración desde el WordPress actual

El importador (`herramientas/importar-wordpress.js`) lee la API REST pública de `municipalidadmelipeuco.cl` y genera un paquete que se carga en la base del sitio. La semilla incluida en `contenido/semilla/wordpress.json.gz` se generó el 24-10-2026 y se carga sola en el primer arranque.

## Qué se importa y cómo

| WordPress | Sitio nuevo |
|---|---|
| 473 entradas (Gutenberg) | Noticias con la **misma URL** `/{año}/{mes}/{día}/{slug}/`, fecha, categorías, etiquetas, imagen destacada y texto saneado |
| 29 categorías y 26 etiquetas | Taxonomías con los mismos slugs (`/category/x/` redirige a `/categoria/x/`) |
| Páginas Elementor con HTML a medida | Bloques «HTML avanzado (aislado)» que se ven **idénticos** al original (con sus estilos y scripts, p. ej. el horario de buses) en un marco seguro de altura automática |
| Páginas Elementor con widgets | Bloques equivalentes: texto, títulos, botones, imágenes, carruseles (con las imágenes de fondo de Elementor), videos, mapas, noticias |
| Páginas antiguas de WPBakery (2021) | Texto limpio (se decodifican los mapas en base64) |
| 59 eventos (Modern Events Calendar) | Eventos con fecha, hora y lugar leídos de cada página |
| 1.789 medios | Biblioteca con sus tamaños (srcset); los archivos se sirven en `/wp-content/uploads/…` |
| Galería de YouTube del Concejo | 50 sesiones del Concejo con su transmisión y fecha |
| Tablas de «Agenda de contactos» | 67 contactos del directorio (teléfonos y correos) |
| Portada (Elementor) | Banners, accesos rápidos y secciones nuevas (misma información) |

Se descartan las páginas técnicas de plugins (tickets, reservas, registro, ejemplo) y las de menú vacías, que se reemplazan por páginas de sección con contenido real en las mismas direcciones (`/salud/`, `/educacion/`, `/municipio/`…).

## Comandos

```bash
npm run importar                    # agrega a la base lo nuevo del WordPress (no toca lo ya importado)
npm run importar -- --reemplazar    # vuelve a importar y reemplaza lo importado antes
npm run importar -- --medios        # además descarga imágenes y archivos a data/uploads/wp/
node herramientas/importar-wordpress.js --solo-medios   # sólo descarga los medios de la semilla
npm run semilla                     # regenera contenido/semilla/wordpress.json.gz
```

Opciones: `--sitio https://…` (otro origen), `--cache carpeta` (guarda las respuestas para repetir sin red), `--db archivo`.

También se puede lanzar desde el panel: *Sistema → Importar desde el sitio WordPress*.

## Medios

Mientras los archivos no estén copiados, el sitio redirige `/wp-content/uploads/…` a `MEDIOS_RESPALDO_URL` (el WordPress). Antes de apagar el WordPress ejecute la descarga de medios; desde entonces se sirven localmente en las mismas direcciones, sin romper enlaces publicados en redes sociales.
