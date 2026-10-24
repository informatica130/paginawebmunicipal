# Guía del panel de administración

El panel está en **`/admin/`** (por ejemplo `https://municipalidadmelipeuco.cl/admin/`). Se ingresa con el correo institucional y la contraseña. La primera vez se pide cambiar la contraseña temporal.

## Primeros pasos recomendados

1. **Active la verificación en dos pasos** en *Mi cuenta*: escanee el código QR con Google Authenticator, Microsoft Authenticator o FreeOTP. Desde entonces el ingreso pide también un código de 6 dígitos.
2. **Cree los usuarios** en *Usuarios y permisos* (sólo Super Administrador). A cada persona se le entrega una contraseña temporal.
3. **Revise los Ajustes del sitio**: contacto, redes sociales, colores y teléfonos de emergencia.
4. **Complete el Concejo**: en *Alcaldía y Concejo* agregue a los concejales del período 2024–2028 con su foto y correo (el sitio anterior sólo tenía los del período 2021–2024).

## Roles

| Rol | Puede |
|---|---|
| Super Administrador(a) | Todo, incluidos usuarios, respaldos, importación y código de analítica. |
| Administrador(a) del sitio | Todo el contenido y la configuración, sin gestionar usuarios ni respaldos. |
| Editor(a) | Crear, editar, publicar y eliminar cualquier contenido; medios, menús y categorías. |
| Periodista / Redactor(a) | Redactar y **enviar a revisión**; un editor publica. |
| Encargado(a) de área | Crear y publicar **sólo** en las áreas asignadas (p. ej. Tránsito, Salud) y sus unidades. |
| Atención OIRS | Responder consultas, reclamos y sugerencias; ver suscriptores. |
| Consulta / Control | Ver el panel, la auditoría y las estadísticas, sin modificar. |

Con «Acceso vigente hasta» se pueden dar accesos temporales (reemplazos, prácticas).

## Publicar una noticia

1. *Noticias → Nueva noticia*.
2. Escriba el **título**, el **resumen** (una o dos frases: se ven en la portada, en Google y en redes sociales) y el **texto**.
3. Elija la **imagen destacada** (se optimiza sola) y las **categorías**.
4. Opcional: galería de fotos, video, bloques adicionales y área municipal responsable.
5. Pulse **Publicar ahora**, o elija una fecha futura con estado «Publicado» para que se publique sola.

Atajos: <kbd>Ctrl</kbd>+<kbd>S</kbd> guarda. Si sale con cambios sin guardar, el panel avisa. Si otra persona está editando lo mismo, aparece un aviso.

Cada guardado deja una **versión** en *Historial de cambios*: se puede volver a cualquiera.

Para enviar la noticia por correo a los suscriptores: *Más acciones → Enviar por el boletín* (requiere correo configurado en el servidor).

## Avisos y alertas (emergencias)

*Avisos y alertas → Nuevo*. Elija el nivel (información, alerta amarilla, **emergencia roja**, buena noticia), el período en que se muestra y si va en todas las páginas o sólo en la portada. Útil para alertas por el volcán Llaima, cortes de camino, nevadas, cortes de agua o cambios de horario.

## Portada

- **Banners**: *Banners de portada*. Use imágenes horizontales (por ejemplo 1600×600 px) y escriba en «Descripción» el texto que dice la imagen (lo leen las personas ciegas). Puede indicar fechas de inicio y término.
- **Accesos rápidos**: los botones de colores bajo el carrusel. Ordénelos con las flechas.
- **Secciones**: en *Ajustes → Portada* se activan, ordenan y renombran (trámites, noticias, agenda, áreas, turismo, video, boletín…).

## Diseño del sitio

*Administración → Diseño del sitio* cambia el aspecto de todo el sitio, con una vista previa en vivo (computador, tablet o celular) que no se publica hasta presionar **Guardar y publicar**.

