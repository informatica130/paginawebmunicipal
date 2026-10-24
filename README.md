# Sitio web — Ilustre Municipalidad de Melipeuco

Nuevo sitio web oficial de la Municipalidad de Melipeuco («Para todas y todos»): réplica completa y mejorada de `municipalidadmelipeuco.cl`, con **panel de administración propio**, **seguridad reforzada** y **integración nativa con la Plataforma Municipal de Trámites** (proyecto `Transito`), para que todo trámite que se publique allí aparezca solo en el sitio.

| Portada | Ficha de trámite conectada a la Plataforma |
|---|---|
| ![Portada](docs/img/portada.webp) | ![Ficha](docs/img/ficha-tramite.webp) |
| **Panel: escritorio** | **Panel: editor de contenidos** |
| ![Escritorio](docs/img/panel-escritorio.webp) | ![Editor](docs/img/panel-editor.webp) |
| **Página heredada, idéntica a la original** | **Celular** |
| ![Página heredada](docs/img/pagina-heredada.webp) | ![Celular](docs/img/movil.webp) |

## Qué incluye

**Todo el contenido del sitio actual**, importado desde WordPress y con las mismas direcciones:
- 473 noticias con sus fechas, categorías, etiquetas e imágenes (`/2026/10/21/bases-programa-mirar-a-tiempo/` sigue funcionando);
- 50 páginas (licencias, patentes, solicitudes, Juzgado, transporte, Fondeve, organigrama, Descubre Melipeuco…). Las páginas armadas con HTML a medida en Elementor se conservan **idénticas**, en un marco aislado y seguro;
- 59 eventos de la agenda, 1.789 archivos de la biblioteca de medios, 50 transmisiones del Concejo convertidas en sesiones, y el directorio telefónico y de correos;
- las páginas del menú que estaban vacías (Municipio, Salud, Educación, Udel, Social, Deporte, Turismo, Juzgado, PLADECO…) ahora tienen contenido: noticias de su área, trámites, contactos y documentos.

**Diseño «Cordillera» (2026)**
- Identidad propia tomada del territorio: azul noche y crema del escudo, verde pehuén, turquesa de la laguna Icalma y ámbar del piñón; títulos en Big Shoulders Display (estilo señalética de parques) y textos en Atkinson Hyperlegible.
- **Escudo vectorizado** (`public/img/escudo-*.svg`, `emblema-*.svg`): nítido en cualquier tamaño, se dibuja trazo a trazo en la portada.
- **Paisaje vectorial animado** del volcán Llaima con fumarola, araucarias, nubes y laguna (`server/render/paisaje.js`). Sus colores siguen la **hora real de Melipeuco** (amanecer, día, atardecer, noche con estrellas) y las capas se mueven con el desplazamiento.
- Crestas de cordillera entre secciones, curvas de nivel como textura y la guarda textil del escudo en el pie.
- Íconos que se dibujan al aparecer, revelado escalonado al desplazarse, cabecera que se compacta, transiciones entre páginas y microanimaciones en botones y tarjetas. Todo se desactiva con «reducir movimiento» del sistema.

**Mejoras del sitio público**
- Portada nueva: avisos de emergencia, paisaje del volcán Llaima con reloj y tiempo actual, campañas, buscador «¿Qué necesita hacer hoy?», accesos rápidos, trámites en línea con **próximas horas disponibles en vivo**, noticias, agenda, clima, teléfonos de emergencia, áreas municipales, turismo, encuesta, video y boletín.
- **Catálogo de trámites** con fichas claras (requisitos, documentos, paso a paso, costo, plazo, dónde y cuándo) y filtros por área y modalidad. Se mezclan las fichas del sitio y los trámites en línea de la Plataforma.
- **63 áreas municipales** según el Reglamento de Organización Interna N° 12/2025 (el mismo organigrama de la Plataforma), cada una con funciones, contacto, trámites y noticias.
- **Concejo Municipal**: autoridades, sesiones con tabla, acuerdos, acta y transmisión.
- **OIRS en línea**: consultas, reclamos y sugerencias con código de seguimiento; con RUN, el mensaje entra además como solicitud a la Oficina de Partes de la Plataforma.
- Agenda con calendario mensual y exportación a calendario (ICS), documentos por colección, transparencia, directorio con buscador, encuestas ciudadanas, boletín por correo, mapa del sitio.
- Buscador de texto completo con sugerencias al escribir (incluye los trámites en línea).
- **Accesibilidad**: tipografía Atkinson Hyperlegible, contraste AA, tamaño de texto, alto contraste, modo oscuro, navegación con teclado, «saltar al contenido», textos alternativos, enlaces externos anunciados.
- SEO: metadatos, Open Graph, datos estructurados (organización, noticias, eventos, servicios), sitemap, RSS, URLs canónicas y redirecciones 301 de las direcciones antiguas.
- Rápido: páginas generadas en el servidor (5–15 ms), caché, compresión, imágenes en varios tamaños, videos livianos y aplicación instalable con lectura sin conexión.
- API pública de datos abiertos (`/api/public/`): noticias, avisos, eventos, trámites, áreas, documentos.

