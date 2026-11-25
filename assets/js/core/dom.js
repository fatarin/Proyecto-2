/* PawLink · utilidades DOM mínimas. */
(function (w, d) {
  var PL = w.PawLink = w.PawLink || {};
  PL.dom = {
    byId: function (id) { return d.getElementById(id); },
    qs: function (sel, root) { return (root || d).querySelector(sel); },
    qsa: function (sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); },
    show: function (el, on) { if (el) el.hidden = !on; },
    /* Delegación: PawLink.dom.delegate(document, 'click', '.x', function (e, target) {}) */
    delegate: function (root, type, sel, fn) {
      root.addEventListener(type, function (e) {
        var t = e.target && e.target.closest ? e.target.closest(sel) : null;
        if (t && root.contains(t)) fn(e, t);
      });
    },
    /* Elementos enfocables y visibles dentro de un contenedor */
    focusables: function (root) {
      return Array.prototype.filter.call(
        root.querySelectorAll('a[href],button:not([disabled]),summary,input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetParent !== null || el.getClientRects().length > 0; });
    }
  };
})(window, document);
