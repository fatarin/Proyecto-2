/* PawLink · CONTROLADOR de la ficha de mascota (views/public/mascota.html?id=…).  data-module="ficha" en <main>.
   Rellena la ficha con los datos de la tabla `mascota` (y sus tablas relacionadas) de la mascota indicada en la URL.
   Sin ?id= muestra la primera mascota publicada.
   Reglas de la memoria que respeta:
     · RN-30  el «Estado» es el de publicación; «necesita tratamiento» y «tiene PawMate» son etiquetas aparte.
     · RN-111/112  las actualizaciones PRIVADAS no se ven; las de COLABORADORES solo las ve quien ha hecho un regalo
       o una aportación a un tratamiento de esta mascota (aunque sea parcial). */
PawLink.register('ficha', function (root) {
  var db = PawLink.db, C = PawLink.cards, e = db.esc, tag = C.tag;
  var id = db.param('id'), m = (id && db.byId('mascota', id)) || db.where('mascota', { estado: 'PUBLICADA' })[0];
  if (!m) return;
  var v = db.vista(m), pr = v.protectora, tr = db.tratamientoAbierto(m);
  var ESTADO = { BORRADOR: ['secondary', 'Borrador'], PENDIENTE_REVISION: ['accent', 'En revisión'], PUBLICADA: ['success', 'Publicada'], PAUSADA: ['secondary', 'Pausada'], ADOPTADA: ['violet', 'Adoptada'], NO_DISPONIBLE: ['secondary', 'No disponible'] };
  var SEXO = { HEMBRA: 'Hembra', MACHO: 'Macho' }, ESPECIE = { PERRO: 'Perro', GATO: 'Gato', CONEJO: 'Conejo', OTRO: 'Otro' };
  document.title = 'PawLink – ' + m.nombre;

  /* ¿Quién mira? Solo un usuario con sesión puede ser colaborador */
  var logueado = document.documentElement.getAttribute('data-sess') === 'usuario';   // la sesión de prueba solo guarda el rol (core/boot.js)
  var yo = logueado ? db.usuarioActual() : null;
  var esColab = !!yo && db.colaboradores(m.id_mascota).indexOf(yo.id_usuario) > -1;

  /* ── Columna izquierda ── */
  var imgs = db.where('mascota_imagen', { id_mascota: m.id_mascota }).sort(function (a, b) { return a.orden - b.orden; });
  var thumbs = imgs.slice(1).map(function (i) { return '<div class="ph flex-1 h-90 r-lg"><img class="pic" src="' + e(db.img(i.url)) + '" alt="Foto de ' + e(m.nombre) + '"></div>'; }).join('');
  function fila(k, val, full) { return '<div' + (full ? ' class="gridcolumn-1-1"' : '') + '><dt class="m-0 fs-13 fw-800 c-muted mb-2">' + k + '</dt><dd class="m-0">' + val + '</dd></div>'; }
  var est = ESTADO[m.estado];
  var situacion = (tr ? ' ' + tag('danger', 'Necesita tratamiento') : '') + (v.pawmate ? ' ' + tag('secondary', 'Tiene PawMate') : (m.estado === 'PUBLICADA' ? ' ' + tag('success', 'Disponible para apadrinar') : ''));
  var ficha = '<section class="card p-24 mb-36" aria-labelledby="h-1"><h2 id="h-1">Datos de la ficha</h2><dl class="d-grid cols-repeat-auto-fi0a3fd gap-18-28">' +
    fila('Nombre', e(m.nombre)) + fila('Especie', ESPECIE[m.especie]) + fila('Raza', e(m.raza || '—')) + fila('Sexo', SEXO[m.sexo]) +
    fila('Fecha de nacimiento', db.fecha(m.fecha_nacimiento)) + fila('Edad aproximada', m.edad_aproximada != null ? db.edadTxt(m) : '—') +
    fila('Descripción', e(m.descripcion), 1) + fila('Historia', e(m.historia), 1) + fila('Motivo', e(m.motivo_necesidad), 1) +
    fila('Estado', tag(est[0], est[1]) + situacion) + fila('Entrada en la protectora', db.fecha(m.fecha_entrada)) +
    fila('Publicación', db.fecha(m.fecha_publicacion)) + fila('Creación', db.fecha(m.fecha_creacion)) + fila('Actualización', db.fecha(m.fecha_actualizacion)) + '</dl></section>';
  var necesita = '';
  if (tr) {
    var rec = db.recaudado(tr), pct = Math.min(100, Math.round(rec / tr.importe_objetivo * 100));
    necesita = '<h2>Necesita ahora</h2><div class="card p-22 mb-36"><div class="d-flex jc-space-between gap-12 fwrap-wrap fw-800"><span>' + e(tr.titulo) + (tr.urgente ? ' ' + tag('danger', 'Urgente') : '') + '</span><span>' + db.eur(rec) + ' de ' + db.eur(tr.importe_objetivo) + '</span></div>' +
      '<div class="bar m-12-0" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
      (tr.estado === 'EN_CURSO' ? '<p class="m-0-0-12 fs-14 c-muted">El tratamiento ya ha empezado; faltan ' + db.eur(tr.importe_objetivo - rec) + ' por cubrir.</p>' : '') +
      '<div class="d-flex jc-space-between gap-12 fwrap-wrap ai-center"><span class="d-flex gap-16 ai-center fwrap-wrap"><a href="../dialogs/ver-presupuesto.html" class="c-primary fw-800 td-underline">Ver presupuesto del veterinario</a><span class="fs-14 c-muted">✔ Revisado por PawLink</span></span><a href="../usuario/aportar-tratamiento.html" class="btn">Ser PawCare</a></div></div>';
  }
  var prods = db.where('producto_mascota', { id_mascota: m.id_mascota }).sort(function (a, b) { return (b.recomendado - a.recomendado); })
    .map(function (x) { return db.byId('catalogo_regalo', x.id_producto); }).filter(function (p) { return p && p.activo; }).slice(0, 4);
  var regalos = prods.length ? '<h2>Regálale algo · PawGift</h2><div class="d-flex gap-16 fwrap-wrap mb-36">' + prods.map(function (p) {
    return '<div class="card flex-1-1-150 p-14"><figure class="ph h-90 r-md mb-10"><img class="ill" src="' + e(db.img(p.imagen_url)) + '" alt="' + e(p.nombre) + '"></figure><h3 class="m-0 fw-800 card-title">' + e(p.nombre) + '</h3><p class="m-0 fs-14">' + db.eur(p.precio) + '</p></div>'; }).join('') + '</div>' : '';
  /* Actualizaciones visibles para quien mira (RN-111/112) */
  var ups = db.where('actualizacion', function (u) {
    return u.id_mascota === m.id_mascota && u.estado === 'PUBLICADA' && (u.visibilidad === 'PUBLICA' || (u.visibilidad === 'COLABORADORES' && esColab));
  }).sort(function (a, b) { return a.fecha_publicacion < b.fecha_publicacion ? 1 : -1; });
  var novedades = '<h2>Novedades de ' + e(m.nombre) + '</h2>' + (ups.length ? ups.slice(0, 2).map(function (u) {
    return '<div class="card p-20 d-flex gap-16 mb-12"><figure class="ph w-96 h-96 r-md flex-none"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(m.nombre) + '"></figure><div><p class="m-0 fs-14 c-muted">' + db.fecha(u.fecha_publicacion) + ' · ' + e(pr.nombre) + (u.visibilidad === 'COLABORADORES' ? ' · solo colaboradores' : '') + '</p><p class="m-0 fw-800">' + e(u.titulo) + '</p>' + e(u.contenido) + '</div></div>'; }).join('') : '<p class="c-muted">Aún no hay novedades publicadas.</p>');

  var izq = root.querySelector('.flex-1-1-600');
  izq.innerHTML = '<figure class="ph h-440 r-28"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(m.nombre) + '"></figure>' +
    (thumbs ? '<div class="d-flex gap-12 m-12-0-32">' + thumbs + '</div>' : '<div class="m-12-0-32"></div>') +
    '<div class="d-flex ai-center jc-space-between gap-16 fwrap-wrap"><h1 class="m-0 ff-display fw-800 fs-48">' + e(m.nombre) + '</h1>' +
    '<label class="fw"><input type="checkbox" class="sr" aria-label="Seguir a ' + e(m.nombre) + '" data-follow="' + e(m.id_mascota) + '"' + (db.sigue(m.id_mascota) ? ' checked' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span class="t1">Seguir</span><span class="t2">Siguiendo</span></label></div>' +
    '<p class="m-4-0-20 c-muted">' + e(v.especieTxt) + (v.edad ? ' · ' + e(v.edad) : '') + (v.ciudad ? ' · ' + e(v.ciudad) : '') + ' · <a href="ficha-protectora.html?id=' + e(pr.id_protectora) + '" class="c-primary fw-800 td-underline">' + e(pr.nombre) + (pr.estado_verificacion === 'VERIFICADA' ? ' ✔ Verificada' : '') + '</a></p>' +
    ficha + necesita + regalos + novedades;
  izq.addEventListener('change', function (ev) { var i = ev.target; if (i && i.hasAttribute && i.hasAttribute('data-follow')) db.setSigue(i.getAttribute('data-follow'), i.checked); });

  /* ── Columna derecha: panel PawMate ── */
  var panel = root.querySelector('section[aria-labelledby=h-2]');
  if (panel) {
    panel.querySelector('h2').textContent = 'Sé PawMate de ' + m.nombre;
    var btn = panel.querySelector('a.btn'), nota = panel.querySelector('p.ta-center');
    var libre = m.estado === 'PUBLICADA' && !v.pawmate;
    if (libre) { nota.textContent = '✔ ' + m.nombre + ' está disponible: solo puede tener un PawMate a la vez.'; btn.href = btn.getAttribute('href').split('?')[0] + '?id=' + m.id_mascota; }
    else {
      var porque = v.pawmate ? m.nombre + ' ya tiene PawMate. Puedes seguirla y ayudarla con un tratamiento o un regalo.' : m.nombre + ' no está disponible para apadrinar ahora mismo (' + est[1].toLowerCase() + ').';
      nota.textContent = porque; btn.removeAttribute('href'); btn.setAttribute('aria-disabled', 'true'); btn.classList.add('btn--off'); btn.textContent = 'No disponible para PawMate';
      Array.prototype.forEach.call(panel.querySelectorAll('.opt'), function (b) { b.disabled = true; });
    }
  }

  /* ── Mi Historia: novedades visibles + notificaciones propias sobre esta mascota ── */
  var hist = root.querySelector('.mt-56'); if (!hist) return;
  var items = ups.map(function (u) { return { k: 'novedad', f: u.fecha_publicacion, tag: tag('violet', 'Novedad'), txt: '<b>' + e(u.titulo) + '</b> · ' + e(u.contenido) }; });
  if (yo) db.where('notificacion', function (n) { return n.id_usuario === yo.id_usuario && !n.id_actualizacion; }).forEach(function (n) {
    var mm = C.mascotaDe(n); if (!mm || mm.id_mascota !== m.id_mascota) return;
    var g = C.grupoNotif(n); items.push({ k: { mate: 'notif', care: 'trat', gift: 'regalo' }[g] || 'notif', f: n.fecha_creacion, tag: tag({ mate: 'success', care: 'accent', gift: 'secondary' }[g] || 'secondary', { mate: 'PawMate', care: 'PawCare', gift: 'PawGift' }[g] || 'Notificación'), txt: e(n.mensaje) });
  });
  items.sort(function (a, b) { return a.f < b.f ? 1 : -1; });
  hist.querySelector('.m-0-0-20').textContent = 'Todas las novedades' + (yo ? ' y notificaciones' : '') + ' relacionadas con ' + m.nombre + '.';
  var tl = hist.querySelector('ul.tl');
  tl.innerHTML = items.length ? items.map(function (i) { return '<li data-k="' + i.k + '"><div class="card p-16-20"><div class="d-flex gap-12 ai-center fwrap-wrap mb-6">' + i.tag + '<span class="fs-14 c-muted">' + db.fecha(i.f) + '</span></div>' + i.txt + '</div></li>'; }).join('')
    : '<li><div class="card p-16-20 c-muted">Todavía no hay movimientos que mostrar.' + (logueado ? '' : ' Inicia sesión para ver tu historia con ' + e(m.nombre) + '.') + '</div></li>';
  var chips = hist.querySelectorAll('.chip'), MAPA = { 'Todo': '', 'Novedades': 'novedad', 'Notificaciones': 'notif', 'Tratamientos': 'trat', 'Regalos': 'regalo' };
  if (PawLink.FILTROS_ACTIVOS) hist.querySelector('[role=group]').addEventListener('click', function (ev) {
    var c = ev.target.closest ? ev.target.closest('.chip') : null; if (!c) return; var k = MAPA[c.textContent.trim()];
    Array.prototype.forEach.call(chips, function (x) { x.classList.toggle('on', x === c); });
    Array.prototype.forEach.call(tl.children, function (li) { li.hidden = !!k && li.getAttribute('data-k') !== k; });
  });
});
