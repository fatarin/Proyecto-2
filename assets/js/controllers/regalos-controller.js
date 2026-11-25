/* PawLink · CONTROLADOR del catálogo PawGift (views/public/regalos.html).  data-module="regalos" en <main>.
   Muestra los productos activos de `catalogo_regalo` y filtra por categoría (ALIMENTACION, JUGUETES, DESCANSO, CUIDADOS, OTROS). */
PawLink.register('regalos', function (root) {
  var db = PawLink.db, C = PawLink.cards;
  var grid = root.querySelector('.g'), bar = root.querySelector('[role=group][aria-label=Filtros]');
  if (!grid || !bar) return;
  Array.prototype.forEach.call(root.querySelectorAll('input[name=pg], .pg-nav'), function (n) { n.parentNode.removeChild(n); });
  var productos = db.where('catalogo_regalo', { activo: true });                      // RN-66: solo los productos activos
  var cats = ['ALIMENTACION', 'JUGUETES', 'DESCANSO', 'CUIDADOS', 'OTROS'], actual = '';
  bar.innerHTML = '<button class="chip on" type="button" data-c="">Todo</button>' + cats.map(function (c) { return '<button class="chip" type="button" data-c="' + c + '">' + C.CATTXT[c] + '</button>'; }).join('');
  function render() {
    grid.innerHTML = productos.filter(function (p) { return !actual || p.categoria === actual; }).map(C.regalo).join('');
    Array.prototype.forEach.call(bar.querySelectorAll('.chip'), function (c) { c.classList.toggle('on', c.getAttribute('data-c') === actual); });
  }
  if (PawLink.FILTROS_ACTIVOS) bar.addEventListener('click', function (ev) { var c = ev.target.closest ? ev.target.closest('.chip') : null; if (c) { actual = c.getAttribute('data-c'); render(); } });
  render();
  if (PawLink.pager) PawLink.pager.attach({ grid: grid, nav: root.querySelector('.pgn'), per: 8, nombre: 'regalos' });   // paginación real (8 por página)
});
