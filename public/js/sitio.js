/* Sitio web — Municipalidad de Melipeuco. Mejora progresiva: todo funciona sin JavaScript;
   esto agrega menú móvil, buscador con sugerencias, accesibilidad, carruseles, visor de
   imágenes, videos livianos, clima, horas disponibles en vivo y utilidades. */
(function () {
  'use strict';
  var d = document, raiz = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var guardar = function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  var leer = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function avisar(texto) {
    var a = d.createElement('div');
    a.className = 'aviso-copiado'; a.setAttribute('role', 'status'); a.textContent = texto;
    d.body.appendChild(a);
    setTimeout(function () { a.remove(); }, 2200);
  }

  // ---------------- Menú principal y submenús
  var nav = $('#nav'), botonMenu = $('[data-menu]'), velo = null;
  function cerrarSubmenus(excepto) { $$('.nav-boton[aria-expanded="true"]').forEach(function (b) { if (b !== excepto) b.setAttribute('aria-expanded', 'false'); }); }
  $$('.nav-boton').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); var abierto = b.getAttribute('aria-expanded') === 'true'; cerrarSubmenus(b); b.setAttribute('aria-expanded', abierto ? 'false' : 'true'); });
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.nav-item')) cerrarSubmenus(); });
  function menuMovil(abrir) {
    if (!nav) return;
    nav.classList.toggle('abierto', abrir);
    botonMenu.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    botonMenu.innerHTML = abrir ? '<svg class="ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>' : '<svg class="ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    d.body.style.overflow = abrir ? 'hidden' : '';
    if (abrir) { velo = d.createElement('div'); velo.className = 'velo'; velo.addEventListener('click', function () { menuMovil(false); }); d.body.appendChild(velo); var p = $('a, button', nav); p && p.focus(); }
    else if (velo) { velo.remove(); velo = null; }
  }
  botonMenu && botonMenu.addEventListener('click', function () { menuMovil(!nav.classList.contains('abierto')); });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    cerrarSubmenus();
    if (nav && nav.classList.contains('abierto')) { menuMovil(false); botonMenu.focus(); }
    var vis = $('.visor'); vis && vis.remove();
    cerrarBuscador();
  });

  // ---------------- Buscador y sugerencias
  var buscador = $('#buscador');
  function cerrarBuscador() { if (buscador && !buscador.hidden) { buscador.hidden = true; var b = $('[data-abrir-buscador]'); b && b.focus(); } }
  $$('[data-abrir-buscador]').forEach(function (b) { b.addEventListener('click', function () { buscador.hidden = !buscador.hidden; if (!buscador.hidden) $('input', buscador).focus(); }); });
  $$('[data-cerrar-buscador]').forEach(function (b) { b.addEventListener('click', cerrarBuscador); });

  $$('[data-sugerencias]').forEach(function (input) {
    var caja = d.getElementById(input.getAttribute('aria-controls'));
    if (!caja) return;
    var t = null, ultimo = '', sel = -1;
    function mostrar(items) {
      sel = -1;
      if (!items.length) { caja.hidden = true; return; }
      caja.innerHTML = items.map(function (it, i) {
        return '<a role="option" id="' + caja.id + '-' + i + '" href="' + esc(it.url) + '"' + (it.externo ? ' target="_blank" rel="noopener"' : '') + '><span>' + esc(it.titulo) + '</span><small>' + esc(it.tipo) + '</small></a>';
      }).join('');
      caja.hidden = false;
    }
    input.addEventListener('input', function () {
      var q = input.value.trim();
      clearTimeout(t);
      if (q.length < 2) { caja.hidden = true; return; }
      t = setTimeout(function () {
        if (q === ultimo) return;
        ultimo = q;
        fetch('/api/public/buscar?q=' + encodeURIComponent(q)).then(function (r) { return r.ok ? r.json() : { items: [] }; }).then(function (j) { if (input.value.trim() === q) mostrar(j.items || []); }).catch(function () {});
      }, 220);
    });
    input.addEventListener('keydown', function (e) {
      var op = $$('a', caja);
      if (caja.hidden || !op.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + op.length) % op.length;
        op.forEach(function (o, i) { o.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
        input.setAttribute('aria-activedescendant', op[sel].id);
      } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); op[sel].click(); }
    });
    d.addEventListener('click', function (e) { if (e.target !== input && !caja.contains(e.target)) caja.hidden = true; });
  });

  // ---------------- Accesibilidad: tamaño de texto, contraste y tema
  var escala = parseFloat(leer('mlp-texto') || '1');
  $$('[data-texto]').forEach(function (b) {
    b.addEventListener('click', function () {
      escala = Math.min(1.5, Math.max(.85, Math.round((escala + Number(b.getAttribute('data-texto')) * 0.1) * 100) / 100));
      raiz.style.setProperty('--escala', escala);
      guardar('mlp-texto', escala === 1 ? null : String(escala));
      avisar('Tamaño del texto: ' + Math.round(escala * 100) + ' %');
    });
  });
  // Sólo los botones: <html> también lleva data-tema y data-contraste, y no debe responder a clics.
  var bcs = $$('button[data-contraste]');
  bcs.forEach(function (bc) { bc.setAttribute('aria-pressed', raiz.dataset.contraste === 'alto' ? 'true' : 'false'); });
  bcs.forEach(function (bc) {
    bc.addEventListener('click', function () {
      var on = raiz.dataset.contraste !== 'alto';
      if (on) raiz.dataset.contraste = 'alto'; else delete raiz.dataset.contraste;
      bcs.forEach(function (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      guardar('mlp-contraste', on ? '1' : null);
    });
  });
  var bts = $$('button[data-tema]');
  if (bts.length) {
    var oscuroSistema = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    if (!raiz.dataset.tema && oscuroSistema) raiz.dataset.tema = 'oscuro';
    var etiquetaTema = function () { bts.forEach(function (bt) { bt.setAttribute('aria-label', raiz.dataset.tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); bt.setAttribute('aria-pressed', raiz.dataset.tema === 'oscuro' ? 'true' : 'false'); }); };
    etiquetaTema();
    bts.forEach(function (bt) {
      bt.addEventListener('click', function () {
        var t = raiz.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
        raiz.dataset.tema = t; guardar('mlp-tema', t); etiquetaTema();
      });
    });
  }

  // ---------------- Opciones de lectura (panel desplegable de la cabecera)
  var accBtn = $('[data-acc-abrir]'), accPanel = $('#acc-panel');
  if (accBtn && accPanel) {
    var accCerrar = function (foco) { accPanel.hidden = true; accBtn.setAttribute('aria-expanded', 'false'); if (foco) accBtn.focus(); };
    accBtn.addEventListener('click', function () { var abrir = accPanel.hidden; accPanel.hidden = !abrir; accBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false'); });
    d.addEventListener('click', function (e) { if (!accPanel.hidden && !e.target.closest('.acc-menu')) accCerrar(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !accPanel.hidden) accCerrar(true); });
  }

  // ---------------- Avisos (se pueden ocultar durante la visita)
  var ocultos = (function () { try { return JSON.parse(sessionStorage.getItem('mlp-avisos') || '[]'); } catch (e) { return []; } })();
  $$('[data-aviso]').forEach(function (a) {
    if (ocultos.indexOf(a.getAttribute('data-aviso')) >= 0 && !a.classList.contains('aviso-emergencia')) a.hidden = true;
    var b = $('[data-cerrar-aviso]', a);
    b && b.addEventListener('click', function () {
      ocultos.push(a.getAttribute('data-aviso')); try { sessionStorage.setItem('mlp-avisos', JSON.stringify(ocultos)); } catch (e) {}
      // Se pliega hacia arriba antes de desaparecer.
      if (!reducido && a.animate && raiz.dataset.anim !== 'no') a.animate([{ height: a.offsetHeight + 'px', opacity: 1 }, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }], { duration: 280, easing: 'cubic-bezier(.4, 0, .2, 1)' }).finished.then(function () { a.hidden = true; });
      else a.hidden = true;
    });
  });

  // ---------------- Carruseles
  $$('[data-carrusel]').forEach(function (c) {
    var pista = $('.carrusel-pista', c), items = $$('.carrusel-item', c), i = 0, timer = null, pausado = reducido;
    if (items.length < 2) return;
    var puntos = $('.carrusel-puntos', c);
    if (puntos) {
      puntos.innerHTML = items.map(function (_, n) { return '<button type="button" role="tab" aria-label="Ir al banner ' + (n + 1) + '"></button>'; }).join('');
      $$('button', puntos).forEach(function (b, n) { b.addEventListener('click', function () { ir(n); detener(); }); });
    }
    function marcar() { if (puntos) $$('button', puntos).forEach(function (b, n) { b.setAttribute('aria-selected', n === i ? 'true' : 'false'); }); }
    function ir(n) { i = (n + items.length) % items.length; pista.scrollTo({ left: items[i].offsetLeft, behavior: reducido ? 'auto' : 'smooth' }); marcar(); }
    pista.addEventListener('scroll', function () { var n = Math.round(pista.scrollLeft / pista.clientWidth); if (n !== i) { i = n; marcar(); } }, { passive: true });
    var ant = $('.carrusel-ant', c), sig = $('.carrusel-sig', c), pausa = $('.carrusel-pausa', c);
    ant && ant.addEventListener('click', function () { ir(i - 1); detener(); });
    sig && sig.addEventListener('click', function () { ir(i + 1); detener(); });
    var ms = Number(c.getAttribute('data-auto')) || 0;
    if (ms) c.style.setProperty('--dur', ms + 'ms');
    function iniciar() { if (ms && !pausado) { clearInterval(timer); timer = setInterval(function () { ir(i + 1); }, ms); c.classList.remove('en-pausa'); } }
    function detener() { clearInterval(timer); c.classList.add('en-pausa'); }
    if (pausa) {
      if (!ms) pausa.hidden = true;
      pausa.addEventListener('click', function () { pausado = !pausado; pausa.setAttribute('aria-label', pausado ? 'Reanudar el carrusel' : 'Pausar el carrusel'); pausado ? detener() : iniciar(); });
    }
    c.addEventListener('mouseenter', detener); c.addEventListener('mouseleave', iniciar);
    c.addEventListener('focusin', detener);
    marcar(); iniciar();
  });

  // ---------------- Visor de imágenes (galerías)
  $$('[data-galeria]').forEach(function (g) {
    var enlaces = $$('[data-lightbox]', g);
    enlaces.forEach(function (a, n) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var actual = n, origen = a;
        var v = d.createElement('div');
        v.className = 'visor'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Imagen ampliada');
        function pintar() { var img = $('img', enlaces[actual]); v.innerHTML = '<img src="' + esc(enlaces[actual].getAttribute('href')) + '" alt="' + esc(img ? img.alt : '') + '"><p>' + (actual + 1) + ' / ' + enlaces.length + '</p><button class="visor-cerrar" aria-label="Cerrar">✕</button>' + (enlaces.length > 1 ? '<button class="visor-ant" aria-label="Anterior">‹</button><button class="visor-sig" aria-label="Siguiente">›</button>' : ''); $('.visor-cerrar', v).focus(); }
        v.addEventListener('click', function (ev) {
          if (ev.target.closest('.visor-ant')) { actual = (actual - 1 + enlaces.length) % enlaces.length; pintar(); }
          else if (ev.target.closest('.visor-sig')) { actual = (actual + 1) % enlaces.length; pintar(); }
          else if (ev.target === v || ev.target.closest('.visor-cerrar')) { v.remove(); origen.focus(); }
        });
        v.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowRight') { actual = (actual + 1) % enlaces.length; pintar(); } if (ev.key === 'ArrowLeft') { actual = (actual - 1 + enlaces.length) % enlaces.length; pintar(); } });
        d.body.appendChild(v); pintar();
      });
    });
  });

  // ---------------- Videos livianos (YouTube sin cookies)
  $$('[data-youtube] .video-play').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.parentNode.getAttribute('data-youtube');
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      f.title = b.getAttribute('aria-label') || 'Video';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      b.replaceWith(f);
    });
  });

  // ---------------- Bloques aislados: altura automática
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.tipo !== 'mlp-alto') return;
    $$('iframe[data-aislado]').forEach(function (f) { if (f.contentWindow === e.source) f.style.height = Math.max(120, Math.min(20000, Number(e.data.alto) || 0)) + 'px'; });
  });

  // ---------------- Copiar, imprimir, compartir
  d.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copiar]');
    if (c) {
      var texto = c.getAttribute('data-copiar');
      (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).then(function () { avisar('Copiado: ' + texto); }).catch(function () { window.prompt('Copie el texto:', texto); });
    }
    if (e.target.closest('[data-imprimir]')) window.print();
  });
  var comp = $('[data-compartir]');
  if (comp && navigator.share) {
    var b = d.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', 'Compartir desde mi teléfono');
    b.innerHTML = '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>';
    b.addEventListener('click', function () { navigator.share({ title: comp.getAttribute('data-titulo'), url: comp.getAttribute('data-url') }).catch(function () {}); });
    comp.appendChild(b);
  }

  // ---------------- Volver arriba
  var arriba = $('[data-arriba]');
  if (arriba) {
    var marcoArriba = 0;
    window.addEventListener('scroll', function () {
      cancelAnimationFrame(marcoArriba);
      marcoArriba = requestAnimationFrame(function () {
        var alto = d.documentElement.scrollHeight - innerHeight;
        arriba.classList.toggle('visible', window.scrollY > 700);
        arriba.style.setProperty('--progreso', alto > 0 ? Math.min(1, scrollY / alto).toFixed(3) : 0);
      });
    }, { passive: true });
    arriba.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' }); var m = $('#contenido'); m && m.focus({ preventScroll: true }); });
  }

  // ---------------- Clima (Open-Meteo, sin cookies ni llaves) con íconos animados
  var clima = $('[data-clima]');
  var ICONOS_CLIMA = {
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    parcial: '<path d="M8 3v1.5M3.6 5.6l1 1M2 10h1.5M12.4 5.6l-1 1"/><path d="M5.3 12.5A3.5 3.5 0 1 1 11 8.4"/><path d="M9 20h8a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.4 2A3 3 0 0 0 9 20z"/>',
    nube: '<path d="M7 19h10a4.5 4.5 0 0 0 .5-9A6 6 0 0 0 6 11.5 3.8 3.8 0 0 0 7 19z"/>',
    lluvia: '<path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 8.5 3.3 3.3 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    nieve: '<path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 8.5 3.3 3.3 0 0 0 7 15z"/><path d="M8 19h.01M12 21h.01M16 19h.01"/>'
  };
  function iconoClima(tipo) { return '<svg class="clima-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONOS_CLIMA[tipo] || ICONOS_CLIMA.nube) + '</svg>'; }
  if (clima) {
    var CODIGOS = { 0: ['Despejado', 'sol'], 1: ['Mayormente despejado', 'sol'], 2: ['Parcialmente nublado', 'parcial'], 3: ['Nublado', 'nube'], 45: ['Niebla', 'nube'], 48: ['Niebla', 'nube'], 51: ['Llovizna', 'lluvia'], 53: ['Llovizna', 'lluvia'], 55: ['Llovizna', 'lluvia'], 61: ['Lluvia débil', 'lluvia'], 63: ['Lluvia', 'lluvia'], 65: ['Lluvia fuerte', 'lluvia'], 66: ['Lluvia helada', 'lluvia'], 67: ['Lluvia helada', 'lluvia'], 71: ['Nieve', 'nieve'], 73: ['Nieve', 'nieve'], 75: ['Nieve intensa', 'nieve'], 77: ['Nieve', 'nieve'], 80: ['Chubascos', 'lluvia'], 81: ['Chubascos', 'lluvia'], 82: ['Chubascos fuertes', 'lluvia'], 85: ['Chubascos de nieve', 'nieve'], 86: ['Chubascos de nieve', 'nieve'], 95: ['Tormenta', 'lluvia'], 96: ['Tormenta', 'lluvia'], 99: ['Tormenta', 'lluvia'] };
    var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + clima.getAttribute('data-lat') + '&longitude=' + clima.getAttribute('data-lng') + '&current=temperature_2m,weather_code,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSantiago&forecast_days=1';
    fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var c = j.current, dd = j.daily || {}, cod = CODIGOS[c.weather_code] || ['', 'nube'];
      var max = dd.temperature_2m_max ? Math.round(dd.temperature_2m_max[0]) : null, min = dd.temperature_2m_min ? Math.round(dd.temperature_2m_min[0]) : null;
      clima.innerHTML = iconoClima(cod[1]) + '<span><b>Tiempo en Melipeuco</b>' + Math.round(c.temperature_2m) + '°C, ' + esc(cod[0].toLowerCase()) + (max != null ? ' (máx. ' + max + '°, mín. ' + min + '°)' : '') + '</span>';
      clima.setAttribute('title', 'Fuente: Open-Meteo. Viento ' + Math.round(c.wind_speed_10m) + ' km/h');
    }).catch(function () { clima.hidden = true; });
  }

  // ---------------- Próxima hora disponible (Plataforma de Trámites)
  $$('[data-disponibilidad]').forEach(function (el) {
    var base = el.getAttribute('data-base'), id = el.getAttribute('data-disponibilidad');
    if (!base) return;
    var hoy = new Date(), hasta = new Date(Date.now() + 40 * 864e5);
    var iso = function (x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
    fetch(base + 'api/public/availability?procedureId=' + encodeURIComponent(id) + '&from=' + iso(hoy) + '&to=' + iso(hasta)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var prox = null, total = 0;
      (j.days || []).forEach(function (x) { total += x.free || 0; if (!prox && x.free) prox = { fecha: x.date, hora: ((x.slots || []).filter(function (s) { return s.free > 0; })[0] || {}).time }; });
      el.textContent = prox ? 'Próxima hora disponible: ' + new Date(prox.fecha + 'T12:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) + (prox.hora ? ' a las ' + prox.hora : '') + ' (' + total + ' cupos en las próximas semanas).' : 'Sin cupos disponibles por ahora; vuelva a revisar pronto.';
    }).catch(function () {});
  });

  // ---------------- Formularios: RUN, contador, filtros y doble envío
  $$('[data-rut]').forEach(function (i) {
    i.addEventListener('blur', function () {
      var r = i.value.replace(/[^0-9kK]/g, '').toUpperCase();
      if (r.length > 1) i.value = r.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + r.slice(-1);
    });
  });
  $$('textarea[data-contador]').forEach(function (t) {
    var p = d.createElement('p'); p.className = 'contador'; p.setAttribute('aria-live', 'polite');
    var max = t.getAttribute('maxlength');
    var act = function () { p.textContent = t.value.length + ' / ' + max + ' caracteres'; };
    t.after(p); t.addEventListener('input', act); act();
  });
  $$('[data-filtrar]').forEach(function (i) {
    var sel = i.getAttribute('data-filtrar');
    var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    i.addEventListener('input', function () {
      var q = norm(i.value.trim());
      $$(sel).forEach(function (el) { el.hidden = q && norm(el.getAttribute('data-filtrable') || el.textContent).indexOf(q) < 0; });
    });
  });
  $$('form').forEach(function (f) {
    if ((f.getAttribute('method') || '').toLowerCase() !== 'post') return;
    f.addEventListener('submit', function () { var b = $('button[type="submit"], button:not([type])', f); if (b) { setTimeout(function () { b.disabled = true; b.textContent = 'Enviando…'; }, 0); } });
  });

  // ---------------- Cabecera fija que se compacta al bajar
  var cab = $('.cabecera');
  if (cab && raiz.getAttribute('data-cabecera-fija') === 'si') {
    // Se compacta al bajar, se oculta al seguir bajando y vuelve apenas se sube.
    var compacta = false, previo = scrollY, marcoCab = 0;
    var ocupada = function () { return (nav && nav.classList.contains('abierto')) || (buscador && !buscador.hidden) || cab.contains(d.activeElement) || $('.nav-boton[aria-expanded="true"]'); };
    var revisarCabecera = function () {
      var y = scrollY, c = y > 120 || (compacta && y > 40);
      if (c !== compacta) { compacta = c; cab.classList.toggle('compacta', c); }
      if (Math.abs(y - previo) > 6) { cab.classList.toggle('oculta', y > previo && y > 420 && !ocupada()); previo = y; }
    };
    addEventListener('scroll', function () { cancelAnimationFrame(marcoCab); marcoCab = requestAnimationFrame(revisarCabecera); }, { passive: true });
    revisarCabecera();
  }

  // ---------------- Vista previa del panel «Diseño del sitio»
  // Cuando la página se muestra dentro del panel, recibe el diseño en edición y lo aplica en vivo.
  if (window.parent !== window) {
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.tipo !== 'mlp-diseno') return;
      var m = e.data;
      var est = d.getElementById('diseno-vars'); if (est) est.textContent = m.css;
      var propio = d.getElementById('diseno-propio');
      if (!propio) { propio = d.createElement('style'); propio.id = 'diseno-propio'; d.head.appendChild(propio); }
      propio.textContent = m.cssPropio || '';
      Object.keys(m.atributos || {}).forEach(function (k) { raiz.setAttribute(k, m.atributos[k]); });
      var f = d.getElementById('diseno-fuentes');
      if (m.fuentes) { if (!f) { f = d.createElement('link'); f.rel = 'stylesheet'; f.id = 'diseno-fuentes'; d.head.appendChild(f); } if (f.getAttribute('href') !== m.fuentes) f.href = m.fuentes; }
      $$('[data-diseno]').forEach(function (el) { var v = (m.textos || {})[el.getAttribute('data-diseno')]; if (v != null) { el.textContent = v; el.hidden = !v; } });
      $$('[data-diseno-img]').forEach(function (img) { var v = (m.imagenes || {})[img.getAttribute('data-diseno-img')]; if (v && img.getAttribute('src') !== v) { img.removeAttribute('srcset'); img.src = v; } });
      d.dispatchEvent(new CustomEvent('mlp:diseno', { detail: { reproducir: !!m.reproducir, transicion: !!m.transicion } }));
      if (m.logo) { $$('[data-diseno-logo]').forEach(function (img) { img.src = m.logo[img.getAttribute('data-diseno-logo')]; }); var mt = $('.marca-texto'); if (mt) mt.hidden = !m.logo.conTexto; }
    });
    window.parent.postMessage({ tipo: 'mlp-vista-lista' }, location.origin);
  }

  // ---------------- Aplicación instalable y lectura sin conexión
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(function () {});
})();