**Panel de administración** (`/admin/`)
- Escritorio con mensajes pendientes, visitas, publicaciones programadas, cambios recientes y estado de la Plataforma.
- 14 tipos de contenido: noticias, páginas, trámites, eventos, documentos, avisos, banners, accesos rápidos, áreas, autoridades, sesiones del Concejo, directorio, lugares turísticos y encuestas. Cada uno con sus propios campos.
- Editor de texto enriquecido y **editor de bloques** (galerías, botones, tarjetas, preguntas frecuentes, videos, mapas, documentos, trámites en línea, formularios, directorio…).
- Borradores, revisión, publicación programada, historial de versiones con restauración, aviso de edición simultánea, vista previa, duplicar, SEO por contenido.
- Biblioteca de medios con subida por arrastre, optimización automática de fotos (WEBP en 480/960/1600 px) y control de usos.
- Menús, categorías, etiquetas y colecciones; ajustes del sitio (colores, contacto, redes, portada, emergencias, mantenimiento).
- Bandeja OIRS con estados, asignación, notas internas y respuesta por correo; boletín de noticias; estadísticas de visitas sin cookies; redirecciones; respaldos; exportación; importación desde WordPress.
- **Usuarios y roles**: Super Administrador, Administrador, Editor, Periodista, Encargado de área (sólo publica en sus áreas), OIRS y Consulta.

**Seguridad**: contraseñas con scrypt, sesiones con cookie `HttpOnly`/`SameSite=Strict`, token CSRF, verificación en dos pasos (TOTP), bloqueo por intentos, política de contraseñas, auditoría de todas las acciones, saneador de HTML por lista blanca, CSP con *nonce*, bloques HTML heredados en *sandbox* de origen opaco, validación del contenido real de los archivos subidos, límites de solicitudes y respaldos cifrados. Ver [docs/SEGURIDAD.md](docs/SEGURIDAD.md).

## Inicio rápido

Requiere **Node.js 22.5 o superior**. No tiene dependencias externas: no hay `npm install`.

```bash
cp .env.example .env     # complete PUBLIC_URL, ADMIN_EMAIL, ADMIN_PASSWORD y TRAMITES_URL
npm start                # http://localhost:8090  ·  panel: http://localhost:8090/admin/
npm test                 # pruebas automáticas
```

En el primer arranque se crea `data/sitio.db` con todo el contenido importado y el Super Administrador (si `ADMIN_PASSWORD` está vacío, la consola muestra una contraseña temporal).

## Documentación

- [docs/ADMINISTRACION.md](docs/ADMINISTRACION.md) — guía del panel para funcionarias y funcionarios.
- [docs/INTEGRACION-TRAMITES.md](docs/INTEGRACION-TRAMITES.md) — cómo se conecta con la Plataforma Municipal de Trámites y cómo agregar trámites nuevos.
- [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) — instalación en el servidor, nginx, HTTPS, respaldos y paso a producción.
- [docs/MIGRACION-WORDPRESS.md](docs/MIGRACION-WORDPRESS.md) — qué se importó, cómo se convirtió y cómo volver a importar.
- [docs/SEGURIDAD.md](docs/SEGURIDAD.md) — medidas de seguridad y recuperación de acceso.
- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) — estructura del código y cómo extenderlo (tipos de contenido, bloques, rutas).

## Estructura

```
server/          servidor HTTP, base de datos, seguridad, API del panel, sitio público
  render/        plantillas HTML (portada, páginas, noticias, trámites, bloques…)
src/             esquema de tipos de contenido, roles y utilidades compartidas
public/          estilos, scripts, imágenes y el panel de administración (/admin/)
contenido/       semilla con el contenido importado del sitio actual
herramientas/    importador de WordPress, respaldos y recuperación de usuarios
tests/           pruebas automáticas (node:test)
docs/            documentación
```
