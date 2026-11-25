/* PawLink · PAGINADOR de listados (PawMate, PawCare, PawGift, Protectoras).
   Uso (desde un controlador, después de crear el módulo):
        PawLink.pager.attach({ grid: <contenedor de las tarjetas>, nav: <nav class="pgn">, per: 6, nombre: 'mascotas' });
   - Muestra `per` tarjetas por página y genera los botones (Anterior, 1 2 3 … , Siguiente) a partir del nº real de tarjetas.
   - Las tarjetas ocultas por un filtro o por el buscador (clase `xh`) no cuentan: el paginador se recalcula solo y vuelve a la página 1.
   - Oculta con la clase `xp` las tarjetas de otras páginas. Si solo hay una página, esconde los botones. */
(function (w, d) {
  var PL = w.PawLink = w.PawLink || {};
  var ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg>';

  function attach(o) {
    var grid = o.grid, nav = o.nav, per = o.per || 6, nombre = o.nombre || 'elementos', pagina = 1, firma = '', busy = false;
    if (!grid || !nav || grid.__pager) return;
    grid.__pager = true;
    Array.prototype.forEach.call(d.querySelectorAll('input[type=radio][name=pg]'), function (r) { r.parentNode.removeChild(r); });   // maqueta antigua (CSS)

    function items() { return Array.prototype.filter.call(grid.children, function (el) { return !el.classList.contains('xh'); }); }
    function btn(txt, p, cls, label) {
      return '<button type="button" class="pgb' + (cls ? ' ' + cls : '') + '" data-p="' + p + '"' + (label ? ' aria-label="' + label + '"' : '') + '>' + txt + '</button>';
    }
    function numeros(total) {                      // 1 … 4 5 6 … 10 (máx. 5 números + extremos)
      var out = [], i, ini = Math.max(1, pagina - 2), fin = Math.min(total, pagina + 2);
      if (total <= 7) { for (i = 1; i <= total; i++) out.push(i); return out; }
      if (ini > 1) { out.push(1); if (ini > 2) out.push('…'); }
      for (i = ini; i <= fin; i++) out.push(i);
      if (fin < total) { if (fin < total - 1) out.push('…'); out.push(total); }
      return out;
    }
    function render() {
      var its = items(), total = Math.max(1, Math.ceil(its.length / per)), f = its.map(function (e) { return e.getAttribute('data-id') || e.getAttribute('data-n') || ''; }).join('|');
      if (f !== firma) { firma = f; pagina = 1; }
      if (pagina > total) pagina = total;
      busy = true;
      Array.prototype.forEach.call(grid.children, function (el) { el.classList.remove('xp'); });
      its.forEach(function (el, i) { el.classList.toggle('xp', i < (pagina - 1) * per || i >= pagina * per); });
      var desde = its.length ? (pagina - 1) * per + 1 : 0, hasta = Math.min(its.length, pagina * per);
      if (total <= 1) { nav.hidden = true; nav.innerHTML = ''; }
      else {
        var h = '<div class="pgl">' + (pagina > 1 ? btn(ARROW_L + '<span class="pgt">Anterior</span>', pagina - 1, '', 'Página anterior') : '<span class="pgb pgd" aria-disabled="true">' + ARROW_L + '<span class="pgt">Anterior</span></span>');
        numeros(total).forEach(function (n) { h += n === '…' ? '<span class="pge" aria-hidden="true">…</span>' : btn(n, n, n === pagina ? 'on' : '', 'Página ' + n).replace('<button', n === pagina ? '<button aria-current="page"' : '<button'); });
        h += (pagina < total ? btn('<span class="pgt">Siguiente</span>' + ARROW_R, pagina + 1, '', 'Página siguiente') : '<span class="pgb pgd" aria-disabled="true"><span class="pgt">Siguiente</span>' + ARROW_R + '</span>') + '</div>' +
          '<p>Mostrando ' + desde + '–' + hasta + ' de ' + its.length + ' ' + nombre + '</p>';
        nav.innerHTML = h; nav.hidden = false;
      }
      mo.takeRecords(); busy = false;
    }
    var mo = new MutationObserver(function () { if (!busy) render(); });
    function observar() { mo.observe(grid, { childList: true, attributes: true, attributeFilter: ['class'], subtree: true }); }
    // al cambiar nuestras propias clases `xp` no hay que volver a calcular: se ignoran con `busy` y takeRecords()
    nav.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('button[data-p]') : null; if (!b) return;
      pagina = parseInt(b.getAttribute('data-p'), 10); render();
      var top = grid.getBoundingClientRect().top + w.pageYOffset - 90; w.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
    observar(); render();
  }
  PL.pager = { attach: attach };
})(window, document);