- **Estilos prediseñados**: Institucional, Bosque de araucarias, Moderno, Clásico, Claro y amplio, Alto contraste. Cambian colores, letras y formas de una vez; después se puede ajustar cada detalle.
- **Colores**: principal, acento, profundo, fondos, texto, etiquetas y emergencias. El color del texto sobre los botones se elige solo para que se lea bien.
- **Tipografía**: letra del texto y de los títulos (nueve opciones), tamaño, grosor y espaciado de los títulos, menú en mayúsculas.
- **Formas y espacios**: redondeo de esquinas, tarjetas con borde, con sombra o planas, forma de los botones, espacio entre secciones y ancho del contenido.
- **Cabecera y logo**: fondo blanco, de color u oscuro; emblema con nombre, escudo completo o una imagen propia; tamaño del logo; cabecera fija; barra de transparencia y botón «Trámites».
- **Portada**: foto principal, título, texto, pie de foto, altura, alineación, cuánto se oscurece la foto, franja de datos y «Lo más buscado».
- **Pie de página**: fondo oscuro, de color o claro; teléfonos de emergencia, boletín y escudo.
- **Animaciones**: activarlas o no, intensidad, velocidad, pantalla de carga (primera visita, siempre o nunca), aparición al bajar, inclinación 3D, transición entre páginas y barra de carga. Quien pide «reducir movimiento» en su equipo nunca ve animaciones.
- **CSS propio** (sólo Super Administrador): reglas que se agregan al final de la hoja de estilos.

**Deshacer** revierte el último cambio y **Volver al diseño original** restablece todo (sin publicar hasta guardar).

## Trámites

Cada **ficha de trámite** tiene requisitos, documentos, paso a paso, costo, plazo, horario, lugar, formularios descargables y preguntas frecuentes.

Si el trámite existe en la **Plataforma Municipal de Trámites**, escriba su código en «Trámite de la Plataforma» (por ejemplo `tra-hora-licencia`): la ficha mostrará en vivo la próxima hora disponible y el botón para iniciarlo en línea. Los trámites en línea de la Plataforma que no tienen ficha aparecen solos en el catálogo. Ver [INTEGRACION-TRAMITES.md](INTEGRACION-TRAMITES.md).

## Páginas y bloques

Las páginas se arman con texto y **bloques**: imagen, galería o carrusel, botones, tarjetas, preguntas frecuentes, video, mapa, datos de contacto, noticias de una categoría, eventos, trámites de un área, trámite en línea de la Plataforma, documentos, recuadro destacado, cita, formulario (contacto, OIRS, boletín), encuesta, directorio, autoridades, sesiones del Concejo, áreas y lugares turísticos.

Las páginas pueden tener una **página superior** (la dirección queda `/municipio/historia/`) y un diseño: normal (con índice lateral), ancho completo o portada de sección.

El bloque **HTML avanzado (aislado)** permite pegar código HTML con estilos y scripts propios (así se conservaron las páginas de Elementor). Se ejecuta en un marco aislado sin acceso a las sesiones del sitio, y sólo lo pueden editar quienes tienen el permiso «HTML avanzado».

## Mensajes y OIRS

En *Mensajes y OIRS* llegan las consultas, reclamos, sugerencias, felicitaciones, denuncias y mensajes de contacto. Cada uno tiene:
- código de seguimiento (`OIRS-XXXXXX`) que la persona usa para ver la respuesta en `/oirs/seguimiento/`;
- estado (nuevo, en proceso, respondido, cerrado), persona asignada y notas internas;
- historial completo;
- si la persona indicó su RUN y la Plataforma está conectada, el código de la solicitud creada en la Oficina de Partes.

La respuesta se envía por correo (si está configurado) y queda visible con el código. Los mensajes con más de 14 días sin cerrar se destacan en el escritorio.

## Medios

Arrastre archivos a la biblioteca. Las fotos se reducen a 2400 px y se crean versiones para celular y computador en formato WEBP. Se aceptan PDF, Word, Excel, PowerPoint, OpenDocument, ZIP, MP4, MP3, CSV y TXT (hasta 40 MB). Escriba siempre la **descripción** de las imágenes. Un archivo en uso no se puede borrar hasta reemplazarlo.

## Menús

*Menús*: elija el menú (principal, barra de transparencia o pie), ordene con ↑ ↓ y convierta un enlace en submenú con →. «Agregar una página» inserta cualquier página publicada.

## Estadísticas

Conteo propio de páginas vistas, sin cookies ni servicios externos y sin guardar datos de quienes visitan.

## Sistema

Estado de la Plataforma de Trámites y su catálogo, respaldos (automáticos cada día y manuales), exportación del contenido, importación desde el WordPress, redirecciones, reconstrucción del índice de búsqueda y limpieza de caché.
