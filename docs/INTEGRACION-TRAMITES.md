# Integración con la Plataforma Municipal de Trámites

El sitio web y la Plataforma Municipal de Trámites (repositorio `Transito`) son **dos aplicaciones hermanas**: comparten organigrama y escudo, y se comunican por sus API públicas. El sitio **no duplica trámites**: los lee en vivo.

```
 Ciudadanía ──► municipalidadmelipeuco.cl (este sitio)          tramites.municipalidadmelipeuco.cl (Plataforma)
                 ├ catálogo /tramites/  ◄── GET /api/public/info ────────┤ trámites publicados, dependencias
                 ├ portada «Próximas horas» ◄── GET /api/public/highlights ┤ cupos de agenda
                 ├ ficha: próxima hora (navegador) ◄── GET /api/public/availability
                 ├ botón «Reservar / Iniciar» ──► portal.html#/tramite/{id} ┤ reserva, solicitud, ClaveÚnica
                 ├ «Ver mi trámite» ──► portal.html#/seguimiento?code=…     ┤ seguimiento
                 ├ «Verificar documento» ──► verificar.html?c=…            ┤ verificación de resoluciones
                 ├ OIRS con RUN ──► POST /api/integrations/solicitud ──────┤ solicitud en Oficina de Partes
                 └ API pública /api/public/noticias, /avisos, /eventos ───► la Plataforma puede mostrarlas
```

## Configuración

En el **sitio** (`.env`):

```
TRAMITES_URL=https://tramites.municipalidadmelipeuco.cl/
TRAMITES_API_KEY=<llave con alcance solicitudes.crear>   # opcional: OIRS → Oficina de Partes
TRAMITES_OIRS_CODIGO=SEC-OIRS-01                         # trámite que recibe la OIRS
CORS_ORIGINS=https://tramites.municipalidadmelipeuco.cl  # la Plataforma puede leer noticias y avisos
```

En la **Plataforma** (`.env` de `Transito`):

```
CORS_ORIGINS=https://municipalidadmelipeuco.cl            # el sitio consulta disponibilidad desde el navegador
FRAME_ANCESTORS=https://municipalidadmelipeuco.cl https://*.municipalidadmelipeuco.cl   # widget incrustado
```

La llave API se crea en la intranet de la Plataforma (*Administración → Llaves API*) con el alcance `solicitudes.crear`.

## Cómo aparece un trámite nuevo en el sitio

1. Se crea y publica el trámite en la Plataforma (marcado como público y activo).
2. En máximo 5 minutos el sitio lo muestra en `/tramites/`, en la búsqueda y en la página de su área (si el área del sitio tiene el campo «Código de la dependencia en la Plataforma», que ya viene completo para las 63 áreas del organigrama).
3. Opcional: crear en el sitio una **ficha** con requisitos y preguntas frecuentes y vincularla con el campo «Trámite de la Plataforma». La ficha reemplaza al enlace automático en el catálogo y muestra la próxima hora disponible.

Para incrustar el formulario de la Plataforma dentro de una página del sitio, use el bloque **Trámite en línea (Plataforma)**: muestra un trámite, el catálogo de una dependencia o la consulta de seguimiento, con el widget oficial (`embed/melipeuco-widget.js`) que ajusta su altura solo.

## Tolerancia a fallas

Las consultas a la Plataforma tienen tiempo máximo (4 s) y caché (catálogo 5 min, horas 1 min). Si la Plataforma no responde, el sitio sigue funcionando con la última información obtenida y con enlaces directos; el escritorio del panel muestra el estado de la conexión.

## OIRS

Los mensajes de la OIRS del sitio se guardan siempre en el sitio (bandeja *Mensajes y OIRS*, código `OIRS-…`). Si la persona indica su **RUN** y hay llave API, además se crea una solicitud del trámite `SEC-OIRS-01` en la Plataforma (código `MLP-…`), enlazada en ambos sentidos (`externalRef` en la Plataforma, campo «Plataforma de Trámites» en el sitio). Así queda en el expediente de la persona y en «Mis trámites» si ingresa con ClaveÚnica.

## API pública del sitio (para la Plataforma u otros sistemas)

| Recurso | Contenido |
|---|---|
| `GET /api/public/noticias?limite=&categoria=&pagina=` | noticias publicadas |
| `GET /api/public/noticias/{id}` | noticia completa |
| `GET /api/public/avisos` | avisos y alertas vigentes (emergencias) |
| `GET /api/public/eventos` | próximos eventos |
| `GET /api/public/tramites` | fichas de trámites con su vínculo a la Plataforma |
| `GET /api/public/areas` | áreas municipales con su código de dependencia |
| `GET /api/public/documentos` | documentos publicados |
| `GET /api/public/sitio` | datos de contacto, redes, emergencias y colores |
| `GET /api/public/menu/{clave}` | menús (por ejemplo, para replicar la cabecera) |
| `GET /api/public/buscar?q=` | sugerencias de búsqueda |

Ejemplo de uso desde la Plataforma: mostrar en el portal ciudadano los avisos de emergencia vigentes del sitio consultando `/api/public/avisos`.
