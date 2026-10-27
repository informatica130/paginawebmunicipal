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
  // También cuenta la elección de la persona en «Opciones de lectura → Movimiento».
  var reducido = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.getAttribute('data-movimiento') === 'nada';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function avisar(texto) {
    var a = d.createElement('div');
    a.className = 'aviso-copiado'; a.setAttribute('role', 'status'); a.textContent = texto;
    d.body.appendChild(a);
    setTimeout(function () { a.remove(); }, 2200);
  }

  // Si esta página llegó descargada por adelantado (al pasar el cursor), se cuenta la visita ahora.
  try { var nav0 = performance.getEntriesByType('navigation')[0]; if (nav0 && /prefetch|prerender/.test(nav0.deliveryType || '')) fetch('/api/public/visita?r=' + encodeURIComponent(location.pathname), { keepalive: true }).catch(function () {}); } catch (e) {}

  // Las imágenes diferidas aparecen con un fundido suave (mientras cargan, su caja brilla).
  $$('img[loading="lazy"]').forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('por-cargar');
    var listo = function () { img.classList.add('cargada'); };
    img.addEventListener('load', listo, { once: true }); img.addEventListener('error', listo, { once: true });
  });

  // ---------------- Menú principal y submenús
  var nav = $('#nav'), botonMenu = $('[data-menu]'), velo = null;
  function cerrarSubmenus(excepto) { $$('.nav-boton[aria-expanded="true"]').forEach(function (b) { if (b !== excepto) b.setAttribute('aria-expanded', 'false'); }); }
  $$('.nav-boton').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); if (Date.now() - (b._porCursor || 0) < 700) return; var abierto = b.getAttribute('aria-expanded') === 'true'; cerrarSubmenus(b); b.setAttribute('aria-expanded', abierto ? 'false' : 'true'); });
  });
  d.addEventListener('click', function (e) { if (!e.target.closest('.nav-item')) cerrarSubmenus(); });
  // En computador los submenús se abren al pasar el cursor (con una pequeña pausa para que no se
  // abran por accidente al cruzar la barra). Opción «Cabecera → Abrir los menús».
  var conCursor = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1025px)');
  $$('.nav-item').forEach(function (item) {
    var b = $('.nav-boton', item), espera = null;
    if (!b) return;
    var activo = function () { return conCursor && conCursor.matches && raiz.getAttribute('data-menu-abrir') !== 'clic'; };
    item.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !activo()) return;
      clearTimeout(espera);
      var abierto = $('.nav-boton[aria-expanded="true"]');
      espera = setTimeout(function () { cerrarSubmenus(b); if (b.getAttribute('aria-expanded') !== 'true') b._porCursor = Date.now(); b.setAttribute('aria-expanded', 'true'); }, abierto ? 0 : 90);
    });
    item.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !activo()) return;
      clearTimeout(espera);
      espera = setTimeout(function () { if (!item.contains(d.activeElement)) b.setAttribute('aria-expanded', 'false'); }, 260);
    });
  });
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

  // Buscador predictivo: resultados mientras se escribe (agrupados y con las palabras resaltadas),
  // la palabra se completa en gris (Tab o → la acepta), búsquedas recientes y lo más buscado al
  // entrar al campo, y ejemplos que se escriben solos en el campo vacío.
  // Opciones en «Diseño del sitio → Buscador» (atributos data-busca-* de <html>).
  var opBusca = function (k) { return raiz.getAttribute('data-busca-' + k) !== 'no'; };
  var sinTilde = function (t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var ICONOS_TIPO = { atajo: 'M5 12h14M13 6l6 6-6 6', 'en-linea': 'M4 5h16v11H4zM8 20h8', tramite: 'M7 3h7l5 5v13H7zM14 3v5h5', noticia: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2', evento: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', documento: 'M7 3h7l5 5v13H7zM10 13h6M10 17h6', reciente: 'M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5', popular: 'M13 3 4 14h7l-1 7 9-11h-7z' };
  var icoTipo = function (k) { return '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (ICONOS_TIPO[k] || 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5') + '"/></svg>'; };
  // Resalta (sin importar tildes ni mayúsculas) las palabras buscadas dentro de un texto.
  function resaltar(texto, palabras) {
    var t = String(texto || ''), n = sinTilde(t), marcas = [];
    palabras.forEach(function (p) { if (p.length < 2) return; var k = n.indexOf(p); while (k >= 0) { marcas.push([k, k + p.length]); k = n.indexOf(p, k + p.length); } });
    if (!marcas.length) return esc(t);
    marcas.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    marcas.forEach(function (m) { if (m[0] < pos) return; out += esc(t.slice(pos, m[0])) + '<mark>' + esc(t.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    return out + esc(t.slice(pos));
  }
  var recientes = function () { try { return JSON.parse(leer('mlp-busquedas') || '[]').slice(0, 5); } catch (e) { return []; } };
  function recordar(q) {
    q = String(q || '').trim(); if (q.length < 2 || !opBusca('recientes')) return;
    var l = recientes().filter(function (x) { return sinTilde(x) !== sinTilde(q); }); l.unshift(q.slice(0, 80));
    guardar('mlp-busquedas', JSON.stringify(l.slice(0, 5)));
  }
  var ejemplos = function () { return (raiz.getAttribute('data-busca-lista') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8); };
  var cacheBusca = {};

  $$('[data-sugerencias]').forEach(function (input) {
    var caja = d.getElementById(input.getAttribute('aria-controls'));
    if (!caja) return;
    var form = input.form, marco = input.parentNode;
    var t = null, pedido = 0, sel = -1, completar = '';
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'both'); input.setAttribute('aria-expanded', 'false');
    // Texto fantasma con la palabra completada
    var fantasma = d.createElement('span'); fantasma.className = 'sug-fantasma'; fantasma.setAttribute('aria-hidden', 'true');
    marco.classList.add('con-fantasma'); marco.insertBefore(fantasma, input.nextSibling);
    var lienzo = d.createElement('canvas').getContext('2d');
    function ponerFantasma(texto) {
      var v = input.value;
      completar = texto && v && sinTilde(texto).indexOf(sinTilde(v)) === 0 && texto.length > v.length ? texto : '';
      if (!completar || d.activeElement !== input) { fantasma.textContent = ''; return; }
      var cs = getComputedStyle(input); lienzo.font = cs.font;
      fantasma.style.font = cs.font;
      fantasma.style.left = (input.offsetLeft + parseFloat(cs.paddingLeft) + lienzo.measureText(v).width - input.scrollLeft) + 'px';
      fantasma.style.top = input.offsetTop + 'px'; fantasma.style.height = input.offsetHeight + 'px'; fantasma.style.lineHeight = input.offsetHeight + 'px';
      fantasma.textContent = completar.slice(v.length);
    }
    function abrir(htmlCaja) { caja.innerHTML = htmlCaja; caja.hidden = false; input.setAttribute('aria-expanded', 'true'); sel = -1; }
    function cerrar() { caja.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); fantasma.textContent = ''; }
    var opcionHtml = function (i, url, titulo, extra, ico, externo, datos) {
      return '<a role="option" id="' + caja.id + '-' + i + '" href="' + esc(url) + '"' + (externo ? ' target="_blank" rel="noopener"' : '') + (datos || '') + '><span class="sug-ico">' + icoTipo(ico) + '</span><span class="sug-txt"><span class="sug-titulo">' + titulo + '</span>' + (extra || '') + '</span><svg class="ico sug-ir" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="' + (externo ? 'M7 17 17 7M8 7h9v9' : 'M5 12h14M13 6l6 6-6 6') + '"/></svg></a>';
    };
    // Al entrar al campo vacío: recientes y lo más buscado.
    function inicio() {
      var r = opBusca('recientes') ? recientes() : [], p = opBusca('populares') ? ejemplos() : [], n = 0, h = '';
      if (r.length) h += '<div class="sug-grupo"><span>Búsquedas recientes</span><button type="button" class="sug-borrar" data-borrar>Borrar</button></div>' + r.map(function (q) { return opcionHtml(n++, '/buscar/?q=' + encodeURIComponent(q), esc(q), '', 'reciente', false, ' data-q="' + esc(q) + '"'); }).join('');
      if (p.length) h += '<div class="sug-grupo"><span>Lo más buscado</span></div><div class="sug-chips">' + p.map(function (q) { return '<a role="option" id="' + caja.id + '-' + (n++) + '" class="sug-chip" href="/buscar/?q=' + encodeURIComponent(q) + '" data-q="' + esc(q) + '">' + icoTipo('popular') + esc(q) + '</a>'; }).join('') + '</div>';
      if (h) abrir(h); else cerrar();
    }
    function mostrar(q, j) {
      var items = j.items || [], palabras = sinTilde(q).split(/\s+/).filter(Boolean), frag = opBusca('fragmentos');
      if (!items.length) {
        abrir('<p class="sug-vacio">Sin coincidencias para «' + esc(q) + '». Pruebe con otra palabra o revise la ortografía.</p>' + (ejemplos().length ? '<div class="sug-chips">' + ejemplos().slice(0, 4).map(function (x, i) { return '<a role="option" id="' + caja.id + '-' + i + '" class="sug-chip" href="/buscar/?q=' + encodeURIComponent(x) + '" data-q="' + esc(x) + '">' + icoTipo('popular') + esc(x) + '</a>'; }).join('') + '</div>' : ''));
        ponerFantasma(''); return;
      }
      var h = j.aproximado ? '<div class="sug-grupo"><span>¿Quiso decir…?</span></div>' : '', grupo = null;
      items.forEach(function (it, i) {
        if (!j.aproximado && it.tipo !== grupo) { grupo = it.tipo; h += '<div class="sug-grupo"><span>' + esc(grupo) + '</span></div>'; }
        var extra = frag && it.fragmento ? '<small class="sug-frag">' + esc(it.fragmento).replace(/\[\[/g, '<mark>').replace(/\]\]/g, '</mark>') + '</small>' : '';
        h += opcionHtml(i, it.url, resaltar(it.titulo, palabras), extra, it.clave, it.externo);
      });
      h += '<a role="option" id="' + caja.id + '-todo" class="sug-todo" href="/buscar/?q=' + encodeURIComponent(q) + '">Ver todos los resultados de «' + esc(q) + '» <kbd>Enter</kbd></a>';
      abrir(h);
      var primero = items.filter(function (it) { return sinTilde(it.titulo).indexOf(sinTilde(input.value)) === 0; })[0];
      ponerFantasma(primero ? primero.titulo : '');
    }
    function consultar() {
      var q = input.value.replace(/\s+/g, ' ').trim();
      clearTimeout(t);
      if (!opBusca('predictivo')) return cerrar();
      if (q.length < 2) { marco.classList.remove('buscando'); ponerFantasma(''); return inicio(); }
      if (cacheBusca[sinTilde(q)]) return mostrar(q, cacheBusca[sinTilde(q)]);
      var n = ++pedido;
      t = setTimeout(function () {
        marco.classList.add('buscando');
        fetch('/api/public/buscar?q=' + encodeURIComponent(q)).then(function (r) { return r.ok ? r.json() : { items: [] }; }).then(function (j) {
          cacheBusca[sinTilde(q)] = j;
          if (n === pedido && d.activeElement === input) mostrar(q, j);
        }).catch(function () {}).then(function () { if (n === pedido) marco.classList.remove('buscando'); });
      }, 110);
    }
    input.addEventListener('input', consultar);
    input.addEventListener('focus', function () { detenerEjemplos(); consultar(); });
    input.addEventListener('blur', function () { setTimeout(function () { if (!caja.contains(d.activeElement)) { cerrar(); arrancarEjemplos(); } }, 150); });
    input.addEventListener('keydown', function (e) {
      var op = $$('[role="option"]', caja);
      if ((e.key === 'Tab' || (e.key === 'ArrowRight' && input.selectionStart === input.value.length)) && completar && !e.shiftKey) {
        e.preventDefault(); input.value = completar; completar = ''; fantasma.textContent = ''; consultar(); return;
      }
      if (e.key === 'Escape') { if (!caja.hidden) { e.preventDefault(); cerrar(); } return; }
      if (caja.hidden || !op.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + op.length) % op.length;
        op.forEach(function (o, i) { o.setAttribute('aria-selected', i === sel ? 'true' : 'false'); });
        input.setAttribute('aria-activedescendant', op[sel].id);
        op[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && sel >= 0) { e.preventDefault(); recordar(op[sel].getAttribute('data-q') || input.value); op[sel].click(); }
    });
    caja.addEventListener('mousedown', function (e) { if (e.target.closest('[data-borrar]')) e.preventDefault(); });
    caja.addEventListener('click', function (e) {
      if (e.target.closest('[data-borrar]')) { guardar('mlp-busquedas', null); input.focus(); inicio(); return; }
      var a = e.target.closest('a'); if (a) recordar(a.getAttribute('data-q') || input.value);
    });
    form && form.addEventListener('submit', function () { recordar(input.value); });
    d.addEventListener('click', function (e) { if (e.target !== input && !caja.contains(e.target)) cerrar(); });

    // Ejemplos que se escriben solos mientras el campo está vacío.
    var original = input.getAttribute('placeholder') || '', reloj = null, vuelta = 0;
    function detenerEjemplos() { clearTimeout(reloj); reloj = null; input.setAttribute('placeholder', original); }
    function arrancarEjemplos() {
      var lista = ejemplos();
      if (reducido || !opBusca('ejemplos') || !lista.length || input.value || d.activeElement === input || reloj) return;
      var palabra = lista[vuelta++ % lista.length], k = 0, borrando = false;
      (function paso() {
        if (input.value || d.activeElement === input) return detenerEjemplos();
        input.setAttribute('placeholder', 'Ej.: ' + palabra.slice(0, k));
        if (!borrando && k < palabra.length) { k++; reloj = setTimeout(paso, 55 + Math.random() * 45); }
        else if (!borrando) { borrando = true; reloj = setTimeout(paso, 1900); }
        else if (k > 0) { k--; reloj = setTimeout(paso, 22); }
        else { palabra = lista[vuelta++ % lista.length]; borrando = false; reloj = setTimeout(paso, 350); }
      })();
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) arrancarEjemplos(); else if (reloj) detenerEjemplos(); }).observe(input);
    d.addEventListener('mlp:diseno', function () { detenerEjemplos(); arrancarEjemplos(); });
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

  // Movimiento elegido por la persona: completo, suave (sin transiciones entre páginas ni pantalla
  // de carga) o sin animaciones. Se recuerda en este navegador y se aplica al recargar la página.
  var bms = $$('button[data-movimiento]');
  if (bms.length) {
    var actualMv = leer('mlp-movimiento') || 'completo';
    var marcarMv = function (v) { bms.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-movimiento') === v ? 'true' : 'false'); }); };
    marcarMv(actualMv);
    bms.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-movimiento');
        if (v === actualMv) return;
        guardar('mlp-movimiento', v === 'completo' ? null : v);
        marcarMv(v);
        avisar(v === 'completo' ? 'Animaciones activadas' : v === 'suave' ? 'Movimiento suave: sin transiciones entre páginas' : 'Animaciones desactivadas');
        setTimeout(function () { location.reload(); }, 700);
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
    // Las campañas toman del diseño la transición (deslizar, fundido, acercamiento o profundidad) y
    // el intervalo; los demás carruseles se deslizan con su propio intervalo.
    var esCampana = c.classList.contains('campanas');
    var desliza = function () { return !esCampana || (raiz.getAttribute('data-camp-trans') || 'deslizar') === 'deslizar'; };
    function marcar() {
      if (puntos) $$('button', puntos).forEach(function (b, n) { b.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      items.forEach(function (it, n) { it.classList.toggle('activa', n === i); it.classList.toggle('previa', n === (i - 1 + items.length) % items.length); });
    }
    function ir(n) { i = (n + items.length) % items.length; if (desliza()) pista.scrollTo({ left: items[i].offsetLeft, behavior: reducido ? 'auto' : 'smooth' }); marcar(); }
    pista.addEventListener('scroll', function () { if (!desliza()) return; var n = Math.round(pista.scrollLeft / pista.clientWidth); if (n !== i) { i = n; marcar(); } }, { passive: true });
    var ant = $('.carrusel-ant', c), sig = $('.carrusel-sig', c), pausa = $('.carrusel-pausa', c);
    ant && ant.addEventListener('click', function () { ir(i - 1); detener(); });
    sig && sig.addEventListener('click', function () { ir(i + 1); detener(); });
    var msDe = function () { return esCampana && raiz.hasAttribute('data-camp-auto') ? Number(raiz.getAttribute('data-camp-auto')) * 1000 : Number(c.getAttribute('data-auto')) || 0; };
    var ms = msDe();
    if (ms) c.style.setProperty('--dur', ms + 'ms');
    if (esCampana) d.addEventListener('mlp:diseno', function () { ms = msDe(); if (ms) c.style.setProperty('--dur', ms + 'ms'); if (pausa) pausa.hidden = !ms; if (!desliza()) pista.scrollTo({ left: 0 }); else ir(i); clearInterval(timer); iniciar(); });
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

  // ---------------- Ventanas emergentes (Extensiones → Ventanas emergentes)
  // Se muestran según su disparo (al abrir, a los N segundos, al bajar o al intentar salir) y su
  // frecuencia (una vez por visita, cada N días, una sola vez o siempre). Se cierran con la ×, con
  // Escape o haciendo clic fuera; el foco vuelve a donde estaba.
  (function () {
    var lista = $$('[data-emergente]');
    if (!lista.length) return;
    var abierta = null, previo = null;
    var clave = function (el) { return 'mlp-em-' + el.getAttribute('data-emergente'); };
    function toca(el) {
      var f = el.getAttribute('data-frecuencia'), v = el.getAttribute('data-version');
      if (f === 'siempre') return true;
      var dato = null;
      try { dato = JSON.parse((f === 'sesion' ? sessionStorage.getItem(clave(el)) : leer(clave(el))) || 'null'); } catch (e) { dato = null; }
      if (!dato || dato.v !== v) return true;
      if (f === 'dias') return Date.now() - dato.t > Number(el.getAttribute('data-dias') || 7) * 864e5;
      return false;
    }
    function anotar(el) {
      var f = el.getAttribute('data-frecuencia'), dato = JSON.stringify({ v: el.getAttribute('data-version'), t: Date.now() });
      if (f === 'siempre') return;
      if (f === 'sesion') { try { sessionStorage.setItem(clave(el), dato); } catch (e) {} } else guardar(clave(el), dato);
    }
    function mostrar(el) {
      if (abierta || !el.hidden) return;
      abierta = el; previo = d.activeElement;
      el.hidden = false; el.classList.add('entrando');
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('entrando'); }); });
      anotar(el);
      if (el.classList.contains('emergente-modal')) { d.body.classList.add('con-emergente'); var b = $('.emergente-cerrar', el); b && b.focus({ preventScroll: true }); }
    }
    function cerrar(el) {
      if (!el || el.hidden) return;
      el.classList.add('saliendo');
      setTimeout(function () { el.hidden = true; el.classList.remove('saliendo'); }, reducido ? 0 : 260);
      d.body.classList.remove('con-emergente');
      abierta = null;
      if (previo && previo.focus) previo.focus({ preventScroll: true });
      // Si hay otra esperando, aparece después.
      setTimeout(revisar, 900);
    }
    var pendientes = [];
    function revisar() { pendientes = pendientes.filter(function (p) { if (p.listo && !abierta) { mostrar(p.el); return false; } return !p.hecha; }); }
    lista.forEach(function (el) {
      if (!toca(el)) return;
      var p = { el: el, listo: false };
      pendientes.push(p);
      var listo = function () { if (p.listo) return; p.listo = true; revisar(); };
      var disparo = el.getAttribute('data-disparo');
      if (disparo === 'carga') setTimeout(listo, 600);
      else if (disparo === 'tiempo') setTimeout(listo, Number(el.getAttribute('data-segundos') || 4) * 1000);
      else if (disparo === 'desplazamiento') {
        var pct = Number(el.getAttribute('data-porcentaje') || 40) / 100;
        var al = function () { var alto = d.documentElement.scrollHeight - innerHeight; if (alto > 0 && scrollY / alto >= pct) { removeEventListener('scroll', al); listo(); } };
        addEventListener('scroll', al, { passive: true });
      } else if (disparo === 'salida') {
        d.addEventListener('mouseout', function salir(e) { if (!e.relatedTarget && e.clientY <= 0) { d.removeEventListener('mouseout', salir); listo(); } });
      }
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-emergente-cerrar]') || e.target === el) cerrar(el);
        else if (e.target.closest('[data-emergente-accion]')) setTimeout(function () { cerrar(el); }, 50);
      });
    });
    d.addEventListener('keydown', function (e) {
      if (!abierta) return;
      if (e.key === 'Escape') cerrar(abierta);
      // Foco atrapado dentro de la ventana al centro.
      if (e.key === 'Tab' && abierta.classList.contains('emergente-modal')) {
        var f = $$('a[href], button, input, select, textarea', abierta).filter(function (x) { return x.offsetParent; });
        if (!f.length) return;
        if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  })();

  // Videoteca: la imagen del reproductor sube a la máxima calidad si YouTube la tiene (si no,
  // YouTube entrega una imagen gris de 120 px y se conserva la normal).
  $$('img[data-calidad][data-mini]').forEach(function (img) {
    var alta = new Image();
    alta.onload = function () { if (alta.naturalWidth > 200) img.src = alta.src; };
    alta.src = 'https://i.ytimg.com/vi/' + img.getAttribute('data-mini') + '/' + img.getAttribute('data-calidad') + '.jpg';
  });

  // Videoteca: flechas de las filas, vista previa animada (los tres cuadros que YouTube publica de
  // cada video) y vista en cuadrícula o lista (se recuerda en este navegador).
  $$('[data-carril]').forEach(function (c) {
    var pista = $('.vd-pista', c), ant = $('[data-carril-ant]', c), sig = $('[data-carril-sig]', c);
    if (!pista) return;
    var revisar = function () { ant.disabled = pista.scrollLeft < 8; sig.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 8; c.classList.toggle('sin-desborde', pista.scrollWidth <= pista.clientWidth + 8); };
    var mover = function (dir) { pista.scrollBy({ left: dir * pista.clientWidth * .85, behavior: reducido ? 'auto' : 'smooth' }); };
    ant.addEventListener('click', function () { mover(-1); }); sig.addEventListener('click', function () { mover(1); });
    pista.addEventListener('scroll', revisar, { passive: true }); addEventListener('resize', revisar, { passive: true }); revisar();
  });
  if (!reducido && window.matchMedia && matchMedia('(hover: hover)').matches) {
    d.addEventListener('pointerover', function (e) {
      var t = e.target.closest && e.target.closest('[data-previa]');
      if (!t || t._previa || raiz.getAttribute('data-vd-previa') !== 'si') return;
      var img = $('.vd-mini img', t); if (!img) return;
      var id = t.getAttribute('data-previa'), original = img.src, n = 0;
      t._previa = setInterval(function () { n = n % 3 + 1; img.src = 'https://i.ytimg.com/vi/' + id + '/mq' + n + '.jpg'; }, 700);
      t.classList.add('en-previa');
      t.addEventListener('pointerleave', function fin() { clearInterval(t._previa); t._previa = null; img.src = original; t.classList.remove('en-previa'); t.removeEventListener('pointerleave', fin); });
    });
  }
  var bvs = $$('button[data-vd-vista]'), vt = $('.videoteca');
  if (bvs.length && vt) {
    var vista = leer('mlp-vd-vista') || 'grilla';
    var pintarVista = function () { vt.setAttribute('data-vista', vista); bvs.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-vd-vista') === vista ? 'true' : 'false'); }); };
    bvs.forEach(function (b) { b.addEventListener('click', function () { vista = b.getAttribute('data-vd-vista'); guardar('mlp-vd-vista', vista === 'grilla' ? null : vista); pintarVista(); }); });
    pintarVista();
  }

  // Filtros que se aplican al elegir una opción (lista de documentos de Transparencia).
  $$('select[data-auto-enviar]').forEach(function (sel) { sel.addEventListener('change', function () { if (sel.form) sel.form.submit(); }); });

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
  // Alto desplazable de la página, medido sólo cuando cambia (leerlo en cada cuadro obliga al
  // navegador a recalcular la página entera y traba el desplazamiento en páginas largas).
  var altoCache = -1;
  var altoPagina = function () { if (altoCache < 0) altoCache = d.documentElement.scrollHeight - innerHeight; return altoCache; };
  addEventListener('resize', function () { altoCache = -1; }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(function () { altoCache = -1; }).observe(d.body);
  window.mlpAltoPagina = altoPagina;
  var arriba = $('[data-arriba]');
  if (arriba) {
    var marcoArriba = 0;
    window.addEventListener('scroll', function () {
      cancelAnimationFrame(marcoArriba);
      marcoArriba = requestAnimationFrame(function () {
        var alto = altoPagina();
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
      if (e.origin === location.origin && e.source === window.parent && e.data && e.data.tipo === 'mlp-ir') {
        // El panel lleva la vista previa a la parte de la página que se está ajustando.
        var destino = $(e.data.sel); if (destino) destino.scrollIntoView({ behavior: 'smooth', block: e.data.sel === '.cabecera' ? 'start' : 'center' });
        return;
      }
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
    // «Tocar para editar» del panel de diseño: resalta la parte bajo el cursor y, al hacer clic,
    // avisa al panel qué opciones le corresponden (la zona más interior gana).
    var insp = null, marcaInsp = null;
    var zonaInsp = function (t) {
      var mejor = null;
      (insp.zonas || []).forEach(function (z) { var el = t.closest && t.closest(z[0]); if (el && (!mejor || mejor.el.contains(el))) mejor = { el: el, grupo: z[1] }; });
      if (mejor && mejor.grupo === 'secciones') mejor.sec = mejor.el.getAttribute('data-sec');
      return mejor;
    };
    var moverInsp = function (e) {
      var z = zonaInsp(e.target);
      if (!z) { marcaInsp.hidden = true; return; }
      var r = z.el.getBoundingClientRect();
      marcaInsp.hidden = false;
      marcaInsp.style.cssText = 'top:' + (r.top + scrollY) + 'px;left:' + (r.left + scrollX) + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
      marcaInsp.firstChild.textContent = '✎ ' + ((insp.nombres || {})[z.sec ? 'sec:' + z.sec : z.grupo] || z.grupo);
    };
    var clicInsp = function (e) {
      var z = zonaInsp(e.target);
      if (!z) return;
      e.preventDefault(); e.stopPropagation();
      window.parent.postMessage({ tipo: 'mlp-elegido', grupo: z.grupo, sec: z.sec || '' }, location.origin);
    };
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.tipo !== 'mlp-inspeccionar') return;
      insp = e.data.activo ? e.data : null;
      raiz.classList.toggle('inspeccionando', !!insp);
      if (insp && !marcaInsp) { marcaInsp = d.createElement('div'); marcaInsp.className = 'marca-inspector'; marcaInsp.hidden = true; marcaInsp.appendChild(d.createElement('span')); d.body.appendChild(marcaInsp); }
      d[insp ? 'addEventListener' : 'removeEventListener']('mouseover', moverInsp, true);
      d[insp ? 'addEventListener' : 'removeEventListener']('click', clicInsp, true);
      if (!insp && marcaInsp) marcaInsp.hidden = true;
    });
    window.parent.postMessage({ tipo: 'mlp-vista-lista' }, location.origin);
  }

  // ---------------- Micrositios: pestañas (con teclado) y barra de secciones que sigue la lectura
  $$('[data-ms-pestanas]').forEach(function (caja) {
    var tabs = [].slice.call(caja.querySelectorAll('[role="tab"]'));
    var elegir = function (t, foco) {
      tabs.forEach(function (x) { var si = x === t; x.setAttribute('aria-selected', String(si)); x.tabIndex = si ? 0 : -1; d.getElementById(x.getAttribute('aria-controls')).hidden = !si; });
      if (foco) t.focus();
      t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { elegir(t); });
      t.addEventListener('keydown', function (e) {
        var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (n === undefined) return;
        e.preventDefault(); elegir(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
  });
  var msNav = $('[data-ms-nav]');
  if (msNav) {
    // La barra queda justo bajo la cabecera fija. La altura se mide sólo cuando la cabecera cambia
    // de tamaño (no en cada movimiento del scroll: escribir una variable en la raíz obliga a
    // recalcular los estilos de toda la página y hacía que el desplazamiento se trabara).
    var cabMs = $('.cabecera'), ultimoAlto = -1;
    var altoCab = function () {
      var a = cabMs && raiz.getAttribute('data-cabecera-fija') === 'si' && !cabMs.classList.contains('oculta') ? Math.round(cabMs.offsetHeight) : 0;
      if (a !== ultimoAlto) { ultimoAlto = a; msNav.style.top = a + 'px'; }
    };
    altoCab();
    if (cabMs && 'ResizeObserver' in window) new ResizeObserver(altoCab).observe(cabMs); else addEventListener('resize', altoCab);
    // Al bajar, la cabecera se esconde: la barra sube con ella.
    if (cabMs && 'MutationObserver' in window) new MutationObserver(altoCab).observe(cabMs, { attributes: true, attributeFilter: ['class'] });
  }
  if (msNav && 'IntersectionObserver' in window) {
    var lista = msNav.querySelector('ul');
    var enlaces = [].slice.call(msNav.querySelectorAll('a'));
    var vistos = new Map(), activo = null;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vistos.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0); });
      var mejor = null, max = 0;
      enlaces.forEach(function (a) { var r = vistos.get(a.hash.slice(1)) || 0; if (r > max) { max = r; mejor = a; } });
      if (mejor === activo) return;
      if (activo) activo.removeAttribute('aria-current');
      activo = mejor;
      if (!mejor) return; // arriba de todo (portada) o en una sección sin nombre en la barra
      activo.setAttribute('aria-current', 'true');
      // Sólo se desliza la barra (horizontal), nunca la página.
      var x = activo.offsetLeft - (lista.clientWidth - activo.offsetWidth) / 2;
      if (Math.abs(lista.scrollLeft - x) > 8) lista.scrollTo({ left: x, behavior: 'smooth' });
    }, { rootMargin: '-120px 0px -45% 0px', threshold: [0, .25, .6] });
    enlaces.forEach(function (a) { var s = d.getElementById(a.hash.slice(1)); if (s) io.observe(s); });
  }

  // ---------------- Aplicación instalable y lectura sin conexión
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(function () {});
})();
