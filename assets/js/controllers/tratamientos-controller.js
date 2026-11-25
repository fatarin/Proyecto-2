/* PawLink · CONTROLADOR del listado PawCare (views/public/tratamientos.html).  data-module="tratamientos" en <main>.
   Muestra los tratamientos que aún piden ayuda (estado ACTIVO o EN_CURSO con importe pendiente) y filtra por chip. */
PawLink.register('tratamientos', function (root) {
  var db = PawLink.db, C = PawLink.cards;
  var grid = root.querySelector('.g'), bar = root.querySelector('[role=group][aria-label=Filtros]'), search = root.querySelector('#pks');
  if (!grid || !bar) return;
  /* La paginación estática se sustituye por la lista completa */
  Array.prototype.forEach.call(root.querySelectorAll('input[name=pg], .pg-nav'), function (n) { n.parentNode.removeChild(n); });
  var FILTROS = {                                   // ← aquí puedes cambiar los criterios
    todos:      function (v) { return true; },
    urgentes:   function (v) { return v.tratamiento.urgente; },
    casi:       function (v) { return v.pct >= 80; },                       // «casi completados»: 80 % o más
    cirugia:    function (v) { return v.tratamiento.categoria === 'CIRUGIA'; },
    cuidados:   function (v) { return v.tratamiento.categoria === 'CUIDADOS'; }
  };
  var CHIP = { 'Todos': 'todos', 'Urgentes': 'urgentes', 'Casi completados': 'casi', 'Cirugía': 'cirugia', 'Cuidados': 'cuidados' };
  var todos = db.where('mascota', { estado: 'PUBLICADA' }).map(db.vista).filter(function (v) { return v.tratamiento; });
  todos.sort(function (a, b) { return (b.urgente - a.urgente) || (b.pct - a.pct); });
  var actual = 'todos';
  function render() {
    var r = todos.filter(FILTROS[actual]);
    grid.innerHTML = r.map(C.tratamiento).join('');
    var vacio = root.querySelector('#mc-vacio');
    if (!vacio) { vacio = document.createElement('p'); vacio.id = 'mc-vacio'; vacio.className = 'm-0-0-20 c-muted'; vacio.setAttribute('role', 'status'); grid.parentNode.insertBefore(vacio, grid); }
    vacio.textContent = r.length ? '' : 'No hay tratamientos con este filtro.';
    if (search) search.dispatchEvent(new Event('input'));
    Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', CHIP[c.textContent.trim()] === actual); });
  }
  if (PawLink.FILTROS_ACTIVOS) bar.addEventListener('click', function (ev) { var c = ev.target.closest ? ev.target.closest('.chip') : null; if (c && CHIP[c.textContent.trim()]) { actual = CHIP[c.textContent.trim()]; render(); } });
  grid.addEventListener('change', function (ev) { var i = ev.target; if (i && i.hasAttribute && i.hasAttribute('data-follow')) db.setSigue(i.getAttribute('data-follow'), i.checked); });
  render();
  if (PawLink.pager) PawLink.pager.attach({ grid: grid, nav: root.querySelector('.pgn'), per: 6, nombre: 'tratamientos' });   // paginación real (6 por página)
});
