/* PawLink · VISTAS (capa V del MVC): funciones que devuelven el HTML de cada tarjeta o fila.
   Reutilizan las mismas clases CSS que el maquetado estático, de modo que el aspecto no cambia.
   Todas reciben objetos ya preparados por PawLink.db (modelo) y escapan el texto con PawLink.db.esc. */
(function (w) {
  var PL = w.PawLink = w.PawLink || {}, db = PL.db, e = db.esc;
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
  function tag(cls, txt) { return '<span class="tag tag--' + cls + '"><span class="tag__dot"></span>' + e(txt) + '</span>'; }
  function heart(v) {
    return '<label class="hrt" title="Seguir a ' + e(v.nombre) + '"><input type="checkbox" class="sr" aria-label="Seguir a ' + e(v.nombre) + '" data-follow="' + e(v.id) + '"' + (db.sigue(v.id) ? ' checked' : '') + '>' + HEART + '</label>';
  }
  function sub(v) { return e(v.especieTxt) + (v.edad ? ' · ' + e(v.edad) : '') + ' · ' + e(v.protectora ? v.protectora.nombre : '') + (v.ciudad ? ', ' + e(v.ciudad) : ''); }

  /* Tarjeta de mascota (listado PawMate, Mis Preferidos) */
  function mascota(v) {
    var oc = v.pawmate, tags = '';
    if (v.urgente) tags += '<span class="tag tag--danger pos-absolute top-12 left-12 sh-tag"><span class="tag__dot"></span>Urgente</span>';
    else if (v.muchoTiempo) tags += '<span class="tag tag--secondary pos-absolute top-12 left-12 sh-tag"><span class="tag__dot"></span>Mucho tiempo en protectora</span>';
    return '<article class="card hov hov--static pos-relative" data-id="' + e(v.id) + '" data-n="' + e(v.nombre) + '">' + heart(v) +
      '<figure class="ph h-210 pos-relative"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(v.nombre) + '">' + tags + '</figure>' +
      '<div class="p-18"><h2 class="m-0 ff-display fw-800 fs-22">' + e(v.nombre) + '</h2><p class="m-0 fs-14 c-muted mb-12">' + sub(v) + '</p>' +
      '<p class="m-0-0-14 fs-14 c-muted">' + e(v.m.descripcion) + '</p>' +
      (oc ? '<span class="tag tag--secondary"><span class="tag__dot"></span>Ya tiene PawMate</span> <a href="' + v.url + '" class="fw-800 c-primary td-underline">Ver ficha</a>'
          : '<a href="' + v.url + '" class="btn">Hazte PawMate</a>') + '</div></article>';
  }
  /* Tarjeta de tratamiento (listado PawCare) */
  function tratamiento(v) {
    var t = v.tratamiento, lbl = t.urgente ? ['danger', 'Urgente'] : (v.pct >= 80 ? ['success', 'Casi listo'] : ['accent', 'Pendiente']);
    return '<article class="card hov hov--static pos-relative d-flex fd-row fwrap-wrap" data-id="' + e(v.id) + '" data-n="' + e(v.nombre) + '">' + heart(v) +
      '<figure class="ph flex-1-1-200 minh-200"><img class="pic" src="' + e(v.foto) + '" alt="Foto de ' + e(v.nombre) + '"></figure>' +
      '<div class="flex-1-1-260 p-22">' + tag(lbl[0], lbl[1]) + (t.estado === 'EN_CURSO' ? ' ' + tag('secondary', 'Tratamiento en curso') : '') +
      '<h2 class="ff-display fw-800 fs-22 m-8-0-2">' + e(v.nombre) + ' · ' + e(t.titulo) + '</h2><p class="m-0 fs-14 c-muted mb-14">' + e(v.protectora ? v.protectora.nombre : '') + (v.ciudad ? ', ' + e(v.ciudad) : '') + '</p>' +
      '<div class="bar" role="progressbar" aria-valuenow="' + v.pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + v.pct + '%"></i></div>' +
      '<p class="fs-14 m-6-0-14">' + db.eur(v.recaudado) + ' de ' + db.eur(v.objetivo) + ' · faltan ' + db.eur(v.objetivo - v.recaudado) + '</p>' +
      '<div class="d-flex gap-16 ai-center fwrap-wrap"><a href="' + v.url + '" class="btn pos-relative z-2">Ser PawCare</a><a href="' + db.root + 'views/dialogs/ver-presupuesto.html" class="c-primary fw-800 td-underline pos-relative z-2">Ver presupuesto</a></div></div></article>';
  }
  var CATTXT = { ALIMENTACION: 'Alimentación', JUGUETES: 'Juguetes', DESCANSO: 'Descanso', CUIDADOS: 'Cuidados', OTROS: 'Otros' };
  function regalo(p) {
    var ag = !(p.stock == null || p.stock > 0);
    return '<div class="card hov hov--static" data-cat="' + e(p.categoria) + '" data-n="' + e(p.nombre) + '"><figure class="ph h-150"><img class="ill" src="' + e(db.img(p.imagen_url)) + '" alt="' + e(p.nombre) + '"></figure>' +
      '<div class="p-16"><h2 class="m-0 fw-800 card-title">' + e(p.nombre) + '</h2><p class="m-0 fs-14 c-muted mb-6">' + e(CATTXT[p.categoria]) + ' · ' + db.eur(p.precio) + '</p><p class="m-0-0-12 fs-14 c-muted">' + e(p.descripcion) + '</p>' +
      (ag ? '<span class="tag tag--secondary"><span class="tag__dot"></span>Agotado</span>' : '<a href="' + db.root + 'views/dialogs/regalo.html" class="btn w-100p bx-border-box">Regalar</a>') + '</div></div>';
  }
  /* Notificación (Mis Notificaciones) */
  var GRUPO = { CUOTA_COBRADA: 'mate', CUOTA_FALLIDA: 'mate', CUOTA_POR_COBRAR: 'mate', PAWMATE_FINALIZADO: 'mate', MASCOTA_ADOPTADA: 'mate', RECOMENDACION_MASCOTA: 'mate',
    TRATAMIENTO_COMPLETADO: 'care', PAGO_CONFIRMADO: 'care', PAWGIFT_CONFIRMADO: 'gift', PAWGIFT_ENVIADO: 'gift', PAWGIFT_RECIBIDO: 'gift' };
  function grupoNotif(n) {
    if (GRUPO[n.tipo]) return GRUPO[n.tipo];
    var s = (n.mensaje + ' ' + n.titulo).toLowerCase();
    if (n.tipo === 'NUEVA_ACTUALIZACION') return 'novedad';
    return /regalo/.test(s) ? 'gift' : /cuota|apadrin/.test(s) ? 'mate' : 'care';
  }
  function mascotaDe(n) {
    if (n.id_actualizacion) { var u = db.byId('actualizacion', n.id_actualizacion); return u && db.byId('mascota', u.id_mascota); }
    var txt = n.mensaje + ' ' + n.titulo, ms = db.t('mascota'), i;
    for (i = 0; i < ms.length; i++) if (new RegExp('\\b' + ms[i].nombre + '\\b').test(txt)) return ms[i];
    return null;
  }
  function notif(n, first) {
    var g = grupoNotif(n), m = mascotaDe(n), cls = { mate: 'success', care: 'accent', gift: 'violet', novedad: 'violet' }[g], lbl = { mate: 'PawMate', care: 'PawCare', gift: 'PawGift', novedad: 'Novedad' }[g];
    var foto = m ? db.imagenPrincipal(m) : db.img(null);
    return '<div class="d-flex gap-16 ai-center fwrap-wrap p-14-0' + (first ? '' : ' bdt-1-solid-line') + '" data-g="' + g + '" data-unread="' + (n.leida ? 0 : 1) + '"><figure class="ph w-56 h-56 r-md flex-none"><img class="pic" src="' + e(foto) + '" alt="' + (m ? 'Foto de ' + e(m.nombre) : '') + '"></figure>' +
      '<div class="flex-1-1-260"><div class="d-flex gap-10 ai-center fwrap-wrap mb-4">' + tag(cls, lbl) + '<span class="fs-14 c-muted">' + db.fecha(n.fecha_creacion) + (m ? ' · ' + e(m.nombre) : '') + '</span></div>' +
      '<p class="m-0 fw-800">' + e(n.titulo) + '</p><p class="m-4-0-0 fs-14">' + e(n.mensaje) + (m ? ' <a href="' + db.root + 'views/public/mascota.html?id=' + e(m.id_mascota) + '" class="c-primary fw-800 td-underline">Ver su ficha</a>' : '') + '</p></div>' +
      (n.leida ? '' : '<span role="img" aria-label="Sin leer" class="w-12 h-12 r-round bg-secondary flex-none"></span>') + '</div>';
  }
  /* Tipo de protectora en texto */
  var TIPOTXT = { ASOCIACION: 'Asociación', FUNDACION: 'Fundación', REFUGIO: 'Refugio', PROTECTORA: 'Protectora', OTRO: 'Otro' };
  /* Tarjeta de protectora (listado Protectoras). `v` = { p: fila de la tabla protectora, n: nº de mascotas publicadas, ciudad: texto o '' } */
  function protectora(v) {
    var p = v.p;
    return '<article class="card hov hov--static" data-id="' + e(p.id_protectora) + '" data-n="' + e(p.nombre) + '">' +
      '<figure class="ph h-190 pos-relative"><img class="ill" src="' + e(db.img(p.logo_url)) + '" alt="Logo de ' + e(p.nombre) + '"><span class="pos-absolute top-12 left-12"><span class="tag tag--success"><span class="tag__dot"></span>✔ Verificada</span></span></figure>' +
      '<div class="p-18"><h2 class="m-0 ff-display fw-800 fs-22">' + e(p.nombre) + '</h2><p class="m-0 fs-14 c-muted mb-12">' + (v.ciudad ? e(v.ciudad) + ' · ' : '') + e(TIPOTXT[p.tipo] || 'Protectora') + '</p>' +
      '<p class="m-0-0-14 fs-14 c-muted">' + e(p.descripcion) + '</p>' +
      '<div class="d-flex jc-space-between ai-center gap-8 fwrap-wrap"><span class="fs-14 fw-800">' + v.n + (v.n === 1 ? ' mascota' : ' mascotas') + '</span><a href="' + db.root + 'views/public/ficha-protectora.html?id=' + e(p.id_protectora) + '" class="btn">Ver ficha</a></div></div></article>';
  }
  PL.cards = { protectora: protectora, TIPOTXT: TIPOTXT, tag: tag, heart: heart, mascota: mascota, tratamiento: tratamiento, regalo: regalo, notif: notif, grupoNotif: grupoNotif, mascotaDe: mascotaDe, CATTXT: CATTXT };
})(window);
