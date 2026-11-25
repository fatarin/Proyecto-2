/* PawLink · CONTROLADOR del Dashboard (index.html).  Módulo en <section id="dashboard" data-module="dashboard">.
   Piezas de index.html:
     #dash-cards           contenedor donde se inyectan las tarjetas
     #tpl-card-pawfriend   <template> con la tarjeta modelo (cada elemento variable lleva data-field="…")
     #dash-q               buscador (módulo list-filter: filtra en vivo las tarjetas de #dash-cards)
   Datos: modelo PawLink.db (assets/js/models/db.js) sobre assets/js/data/mockdata.js.
   Qué se muestra: mascotas PUBLICADAS con un tratamiento que aún necesita ayuda (ACTIVO o EN_CURSO), las urgentes primero. */
PawLink.register('dashboard', function (root) {
  var db = PawLink.db;
  var list = root.querySelector('#dash-cards'),
      tpl = document.getElementById('tpl-card-pawfriend'),
      search = root.querySelector('#dash-q');

  /* Origen de datos: una «vista plana» por mascota (ver PawLink.db.vista) con tratamiento abierto */
  function getData() {
    return db.where('mascota', { estado: 'PUBLICADA' }).map(db.vista).filter(function (v) { return v.tratamiento; })
      .sort(function (a, b) { return (b.urgente - a.urgente) || (b.pct - a.pct); }).slice(0, 6);
  }
  /* Crea una tarjeta clonando el <template> y rellenando los [data-field] */
  function card(v) {
    var el = tpl.content.firstElementChild.cloneNode(true);
    function set(f, fn) { var n = el.querySelector('[data-field=' + f + ']'); if (n) fn(n); }
    el.setAttribute('data-id', v.id);
    el.querySelector('.hrt').title = 'Seguir a ' + v.nombre;
    set('seguir', function (n) { n.setAttribute('aria-label', 'Seguir a ' + v.nombre); n.checked = db.sigue(v.id); n.addEventListener('change', function () { db.setSigue(v.id, n.checked); }); });
    set('foto', function (n) { n.src = v.foto; n.alt = 'Foto de ' + v.nombre; });
    set('nombre', function (n) { n.textContent = v.nombre; });
    set('tratamiento', function (n) { n.textContent = v.tratamiento.titulo; });
    set('protectora', function (n) { n.textContent = v.protectora.nombre; });
    set('ciudad', function (n) { n.textContent = v.ciudad || 'Ubicación reservada'; });
    set('progreso', function (n) { n.setAttribute('aria-valuenow', v.pct); });
    set('barra', function (n) { n.style.width = v.pct + '%'; });
    set('recaudado', function (n) { n.textContent = db.eur(v.recaudado).replace(' €', ''); });
    set('objetivo', function (n) { n.textContent = db.eur(v.objetivo).replace(' €', ''); });
    set('enlace', function (n) { n.href = v.url; });
    return el;
  }
  function render(items) {
    list.innerHTML = '';
    items.forEach(function (v) { list.appendChild(card(v)); });
    refilter();
  }
  /* Reaplica el filtro del buscador a las tarjetas actuales */
  function refilter() { if (search) search.dispatchEvent(new Event('input')); }

  PawLink.dashboard = { render: render, refilter: refilter, data: getData, list: list, template: tpl };
  render(getData());
});
