/* PawLink · CONTROLADORES del área de usuario (PawMate / PawCare / PawGift).
   Cada pantalla es un módulo que se activa con data-module en su <main>:
     pawfriends     → views/usuario/mis-pawfriends.html   (apadrinamientos: activos, suspendido por impago, anteriores)
     miayuda        → views/usuario/mi-ayuda.html         (historial de pagos, próximos cobros, totales)
     notificaciones → views/usuario/mis-notificaciones.html
     preferidos     → views/usuario/mis-preferidos.html   (mascotas que sigue)
     resumen        → views/usuario/padrino.html          (resumen)
   Los datos salen del modelo PawLink.db; el usuario es PawLink.db.usuarioActual() (el usuario demo por defecto). */
(function () {
  var db = PawLink.db, C = PawLink.cards, e = db.esc, tag = C.tag;
  function $(r, s) { return r.querySelector(s); }
  function each(l, f) { Array.prototype.forEach.call(l, f); }

  /* ── Consultas comunes ── */
  function misApad(u) { return db.where('apadrinamiento', { id_usuario: u.id_usuario }); }
  function cuotasDe(a) { return db.where('cuota_apadrinamiento', { id_apadrinamiento: a.id_apadrinamiento }).sort(function (x, y) { return x.numero_cuota - y.numero_cuota; }); }
  function totalApad(a) { return cuotasDe(a).reduce(function (s, c) { var p = db.byId('pago', c.id_pago); return s + (p && p.estado === 'COMPLETADO' ? p.importe : 0); }, 0); }
  function misAportaciones(u, idM) {
    return db.where('aportacion_tratamiento', function (x) { var t = db.byId('tratamiento', x.id_tratamiento), p = db.byId('pago', x.id_pago); return x.id_usuario === u.id_usuario && t.id_mascota === idM && p.estado === 'COMPLETADO'; });
  }
  function misRegalos(u, idM) { return db.where('regalo', function (g) { return g.id_usuario === u.id_usuario && g.id_mascota === idM && g.estado !== 'CANCELADO'; }); }
  function ultimaNovedad(m, u) {
    var colab = db.colaboradores(m.id_mascota).indexOf(u.id_usuario) > -1;
    return db.where('actualizacion', function (x) { return x.id_mascota === m.id_mascota && x.estado === 'PUBLICADA' && (x.visibilidad === 'PUBLICA' || (x.visibilidad === 'COLABORADORES' && colab)); })
      .sort(function (a, b) { return a.fecha_publicacion < b.fecha_publicacion ? 1 : -1; })[0];
  }
  function ultimoCodigoTarjeta(p) { var n = 0, i; for (i = 0; i < p.id_pago.length; i++) n += p.id_pago.charCodeAt(i); return ('000' + (n * 7919 % 10000)).slice(-4); }
  function formaPago(p) { return p.metodo_pago === 'BIZUM' ? 'Bizum' : 'Tarjeta ···· ' + ultimoCodigoTarjeta(p); }
  /* Historial plano de pagos del usuario: cuotas + aportaciones + regalos */
  function historial(u) {
    var r = [];
    misApad(u).forEach(function (a) {
      var m = db.byId('mascota', a.id_mascota);
      cuotasDe(a).forEach(function (c) {
        var p = db.byId('pago', c.id_pago); if (!p) return;
        r.push({ tipo: 'mate', fecha: p.fecha_creacion, m: m, p: p, importe: p.importe,
          concepto: a.modalidad === 'UNICO_30D' ? (c.numero_cuota > 1 ? 'Renovación PawMate · 30 días' : 'PawMate · pago único de 30 días') : 'Cuota mensual · ' + db.mes(c.periodo) });
      });
    });
    db.where('aportacion_tratamiento', { id_usuario: u.id_usuario }).forEach(function (a) {
      var t = db.byId('tratamiento', a.id_tratamiento); r.push({ tipo: 'care', fecha: a.fecha_aportacion, m: db.byId('mascota', t.id_mascota), p: db.byId('pago', a.id_pago), importe: a.importe, concepto: 'Tratamiento: ' + t.titulo });
    });
    db.where('regalo', { id_usuario: u.id_usuario }).forEach(function (g) {
      r.push({ tipo: 'gift', fecha: g.fecha_creacion, m: db.byId('mascota', g.id_mascota), p: db.byId('pago', g.id_pago), importe: g.precio, concepto: 'Regalo: ' + db.byId('catalogo_regalo', g.id_producto).nombre });
    });
    return r.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  }
  var ESTPAGO = { COMPLETADO: ['success', 'Cobrado'], FALLIDO: ['danger', 'Fallido'], REEMBOLSADO: ['secondary', 'Reembolsado'], PENDIENTE: ['accent', 'Pendiente'] };
  function proximaCuota(u) {
    var f = []; misApad(u).forEach(function (a) { if (a.estado === 'ACTIVO') cuotasDe(a).forEach(function (c) { if (c.estado === 'PENDIENTE') f.push({ a: a, c: c }); }); });
    return f.sort(function (x, y) { return x.c.fecha_cobro_esperada < y.c.fecha_cobro_esperada ? -1 : 1; });
  }
  function vermas(cont, items, paso, build) {         // «Ver más» sencillo en lugar de la paginación estática
    var n = 0, btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn2 mt-14'; btn.textContent = 'Ver más';
    function pinta() { cont.insertAdjacentHTML('beforeend', items.slice(n, n + paso).map(build).join('')); n += paso; btn.hidden = n >= items.length; }
    btn.addEventListener('click', pinta); cont.parentNode.insertBefore(btn, cont.nextSibling); pinta(); return pinta;
  }

  /* ══════════ Mis PawFriends ══════════ */
  PawLink.register('pawfriends', function (root) {
    var u = db.usuarioActual();
    function pinta() {
      var aps = misApad(u), vig = aps.filter(function (a) { return a.estado === 'ACTIVO' || a.estado === 'SUSPENDIDO'; }), ant = aps.filter(function (a) { return vig.indexOf(a) < 0; });
      ant.sort(function (a, b) { return (a.fecha_fin || '') < (b.fecha_fin || '') ? 1 : -1; });
      var dd = root.querySelectorAll('dl > .card > dd'), prox = proximaCuota(u);
      dd[0].textContent = vig.length;
      dd[1].textContent = db.eur(aps.filter(function (a) { return a.estado === 'ACTIVO' && a.modalidad === 'MENSUAL'; }).reduce(function (s, a) { return s + a.importe_mensual; }, 0));
      dd[2].textContent = prox.length ? db.fecha(prox[0].c.fecha_cobro_esperada) : '—';

      function tarjeta(a) {
        var m = db.byId('mascota', a.id_mascota), v = db.vista(m), pr = v.protectora, sus = a.estado === 'SUSPENDIDO', fin = a.estado === 'CANCELADO' || a.estado === 'FINALIZADO';
        var tags = '', rows = '', notas = '', acc = '', uni = a.modalidad === 'UNICO_30D';
        function row(k, val) { return '<div class="pf-row"><dt>' + k + '</dt><dd>' + val + '</dd></div>'; }
        if (sus) tags = tag('danger', 'Suspendido por impago');
        else if (fin) tags = a.estado === 'FINALIZADO' ? tag('secondary', 'Finalizado') : tag(/Impago/.test(a.motivo_fin) ? 'danger' : 'secondary', /Impago/.test(a.motivo_fin) ? 'Cancelado por impago' : 'Cancelado');
        else tags = tag('success', uni ? 'PawMate · 30 días' : 'PawMate');
        if (!fin) { if (misAportaciones(u, m.id_mascota).length) tags += tag('accent', 'PawCare'); if (misRegalos(u, m.id_mascota).length) tags += tag('violet', 'PawGift'); }
        if (fin) {
          rows = row('PawMate', db.fecha(a.fecha_inicio) + ' – ' + db.fecha(a.fecha_fin)) + row('Total aportado', db.eur(totalApad(a)));
          notas = '<p class="pf-gift fs-14">' + (a.motivo_fin === 'Mascota adoptada' ? '¡' + e(m.nombre) + ' ya tiene familia! Gracias por haberle acompañado.' : /Impago/.test(a.motivo_fin) ? 'El apadrinamiento se canceló al no regularizarse el pago.' : 'Gracias por haber acompañado a ' + e(m.nombre) + '.' + (m.estado === 'PUBLICADA' ? ' Sigue en la protectora.' : '')) + '</p>';
          acc = '<a href="' + v.url + '" class="btn" aria-label="Ver la ficha de ' + e(m.nombre) + '">Ver ficha</a>';
        } else {
          var cu = cuotasDe(a), pend = cu.filter(function (c) { return c.estado === 'PENDIENTE'; })[0], fall = cu.filter(function (c) { return c.estado === 'FALLIDA'; }).pop();
          rows = row('Tu aportación', '<b>' + db.eur(a.importe_mensual) + '</b>' + (uni ? ' pago único' : ' al mes'));
          if (sus) { var desde = a.fecha_actualizacion.slice(0, 10), hasta = new Date(new Date(desde + 'T12:00:00').getTime() + 15 * 86400000).toISOString().slice(0, 10);
            rows += row('Suspendido desde', db.fecha(desde)) + row('Se cancela el', db.fecha(hasta) + ' · quedan ' + Math.max(0, db.dias(db.meta.hoy, hasta)) + ' días');
            notas = '<p class="pf-gift fs-14">No hemos podido cobrar la cuota de ' + e(db.mes(fall.periodo)) + ' (' + fall.intentos + ' intentos). Actualiza tu método de pago antes del ' + db.fecha(hasta) + ' para conservar a ' + e(m.nombre) + '; si no, el apadrinamiento se cancelará y quedará libre para otros PawMates.</p>'; }
          else if (uni) rows += row('Finaliza', db.fecha(a.fecha_fin) + ' · quedan ' + Math.max(0, db.dias(db.meta.hoy, a.fecha_fin)) + ' días');
          else { rows += row('Próximo cobro', pend ? db.fecha(pend.fecha_cobro_esperada) : '—') + row('Día de cobro', 'Día ' + a.dia_cobro + ' de cada mes'); }
          rows += row('PawFriend desde', db.fecha(a.fecha_inicio)) + row('Total aportado', db.eur(totalApad(a)));
          var tr = db.tratamientoAbierto(m);
          if (tr) { var rec = db.recaudado(tr), pc = Math.min(100, Math.round(rec / tr.importe_objetivo * 100)), mio = misAportaciones(u, m.id_mascota).reduce(function (s, x) { return s + x.importe; }, 0);
            notas += '<div class="pf-prog"><p class="m-0 fs-14 fw-700">Tratamiento: ' + e(tr.titulo) + '</p><div class="bar" role="progressbar" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pc + '%"></i></div><p class="m-0 fs-14 c-muted">' + db.eur(rec) + ' de ' + db.eur(tr.importe_objetivo) + (mio ? ' · tú has aportado ' + db.eur(mio) : '') + '</p></div>'; }
          var rg = misRegalos(u, m.id_mascota).sort(function (x, y) { return x.fecha_creacion < y.fecha_creacion ? 1 : -1; })[0];
          if (rg) notas += '<p class="pf-gift fs-14"><b>Último regalo:</b> ' + e(db.byId('catalogo_regalo', rg.id_producto).nombre) + ' · ' + db.fecha(rg.fecha_creacion) + '</p>';
          var nv = ultimaNovedad(m, u); if (nv) notas += '<p class="pf-news"><span class="fs-14 c-muted">Última novedad · ' + db.fecha(nv.fecha_publicacion) + '</span><br>' + e(nv.contenido) + '</p>';
          acc = '<a href="' + v.url + '" class="btn" aria-label="Ver la ficha de ' + e(m.nombre) + '">Ver ficha</a>' +
            (sus ? '<a href="mis-datos.html" class="btn-link fw-800 c-primary td-underline">Actualizar método de pago</a>' : (uni ? '<a href="pago-apadrinamiento.html?id=' + m.id_mascota + '" class="btn-link fw-800 c-primary td-underline" data-pm-reset>Renovar</a>' : '')) +
            '<button type="button" class="btn-link fw-800 c-secondary td-underline" data-cancelar="' + a.id_apadrinamiento + '" data-n="' + e(m.nombre) + '">Cancelar</button>';
        }
        return '<article class="card hov hov--static pf-card' + (fin ? ' pf-card--end' : '') + '"><figure class="ph h-190"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(m.nombre) + '"></figure><div class="p-18"><div class="pf-tags">' + tags + '</div><h3 class="m-0 ff-display fw-800 fs-22">' + e(m.nombre) + '</h3><p class="m-0 fs-14 c-muted mb-12">' + e(v.especieTxt) + ' · ' + e(pr.nombre) + (v.ciudad ? ', ' + e(v.ciudad) : '') + '</p><dl class="pf-dl">' + rows + '</dl>' + notas + '<div class="pf-act">' + acc + '</div></div></article>';
      }
      function seccion(id, lista, vacio) { var s = root.querySelector('section[aria-labelledby=' + id + ']'), h = s.querySelector('h2'); s.innerHTML = ''; s.appendChild(h); s.insertAdjacentHTML('beforeend', lista.length ? '<div class="pf-g">' + lista.map(tarjeta).join('') + '</div>' : '<p class="c-muted">' + vacio + '</p>'); }
      seccion('pf-a', vig, 'Todavía no tienes ningún apadrinamiento activo. <a href="../public/apadrinar.html" class="c-primary fw-800 td-underline">Descubre a quién ayudar</a>.');
      seccion('pf-b', ant, 'Aquí aparecerán los apadrinamientos que hayan terminado.');
    }
    root.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-cancelar]') : null; if (!b) return;
      PawLink.modal.confirm({ title: 'Cancelar apadrinamiento', text: '¿Quieres cancelar tu apadrinamiento de ' + b.getAttribute('data-n') + '? No se cobrarán más cuotas y ' + b.getAttribute('data-n') + ' quedará libre para otros PawMates.', ok: 'Sí, cancelar', cancel: 'Volver', tone: 'danger', trigger: b,
        onOk: function () { db.cancelarApadrinamiento(b.getAttribute('data-cancelar')); pinta(); PawLink.toast.show('Apadrinamiento cancelado. (Simulación: se guarda solo en este navegador.)', { type: 'ok' }); } });
    });
    pinta();
  });

  /* ══════════ Mi ayuda ══════════ */
  PawLink.register('miayuda', function (root) {
    var u = db.usuarioActual(), h = historial(u), ok = h.filter(function (x) { return x.p.estado === 'COMPLETADO'; }), año = db.meta.hoy.slice(0, 4);
    var dd = root.querySelectorAll('dl.mb-24 > .card > dd');
    dd[0].textContent = db.eur(ok.filter(function (x) { return x.fecha.slice(0, 4) === año; }).reduce(function (s, x) { return s + x.importe; }, 0));
    dd[1].textContent = db.eur(ok.reduce(function (s, x) { return s + x.importe; }, 0));
    var ms = {}; ok.forEach(function (x) { ms[x.m.id_mascota] = 1; }); dd[2].textContent = Object.keys(ms).length;
    var tot = { mate: 0, care: 0, gift: 0 }; ok.forEach(function (x) { tot[x.tipo] += x.importe; });
    var suma = (tot.mate + tot.care + tot.gift) || 1, bars = root.querySelectorAll('.ay-split i');
    ['mate', 'care', 'gift'].forEach(function (k, i) { bars[i].style.width = (tot[k] / suma * 100).toFixed(1) + '%'; bars[i].style.flex = 'none'; root.querySelectorAll('.ay-leg b')[i].textContent = db.eur(tot[k]); });
    /* Aviso de cuota no cobrada (solo si hay un apadrinamiento suspendido) */
    var sus = misApad(u).filter(function (a) { return a.estado === 'SUSPENDIDO'; }), al = $(root, '.ay-alert');
    if (al) { al.hidden = !sus.length; if (sus.length) al.innerHTML = '<b>No hemos podido cobrar la cuota de ' + e(db.byId('mascota', sus[0].id_mascota).nombre) + '.</b> Su apadrinamiento está suspendido. <a href="mis-datos.html" class="c-primary fw-800 td-underline">Actualiza tu método de pago</a> para no perderlo.'; }
    /* Próximos cobros */
    var up = proximaCuota(u), box = $(root, '.ay-up') && $(root, '.ay-up').parentNode;
    if (box) box.innerHTML = up.length ? up.map(function (x) { var m = db.byId('mascota', x.a.id_mascota);
      return '<div class="ay-up"><a href="' + db.vista(m).url + '" class="ph w-48 h-48 r-lg flex-none"><img class="pic" src="' + e(db.imagenPrincipal(m)) + '" alt="Foto de ' + e(m.nombre) + '"></a><div class="flex-1-1-120"><p class="m-0 fw-800">' + e(m.nombre) + '</p><p class="m-0 fs-14 c-muted">PawMate · ' + db.fecha(x.c.fecha_cobro_esperada) + '</p></div><span class="fw-800">' + db.eur(x.c.importe_esperado) + '</span></div>'; }).join('') : '<p class="c-muted fs-14">No tienes cuotas pendientes de cobro.</p>';
    /* Historial con filtros por tipo, año y mascota */
    var hist = $(root, '.ay .pg'), lista = document.createElement('div'); lista.className = 'ay-list'; hist.parentNode.replaceChild(lista, hist);
    var selA = root.querySelectorAll('.ay-sel select')[0], selM = root.querySelectorAll('.ay-sel select')[1];
    var años = {}, nombres = {}; h.forEach(function (x) { años[x.fecha.slice(0, 4)] = 1; nombres[x.m.nombre] = 1; });
    selA.innerHTML = '<option value="">Todos</option>' + Object.keys(años).sort().reverse().map(function (a) { return '<option>' + a + '</option>'; }).join('');
    selM.innerHTML = '<option value="">Todas</option>' + Object.keys(nombres).sort().map(function (a) { return '<option>' + a + '</option>'; }).join('');
    function fila(x) {
      var et = ESTPAGO[x.p.estado], T = { mate: ['success', 'PawMate'], care: ['accent', 'PawCare'], gift: ['violet', 'PawGift'] }[x.tipo];
      return '<details class="ay-row ay-t-' + x.tipo + '" data-y="' + x.fecha.slice(0, 4) + '" data-m="' + e(x.m.nombre) + '"><summary class="ay-sum"><span class="ay-d c-muted">' + db.fecha(x.fecha) + '</span><span class="ay-t">' + tag(T[0], T[1]) + '</span><span class="ay-c"><a href="' + db.vista(x.m).url + '" class="fw-800 td-underline">' + e(x.m.nombre) + '</a><br><span class="fs-14 c-muted">' + e(x.concepto) + '</span></span><span class="ay-i fw-800">' + db.eur(x.importe) + '</span><span class="ay-s">' + tag(et[0], et[1]) + '</span><span class="ay-tg btn-link fw-800 c-primary td-underline">Detalle</span></summary>' +
        '<div class="ay-body"><dl class="ay-dl"><div><dt>Forma de pago</dt><dd>' + formaPago(x.p) + '</dd></div><div><dt>Nº de operación</dt><dd>' + e(x.p.id_externo_proveedor) + '</dd></div><div><dt>Protectora</dt><dd>' + e(db.byId('protectora', x.m.id_protectora).nombre) + '</dd></div></dl>' + (x.p.estado === 'COMPLETADO' ? '<button class="btn btn2" type="button" data-notify="Descarga simulada del justificante.">Descargar justificante</button>' : '') + '</div></details>';
    }
    function aplica() { each(lista.children, function (r) { r.classList.toggle('xh', (selA.value && r.getAttribute('data-y') !== selA.value) || (selM.value && r.getAttribute('data-m') !== selM.value)); }); }
    if (PawLink.FILTROS_ACTIVOS) { selA.addEventListener('change', aplica); selM.addEventListener('change', aplica); }
    vermas(lista, h, 12, fila);
  });

  /* ══════════ Mis notificaciones ══════════ */
  PawLink.register('notificaciones', function (root) {
    var u = db.usuarioActual(), todas = db.where('notificacion', { id_usuario: u.id_usuario }).sort(function (a, b) { return a.fecha_creacion < b.fecha_creacion ? 1 : -1; });
    var card = $(root, '.card.p-8-24'), bar = $(root, '[role=group]'), filtro = '', n = 0, mas = document.createElement('button');
    mas.type = 'button'; mas.className = 'btn btn2 mt-14'; mas.textContent = 'Ver más'; card.parentNode.insertBefore(mas, card.nextSibling);
    var vacio = document.createElement('p'); vacio.className = 'c-muted'; vacio.setAttribute('role', 'status'); card.parentNode.insertBefore(vacio, card.nextSibling);
    function ok(x) { var g = C.grupoNotif(x); return !filtro || (filtro === 'unread' ? !x.leida : (g === filtro || (filtro === 'mate' && g === 'novedad'))); }
    function pinta(reset) {
      if (reset) { n = 0; card.innerHTML = ''; }
      var l = todas.filter(ok); card.insertAdjacentHTML('beforeend', l.slice(n, n + 15).map(function (x, i) { return C.notif(x, n + i === 0); }).join('')); n += 15;
      mas.hidden = n >= l.length; vacio.textContent = l.length ? '' : 'No hay notificaciones con este filtro.';
    }
    var MAPA = { 'Todas': '', 'PawMate': 'mate', 'PawCare': 'care', 'PawGift': 'gift', 'No leídas': 'unread' };
    if (PawLink.FILTROS_ACTIVOS) bar.addEventListener('click', function (ev) { var c = ev.target.closest ? ev.target.closest('.chip') : null; if (!c) return; filtro = MAPA[c.textContent.trim()]; each(bar.querySelectorAll('.chip'), function (x) { x.classList.toggle('on', x === c); }); pinta(true); });
    mas.addEventListener('click', function () { pinta(false); });
    var todasBtn = $(root, 'span.btn.btn2'); if (todasBtn) { todasBtn.setAttribute('role', 'button'); todasBtn.tabIndex = 0; todasBtn.addEventListener('click', function () { db.leerNotificaciones(u.id_usuario); pinta(true); PawLink.toast.show('Todas las notificaciones marcadas como leídas.', { type: 'ok' }); }); }
    pinta(true);
  });

  /* ══════════ Mis preferidos ══════════ */
  PawLink.register('preferidos', function (root) {
    var g = $(root, '.g'), msg = document.createElement('p'); msg.className = 'c-muted'; g.parentNode.insertBefore(msg, g);
    var ms = db.t('mascota').filter(function (m) { return m.estado === 'PUBLICADA' && db.sigue(m.id_mascota); }).map(db.vista);
    g.innerHTML = ms.map(C.mascota).join(''); msg.textContent = ms.length ? '' : 'Todavía no sigues a ninguna mascota. Pulsa el corazón en cualquier ficha para añadirla aquí.';
    g.addEventListener('change', function (ev) { var i = ev.target; if (!i.hasAttribute('data-follow')) return; db.setSigue(i.getAttribute('data-follow'), i.checked);
      if (!i.checked) { var a = i.closest('article'); a.parentNode.removeChild(a); if (!g.children.length) msg.textContent = 'Ya no sigues a ninguna mascota.'; } });
  });

  /* ══════════ Resumen (padrino.html) ══════════ */
  PawLink.register('resumen', function (root) {
    var u = db.usuarioActual(), aps = misApad(u), vig = aps.filter(function (a) { return a.estado === 'ACTIVO' || a.estado === 'SUSPENDIDO'; }), h = historial(u), año = db.meta.hoy.slice(0, 4);
    $(root, 'h1').textContent = 'Hola, ' + u.nombre;
    var dd = root.querySelectorAll('dl > .card > dd'), prox = proximaCuota(u);
    dd[0].textContent = vig.length; dd[1].textContent = db.eur(h.filter(function (x) { return x.p.estado === 'COMPLETADO' && x.fecha.slice(0, 4) === año; }).reduce(function (s, x) { return s + x.importe; }, 0)); dd[2].textContent = prox.length ? db.fecha(prox[0].c.fecha_cobro_esperada) : '—';
    var s1 = $(root, 'section[aria-labelledby=h-4]'), t1 = s1.querySelector('h2'); s1.innerHTML = ''; s1.appendChild(t1);
    s1.insertAdjacentHTML('beforeend', vig.length ? vig.map(function (a) { var m = db.byId('mascota', a.id_mascota), v = db.vista(m), pend = cuotasDe(a).filter(function (c) { return c.estado === 'PENDIENTE'; })[0];
      var info = a.estado === 'SUSPENDIDO' ? tag('danger', 'Suspendido por impago') + '<br><a href="mis-datos.html" class="c-primary fw-800 td-underline">Actualizar método de pago</a>' : a.modalidad === 'UNICO_30D' ? '<b>' + db.eur(a.importe_mensual) + '</b> pago único · 30 días<br>Hasta el ' + db.fecha(a.fecha_fin) : '<b>' + db.eur(a.importe_mensual) + '</b> al mes<br>Próximo cobro: ' + (pend ? db.fecha(pend.fecha_cobro_esperada) : '—');
      return '<div class="d-flex ai-center gap-14 p-14-0 bdt-1-solid-line fwrap-wrap"><a href="' + v.url + '" class="ph w-64 h-64 r-lg flex-none"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(m.nombre) + '"></a><div class="flex-1-1-170"><p class="m-0 fw-800">' + e(m.nombre) + '</p><p class="m-0 fs-14 c-muted">' + e(v.protectora.nombre) + (v.ciudad ? ', ' + e(v.ciudad) : '') + '</p></div><p class="m-0 flex-1-1-150 fs-14">' + info + '</p><a href="mis-pawfriends.html" class="fw-800 c-primary td-underline">Gestionar</a></div>'; }).join('') : '<p class="c-muted">Aún no tienes apadrinamientos activos.</p>');
    var s2 = $(root, 'section[aria-labelledby=h-5]'), t2 = s2.querySelector('h2'); s2.innerHTML = ''; s2.appendChild(t2);
    var nov = vig.map(function (a) { var m = db.byId('mascota', a.id_mascota); return { m: m, n: ultimaNovedad(m, u) }; }).filter(function (x) { return x.n; }).sort(function (a, b) { return a.n.fecha_publicacion < b.n.fecha_publicacion ? 1 : -1; }).slice(0, 3);
    s2.insertAdjacentHTML('beforeend', nov.length ? nov.map(function (x) { return '<div class="d-flex gap-16 mb-12"><figure class="ph w-96 h-96 r-md flex-none"><img class="pic" src="' + e(db.imagenPrincipal(x.m)) + '" alt="Foto de ' + e(x.m.nombre) + '"></figure><div><p class="m-0 fs-14 c-muted">' + db.fecha(x.n.fecha_publicacion) + ' · ' + e(x.m.nombre) + ' · ' + e(db.byId('protectora', x.m.id_protectora).nombre) + '</p><b>' + e(x.n.titulo) + '</b> · ' + e(x.n.contenido) + '<div class="mt-10"><a href="' + db.vista(x.m).url + '" class="fw-800 c-primary td-underline">Ver su ficha</a></div></div></div>'; }).join('') : '<p class="c-muted">Todavía no hay novedades.</p>');
    var s3 = $(root, 'section[aria-labelledby=h-6]'), links = s3.querySelector('.mt-16'), t3 = s3.querySelector('h2'); s3.innerHTML = ''; s3.appendChild(t3);
    s3.insertAdjacentHTML('beforeend', h.filter(function (x) { return x.p.estado === 'COMPLETADO'; }).slice(0, 4).map(function (x) { return '<div class="d-flex gap-14 fwrap-wrap jc-space-between p-12-0 bdt-1-solid-line"><span class="flex-0-0-100 c-muted">' + db.fecha(x.fecha) + '</span><span class="flex-1-1-200 fw-700">' + { mate: 'PawMate', care: 'PawCare', gift: 'PawGift' }[x.tipo] + ' · ' + e(x.m.nombre) + '</span><span class="fw-800">' + db.eur(x.importe) + '</span></div>'; }).join(''));
    s3.appendChild(links);
  });
})();
