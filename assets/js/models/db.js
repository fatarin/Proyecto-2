/* PawLink · MODELO de datos (capa M del MVC).
   Lee `PawLink.mockdata` (generado en assets/js/data/mockdata.js a partir de assets/data/mockdata.json) y ofrece
   consultas sencillas: recorrer una tabla, filtrar, buscar por id y calcular los valores derivados.

   Cada tabla es un array de objetos con los nombres de columna de la memoria v1.2:
     PawLink.db.t('mascota')                       → array con todas las mascotas
     PawLink.db.where('mascota', {estado:'PUBLICADA'})   → filtra por igualdad
     PawLink.db.where('mascota', function (m) { return m.especie === 'GATO'; })  → filtra con una función
     PawLink.db.byId('protectora', id)             → un registro por su clave primaria
   Los valores calculados (3FN) NO se guardan: se calculan aquí (recaudado de un tratamiento, edad, «mucho tiempo»…).
   Sustituir este fichero por llamadas a la API (Node/Express) es el paso al backend: los controladores no cambian. */
(function (w, d) {
  var PL = w.PawLink = w.PawLink || {};
  var DB = PL.mockdata || {};
  var META = DB._meta || {};
  var HOY = new Date((META.hoy || '2026-11-13') + 'T12:00:00');
  var PK = { usuario: 'id_usuario', protectora: 'id_protectora', cuenta_bancaria_protectora: 'id_cuenta', verificacion_protectora: 'id_verificacion',
    mascota: 'id_mascota', mascota_imagen: 'id_imagen', apadrinamiento: 'id_apadrinamiento', cuota_apadrinamiento: 'id_cuota', tratamiento: 'id_tratamiento',
    aportacion_tratamiento: 'id_aportacion', catalogo_regalo: 'id_producto', regalo: 'id_regalo', pago: 'id_pago', actualizacion: 'id_actualizacion', notificacion: 'id_notificacion' };
  var IDX = {};

  /* Ruta relativa a la raíz del sitio (index.html = '', views/x/y.html = '../../') */
  var ROOT = (function () {
    var s = d.querySelectorAll('script[src*="assets/js/"]'), i, m;
    for (i = 0; i < s.length; i++) { m = (s[i].getAttribute('src') || '').match(/^(.*?)assets\/js\//); if (m) return m[1]; }
    return '';
  })();

  function t(name) { return DB[name] || []; }
  function byId(name, id) {
    if (!IDX[name]) { IDX[name] = {}; t(name).forEach(function (r) { IDX[name][r[PK[name]]] = r; }); }
    return IDX[name][id] || null;
  }
  function where(name, cond) {
    var f = typeof cond === 'function' ? cond : function (r) { for (var k in cond) if (r[k] !== cond[k]) return false; return true; };
    return t(name).filter(f);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function param(k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(w.location.search); return m ? decodeURIComponent(m[1]) : null; }
  function store(k, v) { try { if (v === undefined) return w.localStorage.getItem(k); if (v === null) w.localStorage.removeItem(k); else w.localStorage.setItem(k, v); } catch (e) {} return null; }

  /* ── Formatos ── */
  function eur(n) { n = Number(n); var s = (n % 1 === 0 ? String(n) : n.toFixed(2).replace('.', ',')); return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; }
  function fecha(s) { if (!s) return '—'; var x = String(s).slice(0, 10).split('-'); return x[2] + '/' + x[1] + '/' + x[0]; }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function mes(p) { var x = String(p).split('-'); return MESES[+x[1] - 1] + ' ' + x[0]; }
  function dias(a, b) { return Math.round((new Date(String(b).slice(0, 10) + 'T12:00:00') - new Date(String(a).slice(0, 10) + 'T12:00:00')) / 86400000); }
  function img(u) { return u ? (/^(https?:|data:)/.test(u) ? u : ROOT + u) : ROOT + 'assets/img/avatar.svg'; }
  /* Si una foto de mascota no carga (ruta rota, fichero borrado), se muestra la imagen por defecto. */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.classList.contains('pic') && !t.getAttribute('data-fb')) { t.setAttribute('data-fb', '1'); t.src = ROOT + 'assets/img/random.jpg'; }
  }, true);

  /* ── Usuario y protectora «activos» en el prototipo ──
     La sesión de prueba solo guarda el rol; aquí se elige qué persona es. Por defecto el usuario y la protectora demo.
     Para probar con otro: PawLink.db.setUsuario('<id_usuario>')  /  PawLink.db.setProtectora('<id_protectora>') */
  function usuarioActual() { return byId('usuario', store('pawlink.usuario')) || byId('usuario', META.usuario_demo) || t('usuario')[0]; }
  function protectoraActual() { return byId('protectora', store('pawlink.protectora')) || byId('protectora', META.protectora_demo) || t('protectora')[0]; }

  /* ── Valores derivados (nunca almacenados) ── */
  function recaudado(tr) {          // suma de aportaciones con pago COMPLETADO (RN-56)
    var s = 0; where('aportacion_tratamiento', { id_tratamiento: tr.id_tratamiento }).forEach(function (a) {
      var p = byId('pago', a.id_pago); if (p && p.estado === 'COMPLETADO') s += a.importe; });
    return s;
  }
  function edadAnios(m) {
    if (m.edad_aproximada != null) return m.edad_aproximada;
    if (!m.fecha_nacimiento) return null;
    return Math.floor(dias(m.fecha_nacimiento, META.hoy) / 365.25);
  }
  function edadTxt(m) { var e = edadAnios(m); return e == null ? '' : (e === 1 ? '1 año' : e + ' años'); }
  var ESP = { PERRO: ['Perro', 'Perra'], GATO: ['Gato', 'Gata'], CONEJO: ['Conejo', 'Coneja'], OTRO: ['Otro', 'Otra'] };
  function especieTxt(m) { return (ESP[m.especie] || ESP.OTRO)[m.sexo === 'HEMBRA' ? 1 : 0]; }
  /* «Mucho tiempo en protectora»: criterio calculado a partir de fecha_entrada (no es un estado de la mascota). */
  function muchoTiempo(m, meses) { meses = meses || META.umbral_mucho_tiempo_meses || 12; return dias(m.fecha_entrada, META.hoy) >= meses * 30.4; }
  /* Tratamiento que ahora mismo pide ayuda (ACTIVO o EN_CURSO con dinero pendiente) */
  function tratamientoAbierto(m) {
    return where('tratamiento', function (x) { return x.id_mascota === m.id_mascota && (x.estado === 'ACTIVO' || x.estado === 'EN_CURSO') && recaudado(x) < x.importe_objetivo; })[0] || null;
  }
  function pawmateVigente(m) {      // apadrinamiento ACTIVO o SUSPENDIDO (conserva exclusividad)
    return where('apadrinamiento', function (a) { return a.id_mascota === m.id_mascota && (a.estado === 'ACTIVO' || a.estado === 'SUSPENDIDO'); })[0] || null;
  }
  function imagenPrincipal(m) {
    var im = where('mascota_imagen', { id_mascota: m.id_mascota }).filter(function (i) { return i.es_principal; })[0];
    return img(im && im.url);
  }
  function urgente(m) { var tr = tratamientoAbierto(m); return !!(tr && tr.urgente); }
  /* Ficha «plana» de una mascota con todo lo que pintan las tarjetas */
  function vista(m) {
    var pr = byId('protectora', m.id_protectora), tr = tratamientoAbierto(m), rec = tr ? recaudado(tr) : 0, pm = pawmateVigente(m);
    return { m: m, id: m.id_mascota, nombre: m.nombre, protectora: pr, foto: imagenPrincipal(m), edad: edadTxt(m), especieTxt: especieTxt(m),
      ciudad: pr ? (pr.ubicacion_publica === 'OCULTA' ? '' : pr.municipio) : '', tratamiento: tr, recaudado: rec, objetivo: tr ? tr.importe_objetivo : 0,
      pct: tr ? Math.min(100, Math.round(rec / tr.importe_objetivo * 100)) : 0, urgente: !!(tr && tr.urgente), muchoTiempo: muchoTiempo(m),
      pawmate: pm, url: ROOT + 'views/public/mascota.html?id=' + m.id_mascota };
  }
  function colaboradores(idMascota) {   // quien ha aportado a un tratamiento o hecho un regalo (aunque sea parcial)
    var s = {};
    t('aportacion_tratamiento').forEach(function (a) { var tr = byId('tratamiento', a.id_tratamiento), p = byId('pago', a.id_pago);
      if (tr && tr.id_mascota === idMascota && p && p.estado === 'COMPLETADO') s[a.id_usuario] = 1; });
    where('regalo', { id_mascota: idMascota }).forEach(function (g) { var p = byId('pago', g.id_pago); if (p && p.estado === 'COMPLETADO') s[g.id_usuario] = 1; });
    return Object.keys(s);
  }
  /* Seguimiento (corazón). Los cambios hechos en el prototipo se guardan en localStorage encima de los datos. */
  function sigue(idMascota, idUsuario) {
    idUsuario = idUsuario || usuarioActual().id_usuario;
    var ov = {}; try { ov = JSON.parse(store('pawlink.seguidos') || '{}'); } catch (e) {}
    var k = idUsuario + '|' + idMascota; if (k in ov) return !!ov[k];
    return t('seguimiento_mascota').some(function (s) { return s.id_usuario === idUsuario && s.id_mascota === idMascota; });
  }
  function setSigue(idMascota, v) {
    var ov = {}; try { ov = JSON.parse(store('pawlink.seguidos') || '{}'); } catch (e) {}
    ov[usuarioActual().id_usuario + '|' + idMascota] = !!v; store('pawlink.seguidos', JSON.stringify(ov));
  }
  function textoBusqueda(s) { return String(s || '').toLowerCase().normalize ? String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : String(s || '').toLowerCase(); }


  /* ── Cambios de la demo (cancelar apadrinamiento, marcar notificaciones leídas) ──
     No hay backend: se guardan en localStorage y se reaplican sobre los datos al cargar cada página.
     Para volver a los datos originales: PawLink.db.reiniciarDemo() */
  function lee(k) { try { return JSON.parse(store(k) || '[]'); } catch (e) { return []; } }
  function aplicaCancelacion(id) {
    var a = byId('apadrinamiento', id); if (!a || a.estado === 'CANCELADO') return;
    a.estado = 'CANCELADO'; a.fecha_fin = META.hoy; a.motivo_fin = 'Cancelado por el usuario';
    where('cuota_apadrinamiento', { id_apadrinamiento: id, estado: 'PENDIENTE' }).forEach(function (c) { c.estado = 'CANCELADA'; });   // RN-47-sept
  }
  function cancelarApadrinamiento(id) { var l = lee('pawlink.cancelados'); if (l.indexOf(id) < 0) l.push(id); store('pawlink.cancelados', JSON.stringify(l)); aplicaCancelacion(id); }
  function leerNotificaciones(usuario) {
    var l = lee('pawlink.leidas'); if (l.indexOf(usuario) < 0) l.push(usuario); store('pawlink.leidas', JSON.stringify(l));
    where('notificacion', { id_usuario: usuario }).forEach(function (n) { n.leida = true; });
  }
  function reiniciarDemo() { ['pawlink.cancelados', 'pawlink.leidas', 'pawlink.seguidos', 'pawlink.usuario', 'pawlink.protectora'].forEach(function (k) { store(k, null); }); w.location.reload(); }
  lee('pawlink.cancelados').forEach(aplicaCancelacion);
  lee('pawlink.leidas').forEach(function (u) { where('notificacion', { id_usuario: u }).forEach(function (n) { n.leida = true; }); });

  PL.db = { meta: META, hoy: HOY, root: ROOT, t: t, byId: byId, where: where, esc: esc, param: param,
    eur: eur, fecha: fecha, mes: mes, dias: dias, img: img, usuarioActual: usuarioActual, protectoraActual: protectoraActual,
    setUsuario: function (id) { store('pawlink.usuario', id); }, setProtectora: function (id) { store('pawlink.protectora', id); },
    recaudado: recaudado, edadAnios: edadAnios, edadTxt: edadTxt, especieTxt: especieTxt, muchoTiempo: muchoTiempo,
    tratamientoAbierto: tratamientoAbierto, pawmateVigente: pawmateVigente, imagenPrincipal: imagenPrincipal, urgente: urgente,
    cancelarApadrinamiento: cancelarApadrinamiento, leerNotificaciones: leerNotificaciones, reiniciarDemo: reiniciarDemo,
    vista: vista, colaboradores: colaboradores, sigue: sigue, setSigue: setSigue, norm: textoBusqueda };
})(window, document);
