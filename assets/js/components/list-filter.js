/* PawLink · filtro de texto en tiempo real sobre una lista de tarjetas o elementos.
   <input data-module="list-filter" data-filter-items=".selector" data-filter-class="xh"
          data-filter-attr="data-n" (opcional: si no, el texto del elemento) data-filter-empty="id-del-aviso"
          data-filter-count="id-del-contador" (opcional: escribe "N resultados")>
   Los elementos se vuelven a buscar en cada pulsación, así que valen también los inyectados dinámicamente. */
PawLink.register('list-filter', function (input) {
  if (!PawLink.FILTROS_ACTIVOS) return;                                   // filtros desactivados en la entrega del 18/11/2026
  var sel = input.getAttribute('data-filter-items'), cls = input.getAttribute('data-filter-class') || 'xh',
      attr = input.getAttribute('data-filter-attr'), empty = PawLink.dom.byId(input.getAttribute('data-filter-empty')),
      count = PawLink.dom.byId(input.getAttribute('data-filter-count'));
  function run() {
    var q = input.value.toLowerCase().trim(), items = PawLink.dom.qsa(sel), n = 0;
    items.forEach(function (el) {
      var txt = (attr ? (el.getAttribute(attr) || '') : el.textContent).toLowerCase(), ok = txt.indexOf(q) !== -1;
      el.classList.toggle(cls, !ok);
      if (el.offsetParent !== null) n++;
    });
    if (empty) empty.hidden = n !== 0 || !items.length && !q;
    if (count) count.textContent = items.length ? (n === 1 ? '1 resultado' : n + ' resultados') : '';
  }
  input.addEventListener('input', run);
});
