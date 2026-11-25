/* PawLink · CONTROLADORES del área de protectora.
     protpanel   → views/protectora/panel.html            (estadísticas, mis mascotas, tratamientos)
     protgifts   → views/protectora/pawgifts-recibidos.html (regalos con sus 6 estados)
   La protectora activa es PawLink.db.protectoraActual() (demo: Huella Abierta). */
(function () {
  var db = PawLink.db, C = PawLink.cards, e = db.esc, tag = C.tag;
  function $(r, s) { return r.querySelector(s); }
  function misMascotas(p) { return db.where('mascota', { id_protectora: p.id_protectora }); }
  /* Estado de PUBLICACIÓN de la ficha (no mezclar con la situación de la mascota, RN-30) */
  var EST = { PUBLICADA: ['success', 'Publicada'], BORRADOR: ['secondary', 'Borrador'], PENDIENTE_REVISION: ['accent', 'En revisión'], PAUSADA: ['secondary', 'Pausada'], ADOPTADA: ['secondary', 'Adoptada'], NO_DISPONIBLE: ['danger', 'No disponible'] };
  var ESTTR = { BORRADOR: ['secondary', 'Borrador'], ACTIVO: ['success', 'Publicado'], FINANCIADO: ['success', 'Financiado'], EN_CURSO: ['accent', 'En curso'], COMPLETADO: ['success', 'Completado'], CANCELADO: ['secondary', 'Cancelado'] };
  function alias(u) { return u ? u.nombre + ' ' + (u.apellidos || '').charAt(0) + '.' : 'Usuario'; }

  PawLink.register('protpanel', function (root) {
    var p = db.protectoraActual(), ms = misMascotas(p), ids = ms.map(function (m) { return m.id_mascota; });
    $(root, 'h1').textContent = 'Hola, ' + p.nombre;
    var ap = db.t('apadrinamiento').filter(function (a) { return ids.indexOf(a.id_mascota) > -1 && a.estado === 'ACTIVO'; });
    var cuotasMes = db.t('cuota_apadrinamiento').filter(function (c) { var a = db.byId('apadrinamiento', c.id_apadrinamiento); return ids.indexOf(a.id_mascota) > -1; });
    var mes = db.meta.hoy.slice(0, 7), cobrado = cuotasMes.filter(function (c) { var pg = db.byId('pago', c.id_pago); return pg && pg.estado === 'COMPLETADO' && pg.fecha_creacion.slice(0, 7) === mes; }).reduce(function (s, c) { return s + c.importe_esperado; }, 0);
    var prox = cuotasMes.filter(function (c) { return c.estado === 'PENDIENTE'; }).reduce(function (s, c) { return s + c.importe_esperado; }, 0);
    var dd = root.querySelectorAll('dl > .card > dd'); dd[0].textContent = ms.length; dd[1].textContent = ap.length; dd[2].textContent = db.eur(cobrado); dd[3].textContent = db.eur(prox);
    /* Mis mascotas: la etiqueta es el estado de la ficha; la situación va aparte */
    var f = $(root, 'form[aria-labelledby=h-5]'), nota = f.querySelector('p.m-12-0-0'), h = f.querySelector('h2');
    f.innerHTML = ''; f.appendChild(h);
    ms.forEach(function (m) {
      var st = EST[m.estado], pm = db.pawmateVigente(m), u = pm && db.byId('usuario', pm.id_usuario);
      f.insertAdjacentHTML('beforeend', '<div class="d-flex ai-center gap-14 p-12-0 bdt-1-solid-line fwrap-wrap"><figure class="ph w-56 h-56 r-md flex-none"><img class="pic" src="' + e(db.imagenPrincipal(m)) + '" alt="Foto de ' + e(m.nombre) + '"></figure><div class="flex-1-1-160"><p class="m-0 fw-800">' + e(m.nombre) + '</p><p class="m-0 fs-14 c-muted">' + e(db.especieTxt(m)) + ' · ' + e(db.edadTxt(m)) + '</p></div><p class="m-0 flex-1-1-120 fs-14">' + (db.tratamientoAbierto(m) ? 'Necesita tratamiento' : '') + '</p><p class="m-0 flex-0-0-130 fs-14">PawMate: ' + (pm ? e(alias(u)) : '—') + '</p>' + tag(st[0], st[1]) + '<a href="nueva-mascota.html" class="fw-800 c-primary td-underline">Editar</a></div>');
    });
    f.appendChild(nota);
    /* Tratamientos */
    var s = $(root, 'section[aria-labelledby=h-6]'), head = s.firstElementChild, btn = s.lastElementChild; s.innerHTML = ''; s.appendChild(head);
    db.t('tratamiento').filter(function (t) { return ids.indexOf(t.id_mascota) > -1; }).forEach(function (t) {
      var m = db.byId('mascota', t.id_mascota), st = ESTTR[t.estado], rec = db.recaudado(t), pc = Math.min(100, Math.round(rec / t.importe_objetivo * 100));
      s.insertAdjacentHTML('beforeend', '<div class="p-12-0 bdt-1-solid-line"><div class="d-flex jc-space-between ai-center gap-12 fwrap-wrap fw-800"><span>' + e(m.nombre) + ' · ' + e(t.titulo) + '</span>' + tag(st[0], st[1]) + '</div>' + (t.estado === 'BORRADOR' ? '' : '<div class="d-flex jc-space-between gap-12 fwrap-wrap fs-14 m-6-0-0"><span>' + db.eur(rec) + ' de ' + db.eur(t.importe_objetivo) + '</span></div><div class="bar mt-8" role="progressbar" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pc + '%"></i></div>') + (t.estado === 'COMPLETADO' ? '<p class="m-6-0-0 fs-14">Falta la factura final. <a href="subir-factura.html" class="fw-800 c-primary td-underline">Subirla</a></p>' : '') + '</div>');
    });
    s.appendChild(btn);
  });

  PawLink.register('protgifts', function (root) {
    var p = db.protectoraActual(), ids = misMascotas(p).map(function (m) { return m.id_mascota; });
    var gs = db.t('regalo').filter(function (g) { return ids.indexOf(g.id_mascota) > -1; }).sort(function (a, b) { return a.fecha_creacion < b.fecha_creacion ? 1 : -1; });
    var PEN = ['PENDIENTE', 'PREPARANDO', 'ENVIADO', 'RECIBIDO_PROTECTORA'];
    var T = { PENDIENTE: ['accent', 'Pendiente de envío'], PREPARANDO: ['accent', 'Preparando'], ENVIADO: ['accent', 'En camino'], RECIBIDO_PROTECTORA: ['accent', 'Recibido · falta entregar'], ENTREGADO_MASCOTA: ['success', 'Entregado'], CANCELADO: ['secondary', 'Cancelado'] };
    var dd = root.querySelectorAll('dl > .card > dd'); dd[0].textContent = gs.filter(function (g) { return g.estado === 'RECIBIDO_PROTECTORA'; }).length; dd[1].textContent = gs.filter(function (g) { return g.estado === 'ENTREGADO_MASCOTA' && g.fecha_actualizacion.slice(0, 7) === db.meta.hoy.slice(0, 7); }).length;
    root.querySelectorAll('dt')[0].textContent = 'Por entregar a la mascota';
    var gf = $(root, '.gf'), lista = document.createElement('div'); lista.className = 'gf-list';
    var pg = $(gf, '.pg'); pg.parentNode.replaceChild(lista, pg);
    lista.innerHTML = gs.map(function (g) {
      var m = db.byId('mascota', g.id_mascota), pr = db.byId('catalogo_regalo', g.id_producto), t = T[g.estado], pen = PEN.indexOf(g.estado) > -1;
      return '<article class="card p-20 gf-row ' + (pen ? 'gf-pen' : 'gf-ent') + '" data-estado="' + g.estado + '"><div class="d-flex ai-center gap-14 fwrap-wrap"><figure class="ph w-56 h-56 r-md flex-none"><img class="pic" src="' + e(db.imagenPrincipal(m)) + '" alt="Foto de ' + e(m.nombre) + '"></figure><div class="flex-1-1-220"><p class="m-0 fw-800 fs-18">' + e(pr.nombre) + ' · ' + e(m.nombre) + '</p><p class="m-0 fs-14 c-muted">De ' + e(alias(db.byId('usuario', g.id_usuario))) + ' · ' + db.fecha(g.fecha_creacion) + ' · ' + db.eur(g.precio) + '</p></div>' + tag(t[0], t[1]) + '</div><div class="mt-14">' +
        (g.estado === 'RECIBIDO_PROTECTORA' ? '<label class="btn btn2 gf-up">Subir foto y marcar como entregado<input type="file" accept="image/*" class="sr"></label>' : g.estado === 'ENTREGADO_MASCOTA' ? '<p class="m-0 fs-14 c-muted">Entregado el ' + db.fecha(g.fecha_actualizacion) + ' · foto enviada al donante.</p>' : g.estado === 'CANCELADO' ? '<p class="m-0 fs-14 c-muted">Regalo cancelado.</p>' : '<p class="m-0 fs-14 c-muted">Aún no ha llegado a la protectora.</p>') + '</div></article>';
    }).join('');
  });
})();
