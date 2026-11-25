/* PawLink · CONTROLADOR de Protectoras: listado (views/public/protectoras.html) y ficha (views/public/ficha-protectora.html?id=…).
   Lee las tablas del mockdata a través de PawLink.db. Solo se muestran las protectoras VERIFICADAS.
   Filtros del listado: tipo (chips), «Cerca de mí» (ubicación de demostración: Valencia), ciudad (el chip «Ciudad» va rotando
   por las ciudades disponibles) y «Con tratamientos activos». La paginación (6 por página) la hace components/pager.js. */
(function () {
  var db = PawLink.db, C = PawLink.cards, e = db.esc;
  function verificadas() { return db.where('protectora', { estado_verificacion: 'VERIFICADA' }); }
  function mascotasDe(p, estado) { return db.where('mascota', function (m) { return m.id_protectora === p.id_protectora && (!estado || m.estado === estado); }); }
  function ciudad(p) { return p.ubicacion_publica === 'OCULTA' ? '' : p.municipio; }
  function conTratamiento(p) { return mascotasDe(p, 'PUBLICADA').some(function (m) { return !!db.tratamientoAbierto(m); }); }

  /* ───────── Listado ───────── */
  PawLink.register('protectoras', function (root) {
    var grid = root.querySelector('.g'), bar = root.querySelector('[role=group][aria-label=Filtros]'); if (!grid || !bar) return;
    var todas = verificadas().map(function (p) { return { p: p, n: mascotasDe(p, 'PUBLICADA').length, ciudad: ciudad(p) }; });
    var ciudades = Object.keys(todas.reduce(function (o, v) { if (v.ciudad) o[v.ciudad] = 1; return o; }, {})).sort();
    var est = { tipo: '', cerca: false, ciudad: '', trat: false };
    var TIPO = { 'Asociaciones': 'ASOCIACION', 'Fundaciones': 'FUNDACION', 'Refugios': 'REFUGIO' };
    function ok(v) {
      return (!est.tipo || v.p.tipo === est.tipo) && (!est.cerca || v.ciudad === 'Valencia') && (!est.ciudad || v.ciudad === est.ciudad) && (!est.trat || conTratamiento(v.p));
    }
    function render() {
      var r = todas.filter(ok);
      grid.innerHTML = r.map(C.protectora).join('');
      var vacio = root.querySelector('#mc-vacio');
      if (!vacio) { vacio = document.createElement('p'); vacio.id = 'mc-vacio'; vacio.className = 'm-0-0-20 c-muted'; vacio.setAttribute('role', 'status'); grid.parentNode.insertBefore(vacio, grid); }
      vacio.textContent = r.length ? '' : 'No hay ninguna protectora con estos filtros.';
      Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (c) {
        var t = c.getAttribute('data-t'), on;
        if (t === 'todas') on = !est.tipo && !est.cerca && !est.ciudad && !est.trat; else if (t === 'tipo') on = est.tipo === c.getAttribute('data-v');
        else if (t === 'cerca') on = est.cerca; else if (t === 'ciudad') on = !!est.ciudad; else on = est.trat;
        c.classList.toggle('on', !!on);
        if (t === 'ciudad') { var tx = c.firstChild; if (tx && tx.nodeType === 3) tx.nodeValue = est.ciudad ? 'Ciudad: ' + est.ciudad : 'Ciudad'; }
      });
    }
    Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (c) {
      var tx = (c.firstChild && c.firstChild.nodeType === 3 ? c.firstChild.nodeValue : c.textContent).trim();
      if (tx === 'Todas') c.setAttribute('data-t', 'todas');
      else if (TIPO[tx]) { c.setAttribute('data-t', 'tipo'); c.setAttribute('data-v', TIPO[tx]); }
      else if (tx === 'Cerca de mí') c.setAttribute('data-t', 'cerca');
      else if (tx.indexOf('Ciudad') === 0) c.setAttribute('data-t', 'ciudad');
      else c.setAttribute('data-t', 'trat');
    });
    if (PawLink.FILTROS_ACTIVOS) bar.addEventListener('click', function (ev) {
      var c = ev.target.closest ? ev.target.closest('.chip') : null; if (!c) return;
      var t = c.getAttribute('data-t');
      if (t === 'todas') est = { tipo: '', cerca: false, ciudad: '', trat: false };
      else if (t === 'tipo') est.tipo = est.tipo === c.getAttribute('data-v') ? '' : c.getAttribute('data-v');
      else if (t === 'cerca') est.cerca = !est.cerca;
      else if (t === 'ciudad') { var i = ciudades.indexOf(est.ciudad); est.ciudad = i + 1 < ciudades.length ? ciudades[i + 1] : ''; }   // rota por las ciudades; la última vuelve a «todas»
      else est.trat = !est.trat;
      render();
    });
    render();
    if (PawLink.pager) PawLink.pager.attach({ grid: grid, nav: root.querySelector('.pgn'), per: 6, nombre: 'protectoras' });
  });

  /* ───────── Ficha de protectora ───────── */
  PawLink.register('ficha-protectora', function (root) {
    var id = db.param('id'), p = (id && db.byId('protectora', id)) || verificadas()[0]; if (!p) return;
    var ms = mascotasDe(p, 'PUBLICADA'), todasM = mascotasDe(p), idsM = todasM.map(function (m) { return m.id_mascota; });
    function $(sel) { return root.querySelector(sel); }
    $('h1').textContent = p.nombre;
    var logo = $('figure.w-112 img'); if (logo) { logo.src = db.img(p.logo_url); logo.alt = 'Logo de ' + p.nombre; }
    var linea = $('h1').parentNode.querySelector('.c-muted'); if (linea) linea.textContent = (ciudad(p) ? ciudad(p) + (p.provincia ? ', ' + p.provincia : '') : (C.TIPOTXT[p.tipo] || '')) + (p.anio_fundacion ? ' · Desde ' + p.anio_fundacion : '');
    document.title = 'PawLink – ' + p.nombre;
    /* Cifras */
    var pawmates = db.t('apadrinamiento').filter(function (a) { return a.estado === 'ACTIVO' && idsM.indexOf(a.id_mascota) > -1; }).length;
    var trats = db.t('tratamiento').filter(function (t) { return idsM.indexOf(t.id_mascota) > -1 && (t.estado === 'ACTIVO' || t.estado === 'EN_CURSO') && db.recaudado(t) < t.importe_objetivo; });
    var adop = todasM.filter(function (m) { return m.estado === 'ADOPTADA'; }).length;
    var dd = root.querySelectorAll('dl.mb-36 dd'); [ms.length, pawmates, trats.length, adop].forEach(function (n, i) { if (dd[i]) dd[i].textContent = n; });
    /* Sobre nosotros */
    var sobre = root.querySelector('p.maxw-680'); if (sobre) sobre.textContent = p.descripcion;
    /* Sus mascotas */
    var rowM = root.querySelector('.d-flex.gap-20.fwrap-wrap.mb-36');
    if (rowM) rowM.innerHTML = ms.slice(0, 4).map(function (m) { var v = db.vista(m);
      return '<article class="card hov pos-relative flex-1-1-200"><a href="' + v.url + '" class="cl" aria-label="Ver la ficha de ' + e(m.nombre) + '"></a><label class="hrt" title="Seguir a ' + e(m.nombre) + '"><input type="checkbox" class="sr" aria-label="Seguir a ' + e(m.nombre) + '" data-follow="' + e(m.id_mascota) + '"' + (db.sigue(m.id_mascota) ? ' checked' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></label>' +
        '<figure class="ph h-150"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(m.nombre) + '"></figure><div class="p-14"><h3 class="m-0 ff-display fw-800 fs-20">' + e(m.nombre) + '</h3><p class="m-0 fs-14 c-muted mb-10">' + e(v.especieTxt) + (v.edad ? ' · ' + e(v.edad) : '') + '</p><span class="btn">' + (v.pawmate ? 'Ya tiene PawMate' : 'Hazte PawMate') + '</span></div></article>'; }).join('') || '<p class="c-muted">Esta protectora no tiene mascotas publicadas ahora mismo.</p>';
    /* Tratamientos activos */
    var colT = root.querySelector('.d-flex.fd-column.gap-20');
    if (colT) colT.innerHTML = trats.map(function (t) { var m = db.byId('mascota', t.id_mascota), v = db.vista(m), rec = db.recaudado(t), pct = Math.min(100, Math.round(rec / t.importe_objetivo * 100));
      return '<article class="card hov pos-relative d-flex fd-row fwrap-wrap"><a href="' + v.url + '" class="cl" aria-label="Ver la ficha de ' + e(m.nombre) + '"></a><figure class="ph flex-1-1-150 minh-150"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(m.nombre) + '"></figure><div class="flex-2-1-240 p-18">' +
        (t.urgente ? '<span class="tag tag--danger"><span class="tag__dot"></span>Urgente</span>' : '<span class="tag tag--accent"><span class="tag__dot"></span>Pendiente</span>') +
        '<h3 class="ff-display fw-800 fs-20 m-8-0-10">' + e(m.nombre) + ' · ' + e(t.titulo) + '</h3><div class="bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div><p class="fs-14 m-6-0-12">' + db.eur(rec) + ' de ' + db.eur(t.importe_objetivo) + '</p><a href="' + db.root + 'views/usuario/aportar-tratamiento.html" class="btn pos-relative z-2">Ser PawCare</a></div></article>'; }).join('') || '<p class="c-muted">No hay tratamientos activos.</p>';
    /* Contacto público */
    var cd = root.querySelectorAll('section[aria-labelledby=h-5] dd');
    var pub = { 0: p.web, 1: p.email, 2: p.telefono, 3: ciudad(p) ? ciudad(p) + (p.provincia ? ', ' + p.provincia : '') : 'No visible' };
    Array.prototype.forEach.call(cd, function (x, i) { if (pub[i] != null) x.textContent = pub[i] || '—'; });
    /* Cuentas claras: aportaciones del año (cuotas cobradas + aportaciones a tratamientos + regalos con pago completado) y reparto según la barra */
    function pagoOk(id, anio) { var pg = db.byId('pago', id); return pg && pg.estado === 'COMPLETADO' && String(pg.fecha_creacion).slice(0, 4) === anio ? pg.importe : 0; }
    function aportado(anio) {
      var s = 0;
      db.t('cuota_apadrinamiento').forEach(function (q) { var a = db.byId('apadrinamiento', q.id_apadrinamiento); if (a && idsM.indexOf(a.id_mascota) > -1 && q.estado === 'COBRADA') s += pagoOk(q.id_pago, anio); });
      db.t('aportacion_tratamiento').forEach(function (a) { var t = db.byId('tratamiento', a.id_tratamiento); if (t && idsM.indexOf(t.id_mascota) > -1) s += pagoOk(a.id_pago, anio); });
      db.t('regalo').forEach(function (g) { if (idsM.indexOf(g.id_mascota) > -1) s += pagoOk(g.id_pago, anio); });
      return s;
    }
    Array.prototype.forEach.call(root.querySelectorAll('.cc-y'), function (blk) {
      var anio = (blk.className.match(/cc-y(\d{4})/) || [])[1]; if (!anio) return;
      var tot = aportado(anio), big = blk.querySelector('dd'), dt = blk.querySelector('dt');
      if (dt) dt.textContent = 'Aportaciones recibidas en ' + anio;
      if (big) big.textContent = db.eur(tot);
      var barras = blk.querySelectorAll('.cc-bar i'), lis = blk.querySelectorAll('.cc-leg li');
      Array.prototype.forEach.call(lis, function (li, i) { var pc = barras[i] ? parseFloat(barras[i].style.width) : 0, b = li.querySelector('b'), m = li.querySelector('.c-muted');
        if (b) b.textContent = db.eur(Math.round(tot * pc / 100)); if (m) m.textContent = pc + ' %'; });
    });
  });
})();
